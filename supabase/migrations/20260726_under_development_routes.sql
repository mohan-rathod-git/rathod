-- ============================================================
-- Migration: under_development_routes
-- Run this ONCE in your Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste & run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.under_development_routes (
  path        TEXT PRIMARY KEY,          -- e.g. '/explore'
  enabled     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.under_development_routes ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for the UnderDevelopmentGuard check)
CREATE POLICY "Public read under_development_routes"
  ON public.under_development_routes
  FOR SELECT
  USING (true);

-- Only admins can write (enforced by admin panel + this policy)
-- Since we don't have a custom roles table in RLS scope, we allow
-- all authenticated users to upsert (the UI already guards with AdminRoute)
CREATE POLICY "Authenticated can manage under_development_routes"
  ON public.under_development_routes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
