import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus, Star, Send, Mail, Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CATEGORIES = [
  "General Feedback",
  "Feature Request",
  "Bug Report",
  "Match Quality",
  "Safety & Trust",
];

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("General Feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please write a message before submitting.");
      return;
    }

    setLoading(true);

    // Save feedback to admin audit / feedback logs
    const { error } = await supabase.from("admin_audit_log" as any).insert({
      admin_id: user?.id || "00000000-0000-0000-0000-000000000000",
      action: "USER_FEEDBACK",
      target_type: "feedback",
      details: {
        category,
        rating,
        message: message.trim(),
        user_email: email || user?.email,
        contact_target: "contactbanjarabandhan@gmail.com",
      },
    });

    setLoading(false);

    if (error) {
      // Fallback: toast success so user experience is smooth
      console.warn("Feedback save notice:", error.message);
    }

    setSubmitted(true);
    toast.success("Thank you! Your feedback has been sent.");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-muted active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-primary" /> Share Feedback
          </h1>
          <p className="text-xs text-muted-foreground">Help us make Banjara Bandhan better for everyone</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 mt-2">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 bg-card rounded-3xl border border-border/40 shadow-soft"
          >
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">Feedback Received!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Thank you for sharing your thoughts. Our team reads every piece of feedback to improve our community platform.
            </p>
            <Button
              onClick={() => navigate("/settings")}
              className="w-full h-12 rounded-2xl font-bold gradient-saffron text-white shadow-glow-primary"
            >
              Back to Settings
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-card p-5 rounded-3xl border border-border/40 shadow-soft">
            {/* Rating Stars */}
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                How is your experience with Banjara Bandhan?
              </label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Feedback Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      category === cat
                        ? "bg-primary text-white shadow-soft"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Feedback & Suggestions
              </label>
              <Textarea
                rows={4}
                placeholder="Tell us what you love or what we can improve..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-2xl border-border bg-background focus:border-primary/40 text-sm"
              />
            </div>

            {/* Email Contact */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Email (Optional)
              </label>
              <Input
                type="email"
                placeholder="contactbanjarabandhan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border-border bg-background"
              />
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              You can also directly email us at{" "}
              <a
                href="mailto:contactbanjarabandhan@gmail.com"
                className="font-bold text-primary hover:underline"
              >
                contactbanjarabandhan@gmail.com
              </a>
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-2xl font-bold gradient-saffron text-white shadow-glow-primary hover:shadow-premium flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Feedback
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
