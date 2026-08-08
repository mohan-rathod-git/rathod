import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, MessageSquare } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";
import BottomNav from "@/components/BottomNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

const Messages = () => {
  const { conversations, loading, refetch } = useRealtimeMessages();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerProfiles, setPartnerProfiles] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const currentUserId = user?.id;

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);
  const { containerRef, onTouchStart, onTouchMove, onTouchEnd, PullIndicator } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = conversations.map((c) => c.partnerId);
    supabase
      .from("profiles")
      .select("user_id, full_name, photo_url, is_online, community")
      .in("user_id", ids)
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

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="flex flex-col min-h-dvh bg-background"
    >
      <PullIndicator />

      {/* ── Header ── */}
      <div className="bg-card/90 backdrop-blur-xl border-b border-border/30 px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="font-heading text-xl font-bold text-foreground"
          >
            Messages
          </motion.h1>
          {conversations.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-full"
            >
              {conversations.length} chat{conversations.length !== 1 ? "s" : ""}
            </motion.span>
          )}
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative group"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-2xl bg-muted/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all duration-300 border border-transparent focus:border-primary/15"
          />
        </motion.div>
      </div>

      {/* ── Conversation List ── */}
      <div className="flex-1 px-3 pt-2 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length > 0 ? (
          <AnimatePresence>
            {filteredConversations.map((c, i) => {
              const partner = partnerProfiles[c.partnerId];
              const hasUnread = c.unread > 0;
              return (
                <motion.button
                  key={c.partnerId}
                  onClick={() => navigate(`/chat/${c.partnerId}`)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex w-full items-center gap-3.5 rounded-2xl p-3.5 mb-1 text-left transition-all duration-200 group
                    ${hasUnread
                      ? "bg-primary/5 hover:bg-primary/8 border border-primary/10"
                      : "bg-card hover:bg-muted/40 border border-border/20 hover:border-border/30"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`h-13 w-13 rounded-2xl overflow-hidden transition-all duration-300
                      ${hasUnread
                        ? "ring-2 ring-primary/40 shadow-[0_0_12px_rgba(var(--primary),0.15)]"
                        : "ring-1 ring-border/30 group-hover:ring-primary/20"
                      }`}
                      style={{ height: 52, width: 52 }}
                    >
                      <img
                        src={partner?.photo_url || "/placeholder.svg"}
                        alt={partner?.full_name || ""}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    {/* Online indicator */}
                    {partner?.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`font-heading text-sm truncate leading-tight
                        ${hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {partner?.full_name || "User"}
                      </h4>
                      <span className={`text-[10px] tabular-nums shrink-0
                        ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {formatTime(c.lastTime)}
                      </span>
                    </div>
                    <p className={`truncate text-xs leading-snug
                      ${hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                      {c.lastSenderId === currentUserId && (
                        <span className="text-muted-foreground/60 mr-0.5">You: </span>
                      )}
                      {c.lastMessage || "Start chatting..."}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {hasUnread && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex shrink-0 h-5 min-w-[20px] items-center justify-center rounded-full gradient-saffron text-[9px] font-bold text-white px-1.5 shadow-glow-primary"
                    >
                      {c.unread > 99 ? "99+" : c.unread}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No results for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="pt-6">
            <EmptyStateGraphic
              variant="no-messages"
              title="No messages yet"
              subtitle="Start a conversation by connecting with someone you like"
              action={{ label: "Explore Profiles", onClick: () => navigate("/explore") }}
            />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
