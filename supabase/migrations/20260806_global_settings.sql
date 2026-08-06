-- ═══════════════════════════════════════════
-- Global Settings Table — stores app-wide configuration
-- including the active theme ID and hero banner settings.
--
-- RLS: All authenticated users can SELECT (to load the theme).
--      Only super_admin can UPDATE (to change the live theme).
-- Real-time: Enabled so theme changes push instantly to all clients.
-- ═══════════════════════════════════════════

-- Create the table
CREATE TABLE IF NOT EXISTS public.global_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  theme_id TEXT NOT NULL DEFAULT 'blush-romance',
  hero_type TEXT NOT NULL DEFAULT 'gradient',
  hero_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the default row (idempotent)
INSERT INTO public.global_settings (id, theme_id, hero_type)
VALUES ('main', 'blush-romance', 'gradient')
ON CONFLICT (id) DO NOTHING;

-- Add hero columns if they don't exist yet (idempotent upgrade)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='global_settings' AND column_name='hero_type') THEN
    ALTER TABLE public.global_settings ADD COLUMN hero_type TEXT NOT NULL DEFAULT 'gradient';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='global_settings' AND column_name='hero_url') THEN
    ALTER TABLE public.global_settings ADD COLUMN hero_url TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to read settings (needed for theme loading)
DROP POLICY IF EXISTS "Anyone can read global settings" ON public.global_settings;
CREATE POLICY "Anyone can read global settings"
  ON public.global_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon users to read too (for the landing page before login)
DROP POLICY IF EXISTS "Anon can read global settings" ON public.global_settings;
CREATE POLICY "Anon can read global settings"
  ON public.global_settings
  FOR SELECT
  TO anon
  USING (true);

-- Only super_admin or admin can update settings
DROP POLICY IF EXISTS "Admin can update global settings" ON public.global_settings;
CREATE POLICY "Admin can update global settings"
  ON public.global_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow upsert (insert) for admin — needed for the first write
DROP POLICY IF EXISTS "Admin can insert global settings" ON public.global_settings;
CREATE POLICY "Admin can insert global settings"
  ON public.global_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Enable real-time for instant theme pushes
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_settings;

-- Grant permissions
GRANT SELECT ON public.global_settings TO authenticated;
GRANT SELECT ON public.global_settings TO anon;
GRANT INSERT, UPDATE ON public.global_settings TO authenticated;
