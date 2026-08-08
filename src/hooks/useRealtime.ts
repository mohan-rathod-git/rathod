import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRealtimeProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    // Fetch profiles with registration_step >= 2 (SetupProfile now always sets this)
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, gender, date_of_birth, photo_url, community, gotra, city_village, state, occupation, education, annual_income, marital_status, mother_tongue, height, about, rashi, manglik, is_premium, is_verified, is_online, registration_step")
      .gte("registration_step", 2)
      .not("full_name", "is", null)
      .neq("full_name", "")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

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

    // Fetch both directions in parallel (without broken FK join to auth.users)
    const [sentRes, receivedRes] = await Promise.all([
      supabase
        .from("interests")
        .select("id, sender_id, receiver_id, status, created_at")
        .eq("sender_id", user.id),
      supabase
        .from("interests")
        .select("id, sender_id, receiver_id, status, created_at")
        .eq("receiver_id", user.id),
    ]);

    const sentRaw = sentRes.data || [];
    const receivedRaw = receivedRes.data || [];

    // Collect all partner user_ids we need profiles for
    const partnerIds = [
      ...sentRaw.map((i) => i.receiver_id),
      ...receivedRaw.map((i) => i.sender_id),
    ].filter(Boolean);

    const uniquePartnerIds = [...new Set(partnerIds)];

    // Fetch profiles by user_id (not via broken FK)
    let profilesMap: Record<string, any> = {};
    if (uniquePartnerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, photo_url, community, gotra, city_village, state, date_of_birth")
        .in("user_id", uniquePartnerIds);

      if (profilesData) {
        profilesMap = Object.fromEntries(profilesData.map((p) => [p.user_id, p]));
      }
    }

    // Attach profile data to each interest record
    const sentData = sentRaw.map((i) => ({
      ...i,
      profiles: profilesMap[i.receiver_id] || null,
    }));
    const receivedData = receivedRaw.map((i) => ({
      ...i,
      profiles: profilesMap[i.sender_id] || null,
    }));

    setSent(sentData);
    setReceived(receivedData);

    // Compute mutual matches:
    // A match exists when: interest is accepted (from either direction)
    const mutualList: any[] = [];
    const seenPartners = new Set<string>();

    // Interests we sent that were accepted
    for (const s of sentData) {
      if (s.status === "accepted" && !seenPartners.has(s.receiver_id)) {
        seenPartners.add(s.receiver_id);
        mutualList.push(s);
      }
    }

    // Interests we received that we accepted
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
