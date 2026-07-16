import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset link sent to your email");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 px-4 pt-12 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">Forgot Password</h1>
            <p className="text-xs text-muted-foreground">We’ll send you a reset link</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md px-5 pt-8 pb-24 space-y-5 animate-fade-up">
        <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-soft">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 rounded-2xl bg-background pl-10 shadow-soft"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-13 w-full rounded-2xl border-0 text-sm font-semibold text-white gradient-saffron shadow-glow-primary transition-transform active:scale-[0.97]">
          {loading ? "Sending..." : <span className="flex items-center gap-2">Send Reset Link <Send className="h-4 w-4" /></span>}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;