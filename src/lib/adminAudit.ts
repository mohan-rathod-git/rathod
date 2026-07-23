/**
 * Admin Audit Logger — Banjara Bandhan v4.0
 *
 * Every admin action MUST be logged here before the actual mutation.
 * The audit log is immutable — no UPDATE or DELETE operations exist.
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'verify_user'
  | 'reject_verification'
  | 'ban_user'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'warn_user'
  | 'dismiss_report'
  | 'uphold_report'
  | 'broadcast_sent'
  | 'bulk_verify'
  | 'bulk_export'
  | 'role_change'
  | 'delete_user'
  | 'impersonate_view';

export type AuditTargetType =
  | 'user'
  | 'report'
  | 'verification'
  | 'broadcast'
  | 'message'
  | 'system';

interface AuditLogEntry {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}

/**
 * Log an admin action to the immutable audit trail.
 *
 * Call this BEFORE performing the actual mutation so the log
 * entry exists even if the mutation fails.
 *
 * @returns The audit log entry ID, or null on failure
 */
export async function logAdminAction(
  adminId: string,
  entry: AuditLogEntry
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('admin_audit_log' as any)
      .insert({
        admin_id: adminId,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        details: entry.details || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to write audit log:', error);
      return null;
    }

    return (data as any)?.id || null;
  } catch (err) {
    console.error('Audit log error:', err);
    return null;
  }
}

/**
 * Fetch audit log entries with pagination.
 * Only accessible to admin/super_admin (enforced by RLS).
 */
export async function fetchAuditLog(options: {
  page: number;
  pageSize: number;
  actionFilter?: AuditAction;
  adminIdFilter?: string;
}) {
  const { page, pageSize, actionFilter, adminIdFilter } = options;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('admin_audit_log' as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }
  if (adminIdFilter) {
    query = query.eq('admin_id', adminIdFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch audit log:', error);
    return { entries: [], total: 0 };
  }

  return {
    entries: (data as any[]) || [],
    total: count || 0,
  };
}
