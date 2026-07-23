/**
 * AdminDashboard — Section 2: Realtime Overview Metrics
 *
 * All data reads from real Supabase tables via live queries + subscriptions.
 * No mock/placeholder data.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, UserPlus, Heart, MessageCircle, ShieldCheck, Flag, Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: null as number | null,
    newSignupsToday: null as number | null,
    activeMatches: null as number | null,
    messagesToday: null as number | null,
    pendingVerifications: null as number | null,
    openReports: null as number | null,
    onlineNow: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [
      totalUsersRes,
      newSignupsRes,
      activeMatchesRes,
      messagesTodayRes,
      pendingVerifRes,
      openReportsRes,
      onlineNowRes,
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // New signups today
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      // Active matches (accepted interests)
      supabase.from('interests').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      // Messages today
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      // Pending verifications
      supabase.from('verification_requests' as any).select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Open reports
      supabase.from('reports' as any).select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Online now
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('is_online', true),
    ]);

    setMetrics({
      totalUsers: totalUsersRes.count ?? 0,
      newSignupsToday: newSignupsRes.count ?? 0,
      activeMatches: activeMatchesRes.count ?? 0,
      messagesToday: messagesTodayRes.count ?? 0,
      pendingVerifications: pendingVerifRes.count ?? 0,
      openReports: openReportsRes.count ?? 0,
      onlineNow: onlineNowRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchMetrics())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  const cards: MetricCard[] = [
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { label: 'New Signups Today', value: metrics.newSignupsToday, icon: UserPlus, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
    { label: 'Active Matches', value: metrics.activeMatches, icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-500/10' },
    { label: 'Messages Today', value: metrics.messagesToday, icon: MessageCircle, color: 'text-violet-600', bgColor: 'bg-violet-500/10' },
    { label: 'Pending Verifications', value: metrics.pendingVerifications, icon: ShieldCheck, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    { label: 'Open Reports', value: metrics.openReports, icon: Flag, color: 'text-red-600', bgColor: 'bg-red-500/10' },
    { label: 'Users Online Now', value: metrics.onlineNow, icon: Wifi, color: 'text-teal-600', bgColor: 'bg-teal-500/10' },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft hover:shadow-medium transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>

            {loading || card.value === null ? (
              <div className="space-y-2">
                <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
                <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="font-heading text-3xl font-bold text-foreground tabular-nums">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{card.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Review Verifications', href: '/admin/verification', icon: ShieldCheck, count: metrics.pendingVerifications },
            { label: 'View Reports', href: '/admin/reports', icon: Flag, count: metrics.openReports },
            { label: 'Manage Users', href: '/admin/users', icon: Users },
            { label: 'Send Broadcast', href: '/admin/broadcasts', icon: MessageCircle },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-soft transition-all text-center group"
            >
              <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
              {action.count != null && action.count > 0 && (
                <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  {action.count} pending
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
