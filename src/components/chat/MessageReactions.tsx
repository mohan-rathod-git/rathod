/**
 * MessageReactions — Animated emoji reactions for couple chat
 *
 * Features:
 * - Long-press/tap shows a radial reaction picker
 * - Curated set: ❤️ 😂 😮 😢 🔥
 * - Reactions render at ~32px with spring pop animation
 * - Double-tap-to-heart shortcut
 * - Only used inside matched couple chat context
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥'] as const;
type ReactionEmoji = typeof REACTIONS[number];

interface MessageReactionsProps {
  messageId: string;
  /** Current reaction on this message (if any) */
  reaction: ReactionEmoji | null;
  /** Called when user selects a reaction */
  onReact: (messageId: string, emoji: ReactionEmoji | null) => void;
  /** Whether the message is from the current user */
  isMine: boolean;
}

const MessageReactions = ({ messageId, reaction, onReact, isMine }: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 400);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleSelectReaction = (emoji: ReactionEmoji) => {
    // Toggle off if same reaction
    onReact(messageId, reaction === emoji ? null : emoji);
    setShowPicker(false);
  };

  const springAnimation = shouldReduceMotion
    ? { scale: 1 }
    : { scale: [0, 1.15, 1] };

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.35, times: [0, 0.6, 1], ease: 'easeOut' };

  return (
    <div className="relative">
      {/* Touch target for long-press */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="cursor-pointer select-none"
      >
        {/* Existing reaction display */}
        <AnimatePresence>
          {reaction && (
            <motion.button
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ ...springAnimation, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={springTransition}
              onClick={() => setShowPicker(true)}
              className={`flex items-center justify-center h-8 w-8 rounded-full bg-card border border-border/50 shadow-soft -mt-1 ${
                isMine ? 'ml-auto -mr-1' : 'mr-auto -ml-1'
              }`}
              style={{ fontSize: '18px' }}
            >
              {reaction}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Radial reaction picker */}
      <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className={`absolute z-50 -top-12 flex items-center gap-1 rounded-full bg-card/95 backdrop-blur-xl border border-border/50 shadow-elevated px-2 py-1.5 ${
                isMine ? 'right-0' : 'left-0'
              }`}
            >
              {REACTIONS.map((emoji, index) => (
                <motion.button
                  key={emoji}
                  initial={shouldReduceMotion ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.04, type: 'spring', stiffness: 400, damping: 15 }}
                  onClick={() => handleSelectReaction(emoji)}
                  className={`flex items-center justify-center h-9 w-9 rounded-full transition-colors hover:bg-muted/60 active:scale-90 ${
                    reaction === emoji ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                  }`}
                  style={{ fontSize: '22px' }}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageReactions;
export { REACTIONS };
export type { ReactionEmoji };
