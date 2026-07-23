import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRealtimeProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, gender, date_of_birth, photo_url, community, gotra, city_village, state, occupation, education, annual_income, marital_status, mother_tongue, height, about, rashi, manglik, is_premium, is_verified, is_online")
      .gte("registration_step", 2)
      .eq("is_hidden" as any, false)
      .order("created_at", { ascending: false })
      .limit(50);

    setProfiles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();

    // Debounce realtime updates to avoid refetching on every tiny change
    let debounceTimer: NodeJS.Timeout;
    const channel = supabase
      .channel("profiles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchProfiles, 1000);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  return { profiles, loading, refetch: fetchProfiles };
}

export function useRealtimeInterests() {
  const { user } = useAuth();
  const [sent, setSent] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [mutual, setMutual] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    if (!user) return;

    // Fetch both directions in parallel
    const [sentRes, receivedRes] = await Promise.all([
      supabase
        .from("interests")
        .select("*, profiles!interests_receiver_id_fkey(full_name, photo_url, community, gotra, date_of_birth, city_village, state)")
        .eq("sender_id", user.id),
      supabase
        .from("interests")
        .select("*, profiles!interests_sender_id_fkey(full_name, photo_url, community, gotra, date_of_birth, city_village, state)")
        .eq("receiver_id", user.id),
    ]);

    const sentData = sentRes.data || [];
    const receivedData = receivedRes.data || [];

    setSent(sentData);
    setReceived(receivedData);

    // Compute mutual connections
    const mutualList: any[] = [];
    const seenPartners = new Set<string>();

    for (const s of sentData) {
      if (s.status === "accepted" && !seenPartners.has(s.receiver_id)) {
        seenPartners.add(s.receiver_id);
        mutualList.push(s);
      }
    }

    for (const r of receivedData) {
      if (r.status === "accepted" && !seenPartners.has(r.sender_id)) {
        seenPartners.add(r.sender_id);
        mutualList.push(r);
      }
    }

    setMutual(mutualList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInterests();

    let debounceTimer: NodeJS.Timeout;
    const channel = supabase
      .channel("interests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchInterests, 500);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchInterests]);

  return { sent, received, mutual, loading, refetch: fetchInterests };
}

export function useRealtimeMessages(otherUserId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) {
      const convMap = new Map<string, any>();
      data.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastTime: msg.created_at,
            lastSenderId: msg.sender_id,
            unread: msg.sender_id !== user.id && !msg.is_read ? 1 : 0,
          });
        } else if (msg.sender_id !== user.id && !msg.is_read) {
          convMap.get(partnerId).unread += 1;
        }
      });
      setConversations(Array.from(convMap.values()));
    }
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !otherUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);
    setLoading(false);
  }, [user, otherUserId]);

  useEffect(() => {
    if (otherUserId) {
      fetchMessages();
    } else {
      fetchConversations();
    }

    const channelKey = otherUserId ? `messages-${user?.id}-${otherUserId}` : `messages-inbox-${user?.id}`;
    const channel = supabase
      .channel(channelKey)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          if (otherUserId) fetchMessages();
          else fetchConversations();
        }, 200);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, fetchMessages, fetchConversations]);

  return { messages, conversations, loading, refetch: otherUserId ? fetchMessages : fetchConversations };
}
