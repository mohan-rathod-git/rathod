import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Loader2, Search } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";

const Messages = () => {
  const { conversations, loading } = useRealtimeMessages();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerProfiles, setPartnerProfiles] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const currentUserId = user?.id;

  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = conversations.map((c) => c.partnerId);
    supabase.from("profiles").select("user_id, full_name, photo_url, is_online").in("user_id", ids)
      .then(({ data }) => {
        const map: Record<string, any> = {};
        data?.forEach((p) => { map[p.user_id] = p; });
        setPartnerProfiles(map);
      });
  }, [conversations]);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const partner = partnerProfiles[c.partnerId];
    return partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/30 px-4 pt-12 pb-4">
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="font-heading text-xl font-bold text-foreground mb-3"
        >
          Messages
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative group"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-2xl bg-muted/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:bg-card transition-all duration-300 border border-transparent focus:border-primary/10"
          />
        </motion.div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping text-primary opacity-20">
                <Loader2 className="h-8 w-8" />
              </div>
            </div>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((c, i) => {
            const partner = partnerProfiles[c.partnerId];
            return (
              <motion.button
                key={c.partnerId}
                onClick={() => navigate(`/chat/${c.partnerId}`)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all hover:bg-muted/30 active:bg-muted/40 group"
              >
                <div className="relative">
                  <div className={`h-12 w-12 rounded-2xl overflow-hidden ring-2 transition-all ${c.unread > 0 ? 'ring-primary/40' : 'ring-border/30 group-hover:ring-primary/20'}`}>
                    <img src={partner?.photo_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  {partner?.is_online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-heading text-sm text-foreground truncate ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>
                      {partner?.full_name || "User"}
                    </h4>
                    <span className={`text-[10px] tabular-nums ${c.unread > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {format(new Date(c.lastTime), "h:mm a")}
                    </span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {c.lastSenderId === currentUserId ? <span className="text-muted-foreground/70">You: </span> : null}
                    {c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full gradient-saffron text-[9px] font-bold text-white px-1.5 shadow-glow-primary"
                  >
                    {c.unread}
                  </motion.span>
                )}
              </motion.button>
            );
          })
        ) : (
          <EmptyStateGraphic
            variant="no-messages"
            title="No messages yet"
            subtitle="Start a conversation by connecting with someone you like"
            action={{ label: "Explore Profiles", onClick: () => navigate("/explore") }}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
