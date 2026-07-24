/**
 * ChatThemePicker — Theme selection for couple chat
 *
 * Shows curated themes as swatches in a bottom sheet.
 * Both partners can select themes; persisted per match.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X } from 'lucide-react';
import { CHAT_THEMES, type ChatTheme } from '@/lib/chatThemes';

interface ChatThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (theme: ChatTheme) => void;
}

const ChatThemePicker = ({ currentThemeId, onSelectTheme }: ChatThemePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
        title="Chat Theme"
      >
        <Palette className="h-4 w-4" />
      </motion.button>

      {/* Theme picker sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] rounded-t-3xl bg-card border-t border-border/50 shadow-elevated p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-foreground">Chat Theme</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Theme grid */}
              <div className="grid grid-cols-3 gap-3">
                {CHAT_THEMES.map((theme) => {
                  const isSelected = theme.id === currentThemeId;
                  return (
                    <motion.button
                      key={theme.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onSelectTheme(theme);
                        setIsOpen(false);
                      }}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl p-3 border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-transparent bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      {/* Preview swatch */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.backgroundGradientStart}, ${theme.backgroundGradientEnd})`,
                          }}
                        />
                        {/* Mini bubble previews */}
                        <div className="absolute top-2 right-2 w-[60%] h-3 rounded-full opacity-90"
                          style={{ background: theme.bubbleSent }}
                        />
                        <div className="absolute bottom-2 left-2 w-[45%] h-3 rounded-full border"
                          style={{
                            background: theme.bubbleReceived,
                            borderColor: theme.composerBorder,
                          }}
                        />
                      </div>

                      {/* Label */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{theme.emoji}</span>
                        <span className="text-[10px] font-semibold text-foreground truncate">{theme.name}</span>
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm"
                        >
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Themes personalize your chat experience together ✨
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatThemePicker;
