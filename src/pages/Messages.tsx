import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { MessageCircle, Loader2, Search } from "lucide-react";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Messages = () => {
  const { conversations, loading } = useRealtimeMessages();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerProfiles, setPartnerProfiles] = useState<Record<string, any>>({});

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <h1 className="font-heading text-xl font-bold text-foreground mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search conversations..." className="h-10 w-full rounded-xl bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : conversations.length > 0 ? (
          conversations.map((c, i) => {
            const partner = partnerProfiles[c.partnerId];
            return (
              <button key={c.partnerId} onClick={() => navigate(`/chat/${c.partnerId}`)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all active:bg-muted/30 hover:bg-muted/20"
                style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both` }}>
                <div className="relative">
                  <img src={partner?.photo_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                  {partner?.is_online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-semibold text-foreground">{partner?.full_name || "User"}</h4>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{format(new Date(c.lastTime), "h:mm a")}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full gradient-saffron text-[9px] font-bold text-white px-1.5">{c.unread}</span>
                )}
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="font-heading text-sm font-bold text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Start by connecting with someone</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
