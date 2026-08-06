/**
 * AdminThemes — Theme Management (super_admin only)
 *
 * Displays all 10 premium themes as interactive cards.
 * Clicking "Make Live" pushes the theme to all users instantly
 * via the global_settings table + Supabase real-time.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { logAdminAction } from '@/lib/adminAudit';
import { LIGHT_THEMES, DARK_THEMES, type AppTheme } from '@/lib/themes';
import { toast } from 'sonner';
import { Palette, Sun, Moon, Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminThemes = () => {
  const { user: adminUser } = useAuth();
  const { activeThemeId } = useTheme();
  const [pushing, setPushing] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleMakeLive = async (theme: AppTheme) => {
    if (!adminUser) return;
    if (theme.id === activeThemeId) {
      toast.info('This theme is already live!');
      return;
    }

    setPushing(theme.id);

    // Log the theme change to audit trail
    await logAdminAction(adminUser.id, {
      action: 'role_change' as any,
      targetType: 'system',
      targetId: 'global_settings',
      details: {
        op: 'theme_change',
        from_theme: activeThemeId,
        to_theme: theme.id,
        theme_name: theme.name,
        theme_mode: theme.mode,
      },
    });

    // Upsert the global_settings row
    const { error } = await (supabase as any)
      .from('global_settings')
      .upsert(
        { id: 'main', theme_id: theme.id, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Theme push error:', error);
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        toast.error(
          'The global_settings table does not exist yet. Please run the SQL migration first.',
          { duration: 6000 }
        );
      } else {
        toast.error(`Failed to push theme: ${error.message}`);
      }
    } else {
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span><strong>{theme.name}</strong> is now live for all users!</span>
        </div>
      );
    }

    setPushing(null);
  };

  const ThemeCard = ({ theme, index }: { theme: AppTheme; index: number }) => {
    const isActive = theme.id === activeThemeId;
    const isPushing = pushing === theme.id;
    const isHovered = previewId === theme.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onMouseEnter={() => setPreviewId(theme.id)}
        onMouseLeave={() => setPreviewId(null)}
        className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
          isActive
            ? 'border-primary shadow-glow-primary bg-card'
            : 'border-border/30 bg-card hover:border-primary/30 hover:shadow-medium'
        }`}
      >
        {/* Active badge */}
        {isActive && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            <Zap className="h-3 w-3" />
            LIVE
          </div>
        )}

        {/* Color preview bar */}
        <div className="h-20 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.preview.primary} 0%, ${theme.preview.accent} 50%, ${theme.preview.background} 100%)`,
            }}
          />
          {/* Simulated UI elements */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg shadow-md"
              style={{ backgroundColor: theme.preview.card }}
            />
            <div className="flex-1 space-y-1">
              <div
                className="h-2 w-3/4 rounded-full"
                style={{ backgroundColor: theme.preview.card, opacity: 0.9 }}
              />
              <div
                className="h-1.5 w-1/2 rounded-full"
                style={{ backgroundColor: theme.preview.card, opacity: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Theme info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading text-sm font-bold text-foreground">{theme.name}</h3>
            {theme.mode === 'dark' ? (
              <Moon className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Sun className="h-3 w-3 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            {theme.description}
          </p>

          {/* Color swatches */}
          <div className="flex items-center gap-1.5 mb-4">
            {[theme.preview.primary, theme.preview.accent, theme.preview.background, theme.preview.card].map(
              (color, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border border-border/30 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={['Primary', 'Accent', 'Background', 'Card'][i]}
                />
              )
            )}
            <span className="text-[9px] text-muted-foreground ml-1 uppercase tracking-wider">
              {theme.mode}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={() => handleMakeLive(theme)}
            disabled={isActive || isPushing}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-primary/10 text-primary cursor-default'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-soft'
            } disabled:opacity-60`}
          >
            {isPushing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Pushing...
              </>
            ) : isActive ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Currently Live
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Make Live
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Palette className="h-6 w-6 text-primary" />
          Theme Management
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Change the live theme for all users. Changes are pushed instantly via real-time sync.
        </p>
      </div>

      {/* Light Themes */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="h-4.5 w-4.5 text-amber-500" />
          <h2 className="font-heading text-lg font-bold text-foreground">Light Themes</h2>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
            {LIGHT_THEMES.length}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {LIGHT_THEMES.map((theme, i) => (
            <ThemeCard key={theme.id} theme={theme} index={i} />
          ))}
        </div>
      </div>

      {/* Dark Themes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Moon className="h-4.5 w-4.5 text-violet-400" />
          <h2 className="font-heading text-lg font-bold text-foreground">Dark Themes</h2>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
            {DARK_THEMES.length}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {DARK_THEMES.map((theme, i) => (
            <ThemeCard key={theme.id} theme={theme} index={i + LIGHT_THEMES.length} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminThemes;
