/**
 * AdminUnderDevelopment — Admin panel to control which pages show
 * the "Under Development" screen to regular users.
 *
 * Admins are NEVER shown the Under Development page — they always see
 * the real content.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Construction, ToggleLeft, ToggleRight, Loader2, Eye, EyeOff, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// All public-facing routes in the app that can be placed under development
const ALL_ROUTES = [
  { path: '/explore', label: 'Explore / Browse' },
  { path: '/matches', label: 'Matches' },
  { path: '/messages', label: 'Messages' },
  { path: '/my-profile', label: 'My Profile' },
  { path: '/edit-profile', label: 'Edit Profile' },
  { path: '/settings', label: 'Settings' },
  { path: '/subscription', label: 'Subscription / Premium' },
  { path: '/horoscope', label: 'Horoscope Match' },
  { path: '/success-stories', label: 'Success Stories' },
  { path: '/about', label: 'About Us' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/feedback', label: 'Feedback' },
  { path: '/verify-profile', label: 'Verify Profile' },
];

interface UDRoute {
  path: string;
  enabled: boolean;
}

const AdminUnderDevelopment = () => {
  const { user: adminUser } = useAuth();
  const [routes, setRoutes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('under_development_routes' as any)
      .select('path, enabled');

    if (error) {
      console.error('Failed to load under_development_routes:', error);
      // Table might not exist yet — treat as all disabled
      setRoutes({});
    } else {
      const map: Record<string, boolean> = {};
      (data as UDRoute[] || []).forEach((r) => {
        map[r.path] = r.enabled;
      });
      setRoutes(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleToggle = async (path: string, currentEnabled: boolean) => {
    if (!adminUser) return;
    setSaving(path);

    const newEnabled = !currentEnabled;

    const { error } = await supabase
      .from('under_development_routes' as any)
      .upsert({
        path,
        enabled: newEnabled,
        updated_at: new Date().toISOString(),
        updated_by: adminUser.id,
      } as any, { onConflict: 'path' });

    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      // If table doesn't exist, show helpful message
      if (error.message.includes('does not exist') || error.code === '42P01') {
        toast.error(
          'The under_development_routes table is missing. Please run the SQL migration from the README.',
          { duration: 8000 }
        );
      }
    } else {
      setRoutes((prev) => ({ ...prev, [path]: newEnabled }));
      toast.success(
        newEnabled
          ? `"${path}" is now showing Under Development to users`
          : `"${path}" is now live again`
      );
    }

    setSaving(null);
  };

  const enabledCount = Object.values(routes).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Construction className="h-6 w-6 text-amber-500" />
            Under Development Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle which pages show the "Under Development" screen to regular users.
            Admins always see the real page.
          </p>
        </div>
        {enabledCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Construction className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {enabledCount} page{enabledCount !== 1 ? 's' : ''} under development
            </span>
          </div>
        )}
      </div>

      {/* Preview note */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 mb-6 flex items-start gap-3 shadow-soft">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">How this works</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            When a route is enabled here, any regular user who visits that page will see
            the "Under Development" screen with your branded image. Admins and moderators
            always see the real page. Changes take effect immediately.
          </p>
          <a
            href="/under-development-preview"
            target="_blank"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary hover:underline"
          >
            <Eye className="h-3 w-3" /> Preview the Under Development page
          </a>
        </div>
      </div>

      {/* Routes list */}
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {ALL_ROUTES.map((route, i) => {
              const enabled = routes[route.path] ?? false;
              const isSaving = saving === route.path;
              return (
                <motion.div
                  key={route.path}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors ${
                    enabled ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        enabled ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {route.label}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{route.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        enabled
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {enabled ? 'Under Dev' : 'Live'}
                    </span>
                    <button
                      onClick={() => handleToggle(route.path, enabled)}
                      disabled={isSaving}
                      className="relative flex items-center justify-center h-9 w-9 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                      title={enabled ? 'Mark as Live' : 'Mark as Under Development'}
                    >
                      {isSaving ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : enabled ? (
                        <ToggleRight className="h-8 w-8 text-amber-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* SQL migration note */}
      <div className="mt-6 rounded-2xl border border-dashed border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Required: Run this SQL in your Supabase dashboard once if not done yet
        </p>
        <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded-xl p-3 overflow-x-auto leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.under_development_routes (
  path        TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id)
);
ALTER TABLE public.under_development_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage" ON public.under_development_routes
  USING (true) WITH CHECK (true);
CREATE POLICY "Public read" ON public.under_development_routes
  FOR SELECT USING (true);`}
        </pre>
      </div>
    </div>
  );
};

export default AdminUnderDevelopment;
