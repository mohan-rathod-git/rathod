import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { ArrowLeft, Send, Loader2, Phone, Video, CheckCheck, Check, UserPlus, UserCheck, ShieldAlert, Lock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallScreen from "@/components/chat/CallScreen";
import { useGoBack } from "@/hooks/useGoBack";
import EmojiPicker from "@/components/chat/EmojiPicker";
import { motion, AnimatePresence } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";
import { moderateText } from "@/lib/moderation";
import { useMatchStatus } from "@/hooks/useMatchStatus";
import { useFriendStatus } from "@/hooks/useFriendStatus";
import { toast } from "sonner";

const Chat = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/messages");
  const { user } = useAuth();
  const { messages, loading } = useRealtimeMessages(partnerId);
  const { localStream, remoteStream, callStatus, callType, startCall, acceptCall, rejectCall, endCall, isCallReady } = useWebRTC(user?.id, partnerId);
  const matchStatus = useMatchStatus(partnerId);
  const friendStatus = useFriendStatus(partnerId);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCall = (type: 'audio' | 'video') => {
    if (!friendStatus.isFriends) {
      toast.error("Voice & Video calls are locked! Add as Friend first 🤝", {
        action: friendStatus.status === 'none' ? {
          label: "Add Friend",
          onClick: () => friendStatus.sendFriendRequest(),
        } : undefined,
      });
      return;
    }
    startCall(type);
  };

  const handleSend = async () => {
    if (!text.trim() || !user || !partnerId) return;
    
    if (matchStatus.state !== 'matched') {
      toast.error("Messaging requires mutual match! Send an interest first.");
      return;
    }

    // Moderation check
    const modResult = moderateText(text.trim());
    const contentToSend = modResult.sanitizedText;

    setSending(true);
    sendTypingStatus(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setShowEmoji(false);
    await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: partnerId, content: contentToSend,
    });
    setText("");
    setSending(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card/85 backdrop-blur-2xl border-b border-border/50 px-4 pt-12 pb-3 shadow-sm z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </motion.button>
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

        {/* Friend status / request button in header */}
        {friendStatus.status === 'none' && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => friendStatus.sendFriendRequest()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl gradient-saffron text-white text-[10px] font-bold shadow-soft"
            title="Add as Friend to unlock Voice/Video Calls"
          >
            <UserPlus className="h-3 w-3" /> Add Friend
          </motion.button>
        )}
        {friendStatus.status === 'pending_sent' && (
          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 bg-muted rounded-lg">
            Request Sent
          </span>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleCall('video')}
          disabled={!isCallReady}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl active:scale-95 transition-transform disabled:opacity-50 ${
            friendStatus.isFriends ? 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary' : 'bg-muted/50 text-muted-foreground/60'
          }`}
          title={friendStatus.isFriends ? "Video Call" : "Locked (Friend tier required)"}
        >
          {friendStatus.isFriends ? <Video className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleCall('audio')}
          disabled={!isCallReady}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl active:scale-95 transition-transform disabled:opacity-50 ${
            friendStatus.isFriends ? 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary' : 'bg-muted/50 text-muted-foreground/60'
          }`}
          title={friendStatus.isFriends ? "Voice Call" : "Locked (Friend tier required)"}
        >
          {friendStatus.isFriends ? <Phone className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
        </motion.button>
      </div>

      {/* Friend request banner for pending_received */}
      {friendStatus.status === 'pending_received' && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {partner?.full_name || 'User'} sent you a friend request!
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => friendStatus.acceptFriendRequest()}
              className="px-3 py-1 rounded-lg gradient-saffron text-white font-bold text-[10px] shadow-soft"
            >
              Accept
            </button>
            <button
              onClick={() => friendStatus.declineFriendRequest()}
              className="px-2.5 py-1 rounded-lg bg-card text-muted-foreground font-semibold text-[10px]"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping text-primary opacity-20"><Loader2 className="h-8 w-8" /></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyStateGraphic
            variant="no-messages"
            title="Start the conversation"
            subtitle="Say something nice to break the ice!"
          />
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              
              // Determine if we should show a date separator
              const currentDate = new Date(msg.created_at);
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showDateSeparator = !prevMsg || !isSameDay(currentDate, new Date(prevMsg.created_at));

              return (
                <div key={msg.id} className="space-y-4">
                  {showDateSeparator && (
                    <div className="flex justify-center my-4 relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30"></div></div>
                      <span className="relative bg-background px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 rounded-full">
                        {isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-primary text-white rounded-br-sm shadow-glow-primary dark:bg-primary/90"
                        : "bg-card border border-border/50 text-foreground rounded-bl-sm shadow-soft dark:bg-muted/40"
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
                  </motion.div>
                </div>
              );
            })}
            {partnerTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft dark:bg-muted/40">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/90 backdrop-blur-2xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2 relative">
          <div className="flex items-center gap-2">
            <EmojiPicker
              isOpen={showEmoji}
              onToggle={() => setShowEmoji(!showEmoji)}
              onSelect={handleEmojiSelect}
            />
            
            <input
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl gradient-saffron text-white shadow-glow-primary disabled:opacity-40 disabled:shadow-none transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", backgroundSize: "200% 100%" }} />
              <Send className="h-4 w-4 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
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
