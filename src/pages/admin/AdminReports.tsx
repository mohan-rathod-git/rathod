/**
 * AdminReports — Section 5: Abuse Reports & Moderation Queue
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import { Flag, Check, X, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PAGE_SIZE = 15;

const AdminReports = () => {
  const { user: adminUser } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'pending' | 'investigating' | 'upheld' | 'dismissed' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('reports' as any)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error('Failed to fetch reports:', error);
    }

    // Fetch profiles for reporter and reported
    if (data && data.length > 0) {
      const userIds = [...new Set([
        ...(data as any[]).map((r: any) => r.reporter_id),
        ...(data as any[]).map((r: any) => r.reported_id),
      ])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, photo_url')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setReports((data as any[]).map((r: any) => ({
        ...r,
        reporter: profileMap.get(r.reporter_id),
        reported: profileMap.get(r.reported_id),
      })));
    } else {
      setReports([]);
    }
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const handleAction = async (reportId: string, action: 'upheld' | 'dismissed', reportedId: string) => {
    if (!adminUser) return;
    setActionLoading(reportId);

    await logAdminAction(adminUser.id, {
      action: action === 'upheld' ? 'uphold_report' : 'dismiss_report',
      targetType: 'report',
      targetId: reportId,
      details: { reported_user: reportedId },
    });

    const { error } = await supabase
      .from('reports' as any)
      .update({
        status: action,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to update report');
    } else {
      toast.success(`Report ${action}`);

      // Auto-escalation: check if reported user has 3+ upheld reports
      if (action === 'upheld') {
        const { count } = await supabase
          .from('reports' as any)
          .select('*', { count: 'exact', head: true })
          .eq('reported_id', reportedId)
          .eq('status', 'upheld');

        if (count && count >= 3) {
          toast.warning(`⚠️ User has ${count} upheld reports — flagged for review in User Management`);
        }
      }
      fetchReports();
    }
    setActionLoading(null);
  };

  const statusColors: Record<string, string> = {
    pending: 'text-amber-600 bg-amber-500/10',
    investigating: 'text-blue-600 bg-blue-500/10',
    upheld: 'text-destructive bg-destructive/10',
    dismissed: 'text-muted-foreground bg-muted',
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Abuse Reports</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['pending', 'investigating', 'upheld', 'dismissed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              filter === f ? 'gradient-saffron text-white shadow-glow-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/30 p-4 animate-pulse">
              <div className="h-5 w-48 bg-muted rounded mb-2" />
              <div className="h-4 w-72 bg-muted rounded" />
            </div>
          ))
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {filter !== 'all' ? filter : ''} reports</p>
          </div>
        ) : (
          reports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border/30 p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={report.reported?.photo_url || '/placeholder.svg'}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover bg-muted"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {report.reported?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Reported by {report.reporter?.full_name || 'Unknown'} · {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[report.status] || ''}`}>
                  {report.status}
                </span>
              </div>

              <div className="rounded-xl bg-muted/50 px-3 py-2 mb-3">
                <p className="text-xs font-semibold text-foreground mb-0.5">{report.reason}</p>
                {report.details && (
                  <p className="text-xs text-muted-foreground">{report.details}</p>
                )}
              </div>

              {report.status === 'pending' && (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleAction(report.id, 'dismissed', report.reported_id)}
                    disabled={actionLoading === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </button>
                  <button
                    onClick={() => handleAction(report.id, 'upheld', report.reported_id)}
                    disabled={actionLoading === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    {actionLoading === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    Uphold
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
