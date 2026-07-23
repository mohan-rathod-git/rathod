/**
 * useFriendStatus.ts — Friend status hook & state machine
 *
 * Checks friend status between current user and partner.
 * Manages friend requests (send, accept, decline).
 * Listens for realtime updates on `friend_requests` table.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export function useFriendStatus(partnerId?: string) {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendStatus>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user || !partnerId) {
      setStatus('none');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('friend_requests' as any)
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching friend status:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      setStatus('none');
      setRequestId(null);
    } else if (data.status === 'accepted') {
      setStatus('friends');
      setRequestId(data.id);
    } else if (data.status === 'pending') {
      setRequestId(data.id);
      if (data.sender_id === user.id) {
        setStatus('pending_sent');
      } else {
        setStatus('pending_received');
      }
    } else {
      setStatus('none');
      setRequestId(null);
    }
    setLoading(false);
  }, [user, partnerId]);

  useEffect(() => {
    fetchStatus();

    if (!user || !partnerId) return;

    // Realtime subscription for friend status updates
    const channel = supabase
      .channel(`friend-${user.id}-${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatus, user, partnerId]);

  const sendFriendRequest = async (): Promise<boolean> => {
    if (!user || !partnerId) return false;

    const { error } = await supabase.from('friend_requests' as any).insert({
      sender_id: user.id,
      receiver_id: partnerId,
      status: 'pending',
    });

    if (error) {
      toast.error('Could not send friend request');
      console.error(error);
      return false;
    }

    toast.success('Friend request sent! 🤝');
    await fetchStatus();
    return true;
  };

  const acceptFriendRequest = async (): Promise<boolean> => {
    if (!requestId) return false;

    const { error } = await supabase
      .from('friend_requests' as any)
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to accept request');
      return false;
    }

    toast.success('Friend request accepted! Voice & Video calls unlocked! 🎉');
    await fetchStatus();
    return true;
  };

  const declineFriendRequest = async (): Promise<boolean> => {
    if (!requestId) return false;

    const { error } = await supabase
      .from('friend_requests' as any)
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to decline request');
      return false;
    }

    toast.success('Request declined');
    await fetchStatus();
    return true;
  };

  return {
    status,
    isFriends: status === 'friends',
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    refetch: fetchStatus,
  };
}
