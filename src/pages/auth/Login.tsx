import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { getPostAuthRoute } from "@/lib/profileUtils";
import { ensureProfileRow } from "@/lib/profilePersistence";
import { motion } from "framer-motion";
import MehendiPattern from "@/components/graphics/MehendiPattern";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const { email, password } = values;
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* ═══ Premium Gradient Hero with Mehendi ═══ */}
      <div className="relative px-6 pt-16 pb-20 text-center overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: "linear-gradient(145deg, hsl(355 60% 22%) 0%, hsl(14 80% 52%) 40%, hsl(38 75% 55%) 70%, hsl(355 50% 32%) 100%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />



        {/* ── Mehendi Corner Patterns ── */}
        <MehendiPattern
          variant="corner-tl"
          color="white"
          opacity={0.15}
          className="w-[280px] h-[280px] pointer-events-none"
          animate
        />
        <MehendiPattern
          variant="corner-br"
          color="white"
          opacity={0.12}
          className="w-[250px] h-[250px] pointer-events-none"
          animate
        />

        {/* Decorative concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[200, 160, 120, 80].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: `rgba(255,255,255,${0.04 + i * 0.02})`,
                animation: `spin-slow ${40 + i * 12}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
              }}
            />
          ))}
        </div>

        {/* Floating gold sparkles */}
        <motion.div
          className="absolute top-8 right-12"
          animate={{ y: [-3, 3, -3], rotate: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-5 w-5 text-amber-300/40" />
        </motion.div>
        <motion.div
          className="absolute bottom-12 left-10"
          animate={{ y: [2, -4, 2], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Sparkles className="h-4 w-4 text-amber-200/30" />
        </motion.div>

        {/* ── Brand Content ── */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] overflow-hidden bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] ring-1 ring-white/20 backdrop-blur-md relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-10 pointer-events-none" />
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl font-bold text-white tracking-tight"
            style={{ lineHeight: "1.15", textShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
          >
            Banjara Bandhan
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-2 text-sm text-white/50 tracking-wide"
          >
            Where traditions meet hearts ✨
          </motion.p>

          {/* Mehendi border divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-4 mx-auto max-w-[200px]"
          >
            <MehendiPattern variant="border" color="white" opacity={0.25} className="h-5" />
          </motion.div>
        </div>
      </div>

      {/* ═══ Form Section with Glass Card ═══ */}
      <div className="flex-1 -mt-8 rounded-t-[2.5rem] bg-background px-6 pt-9 relative z-10">
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary/20 mt-3" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="font-heading text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{t("auth.email")}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="login-email"
                type="email" placeholder="you@email.com"
                {...register("email")}
                className={`pl-11 h-13 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all duration-300 ${errors.email ? "border-destructive focus:border-destructive ring-destructive/20" : "focus:border-primary/30"}`}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1 ml-1 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{t("auth.password")}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"} placeholder="••••••••"
                {...register("password")}
                className={`pl-11 pr-11 h-13 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all duration-300 ${errors.password ? "border-destructive focus:border-destructive ring-destructive/20" : "focus:border-primary/30"}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1 ml-1 font-medium">{errors.password.message}</p>}
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-sm font-bold gradient-saffron border-0 text-white shadow-glow-primary hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
            >
              {/* Shimmer effect on button */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 animate-shimmer" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", backgroundSize: "200% 100%" }} />
              </div>

              {loading ? (
                <span className="flex items-center gap-2 relative z-10">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("common.loading")}
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  {t("auth.signIn")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Button>
          </motion.div>

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="w-full text-center text-sm font-medium text-primary hover:underline underline-offset-4 transition-all"
          >
            {t("auth.forgotPassword")}
          </button>
        </motion.form>

        {/* ── Register CTA with decorative border ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-10 text-center"
        >
          {/* Decorative mehendi divider */}
          <div className="mx-auto max-w-[180px] mb-5 opacity-40">
            <MehendiPattern variant="border" color="hsl(var(--primary))" opacity={0.3} className="h-4" />
          </div>

          <p className="text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button
              id="goto-register"
              onClick={() => navigate("/register")}
              className="font-bold text-primary hover:underline underline-offset-4 transition-all"
            >
              {t("auth.createAccount")}
            </button>
          </p>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-[10px] text-muted-foreground/40 mt-8 mb-4 tracking-widest uppercase"
        >
          Made with ❤️ for Banjara Community
        </motion.p>
      </div>
    </div>
  );
};

export default Login;
