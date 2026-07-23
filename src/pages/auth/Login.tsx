import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Phone, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { getPostAuthRoute } from "@/lib/profileUtils";
import { ensureProfileRow } from "@/lib/profilePersistence";
import { motion, AnimatePresence } from "framer-motion";
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

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auth Mode: 'email' | 'phone'
  const [authMode, setAuthMode] = useState<"email" | "phone">("phone");
  const [emailSubMode, setEmailSubMode] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Mobile / Phone OTP states (using Supabase Auth)
  const [phone, setPhone] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Email OTP states (using Supabase Auth)
  const [otpEmail, setOtpEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handlePostLogin = async (user: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      await ensureProfileRow(user);
    }

    toast.success("Welcome back!");
    navigate(getPostAuthRoute(profile ?? ({ registration_step: 1 } as any)), { replace: true });
  };

  // 1. Email + Password Login via Supabase
  const onSubmitEmailPassword = async (values: LoginFormValues) => {
    const { email, password } = values;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user) {
      await handlePostLogin(data.user);
    }
  };

  // 2. Email OTP via Supabase (signInWithOtp)
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail.trim(),
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to send email OTP");
      return;
    }

    setEmailOtpSent(true);
    setResendTimer(60);
    toast.success(`OTP code sent to ${otpEmail}! Check your inbox.`);
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtpCode || emailOtpCode.length < 6) {
      toast.error("Please enter 6-digit OTP code");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(),
      token: emailOtpCode.trim(),
      type: "email",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Invalid OTP code");
      return;
    }

    if (data.user) {
      await handlePostLogin(data.user);
    }
  };

  // 3. Mobile Phone OTP via Supabase (signInWithOtp)
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    // Format phone with +91 country code
    const fullPhone = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone.replace(/^0+/, "")}`;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to send OTP code via Supabase");
      return;
    }

    setPhoneOtpSent(true);
    setResendTimer(60);
    toast.success(`Supabase OTP code sent to ${fullPhone}!`);
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpCode || phoneOtpCode.length < 6) {
      toast.error("Please enter 6-digit OTP code");
      return;
    }

    const cleanPhone = phone.trim();
    const fullPhone = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone.replace(/^0+/, "")}`;

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: phoneOtpCode.trim(),
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Invalid OTP code. Please try again.");
      return;
    }

    if (data.user) {
      await handlePostLogin(data.user);
    }
  };

  // 4. Google OAuth Login via Supabase
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen sm:min-h-0 sm:my-8 sm:rounded-3xl sm:shadow-premium sm:border sm:border-border/50 overflow-hidden bg-background">
        {/* ═══ Premium Gradient Hero ═══ */}
        <div className="relative px-6 pt-8 pb-10 text-center overflow-hidden z-0">
          <div
            className="absolute inset-0 animate-gradient-shift"
            style={{
              background: "linear-gradient(145deg, hsl(355 60% 22%) 0%, hsl(14 80% 52%) 40%, hsl(38 75% 55%) 70%, hsl(355 50% 32%) 100%)",
              backgroundSize: "200% 200%",
            }}
          />

          <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />

          {/* Background Vector Patterns (Non-Colliding, Pointer-Events-None) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <MehendiPattern
              variant="corner-tl"
              color="white"
              opacity={0.08}
              className="w-36 h-36 -top-6 -left-6 absolute"
            />
            <MehendiPattern
              variant="corner-br"
              color="white"
              opacity={0.08}
              className="w-36 h-36 -bottom-6 -right-6 absolute"
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl overflow-hidden bg-white/10 shadow-medium ring-1 ring-white/20 backdrop-blur-md relative"
            >
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight"
            >
              Banjara Bandhan
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-0.5 text-[11px] sm:text-xs text-white/70 tracking-wide"
            >
              Where traditions meet hearts ✨
            </motion.p>
          </div>
        </div>

      {/* ═══ Form Section ═══ */}
      <div className="flex-1 -mt-6 rounded-t-[2.5rem] bg-background px-6 pt-7 pb-12 relative z-10 flex flex-col justify-between">
        <div>
          <div className="w-12 h-1 rounded-full bg-primary/20 mx-auto mb-5" />

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-muted p-1 mb-5 border border-border/50">
            <button
              type="button"
              onClick={() => { setAuthMode("phone"); setPhoneOtpSent(false); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === "phone"
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-3.5 w-3.5" /> Mobile OTP
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("email"); setEmailOtpSent(false); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === "email"
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Email Login
            </button>
          </div>

          {/* Google Login Button */}
          <motion.div whileTap={{ scale: 0.98 }} className="mb-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-12 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 font-semibold text-xs text-foreground shadow-soft flex items-center justify-center gap-3 transition-all"
            >
              {googleLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>
          </motion.div>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-border/60 w-full" />
            <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-widest whitespace-nowrap">
              or sign in with {authMode === "phone" ? "Supabase Mobile OTP" : "Email"}
            </span>
            <div className="border-t border-border/60 w-full" />
          </div>

          <AnimatePresence mode="wait">
            {/* Mobile Phone OTP Form (Supabase Auth) */}
            {authMode === "phone" && (
              <motion.form
                key="phone-form"
                onSubmit={phoneOtpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!phoneOtpSent ? (
                  /* Step 1: Mobile Number Entry */
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                      Mobile Number
                    </label>
                    <div className="relative group flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>+91</span>
                        <span className="h-3 w-px bg-border ml-1" />
                      </div>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="pl-24 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all text-sm font-semibold tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Supabase Auth will send a 6-digit OTP code to your mobile number.
                    </p>
                  </div>
                ) : (
                  /* Step 2: OTP Verification */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                        Enter Supabase OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhoneOtpSent(false)}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="pl-11 h-12 rounded-2xl border-emerald-500/40 bg-card shadow-soft text-center font-bold text-lg tracking-[0.5em] focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground text-[11px]">
                        Sent to <strong className="text-foreground">+91 {phone}</strong>
                      </span>
                      {resendTimer > 0 ? (
                        <span className="text-muted-foreground text-[11px]">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          className="font-bold text-primary text-[11px] hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 rounded-2xl text-sm font-bold gradient-saffron border-0 text-white shadow-glow-primary hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        {phoneOtpSent ? "Verifying..." : "Requesting OTP..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        {phoneOtpSent ? "Verify & Login" : "Request Supabase OTP"}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}

            {/* Email Form (Password or OTP) */}
            {authMode === "email" && (
              <motion.div
                key="email-form-container"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Email sub-mode switcher */}
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setEmailSubMode(emailSubMode === "password" ? "otp" : "password")}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    {emailSubMode === "password" ? (
                      <> <KeyRound className="h-3 w-3" /> Use Email OTP instead </>
                    ) : (
                      <> <Lock className="h-3 w-3" /> Use Password instead </>
                    )}
                  </button>
                </div>

                {emailSubMode === "password" ? (
                  <form onSubmit={handleSubmit(onSubmitEmailPassword)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                        {t("auth.email")}
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@email.com"
                          {...register("email")}
                          className={`pl-11 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all ${
                            errors.email ? "border-destructive focus:border-destructive" : "focus:border-primary/30"
                          }`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-destructive mt-1 ml-1 font-medium">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                        {t("auth.password")}
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...register("password")}
                          className={`pl-11 pr-11 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all ${
                            errors.password ? "border-destructive focus:border-destructive" : "focus:border-primary/30"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive mt-1 ml-1 font-medium">{errors.password.message}</p>}
                    </div>

                    <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        className="w-full h-13 rounded-2xl text-sm font-bold gradient-saffron border-0 text-white shadow-glow-primary hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
                      >
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
                      className="w-full text-center text-xs font-medium text-primary hover:underline underline-offset-4 transition-all pt-1"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={emailOtpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="space-y-4">
                    {!emailOtpSent ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="email"
                            placeholder="you@email.com"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            className="pl-11 h-12 rounded-2xl border-border bg-card shadow-soft focus:shadow-medium transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Supabase will send a 6-digit OTP login code to your email.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Enter Email OTP
                          </label>
                          <button
                            type="button"
                            onClick={() => setEmailOtpSent(false)}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            Change Email
                          </button>
                        </div>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                          <Input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={emailOtpCode}
                            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="pl-11 h-12 rounded-2xl border-emerald-500/40 bg-card shadow-soft text-center font-bold text-lg tracking-[0.5em] focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-13 rounded-2xl text-sm font-bold gradient-saffron border-0 text-white shadow-glow-primary hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2 relative z-10">
                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            {emailOtpSent ? "Verifying..." : "Sending..."}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 relative z-10">
                            {emailOtpSent ? "Verify & Login" : "Send Email OTP Code"}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Register CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="mx-auto max-w-[180px] mb-4 opacity-40">
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

          <p className="text-[10px] text-muted-foreground/40 mt-6 tracking-widest uppercase">
            Made with ❤️ for Banjara Community
          </p>
        </motion.div>
      </div>
    </div>
  </div>
  );
};

export default Login;
