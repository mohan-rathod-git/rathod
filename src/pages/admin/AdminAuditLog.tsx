/**
 * AdminAuditLog — Immutable audit trail viewer
 * Only accessible to admin/super_admin (enforced by RLS + AdminRoute).
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLog, type AuditAction } from '@/lib/adminAudit';
import { supabase } from '@/integrations/supabase/client';
import { ScrollText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  verify_user: 'text-emerald-600 bg-emerald-500/10',
  reject_verification: 'text-amber-600 bg-amber-500/10',
  ban_user: 'text-destructive bg-destructive/10',
  suspend_user: 'text-amber-600 bg-amber-500/10',
  unsuspend_user: 'text-emerald-600 bg-emerald-500/10',
  warn_user: 'text-amber-600 bg-amber-500/10',
  dismiss_report: 'text-muted-foreground bg-muted',
  uphold_report: 'text-destructive bg-destructive/10',
  broadcast_sent: 'text-blue-600 bg-blue-500/10',
  role_change: 'text-violet-600 bg-violet-500/10',
  delete_user: 'text-destructive bg-destructive/10',
};

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [adminProfiles, setAdminProfiles] = useState<Map<string, string>>(new Map());

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const result = await fetchAuditLog({
      page,
      pageSize: PAGE_SIZE,
      actionFilter: actionFilter || undefined,
    });
    setEntries(result.entries);
    setTotal(result.total);

    // Fetch admin names
    const adminIds = [...new Set(result.entries.map((e: any) => e.admin_id))];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setAdminProfiles(map);
    }

    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-xs text-muted-foreground">{total.toLocaleString()} total entries</p>
      </div>

      {/* Action filter */}
      <div className="mb-5">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value as any); setPage(0); }}
          className="rounded-xl bg-card border border-border/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary/30"
        >
          <option value="">All actions</option>
          <option value="verify_user">Verify User</option>
          <option value="reject_verification">Reject Verification</option>
          <option value="ban_user">Ban User</option>
          <option value="suspend_user">Suspend User</option>
          <option value="unsuspend_user">Unsuspend User</option>
          <option value="dismiss_report">Dismiss Report</option>
          <option value="uphold_report">Uphold Report</option>
          <option value="broadcast_sent">Broadcast Sent</option>
          <option value="role_change">Role Change</option>
        </select>
      </div>

      {/* Entries */}
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <ScrollText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No audit log entries</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                      actionColors[entry.action] || 'text-foreground bg-muted'
                    }`}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{adminProfiles.get(entry.admin_id) || 'Admin'}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {entry.target_type && `on ${entry.target_type}`}
                          {entry.target_id && ` (${entry.target_id.slice(0, 8)}…)`}
                        </span>
                      </p>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {JSON.stringify(entry.details).slice(0, 120)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
