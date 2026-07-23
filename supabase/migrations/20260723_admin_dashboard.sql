-- ============================================================
-- ADMIN DASHBOARD MIGRATION — Banjara Bandhan v4.0
-- Run AFTER 20260723_phase1_security_privacy.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1A. Extend app_role enum to include 'super_admin'
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 1B. Admin audit log — immutable, append-only
--     No UPDATE or DELETE policies. Ever.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin+ can read
DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Any admin/moderator can insert (logging their own actions)
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = admin_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- NO UPDATE policy
-- NO DELETE policy
-- This log is IMMUTABLE by design.

-- ────────────────────────────────────────────────────────────
-- 1C. Reports table (formalized)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'investigating', 'upheld', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can read all reports" ON public.reports;
CREATE POLICY "Admins can read all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 1D. Notification broadcasts table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT,
  segment JSONB DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins can manage broadcasts" ON public.admin_broadcasts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 1E. Lock down verification_requests to admin/moderator + own
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;

CREATE POLICY "Users can view own verification requests" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 1F. Helper functions: role checks (SECURITY DEFINER)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'moderator')
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 1G. Admin access to engagement_events (for analytics)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all engagement events" ON public.engagement_events;
CREATE POLICY "Admins can view all engagement events" ON public.engagement_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 1H. Add realtime for admin-relevant tables
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_broadcasts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SEED: To create your first super_admin, run this ONCE manually:
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<YOUR_USER_UUID>', 'super_admin');
--
-- Replace <YOUR_USER_UUID> with the auth.users.id of the
-- account you want to be the first super admin.
-- ============================================================
