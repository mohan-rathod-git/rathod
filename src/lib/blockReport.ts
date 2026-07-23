/**
 * Block & Report System — Banjara Bandhan v4.0 §10
 *
 * Provides block/unblock and report functionality.
 * Block immediately hides the blocked user from all feeds, search,
 * and messaging. Unblock reverses this. Report sends a flagged
 * record for admin review.
 */

import { supabase } from '@/integrations/supabase/client';

export type ReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'fake_profile', label: 'Fake or impersonated profile' },
  { value: 'inappropriate_photos', label: 'Inappropriate photos' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'underage', label: 'Underage user' },
  { value: 'other', label: 'Other' },
];

/**
 * Block a user. Returns true on success.
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blocked_users' as any)
      .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) {
      if (error.code === '23505') {
        // Already blocked — that's fine
        return true;
      }
      console.error('Failed to block user:', error);
      return false;
    }

    // Also remove any existing interests between the two users
    await supabase
      .from('interests')
      .delete()
      .or(`and(sender_id.eq.${blockerId},receiver_id.eq.${blockedId}),and(sender_id.eq.${blockedId},receiver_id.eq.${blockerId})`);

    return true;
  } catch (err) {
    console.error('Block user error:', err);
    return false;
  }
}

/**
 * Unblock a user. Returns true on success.
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blocked_users' as any)
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.error('Failed to unblock user:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unblock user error:', err);
    return false;
  }
}

/**
 * Report a user. Returns true on success.
 */
export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  details?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reports' as any)
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        details: details || null,
        status: 'pending',
      });

    if (error) {
      console.error('Failed to report user:', error);
      return false;
    }

    // Auto-block after reporting
    await blockUser(reporterId, reportedId);
    return true;
  } catch (err) {
    console.error('Report user error:', err);
    return false;
  }
}

/**
 * Check if a user is blocked by the current user.
 */
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_users' as any)
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
