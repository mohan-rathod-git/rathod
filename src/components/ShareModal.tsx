import { motion, AnimatePresence } from "framer-motion";
import { Link2, MessageCircle, Send, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  text: string;
}

const ShareModal = ({ isOpen, onClose, url, title, text }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    onClose();
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-elevated border-t border-border/50 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md md:rounded-[2rem] md:pb-6"
          >
            <div className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-border/50 md:hidden" />
            
            <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
              <h2 className="font-heading text-lg font-bold text-foreground">Share Profile</h2>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-muted/50 transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button onClick={handleWhatsApp} className="flex flex-col items-center gap-2 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] transition-transform group-hover:scale-105 group-active:scale-95">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">WhatsApp</span>
              </button>
              
              <button onClick={handleTelegram} className="flex flex-col items-center gap-2 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0088cc]/10 text-[#0088cc] transition-transform group-hover:scale-105 group-active:scale-95">
                  <Send className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Telegram</span>
              </button>

              <button onClick={handleCopy} className="flex flex-col items-center gap-2 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105 group-active:scale-95">
                  <Link2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Copy Link</span>
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-2">
              <div className="flex-1 truncate px-2 text-sm text-muted-foreground">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center rounded-lg bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm border border-border/50 hover:bg-muted/50 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
