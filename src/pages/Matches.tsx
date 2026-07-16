import { useState, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { Heart, Check, X, Loader2, MessageCircle, UserPlus, Send } from "lucide-react";
import { useRealtimeInterests } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

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
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-1">
        <h1 className="font-heading text-xl font-bold text-foreground mb-4">Connections</h1>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                t.key === activeTab ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.key === "Received" && pendingReceived.length > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full gradient-saffron text-[8px] font-bold text-white px-1">{pendingReceived.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {activeTab === "Received" && (pendingReceived.length > 0 ? pendingReceived.map((r, i) => {
              const p = r.profiles;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft border border-border/50"
                  style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }}>
                  <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-border/50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecline(r.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleAccept(r.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal active:scale-90 transition-transform">
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            }) : <EmptyState icon={UserPlus} title="No requests yet" subtitle="When someone likes your profile, you'll see it here" />)}

            {activeTab === "Sent" && (sent.length > 0 ? sent.map((s, i) => {
              const p = s.profiles;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft border border-border/50"
                  style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }}>
                  <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-border/50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                    s.status === "accepted" ? "bg-teal/10 text-teal" : s.status === "declined" ? "bg-destructive/10 text-destructive" : "bg-accent/15 text-accent-foreground"
                  }`}>{s.status}</span>
                </div>
              );
            }) : <EmptyState icon={Heart} title="No interests sent" subtitle="Express interest in profiles you like" />)}

            {activeTab === "Mutual" && (mutual.length > 0 ? mutual.map((m, i) => {
              const p = m.profiles;
              const partnerId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
              return (
                <button key={m.id} onClick={() => navigate(`/chat/${partnerId}`)}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft border border-border/50 w-full text-left active:scale-[0.98] hover:shadow-medium transition-all"
                  style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }}>
                  <img src={p?.photo_url || "/placeholder.svg"} alt={p?.full_name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-border/50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-semibold text-foreground truncate">{p?.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{p?.community} · {p?.city_village || p?.state}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-teal/10 text-teal px-3 py-1.5 text-[10px] font-bold">
                    <MessageCircle className="h-3 w-3" /> Chat
                  </span>
                </button>
              );
            }) : <EmptyState icon={Heart} title="No matches yet" subtitle="Mutual interest creates a match" />)}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="h-7 w-7 text-muted-foreground/40" />
    </div>
    <p className="font-heading text-sm font-bold text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">{subtitle}</p>
  </div>
);

export default Matches;
