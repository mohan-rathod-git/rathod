import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { createElement } from "react";

const RealtimeNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use ref for preferences to avoid re-subscribing when they change
  const prefsRef = useRef({
    push_notifications: true,
    interest_notifications: true,
    message_notifications: true,
    match_notifications: true,
  });

  // Load notification preferences once
  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("push_notifications, interest_notifications, message_notifications, match_notifications")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          prefsRef.current = {
            push_notifications: data.push_notifications ?? true,
            interest_notifications: data.interest_notifications ?? true,
            message_notifications: data.message_notifications ?? true,
            match_notifications: data.match_notifications ?? true,
          };
        }
      });
  }, [user]);

  // Single realtime subscription for all notification events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const prefs = prefsRef.current;
          if (!prefs.push_notifications || !prefs.interest_notifications) return;
          const { data } = await supabase.from("profiles").select("full_name").eq("user_id", payload.new.sender_id).maybeSingle();
          toast(data?.full_name || "Someone", {
            description: "sent you an interest! 💕",
            icon: createElement(Heart, { className: "h-4 w-4 text-primary" }),
            duration: 5000,
            action: { label: "View", onClick: () => navigate("/matches") }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const prefs = prefsRef.current;
          if (!prefs.push_notifications || !prefs.message_notifications) return;
          const { data } = await supabase.from("profiles").select("full_name").eq("user_id", payload.new.sender_id).maybeSingle();
          toast(data?.full_name || "Someone", {
            description: payload.new.content?.slice(0, 50) || "sent you a message",
            icon: createElement(MessageCircle, { className: "h-4 w-4 text-teal" }),
            duration: 4000,
            action: { label: "Reply", onClick: () => navigate(`/chat/${payload.new.sender_id}`) }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interests", filter: `sender_id=eq.${user.id}` },
        async (payload) => {
          if (payload.new.status !== "accepted") return;
          const prefs = prefsRef.current;
          if (!prefs.push_notifications || !prefs.match_notifications) return;
          const { data } = await supabase.from("profiles").select("full_name").eq("user_id", payload.new.receiver_id).maybeSingle();
          toast.success("It's a match! 🎉", {
            description: `You and ${data?.full_name || "someone"} are now connected!`,
            icon: createElement(Sparkles, { className: "h-4 w-4 text-accent" }),
            duration: 6000,
            action: { label: "Chat", onClick: () => navigate(`/chat/${payload.new.receiver_id}`) }
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate, user]);

  return null;
};

export default RealtimeNotifications;
