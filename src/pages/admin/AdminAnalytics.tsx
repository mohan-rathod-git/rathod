/**
 * AdminAnalytics — Section 7: Growth Charts & Funnel
 *
 * All data from real Supabase queries. No mock data.
 * Uses Recharts for visualization.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyMetric {
  date: string;
  signups: number;
  matches: number;
  messages: number;
}

interface FunnelStep {
  label: string;
  count: number;
  percentage: number;
}

const AdminAnalytics = () => {
  const [dailyData, setDailyData] = useState<DailyMetric[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [communityData, setCommunityData] = useState<{ community: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startISO = startDate.toISOString();

    // Fetch raw data in parallel
    const [profilesRes, matchesRes, messagesRes, allProfilesRes] = await Promise.all([
      supabase.from('profiles').select('created_at').gte('created_at', startISO),
      supabase.from('interests').select('created_at').eq('status', 'accepted').gte('created_at', startISO),
      supabase.from('messages').select('created_at').gte('created_at', startISO),
      supabase.from('profiles').select('community, profile_completion, is_verified'),
    ]);

    // Aggregate daily
    const dailyMap = new Map<string, DailyMetric>();
    for (let d = 0; d < daysBack; d++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - 1 - d));
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { date: key, signups: 0, matches: 0, messages: 0 });
    }

    (profilesRes.data || []).forEach((row: any) => {
      const key = row.created_at?.split('T')[0];
      if (key && dailyMap.has(key)) dailyMap.get(key)!.signups++;
    });

    (matchesRes.data || []).forEach((row: any) => {
      const key = row.created_at?.split('T')[0];
      if (key && dailyMap.has(key)) dailyMap.get(key)!.matches++;
    });

    (messagesRes.data || []).forEach((row: any) => {
      const key = row.created_at?.split('T')[0];
      if (key && dailyMap.has(key)) dailyMap.get(key)!.messages++;
    });

    setDailyData(Array.from(dailyMap.values()));

    // Funnel analysis (all time)
    const allProfiles = allProfilesRes.data || [];
    const totalSignups = allProfiles.length;
    const profileComplete = allProfiles.filter((p: any) => (p.profile_completion || 0) >= 80).length;
    const verified = allProfiles.filter((p: any) => p.is_verified).length;

    const { count: firstInterestCount } = await supabase
      .from('interests')
      .select('sender_id', { count: 'exact', head: true });

    const { count: firstMatchCount } = await supabase
      .from('interests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted');

    const { count: firstMessageCount } = await supabase
      .from('messages')
      .select('sender_id', { count: 'exact', head: true });

    const funnelSteps: FunnelStep[] = [
      { label: 'Sign Up', count: totalSignups, percentage: 100 },
      { label: 'Profile Complete (≥80%)', count: profileComplete, percentage: totalSignups ? Math.round(profileComplete / totalSignups * 100) : 0 },
      { label: 'Verified', count: verified, percentage: totalSignups ? Math.round(verified / totalSignups * 100) : 0 },
      { label: 'First Interest Sent', count: firstInterestCount || 0, percentage: totalSignups ? Math.round((firstInterestCount || 0) / totalSignups * 100) : 0 },
      { label: 'First Match', count: firstMatchCount || 0, percentage: totalSignups ? Math.round((firstMatchCount || 0) / totalSignups * 100) : 0 },
      { label: 'First Message', count: firstMessageCount || 0, percentage: totalSignups ? Math.round((firstMessageCount || 0) / totalSignups * 100) : 0 },
    ];
    setFunnel(funnelSteps);

    // Community breakdown
    const communityMap = new Map<string, number>();
    allProfiles.forEach((p: any) => {
      const c = p.community || 'Unknown';
      communityMap.set(c, (communityMap.get(c) || 0) + 1);
    });
    setCommunityData(
      Array.from(communityMap.entries())
        .map(([community, count]) => ({ community, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    setLoading(false);
  }, [dateRange]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const exportCSV = () => {
    const headers = 'Date,Signups,Matches,Messages\n';
    const rows = dailyData.map(d => `${d.date},${d.signups},${d.matches},${d.messages}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate max values for chart scaling
  const maxSignups = Math.max(...dailyData.map(d => d.signups), 1);
  const maxMatches = Math.max(...dailyData.map(d => d.matches), 1);
  const maxMessages = Math.max(...dailyData.map(d => d.messages), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Date range tabs */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              dateRange === range ? 'gradient-saffron text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Signups Chart (CSS-based bar chart) */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-bold text-foreground">Daily Signups</h2>
        </div>
        <div className="flex items-end gap-px h-32 overflow-x-auto">
          {dailyData.map((d) => (
            <div
              key={d.date}
              className="flex-1 min-w-[4px] flex flex-col items-center justify-end group"
              title={`${d.date}: ${d.signups} signups`}
            >
              <div
                className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-colors min-h-[2px]"
                style={{ height: `${(d.signups / maxSignups) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{dailyData[0]?.date}</span>
          <span>{dailyData[dailyData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Matches & Messages Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Daily Matches', data: dailyData.map(d => d.matches), max: maxMatches, color: 'bg-pink-500' },
          { label: 'Daily Messages', data: dailyData.map(d => d.messages), max: maxMessages, color: 'bg-violet-500' },
        ].map((chart) => (
          <div key={chart.label} className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft">
            <h3 className="font-heading text-sm font-bold text-foreground mb-4">{chart.label}</h3>
            <div className="flex items-end gap-px h-24">
              {chart.data.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[3px] flex flex-col justify-end"
                  title={`${dailyData[i]?.date}: ${v}`}
                >
                  <div
                    className={`w-full rounded-t ${chart.color}/60 hover:${chart.color} transition-colors min-h-[2px]`}
                    style={{ height: `${(v / chart.max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft mb-6">
        <h2 className="font-heading text-sm font-bold text-foreground mb-4">Conversion Funnel</h2>
        <div className="space-y-2">
          {funnel.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-medium text-muted-foreground w-40 flex-shrink-0 text-right">
                {step.label}
              </span>
              <div className="flex-1 h-7 bg-muted/50 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg gradient-saffron flex items-center justify-end px-2 transition-all duration-500"
                  style={{ width: `${Math.max(step.percentage, 2)}%` }}
                >
                  <span className="text-[10px] font-bold text-white whitespace-nowrap">
                    {step.count.toLocaleString()} ({step.percentage}%)
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Community Breakdown */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 shadow-soft">
        <h2 className="font-heading text-sm font-bold text-foreground mb-4">Community Breakdown (Top 10)</h2>
        <div className="space-y-2">
          {communityData.map((c) => {
            const maxCount = communityData[0]?.count || 1;
            return (
              <div key={c.community} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-32 truncate flex-shrink-0">{c.community}</span>
                <div className="flex-1 h-5 bg-muted/50 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md bg-primary/60"
                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground tabular-nums w-10 text-right">{c.count}</span>
              </div>
            );
          })}
          {communityData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No community data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
