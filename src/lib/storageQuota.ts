/**
 * storageQuota.ts — Shared upload helper with 50MB per-user quota enforcement.
 *
 * All upload paths (avatar, gallery, verification, registration) should use
 * `uploadWithQuotaCheck()` instead of calling supabase.storage.upload() directly.
 *
 * Quota is tracked as a running total in profiles.storage_used_bytes and
 * enforced atomically via the `increment_storage()` DB function.
 *
 * Chat media counts against the SENDER's quota only.
 */

import { supabase } from '@/integrations/supabase/client';

const STORAGE_MAX_BYTES = 52428800; // 50MB

export interface QuotaCheckResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  currentUsed?: number;
  remaining?: number;
}

/**
 * Upload a file with quota enforcement.
 * 1. Check quota atomically via DB function
 * 2. Upload on success
 * 3. Roll back quota on upload failure
 */
export async function uploadWithQuotaCheck(
  file: File | Blob,
  userId: string,
  storagePath: string,
  bucket: string = 'avatars',
  options?: { upsert?: boolean }
): Promise<QuotaCheckResult> {
  const fileSize = file.size;

  // Step 1: Atomically reserve quota
  const { data: allowed, error: rpcError } = await supabase.rpc('increment_storage', {
    _user_id: userId,
    _bytes: fileSize,
  });

  if (rpcError) {
    console.error('Quota check RPC error:', rpcError);
    return { success: false, error: 'Failed to check storage quota. Please try again.' };
  }

  if (allowed === false) {
    // Fetch current usage for the error message
    const { data: profile } = await supabase
      .from('profiles')
      .select('storage_used_bytes')
      .eq('user_id', userId)
      .single();

    const currentUsed = (profile as any)?.storage_used_bytes || 0;
    const remaining = Math.max(0, STORAGE_MAX_BYTES - currentUsed);
    const usedMB = (currentUsed / 1048576).toFixed(1);
    const fileMB = (fileSize / 1048576).toFixed(1);
    const remainMB = (remaining / 1048576).toFixed(1);

    return {
      success: false,
      error: `You've used ${usedMB}MB of 50MB — this file (${fileMB}MB) needs ${(fileSize / 1048576 - remaining / 1048576).toFixed(1)}MB more than you have left (${remainMB}MB remaining). Delete some files to free space.`,
      currentUsed,
      remaining,
    };
  }

  // Step 2: Upload the file
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { upsert: options?.upsert ?? false });

  if (uploadError) {
    // Roll back the quota reservation
    await supabase.rpc('decrement_storage', { _user_id: userId, _bytes: fileSize });
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Step 3: Get the public URL
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { success: true, publicUrl };
}

/**
 * Decrement storage when a file is deleted (e.g., removing gallery photo).
 */
export async function decrementStorageQuota(
  userId: string,
  estimatedBytes: number
): Promise<void> {
  await supabase.rpc('decrement_storage', {
    _user_id: userId,
    _bytes: estimatedBytes,
  });
}

/**
 * Get current storage usage for a user.
 */
export async function getStorageUsage(userId: string): Promise<{ used: number; max: number; remaining: number }> {
  const { data } = await supabase
    .from('profiles')
    .select('storage_used_bytes')
    .eq('user_id', userId)
    .single();

  const used = (data as any)?.storage_used_bytes || 0;
  return {
    used,
    max: STORAGE_MAX_BYTES,
    remaining: Math.max(0, STORAGE_MAX_BYTES - used),
  };
}
