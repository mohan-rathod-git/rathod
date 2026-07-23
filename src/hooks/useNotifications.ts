/**
 * Notification Hook — Banjara Bandhan v4.0
 *
 * Provides real-time notification feed:
 * - Interest received
 * - Interest accepted (match!)
 * - New message
 * - Profile view (if premium)
 *
 * Uses Supabase real-time subscriptions for push-like behavior.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'interest_received' | 'match' | 'message' | 'profile_view' | 'system';
  title: string;
  body: string;
  fromUserId: string | null;
  fromUserName: string | null;
  fromUserPhoto: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Build notifications from interests table
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch interests received (as notifications)
      const { data: interests } = await supabase
        .from('interests')
        .select('id, sender_id, status, created_at')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!interests || interests.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Fetch sender profiles
      const senderIds = [...new Set(interests.map((i: any) => i.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, photo_url')
        .in('user_id', senderIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const notifs: Notification[] = interests.map((interest: any) => {
        const sender = profileMap.get(interest.sender_id);
        const name = sender?.full_name || 'Someone';
        const isMatch = interest.status === 'matched';

        return {
          id: interest.id,
          type: isMatch ? 'match' as const : 'interest_received' as const,
          title: isMatch ? '🎉 New Match!' : '💫 Interest Received',
          body: isMatch
            ? `You and ${name} are now matched! Start chatting.`
            : `${name} has shown interest in your profile.`,
          fromUserId: interest.sender_id,
          fromUserName: name,
          fromUserPhoto: sender?.photo_url || null,
          read: false, // TODO: Track read state in DB
          createdAt: interest.created_at,
        };
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new interests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(); // Refetch on new interest
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interests',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.status === 'matched') {
            fetchNotifications(); // Refetch when our interest is accepted
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
