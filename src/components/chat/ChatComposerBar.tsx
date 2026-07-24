/**
 * ChatComposerBar — Premium custom input for couple chat
 *
 * Features:
 * - Emoji/sticker picker toggle (left)
 * - Auto-resizing textarea
 * - Attachment button
 * - Mic button (hold-to-record placeholder)
 * - Send button that morphs from mic icon when text is present
 * - Glassmorphism styling per chat theme
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Smile, Paperclip, Mic, Send, Image } from 'lucide-react';
import EmojiPicker from '@/components/chat/EmojiPicker';
import type { ChatTheme } from '@/lib/chatThemes';

interface ChatComposerBarProps {
  text: string;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onEmojiSelect: (emoji: string) => void;
  sending: boolean;
  theme: ChatTheme;
  placeholder?: string;
}

const ChatComposerBar = ({
  text,
  onTextChange,
  onSend,
  onEmojiSelect,
  sending,
  theme,
  placeholder = 'Type a message...',
}: ChatComposerBarProps) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasText = text.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleEmojiSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    textareaRef.current?.focus();
  }, [onEmojiSelect]);

  const handleMicDown = () => {
    recordTimer.current = setTimeout(() => {
      setIsRecording(true);
    }, 300);
  };

  const handleMicUp = () => {
    if (recordTimer.current) {
      clearTimeout(recordTimer.current);
      recordTimer.current = null;
    }
    if (isRecording) {
      setIsRecording(false);
      // Voice note recording would be finalized here
    }
  };

  return (
    <div
      className="border-t px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]"
      style={{
        background: theme.composerBg,
        borderColor: theme.composerBorder,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-2 px-2"
          >
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-semibold text-destructive">Recording voice note...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1.5">
        {/* Emoji toggle */}
        <EmojiPicker
          isOpen={showEmoji}
          onToggle={() => setShowEmoji(!showEmoji)}
          onSelect={handleEmojiSelect}
        />

        {/* Text input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none rounded-2xl border border-border/50 bg-background/60 px-4 py-2.5 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-muted-foreground/60 scrollbar-thin"
            style={{
              focusRingColor: theme.accentGlow,
              maxHeight: '120px',
              minHeight: '42px',
            }}
          />
        </div>

        {/* Attachment */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </motion.button>

        {/* Mic / Send morph button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={hasText ? onSend : undefined}
          onPointerDown={!hasText ? handleMicDown : undefined}
          onPointerUp={!hasText ? handleMicUp : undefined}
          onPointerLeave={!hasText ? handleMicUp : undefined}
          disabled={hasText && (!text.trim() || sending)}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg disabled:opacity-40 disabled:shadow-none transition-all relative overflow-hidden"
          style={{
            background: hasText ? theme.bubbleSent : `${theme.accentGlow}22`,
            boxShadow: hasText ? `0 4px 20px ${theme.accentGlow}40` : 'none',
          }}
        >
          <AnimatePresence mode="wait">
            {hasText ? (
              <motion.div
                key="send"
                initial={shouldReduceMotion ? {} : { scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={shouldReduceMotion ? {} : { scale: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                <Send className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={shouldReduceMotion ? {} : { scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Mic className="h-4.5 w-4.5" style={{ color: theme.accentGlow }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatComposerBar;
