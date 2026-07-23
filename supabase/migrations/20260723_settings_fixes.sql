-- ============================================================
-- SETTINGS FIXES MIGRATION — Banjara Bandhan v4.0
-- Run AFTER 20260723_admin_dashboard.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: Hide Profile — dedicated column (replaces registration_step=-1 hack)
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_hidden ON public.profiles(is_hidden);

-- Drop the open catch-all SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view visible profiles" ON public.profiles;

-- New: hide profile enforcement at RLS layer
-- Own profile: always visible
-- Other profiles: only visible if is_hidden = false OR viewer is admin/moderator
CREATE POLICY "Users can view visible profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_hidden = false AND registration_step >= 2)
    OR public.is_moderator_or_above()
  );

-- Allow users to update their own is_hidden field
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- SECTION 4: Storage Quota — 50MB per user
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN storage_used_bytes BIGINT NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Atomically check and increment storage (returns true if OK, false if would exceed limit)
CREATE OR REPLACE FUNCTION public.increment_storage(
  _user_id UUID,
  _bytes BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current BIGINT;
  _max BIGINT := 52428800; -- 50MB in bytes
BEGIN
  SELECT COALESCE(storage_used_bytes, 0) INTO _current
  FROM profiles
  WHERE user_id = _user_id;

  IF _current + _bytes > _max THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + _bytes
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

-- Decrement storage (for delete operations)
CREATE OR REPLACE FUNCTION public.decrement_storage(
  _user_id UUID,
  _bytes BIGINT
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) - _bytes)
  WHERE user_id = _user_id;
$$;

-- ────────────────────────────────────────────────────────────
-- SECTION 6: Friend Tier
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Only mutually matched users can send friend requests
DROP POLICY IF EXISTS "Matched users can send friend requests" ON public.friend_requests;
CREATE POLICY "Matched users can send friend requests" ON public.friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_matched(sender_id, receiver_id)
  );

DROP POLICY IF EXISTS "Participants can view own friend requests" ON public.friend_requests;
CREATE POLICY "Participants can view own friend requests" ON public.friend_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Receiver can update friend request" ON public.friend_requests;
CREATE POLICY "Receiver can update friend request" ON public.friend_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Helper: check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE (
      (sender_id = _user_a AND receiver_id = _user_b)
      OR (sender_id = _user_b AND receiver_id = _user_a)
    )
    AND status = 'accepted'
  );
$$;

-- Add message_type column to messages
-- text = normal message (available at MATCHED)
-- media = photo/video (available at MATCHED per user decision)
-- call_event = call start/end system message
DO $$ BEGIN
  ALTER TABLE public.messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'media', 'call_event'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Gate voice/video calls: only FRIENDS can initiate calls
-- This is enforced in the WebRTC hook on the client, plus we add a DB-level call_event check
-- INSERT policy for call_event messages: only friends
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_matched(sender_id, receiver_id)
    AND (
      -- text/media messages: matched is enough
      message_type IN ('text', 'media')
      -- call events: friends only
      OR (message_type = 'call_event' AND public.are_friends(sender_id, receiver_id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- SECTION 7: Admin-controlled Landing Content
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.landing_content (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tagline_line1 TEXT NOT NULL DEFAULT 'Find Your',
  tagline_line2 TEXT NOT NULL DEFAULT 'Sacred Bond',
  stat_profiles INTEGER NOT NULL DEFAULT 0,
  stat_matches INTEGER NOT NULL DEFAULT 0,
  stat_success INTEGER NOT NULL DEFAULT 0,
  hero_photo_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Begin Your Journey',
  cta_link TEXT NOT NULL DEFAULT '/register',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default row
INSERT INTO public.landing_content (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read landing content (public marketing page)
DROP POLICY IF EXISTS "Anyone can read landing content" ON public.landing_content;
CREATE POLICY "Anyone can read landing content" ON public.landing_content
  FOR SELECT TO anon, authenticated USING (true);

-- Only admins can update it
DROP POLICY IF EXISTS "Admins can update landing content" ON public.landing_content;
CREATE POLICY "Admins can update landing content" ON public.landing_content
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Add to realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- DONE. Run in Supabase SQL Editor before deploying app changes.
-- ============================================================
