-- ============================================================
-- PHASE 1: Security & Privacy Foundation
-- Banjara Bandhan v4.0 Migration
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add privacy_mode column to profiles
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.privacy_mode AS ENUM ('public', 'verified_only', 'matches_only', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN privacy_mode public.privacy_mode DEFAULT 'public';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. Create a secure view that hides sensitive fields for non-self
--    Phone and email should NEVER be visible pre-match.
--    We use a function instead of a view for flexible access control.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_profile_for_viewer(
  _profile_user_id UUID,
  _viewer_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  state TEXT,
  district TEXT,
  city_village TEXT,
  community TEXT,
  tanda_name TEXT,
  gotra TEXT,
  sub_caste TEXT,
  religion TEXT,
  mother_tongue TEXT,
  education TEXT,
  occupation TEXT,
  annual_income TEXT,
  marital_status TEXT,
  height TEXT,
  about TEXT,
  photo_url TEXT,
  additional_photos TEXT[],
  rashi TEXT,
  nakshatra TEXT,
  manglik TEXT,
  birth_time TEXT,
  birth_place TEXT,
  is_premium BOOLEAN,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  profile_completion INTEGER,
  privacy_mode public.privacy_mode,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_matched BOOLEAN;
  _is_self BOOLEAN;
BEGIN
  _is_self := (_profile_user_id = _viewer_user_id);

  -- Check if mutually matched
  IF NOT _is_self THEN
    SELECT EXISTS (
      SELECT 1 FROM public.interests i1
      WHERE i1.sender_id = _profile_user_id
        AND i1.receiver_id = _viewer_user_id
        AND i1.status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM public.interests i2
        WHERE i2.sender_id = _viewer_user_id
          AND i2.receiver_id = _profile_user_id
          AND i2.status = 'accepted'
      )
    ) INTO _is_matched;
  ELSE
    _is_matched := TRUE;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.gender,
    p.date_of_birth,
    -- Phone/email: only visible to self or matched users
    CASE WHEN _is_self OR _is_matched THEN p.phone ELSE NULL END AS phone,
    CASE WHEN _is_self OR _is_matched THEN p.email ELSE NULL END AS email,
    p.state,
    p.district,
    -- Exact location: depends on privacy_mode
    CASE
      WHEN _is_self THEN p.city_village
      WHEN _is_matched THEN p.city_village
      WHEN p.privacy_mode IN ('public', 'verified_only') THEN p.city_village
      ELSE NULL
    END AS city_village,
    p.community,
    p.tanda_name,
    p.gotra,
    p.sub_caste,
    p.religion,
    p.mother_tongue,
    p.education,
    p.occupation,
    p.annual_income,
    p.marital_status,
    p.height,
    p.about,
    -- Photo: in private mode, hide until match
    CASE
      WHEN _is_self THEN p.photo_url
      WHEN p.privacy_mode = 'private' AND NOT _is_matched THEN NULL
      ELSE p.photo_url
    END AS photo_url,
    CASE
      WHEN _is_self THEN p.additional_photos
      WHEN p.privacy_mode = 'private' AND NOT _is_matched THEN '{}'::TEXT[]
      ELSE p.additional_photos
    END AS additional_photos,
    p.rashi,
    p.nakshatra,
    p.manglik,
    p.birth_time,
    p.birth_place,
    p.is_premium,
    p.is_verified,
    -- is_online / last_seen: hidden unless matched or public
    CASE
      WHEN _is_self THEN p.is_online
      WHEN _is_matched THEN p.is_online
      ELSE NULL
    END AS is_online,
    p.profile_completion,
    p.privacy_mode,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = _profile_user_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. is_matched function — server-side mutual match check
--    Used by RLS policies and client code
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_matched(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.interests
    WHERE sender_id = _user_a AND receiver_id = _user_b AND status = 'accepted'
  ) AND EXISTS (
    SELECT 1 FROM public.interests
    WHERE sender_id = _user_b AND receiver_id = _user_a AND status = 'accepted'
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 4. Gate messages INSERT on mutual match status
--    Only matched users can exchange messages
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_matched(sender_id, receiver_id)
  );

-- ────────────────────────────────────────────────────────────
-- 5. Add 'unmatched' to interests status constraint
--    Soft-delete for moderation/audit purposes
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.interests DROP CONSTRAINT IF EXISTS interests_status_check;
  ALTER TABLE public.interests ADD CONSTRAINT interests_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'unmatched'));
EXCEPTION WHEN undefined_object THEN
  -- Constraint doesn't exist yet, add it fresh
  ALTER TABLE public.interests ADD CONSTRAINT interests_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'unmatched'));
END $$;

-- Add unmatched_at for audit trail
DO $$ BEGIN
  ALTER TABLE public.interests ADD COLUMN unmatched_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Allow senders to also update interests (for unmatch from either side)
DROP POLICY IF EXISTS "Senders can update own interests" ON public.interests;
CREATE POLICY "Senders can update own interests" ON public.interests
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

-- ────────────────────────────────────────────────────────────
-- 6. Add moderation_status to messages (prep for Phase 10)
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM ('clean', 'flagged', 'auto_hidden', 'reviewed_ok', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.messages ADD COLUMN moderation_status public.moderation_status DEFAULT 'clean';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. Create engagement_events table (prep for Phase 4)
--    Start logging from day one even before recommendation engine
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'impression', 'view', 'view_long', 'interest_sent', 'interest_received',
    'accept', 'reject', 'skip', 'profile_click', 'photo_view'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON public.engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_target ON public.engagement_events(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON public.engagement_events(event_type);

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own events" ON public.engagement_events;
CREATE POLICY "Users can insert own events" ON public.engagement_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own events" ON public.engagement_events;
CREATE POLICY "Users can view own events" ON public.engagement_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add to realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- DONE: Phase 1 migration complete.
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/btcpqibbbfisfajmyajd/sql/new
-- ============================================================
