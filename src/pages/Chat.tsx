import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { ArrowLeft, Phone, Video, CheckCheck, Check, UserPlus, UserCheck, Lock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallScreen from "@/components/chat/CallScreen";
import { useGoBack } from "@/hooks/useGoBack";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";
import { moderateText } from "@/lib/moderation";
import { useMatchStatus } from "@/hooks/useMatchStatus";
import { useFriendStatus } from "@/hooks/useFriendStatus";
import { toast } from "sonner";
import ChatThemePicker from "@/components/chat/ChatThemePicker";
import ChatComposerBar from "@/components/chat/ChatComposerBar";
import MessageReactions from "@/components/chat/MessageReactions";
import FirstMessageCelebration from "@/components/chat/FirstMessageCelebration";
import { getChatThemeForMatch, setChatThemeForMatch, type ChatTheme } from "@/lib/chatThemes";
import type { ReactionEmoji } from "@/components/chat/MessageReactions";
import { Loader2 } from "lucide-react";

const Chat = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/messages");
  const { user } = useAuth();
  const { messages, loading } = useRealtimeMessages(partnerId);
  const { localStream, remoteStream, callStatus, callType, startCall, acceptCall, rejectCall, endCall, isCallReady } = useWebRTC(user?.id, partnerId);
  const matchStatus = useMatchStatus(partnerId);
  const friendStatus = useFriendStatus(partnerId);
  const shouldReduceMotion = useReducedMotion();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [justSentFirstMessage, setJustSentFirstMessage] = useState(false);

  // Theme system
  const [theme, setTheme] = useState<ChatTheme>(() => {
    if (user?.id && partnerId) return getChatThemeForMatch(user.id, partnerId);
    return getChatThemeForMatch('', '');
  });

  // Reactions (in-memory per session)
  const [reactions, setReactions] = useState<Record<string, ReactionEmoji>>({});

  // Double-tap tracking
  const lastTap = useRef<Record<string, number>>({});

  useEffect(() => {
    if (user?.id && partnerId) {
      setTheme(getChatThemeForMatch(user.id, partnerId));
    }
  }, [user?.id, partnerId]);

  const handleThemeChange = (newTheme: ChatTheme) => {
    if (user?.id && partnerId) {
      setChatThemeForMatch(user.id, partnerId, newTheme.id);
      setTheme(newTheme);
    }
  };

  const handleReaction = (messageId: string, emoji: ReactionEmoji | null) => {
    setReactions(prev => {
      const next = { ...prev };
      if (emoji === null) {
        delete next[messageId];
      } else {
        next[messageId] = emoji;
      }
      return next;
    });
  };

  // Double-tap-to-heart
  const handleDoubleTap = (messageId: string) => {
    const now = Date.now();
    const lastTime = lastTap.current[messageId] || 0;
    lastTap.current[messageId] = now;

    if (now - lastTime < 300) {
      // Double tap detected — toggle heart
      handleReaction(messageId, reactions[messageId] === '❤️' ? null : '❤️');
    }
  };

  useEffect(() => {
    if (!partnerId) return;
    supabase.from("profiles").select("full_name, photo_url, is_online")
      .eq("user_id", partnerId).maybeSingle()
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

  const handleTextChange = (newText: string) => {
    setText(newText);
    sendTypingStatus(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTypingStatus(false), 2000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
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

    const isFirstMessage = messages.length === 0;

    setSending(true);
    sendTypingStatus(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: partnerId, content: contentToSend,
    });
    setText("");
    setSending(false);

    if (isFirstMessage) {
      setJustSentFirstMessage(true);
    }
  };

  // Match key for celebration tracking
  const matchKey = user?.id && partnerId
    ? [user.id, partnerId].sort().join('_')
    : '';

  // Bubble animation variants (directional)
  const getBubbleVariants = (isMine: boolean) => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      };
    }
    return {
      initial: {
        opacity: 0,
        x: isMine ? 12 : -12,
        scale: 0.96,
      },
      animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      },
    };
  };

  // SVG heart petal decoration for empty state
  const EmptyChatDecoration = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]">
      {[...Array(6)].map((_, i) => (
        <svg
          key={i}
          className="absolute text-rose-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            top: `${15 + Math.sin(i * 1.2) * 30}%`,
            left: `${10 + (i * 15) % 80}%`,
            transform: `rotate(${i * 45}deg) scale(${0.6 + (i % 3) * 0.3})`,
          }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen flex-col" style={{ background: `linear-gradient(180deg, ${theme.backgroundGradientStart}, ${theme.backgroundGradientEnd})` }}>
      {/* First message celebration overlay */}
      <FirstMessageCelebration matchKey={matchKey} trigger={justSentFirstMessage} />

      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 pt-12 pb-3 shadow-sm z-10"
        style={{
          background: `${theme.composerBg}`,
          borderColor: theme.composerBorder,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 active:scale-95 transition-transform"
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
            <p className="text-[10px] font-semibold animate-pulse" style={{ color: theme.accentGlow }}>typing...</p>
          ) : partner?.is_online ? (
            <p className="text-[10px] text-emerald-500 font-semibold">Online now</p>
          ) : null}
        </div>

        {/* Theme picker */}
        <ChatThemePicker currentThemeId={theme.id} onSelectTheme={handleThemeChange} />

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
            friendStatus.isFriends ? 'bg-muted/60 text-foreground hover:bg-primary/10 hover:text-primary' : 'bg-muted/30 text-muted-foreground/60'
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
            friendStatus.isFriends ? 'bg-muted/60 text-foreground hover:bg-primary/10 hover:text-primary' : 'bg-muted/30 text-muted-foreground/60'
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping text-primary opacity-20"><Loader2 className="h-8 w-8" /></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="relative">
            <EmptyChatDecoration />
            <EmptyStateGraphic
              variant="no-messages"
              title="Start the conversation"
              subtitle="Say something nice to break the ice!"
            />
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;

              // Date separator
              const currentDate = new Date(msg.created_at);
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showDateSeparator = !prevMsg || !isSameDay(currentDate, new Date(prevMsg.created_at));

              const variants = getBubbleVariants(isMine);

              return (
                <div key={msg.id} className="space-y-3">
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/20"></div></div>
                      <span
                        className="relative px-3 text-[10px] uppercase tracking-wider font-semibold rounded-full"
                        style={{ color: theme.dateSeparatorColor, background: theme.backgroundGradientStart }}
                      >
                        {isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <motion.div
                    initial={variants.initial}
                    animate={variants.animate}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    onClick={() => handleDoubleTap(msg.id)}
                  >
                    <div className="max-w-[75%] flex flex-col">
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? "rounded-br-sm shadow-lg"
                            : "rounded-bl-sm shadow-soft border"
                        }`}
                        style={
                          isMine
                            ? {
                                background: theme.bubbleSent,
                                color: theme.bubbleSentText,
                              }
                            : {
                                background: theme.bubbleReceived,
                                color: theme.bubbleReceivedText,
                                borderColor: theme.composerBorder,
                              }
                        }
                      >
                        <p className="text-[13px] leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                          <p className="text-[9px]" style={{ opacity: 0.55 }}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                          {isMine && (
                            <motion.span
                              initial={shouldReduceMotion ? {} : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {msg.is_read ? (
                                <CheckCheck className="h-3 w-3" style={{ opacity: 0.7 }} />
                              ) : (
                                <Check className="h-3 w-3" style={{ opacity: 0.4 }} />
                              )}
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      {matchStatus.state === 'matched' && (
                        <MessageReactions
                          messageId={msg.id}
                          reaction={reactions[msg.id] || null}
                          onReact={handleReaction}
                          isMine={isMine}
                        />
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
            {partnerTyping && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -12, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="flex justify-start"
              >
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft border"
                  style={{
                    background: theme.bubbleReceived,
                    borderColor: theme.composerBorder,
                  }}
                >
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

      {/* Custom composer bar */}
      <ChatComposerBar
        text={text}
        onTextChange={handleTextChange}
        onSend={handleSend}
        onEmojiSelect={handleEmojiSelect}
        sending={sending}
        theme={theme}
        placeholder="Type a message..."
      />

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
