import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { useState } from "react";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"]
  },
  {
    name: "Gestures & People",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "骨", "👀", "👁️", "👅", "👄", "💋", "🩸"]
  },
  {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "❤️‍🔥", "❤️‍🩹"]
  },
  {
    name: "Symbols & Special",
    emojis: ["✨", "🌟", "💫", "💥", "💢", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "💯", "🪔", "🕉️", "🏵️", "🌺", "🌻", "🌼", "🌷"]
  }
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const EmojiPicker = ({ onSelect, isOpen, onToggle }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
      >
        <Smile className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              onClick={onToggle}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-14 left-0 z-50 w-72 md:w-80 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-elevated"
            >
              {/* Categories */}
              <div className="flex gap-1 overflow-x-auto border-b border-border/50 bg-muted/30 p-2 scrollbar-none">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(idx)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors ${idx === activeCategory ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="h-56 overflow-y-auto p-2 scrollbar-thin">
                <div className="grid grid-cols-6 gap-1 md:grid-cols-7">
                  {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(emoji)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-muted transition-colors active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
