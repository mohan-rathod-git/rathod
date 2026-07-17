import { useState, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { Heart, Check, X, Loader2, MessageCircle, UserPlus, Send } from "lucide-react";
import { useRealtimeInterests } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { motion, AnimatePresence } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";

const tabs = [
  { key: "Received", icon: Heart, label: "Received" },
  { key: "Sent", icon: Send, label: "Sent" },
  { key: "Mutual", icon: MessageCircle, label: "Mutual" },
];

const Matches = () => {
  const [activeTab, setActiveTab] = useState("Received");
  const { sent, received, mutual, loading, refetch } = useRealtimeInterests();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { containerRef, onTouchStart, onTouchMove, onTouchEnd, PullIndicator } = usePullToRefresh(handleRefresh);

  const handleAccept = async (interestId: string) => {
    const { error } = await supabase.from("interests").update({ status: "accepted" }).eq("id", interestId);
    if (error) toast.error("Failed to accept");
    else { toast.success("Interest accepted! 🎉"); refetch(); }
  };

  const handleDecline = async (interestId: string) => {
    const { error } = await supabase.from("interests").update({ status: "declined" }).eq("id", interestId);
    if (error) toast.error("Failed to decline");
    else { toast("Interest declined"); refetch(); }
  };

  const pendingReceived = received.filter((r) => r.status === "pending");

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="min-h-screen bg-background pb-20 overflow-y-auto"
    >
      <PullIndicator />
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/30 px-4 pt-12 pb-1">
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-heading text-xl font-bold text-foreground mb-4"
        >
          Connections
        </motion.h1>
        <div className="flex gap-1 bg-muted/60 rounded-2xl p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                t.key === activeTab ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}>
              {t.key === activeTab && (
                <motion.div
                  layoutId="matchesTabIndicator"
                  className="absolute inset-0 bg-card rounded-xl shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.key === "Received" && pendingReceived.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-4 min-w-[16px] items-center justify-center rounded-full gradient-saffron text-[8px] font-bold text-white px-1"
                  >
                    {pendingReceived.length}
                  </motion.span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "Received" && (pendingReceived.length > 0 ? pendingReceived.map((r, i) => {
                const p = r.profiles;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3.5 rounded-2xl bg-card p-3.5 shadow-soft border border-border/30 mb-2.5 hover:shadow-medium transition-all group"
                  >
                    <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-border/30 group-hover:ring-primary/20 transition-all">
                      <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleDecline(r.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleAccept(r.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal hover:bg-teal/15 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              }) : (
                <EmptyStateGraphic
                  variant="no-matches"
                  title="No requests yet"
                  subtitle="When someone likes your profile, you'll see it here"
                  action={{ label: "Complete Profile", onClick: () => navigate("/edit-profile") }}
                />
              ))}

              {activeTab === "Sent" && (sent.length > 0 ? sent.map((s, i) => {
                const p = s.profiles;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3.5 rounded-2xl bg-card p-3.5 shadow-soft border border-border/30 mb-2.5 hover:shadow-medium transition-all group"
                  >
                    <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-border/30 group-hover:ring-primary/20 transition-all">
                      <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                      s.status === "accepted" ? "bg-teal/10 text-teal" : s.status === "declined" ? "bg-destructive/10 text-destructive" : "bg-accent/15 text-accent-foreground"
                    }`}>{s.status}</span>
                  </motion.div>
                );
              }) : (
                <EmptyStateGraphic
                  variant="no-matches"
                  title="No interests sent"
                  subtitle="Express interest in profiles you like to get started"
                  action={{ label: "Explore Profiles", onClick: () => navigate("/explore") }}
                />
              ))}

              {activeTab === "Mutual" && (mutual.length > 0 ? mutual.map((m, i) => {
                const p = m.profiles;
                const partnerId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
                return (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/chat/${partnerId}`)}
                    className="flex items-center gap-3.5 rounded-2xl bg-card p-3.5 shadow-soft border border-border/30 w-full text-left hover:shadow-elevated hover:border-primary/10 transition-all mb-2.5 group"
                  >
                    <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-border/30 group-hover:ring-primary/20 transition-all">
                      <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-teal/10 text-teal px-3 py-1.5 text-[10px] font-bold group-hover:bg-teal/15 transition-colors">
                      <MessageCircle className="h-3 w-3" /> Chat
                    </span>
                  </motion.button>
                );
              }) : (
                <EmptyStateGraphic
                  variant="no-matches"
                  title="No matches yet"
                  subtitle="Mutual interest creates a match — keep exploring!"
                  action={{ label: "Find Matches", onClick: () => navigate("/explore") }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Matches;
