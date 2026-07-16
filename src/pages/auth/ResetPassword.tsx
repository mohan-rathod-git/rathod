import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, EyeOff, Lock } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const isRecoveryLink = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    return hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";
  }, []);

  useEffect(() => {
    setRecoveryReady(isRecoveryLink);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [isRecoveryLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.auth.signOut();
    toast.success("Password updated successfully");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 px-4 pt-12 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">Reset Password</h1>
            <p className="text-xs text-muted-foreground">Choose a new secure password</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-8 pb-24">
        {!recoveryReady ? (
          <div className="rounded-3xl border border-border/50 bg-card p-6 text-center shadow-soft animate-fade-up">
            <p className="text-sm font-semibold text-foreground">Invalid or expired reset link</p>
            <p className="mt-1 text-xs text-muted-foreground">Please request a new password reset email.</p>
            <Button onClick={() => navigate("/forgot-password")} className="mt-5 h-11 w-full rounded-2xl border-0 text-white gradient-saffron shadow-glow-primary">
              Request New Link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
            <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-soft">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-12 rounded-2xl bg-background pl-10 pr-10 shadow-soft"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-soft">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <Check className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-12 rounded-2xl bg-background pl-10 shadow-soft"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="h-13 w-full rounded-2xl border-0 text-sm font-semibold text-white gradient-saffron shadow-glow-primary transition-transform active:scale-[0.97]">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;