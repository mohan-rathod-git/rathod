/**
 * Notification Hook — Banjara Bandhan v5.0
 *
 * Unified notifications feed covering:
 * - Interests received
 * - Mutual matches
 * - New messages
 * - System broadcasts & Admin alerts
 *
 * Features persistent read state, real-time sync, and category filtering.
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationCategory = "all" | "likes" | "interests" | "messages" | "matches" | "system";

export interface NotificationItem {
  id: string;
  type: "interest_received" | "match" | "message" | "system";
  category: "interests" | "matches" | "messages" | "system";
  title: string;
  body: string;
  fromUserId: string | null;
  fromUserName: string | null;
  fromUserPhoto: string | null;
  read: boolean;
  createdAt: string;
  linkUrl: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to load read IDs from localStorage
  const getReadSet = useCallback((userId: string): Set<string> => {
    try {
      const stored = localStorage.getItem(`bb_read_notifications_${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  const saveReadSet = useCallback((userId: string, readSet: Set<string>) => {
    try {
      localStorage.setItem(`bb_read_notifications_${userId}`, JSON.stringify(Array.from(readSet)));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const readSet = getReadSet(user.id);

      // 1. Fetch received interests & matches
      const { data: interests } = await supabase
        .from("interests")
        .select("id, sender_id, status, created_at")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40);

      // 2. Fetch latest received messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      // 3. Fetch system broadcasts
      const { data: broadcasts } = await supabase
        .from("admin_broadcasts" as any)
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // Extract unique user IDs for profile details
      const senderIds = Array.from(
        new Set([
          ...(interests || []).map((i) => i.sender_id),
          ...(messages || []).map((m) => m.sender_id),
        ])
      );

      let profileMap = new Map<string, { full_name: string; photo_url: string | null }>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, photo_url")
          .in("user_id", senderIds);

        if (profiles) {
          profileMap = new Map(profiles.map((p) => [p.user_id, p]));
        }
      }

      const unified: NotificationItem[] = [];

      // Map Interests & Matches
      (interests || []).forEach((interest) => {
        const sender = profileMap.get(interest.sender_id);
        const name = sender?.full_name || "Someone";
        const isMatch = interest.status === "matched" || interest.status === "accepted";

        unified.push({
          id: `interest-${interest.id}`,
          type: isMatch ? "match" : "interest_received",
          category: isMatch ? "matches" : "interests",
          title: isMatch ? "🎉 It's a Match!" : "💕 Interest Received",
          body: isMatch
            ? `You and ${name} are now connected! Tap to start chatting.`
            : `${name} has shown interest in your profile.`,
          fromUserId: interest.sender_id,
          fromUserName: name,
          fromUserPhoto: sender?.photo_url || null,
          read: readSet.has(`interest-${interest.id}`),
          createdAt: interest.created_at,
          linkUrl: isMatch ? `/chat/${interest.sender_id}` : `/profile/${interest.sender_id}`,
        });
      });

      // Map Messages
      (messages || []).forEach((msg) => {
        const sender = profileMap.get(msg.sender_id);
        const name = sender?.full_name || "Someone";

        unified.push({
          id: `msg-${msg.id}`,
          type: "message",
          category: "messages",
          title: `💬 ${name}`,
          body: msg.content?.slice(0, 75) || "Sent you a message",
          fromUserId: msg.sender_id,
          fromUserName: name,
          fromUserPhoto: sender?.photo_url || null,
          read: readSet.has(`msg-${msg.id}`),
          createdAt: msg.created_at,
          linkUrl: `/chat/${msg.sender_id}`,
        });
      });

      // Map System Broadcasts
      ((broadcasts as any[]) || []).forEach((b) => {
        unified.push({
          id: `sys-${b.id}`,
          type: "system",
          category: "system",
          title: `📢 ${b.title || "Announcement"}`,
          body: b.message || "System update from Banjara Bandhan",
          fromUserId: null,
          fromUserName: "Banjara Bandhan",
          fromUserPhoto: null,
          read: readSet.has(`sys-${b.id}`),
          createdAt: b.created_at,
          linkUrl: "/settings",
        });
      });

      // Sort by newest first
      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(unified);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user, getReadSet]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!user) return;
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
        const readSet = new Set(next.filter((n) => n.read).map((n) => n.id));
        saveReadSet(user.id, readSet);
        return next;
      });
    },
    [user, saveReadSet]
  );

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      const readSet = new Set(next.map((n) => n.id));
      saveReadSet(user.id, readSet);
      return next;
    });
  }, [user, saveReadSet]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
