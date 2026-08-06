/**
 * ThemeContext — Global real-time theme + hero banner provider
 *
 * Fetches the active theme and hero banner settings from `global_settings`
 * table on mount, subscribes to Supabase real-time changes, and injects
 * CSS variables dynamically into the document root.
 *
 * When the super admin changes the live theme, ALL users see the
 * update instantly without a page reload.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { THEMES, DEFAULT_THEME_ID, type AppTheme } from '@/lib/themes';

export type HeroType = 'gradient' | 'image' | 'video';

interface ThemeContextValue {
  /** Currently active theme object */
  activeTheme: AppTheme;
  /** Active theme ID string */
  activeThemeId: string;
  /** Hero banner type */
  heroType: HeroType;
  /** Hero banner URL (image or video) — null means use gradient */
  heroUrl: string | null;
  /** Whether the theme is still loading from DB */
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: THEMES[DEFAULT_THEME_ID],
  activeThemeId: DEFAULT_THEME_ID,
  heroType: 'gradient',
  heroUrl: null,
  loading: true,
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Apply theme CSS variables to document root and toggle light/dark class.
 */
function applyTheme(theme: AppTheme) {
  const root = document.documentElement;

  // Set all CSS variables from the theme definition
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }

  // Sync sidebar variables from core theme vars (sidebar matches main app)
  root.style.setProperty('--sidebar-background', theme.vars['--background'] || '');
  root.style.setProperty('--sidebar-foreground', theme.vars['--foreground'] || '');
  root.style.setProperty('--sidebar-primary', theme.vars['--primary'] || '');
  root.style.setProperty('--sidebar-primary-foreground', theme.vars['--primary-foreground'] || '');
  root.style.setProperty('--sidebar-accent', theme.vars['--muted'] || '');
  root.style.setProperty('--sidebar-accent-foreground', theme.vars['--foreground'] || '');
  root.style.setProperty('--sidebar-border', theme.vars['--border'] || '');
  root.style.setProperty('--sidebar-ring', theme.vars['--ring'] || '');

  // Toggle light/dark mode class
  if (theme.mode === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme.preview.primary);
  }

  // Force body background to match (catches any CSS specificity issues)
  document.body.style.background = `hsl(${theme.vars['--background'] || ''})`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState(DEFAULT_THEME_ID);
  const [heroType, setHeroType] = useState<HeroType>('gradient');
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const appliedRef = useRef(false);

  // Resolve theme object from ID (fallback to default)
  const activeTheme = THEMES[activeThemeId] || THEMES[DEFAULT_THEME_ID];

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(activeTheme);
    appliedRef.current = true;
  }, [activeTheme]);

  // Fetch initial theme and hero settings from global_settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('global_settings')
        .select('theme_id, hero_type, hero_url')
        .eq('id', 'main')
        .maybeSingle();

      if (!error && data) {
        if (data.theme_id && THEMES[data.theme_id]) {
          setActiveThemeId(data.theme_id);
        }
        if (data.hero_type) setHeroType(data.hero_type as HeroType);
        if (data.hero_url !== undefined) setHeroUrl(data.hero_url || null);
      } else {
        setActiveThemeId(DEFAULT_THEME_ID);
      }
    } catch {
      setActiveThemeId(DEFAULT_THEME_ID);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Subscribe to real-time changes on global_settings
  useEffect(() => {
    const channel = supabase
      .channel('theme-realtime')
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_settings',
          filter: 'id=eq.main',
        },
        (payload: any) => {
          const newData = payload?.new;
          if (!newData) return;
          if (newData.theme_id && THEMES[newData.theme_id]) {
            setActiveThemeId(newData.theme_id);
          }
          if (newData.hero_type) setHeroType(newData.hero_type as HeroType);
          setHeroUrl(newData.hero_url || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ activeTheme, activeThemeId, heroType, heroUrl, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
