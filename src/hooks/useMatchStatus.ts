/**
 * Match Status Hook
 *
 * Provides a centralized way for components to check if the current user
 * is matched with another user. Uses the interests table to determine
 * mutual accepted status.
 *
 * Interest/Match State Machine (v4.0 §5):
 *   NONE → INTEREST_SENT → INTEREST_RECEIVED → MATCHED → (optionally) UNMATCHED
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type InterestState =
  | 'none'
  | 'interest_sent'
  | 'interest_received'
  | 'matched'
  | 'unmatched'
  | 'declined';

export interface MatchStatus {
  state: InterestState;
  /** The interest record ID where current user is sender (if exists) */
  sentInterestId: string | null;
  /** The interest record ID where current user is receiver (if exists) */
  receivedInterestId: string | null;
  loading: boolean;
}

/**
 * Check match/interest status between the current user and another user.
 */
export function useMatchStatus(otherUserId: string | undefined): MatchStatus & {
  sendInterest: () => Promise<boolean>;
  acceptInterest: () => Promise<boolean>;
  declineInterest: () => Promise<boolean>;
  unmatch: () => Promise<boolean>;
  refresh: () => void;
} {
  const { user } = useAuth();
  const [status, setStatus] = useState<MatchStatus>({
    state: 'none',
    sentInterestId: null,
    receivedInterestId: null,
    loading: true,
  });

  const computeState = useCallback(async () => {
    if (!user?.id || !otherUserId || user.id === otherUserId) {
      setStatus({ state: 'none', sentInterestId: null, receivedInterestId: null, loading: false });
      return;
    }

    const [sentRes, receivedRes] = await Promise.all([
      supabase.from("interests")
        .select("id, status")
        .eq("sender_id", user.id)
        .eq("receiver_id", otherUserId)
        .maybeSingle(),
      supabase.from("interests")
        .select("id, status")
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .maybeSingle(),
    ]);

    const sent = sentRes.data;
    const received = receivedRes.data;

    let state: InterestState = 'none';
    if (sent?.status === 'unmatched' || received?.status === 'unmatched') {
      state = 'unmatched';
    } else if (sent?.status === 'accepted' && received?.status === 'accepted') {
      state = 'matched';
    } else if (sent?.status === 'declined') {
      state = 'declined';
    } else if (sent && sent.status === 'pending') {
      state = 'interest_sent';
    } else if (received && received.status === 'pending') {
      state = 'interest_received';
    } else if (sent?.status === 'accepted' && !received) {
      // One-sided accept (sent accepted but no reverse interest yet)
      state = 'interest_sent';
    } else if (received?.status === 'accepted' && !sent) {
      state = 'interest_received';
    }

    setStatus({
      state,
      sentInterestId: sent?.id ?? null,
      receivedInterestId: received?.id ?? null,
      loading: false,
    });
  }, [user?.id, otherUserId]);

  useEffect(() => {
    computeState();
  }, [computeState]);

  const sendInterest = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;
    const { error } = await supabase.from("interests").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      status: 'pending',
    });
    if (error) return false;
    await computeState();
    return true;
  }, [user?.id, otherUserId, computeState]);

  const acceptInterest = useCallback(async (): Promise<boolean> => {
    if (!status.receivedInterestId) return false;
    const { error } = await supabase.from("interests")
      .update({ status: 'accepted' })
      .eq("id", status.receivedInterestId);
    if (error) return false;
    await computeState();
    return true;
  }, [status.receivedInterestId, computeState]);

  const declineInterest = useCallback(async (): Promise<boolean> => {
    if (!status.receivedInterestId) return false;
    const { error } = await supabase.from("interests")
      .update({ status: 'declined' })
      .eq("id", status.receivedInterestId);
    if (error) return false;
    await computeState();
    return true;
  }, [status.receivedInterestId, computeState]);

  const unmatch = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;

    // Unmatch from both sides — set status to 'unmatched' with timestamp
    const now = new Date().toISOString();
    const updates = [];

    if (status.sentInterestId) {
      updates.push(
        supabase.from("interests")
          .update({ status: 'unmatched', unmatched_at: now } as any)
          .eq("id", status.sentInterestId)
      );
    }
    if (status.receivedInterestId) {
      updates.push(
        supabase.from("interests")
          .update({ status: 'unmatched', unmatched_at: now } as any)
          .eq("id", status.receivedInterestId)
      );
    }

    await Promise.all(updates);
    await computeState();
    return true;
  }, [user?.id, otherUserId, status.sentInterestId, status.receivedInterestId, computeState]);

  return {
    ...status,
    sendInterest,
    acceptInterest,
    declineInterest,
    unmatch,
    refresh: computeState,
  };
}
