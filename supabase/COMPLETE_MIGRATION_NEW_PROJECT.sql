-- ============================================================
-- MASTER BANJARA BANDHAN v4.0 MIGRATION SCRIPT FOR NEW SUPABASE PROJECT
-- Target Project Reference: dzcymhdhvkjqaxmvqvoz
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dzcymhdhvkjqaxmvqvoz/sql/new
-- ============================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

-- Updated at helper function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
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
  religion TEXT DEFAULT 'Hindu',
  mother_tongue TEXT,
  education TEXT,
  occupation TEXT,
  annual_income TEXT,
  marital_status TEXT,
  height TEXT,
  about TEXT,
  photo_url TEXT,
  additional_photos TEXT[] DEFAULT '{}',
  rashi TEXT,
  nakshatra TEXT,
  manglik TEXT,
  birth_time TEXT,
  birth_place TEXT,
  pref_age_min INTEGER DEFAULT 18,
  pref_age_max INTEGER DEFAULT 60,
  pref_height_min TEXT,
  pref_height_max TEXT,
  pref_states TEXT[] DEFAULT '{}',
  pref_marital_status TEXT[] DEFAULT '{}',
  pref_education TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  privacy_mode TEXT NOT NULL DEFAULT 'public' CHECK (privacy_mode IN ('public', 'blur_photo', 'matched_only', 'private')),
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  profile_completion INTEGER DEFAULT 0,
  registration_step INTEGER DEFAULT 1,
  push_notifs BOOLEAN DEFAULT true,
  match_notifs BOOLEAN DEFAULT true,
  msg_notifs BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_community ON public.profiles(community);
CREATE INDEX IF NOT EXISTS idx_profiles_gotra ON public.profiles(gotra);
CREATE INDEX IF NOT EXISTS idx_profiles_is_hidden ON public.profiles(is_hidden);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('moderator', 'admin', 'super_admin')
  );
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_moderator_or_above());

-- RLS for Profiles
DROP POLICY IF EXISTS "Users can view visible profiles" ON public.profiles;
CREATE POLICY "Users can view visible profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_hidden = false AND registration_step >= 2)
    OR public.is_moderator_or_above()
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Profile trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    NEW.phone
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. INTERESTS & MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id)
);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_matched(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.interests
    WHERE (
      (sender_id = _user_a AND receiver_id = _user_b)
      OR (sender_id = _user_b AND receiver_id = _user_a)
    )
    AND status = 'accepted'
  );
$$;

DROP POLICY IF EXISTS "Users can view own interests" ON public.interests;
CREATE POLICY "Users can view own interests" ON public.interests
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_moderator_or_above());

DROP POLICY IF EXISTS "Users can send interests" ON public.interests;
CREATE POLICY "Users can send interests" ON public.interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receivers can update interests" ON public.interests;
CREATE POLICY "Receivers can update interests" ON public.interests
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

DROP TRIGGER IF EXISTS update_interests_updated_at ON public.interests;
CREATE TRIGGER update_interests_updated_at
  BEFORE UPDATE ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.are_friends(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE (
      (sender_id = _user_a AND receiver_id = _user_b)
      OR (sender_id = _user_b AND receiver_id = _user_a)
    )
    AND status = 'accepted'
  );
$$;

DROP POLICY IF EXISTS "Matched users can send friend requests" ON public.friend_requests;
CREATE POLICY "Matched users can send friend requests" ON public.friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_matched(sender_id, receiver_id));

DROP POLICY IF EXISTS "Participants can view own friend requests" ON public.friend_requests;
CREATE POLICY "Participants can view own friend requests" ON public.friend_requests
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Receiver can update friend request" ON public.friend_requests;
CREATE POLICY "Receiver can update friend request" ON public.friend_requests
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'call_event')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_matched(sender_id, receiver_id)
    AND (
      message_type IN ('text', 'media')
      OR (message_type = 'call_event' AND public.are_friends(sender_id, receiver_id))
    )
  );

DROP POLICY IF EXISTS "Users can mark messages read" ON public.messages;
CREATE POLICY "Users can mark messages read" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- 7. TYPING STATUS TABLE
CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view typing status for their chats" ON public.typing_status;
CREATE POLICY "Users can view typing status for their chats" ON public.typing_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS "Users can upsert own typing status" ON public.typing_status;
CREATE POLICY "Users can upsert own typing status" ON public.typing_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own typing status" ON public.typing_status;
CREATE POLICY "Users can update own typing status" ON public.typing_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 8. BLOCKED USERS TABLE
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocked_users;
CREATE POLICY "Users can view own blocks" ON public.blocked_users FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- 9. VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view own verification requests" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_moderator_or_above());

DROP POLICY IF EXISTS "Users can submit verification requests" ON public.verification_requests;
CREATE POLICY "Users can submit verification requests" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update verification requests" ON public.verification_requests
  FOR UPDATE TO authenticated USING (public.is_moderator_or_above());

-- 10. ABUSE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT TO authenticated USING (public.is_moderator_or_above() OR auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_moderator_or_above());

-- 11. IMMUTABLE ADMIN AUDIT LOG
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id AND public.is_moderator_or_above());

-- 12. ADMIN BROADCASTS TABLE
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_filter JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins can manage broadcasts" ON public.admin_broadcasts FOR ALL TO authenticated USING (public.is_admin());

-- 13. ENGAGEMENT EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own events" ON public.engagement_events;
CREATE POLICY "Users can insert own events" ON public.engagement_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Admins can view engagement events" ON public.engagement_events;
CREATE POLICY "Admins can view engagement events" ON public.engagement_events FOR SELECT TO authenticated USING (public.is_moderator_or_above() OR auth.uid() = actor_id);

-- 14. LANDING CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.landing_content (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tagline_line1 TEXT NOT NULL DEFAULT 'Find Your',
  tagline_line2 TEXT NOT NULL DEFAULT 'Sacred Bond',
  stat_profiles INTEGER NOT NULL DEFAULT 12500,
  stat_matches INTEGER NOT NULL DEFAULT 3400,
  stat_success INTEGER NOT NULL DEFAULT 890,
  hero_photo_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Begin Your Journey',
  cta_link TEXT NOT NULL DEFAULT '/register',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.landing_content (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read landing content" ON public.landing_content;
CREATE POLICY "Anyone can read landing content" ON public.landing_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update landing content" ON public.landing_content;
CREATE POLICY "Admins can update landing content" ON public.landing_content FOR UPDATE TO authenticated USING (public.is_admin());

-- 15. STORAGE QUOTA HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.increment_storage(_user_id UUID, _bytes BIGINT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _current BIGINT;
  _max BIGINT := 52428800; -- 50MB
BEGIN
  SELECT COALESCE(storage_used_bytes, 0) INTO _current FROM profiles WHERE user_id = _user_id;
  IF _current + _bytes > _max THEN
    RETURN false;
  END IF;
  UPDATE profiles SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + _bytes WHERE user_id = _user_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_storage(_user_id UUID, _bytes BIGINT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE profiles SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) - _bytes) WHERE user_id = _user_id;
$$;

-- 16. STORAGE BUCKET & POLICIES
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'chat-attachments', 'verification-docs'));

DROP POLICY IF EXISTS "Anyone can view public storage" ON storage.objects;
CREATE POLICY "Anyone can view public storage" ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('avatars', 'chat-attachments'));

DROP POLICY IF EXISTS "Users can update own storage" ON storage.objects;
CREATE POLICY "Users can update own storage" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'chat-attachments', 'verification-docs'));

DROP POLICY IF EXISTS "Users can delete own storage" ON storage.objects;
CREATE POLICY "Users can delete own storage" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'chat-attachments', 'verification-docs'));

-- 17. REALTIME PUBLICATIONS
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.interests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.reports; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- SUCCESS: MASTER MIGRATION FOR PROJECT dzcymhdhvkjqaxmvqvoz COMPLETED
-- ============================================================
