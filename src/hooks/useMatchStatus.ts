/**
 * Match Status Hook — v5.0
 *
 * Simplified matching model:
 *   - User A sends interest → interest_sent (for A), interest_received (for B)
 *   - User B accepts → MATCHED (no need for B to independently send interest)
 *   - Either party can decline or unmatch
 *
 * State Machine:
 *   NONE → INTEREST_SENT (A) / INTEREST_RECEIVED (B)
 *       → MATCHED (when accepted)
 *       → UNMATCHED / DECLINED
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

    // Fetch both directions in parallel
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

    // Unmatched takes priority
    if (sent?.status === 'unmatched' || received?.status === 'unmatched') {
      state = 'unmatched';
    }
    // Matched: either side accepted the other's interest
    else if (received?.status === 'accepted') {
      // Other person accepted our interest = matched
      state = 'matched';
    } else if (sent?.status === 'accepted') {
      // We accepted their interest = matched
      state = 'matched';
    }
    // Declined
    else if (sent?.status === 'declined') {
      state = 'declined';
    } else if (received?.status === 'declined') {
      state = 'declined';
    }
    // Pending states
    else if (sent?.status === 'pending') {
      state = 'interest_sent';
    } else if (received?.status === 'pending') {
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

    // Subscribe to realtime changes on this interest pair
    if (!user?.id || !otherUserId) return;
    const channel = supabase
      .channel(`match-status-${user.id}-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interests" },
        (payload: any) => {
          // Only refresh if this change affects our pair
          const row = payload.new || payload.old || {};
          const isRelevant =
            (row.sender_id === user.id && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === user.id);
          if (isRelevant) computeState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [computeState, user?.id, otherUserId]);

  const sendInterest = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;

    // Check if a declined/pending record exists first (avoid duplicate key)
    const { data: existing } = await supabase.from("interests")
      .select("id, status")
      .eq("sender_id", user.id)
      .eq("receiver_id", otherUserId)
      .maybeSingle();

    if (existing) {
      // Re-send: update status back to pending
      const { error } = await supabase.from("interests")
        .update({ status: 'pending' })
        .eq("id", existing.id);
      if (error) return false;
    } else {
      const { error } = await supabase.from("interests").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        status: 'pending',
      });
      if (error) return false;
    }
    await computeState();
    return true;
  }, [user?.id, otherUserId, computeState]);

  const acceptInterest = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;

    // Find the interest record where we are the receiver
    const { data: interest, error: fetchError } = await supabase.from("interests")
      .select("id, status")
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .maybeSingle();

    if (fetchError || !interest) {
      console.error("acceptInterest: interest record not found", { otherUserId, userId: user.id, fetchError });
      return false;
    }

    const { error } = await supabase.from("interests")
      .update({ status: 'accepted' })
      .eq("id", interest.id);

    if (error) {
      console.error("acceptInterest: update failed", error);
      return false;
    }

    await computeState();
    return true;
  }, [user?.id, otherUserId, computeState]);

  const declineInterest = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;

    const { data: interest } = await supabase.from("interests")
      .select("id")
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .maybeSingle();

    if (!interest) return false;

    const { error } = await supabase.from("interests")
      .update({ status: 'declined' })
      .eq("id", interest.id);

    if (error) return false;
    await computeState();
    return true;
  }, [user?.id, otherUserId, computeState]);

  const unmatch = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !otherUserId) return false;

    const now = new Date().toISOString();
    const updates: Promise<any>[] = [];

    if (status.sentInterestId) {
      updates.push(
        supabase.from("interests")
          .update({ status: 'unmatched' } as any)
          .eq("id", status.sentInterestId)
      );
    }
    if (status.receivedInterestId) {
      updates.push(
        supabase.from("interests")
          .update({ status: 'unmatched' } as any)
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
