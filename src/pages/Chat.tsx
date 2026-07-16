import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { ArrowLeft, Send, Loader2, Phone, Video, CheckCheck, Check } from "lucide-react";
import { format } from "date-fns";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallScreen from "@/components/chat/CallScreen";

const Chat = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading } = useRealtimeMessages(partnerId);
  const { localStream, remoteStream, callStatus, callType, startCall, acceptCall, rejectCall, endCall, isCallReady } = useWebRTC(user?.id, partnerId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    supabase.from("profiles").select("full_name, photo_url, is_online")
      .eq("user_id", partnerId).single()
      .then(({ data }) => setPartner(data));
  }, [partnerId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !partnerId || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id === partnerId && !m.is_read);
    if (unread.length > 0) {
      supabase.from("messages").update({ is_read: true })
        .eq("sender_id", partnerId).eq("receiver_id", user.id).eq("is_read", false)
        .then(() => {});
    }
  }, [messages, user, partnerId]);

  // Typing indicator - listen for partner typing
  useEffect(() => {
    if (!user || !partnerId) return;
    const channel = supabase
      .channel(`typing-${partnerId}-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "typing_status",
        filter: `user_id=eq.${partnerId}`
      }, (payload: any) => {
        if (payload.new?.partner_id === user.id) {
          setPartnerTyping(payload.new?.is_typing || false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId]);

  // Send typing status
  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user || !partnerId) return;
    await supabase.from("typing_status" as any).upsert({
      user_id: user.id,
      partner_id: partnerId,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,partner_id" });
  }, [user, partnerId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    sendTypingStatus(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTypingStatus(false), 2000);
  };

  const handleSend = async () => {
    if (!text.trim() || !user || !partnerId) return;
    setSending(true);
    sendTypingStatus(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: partnerId, content: text.trim(),
    });
    setText("");
    setSending(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted active:scale-95 transition-transform">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="relative">
          <img src={partner?.photo_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-2xl object-cover" />
          {partner?.is_online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-sm font-bold text-foreground truncate">{partner?.full_name || "..."}</h2>
          {partnerTyping ? (
            <p className="text-[10px] text-primary font-semibold animate-pulse">typing...</p>
          ) : partner?.is_online ? (
            <p className="text-[10px] text-emerald-500 font-semibold">Online now</p>
          ) : null}
        </div>
        <button onClick={() => startCall('video')} disabled={!isCallReady} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted active:scale-95 transition-transform disabled:opacity-50">
          <Video className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => startCall('audio')} disabled={!isCallReady} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted active:scale-95 transition-transform disabled:opacity-50">
          <Phone className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm font-medium text-foreground">Start the conversation</p>
            <p className="text-xs text-muted-foreground mt-1">Say something nice!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  style={{ animation: `fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.03, 0.3)}s both` }}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMine
                      ? "gradient-saffron text-white rounded-br-lg shadow-glow-primary/30"
                      : "bg-card border border-border/50 text-foreground rounded-bl-lg shadow-soft"
                  }`}>
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                      <p className={`text-[9px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                      {isMine && (
                        msg.is_read ? (
                          <CheckCheck className={`h-3 w-3 ${isMine ? "text-white/70" : "text-primary"}`} />
                        ) : (
                          <Check className="h-3 w-3 text-white/40" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {partnerTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-lg px-4 py-3 shadow-soft">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/90 backdrop-blur-xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-saffron text-white shadow-glow-primary disabled:opacity-40 active:scale-95 transition-all">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {callStatus !== 'idle' && (
        <CallScreen
          partnerName={partner?.full_name || "Unknown"}
          partnerPhoto={partner?.photo_url}
          localStream={localStream}
          remoteStream={remoteStream}
          callStatus={callStatus}
          callType={callType}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
        />
      )}
    </div>
  );
};

export default Chat;
