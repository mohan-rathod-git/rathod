import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { getPostAuthRoute } from "@/lib/profileUtils";
import { ensureProfileRow } from "@/lib/profilePersistence";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await ensureProfileRow(data.user);
    }

    toast.success("Welcome back!");
    navigate(getPostAuthRoute(profile ?? ({ registration_step: 1 } as any)), { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand header */}
      <div className="gradient-saffron px-6 pt-20 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/20" style={{
              width: 120 + i * 60, height: 120 + i * 60,
              left: '50%', top: '50%',
              marginLeft: -(60 + i * 30), marginTop: -(60 + i * 30),
            }} />
          ))}
        </div>
        <div className="relative">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm mb-4 animate-fade-up">
            <span className="text-2xl font-heading font-extrabold text-white">ब</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight animate-fade-up-1" style={{ lineHeight: "1.1" }}>
            Banjara Bandhan
          </h1>
          <p className="mt-2 text-sm text-white/60 animate-fade-up-2">
            Where traditions meet hearts
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 -mt-6 rounded-t-[2rem] bg-background px-6 pt-8 relative z-10">
        <div className="animate-fade-up-2">
          <h2 className="font-heading text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4 animate-fade-up-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email" placeholder="you@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-shadow"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-13 rounded-2xl text-sm font-semibold gradient-saffron border-0 text-white shadow-glow-primary active:scale-[0.97] transition-transform">
            {loading ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in...</span>
            ) : (
              <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
            )}
          </Button>

          <button type="button" onClick={() => navigate("/forgot-password")} className="w-full text-center text-sm font-medium text-primary hover:underline underline-offset-4">
            Forgot password?
          </button>
        </form>

        <div className="mt-10 text-center animate-fade-up-4">
          <p className="text-sm text-muted-foreground">
            New to Banjara Bandhan?{" "}
            <button onClick={() => navigate("/register")} className="font-semibold text-primary hover:underline underline-offset-4">
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
