import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, User, Mail, Lock } from "lucide-react";
import { STATES } from "@/types";
import { ensureProfileRow } from "@/lib/profilePersistence";

const genders = [
  { label: "Male", emoji: "👨" },
  { label: "Female", emoji: "👩" },
  { label: "Other", emoji: "🧑" },
];

const RegisterStep1 = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", gender: "", dateOfBirth: "", state: "", cityVillage: "",
  });

  // If user is already authenticated (came back with step=1), pre-fill form from profile
  const isReturningUser = !!user;

  useEffect(() => {
    if (isReturningUser && profile) {
      setForm((prev) => ({
        ...prev,
        fullName: profile.full_name || prev.fullName,
        email: profile.email || user?.email || prev.email,
        gender: profile.gender || prev.gender,
        dateOfBirth: profile.date_of_birth || prev.dateOfBirth,
        state: profile.state || prev.state,
        cityVillage: profile.city_village || prev.cityVillage,
      }));
    }
  }, [isReturningUser, profile, user]);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleUpdateProfile = async (authUser = user) => {
    if (!authUser) return;

    await ensureProfileRow(authUser, {
      full_name: form.fullName,
      gender: form.gender,
      date_of_birth: form.dateOfBirth || null,
      state: form.state || null,
      city_village: form.cityVillage || null,
      registration_step: 2,
    });

    if (user?.id === authUser.id) {
      await refreshProfile();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.gender) {
      toast.error("Please fill required fields (Name & Gender)");
      return;
    }

    setLoading(true);
    try {
      if (isReturningUser) {
        // User is already logged in, just update profile and move to step 2
          await handleUpdateProfile(user);
        toast.success("Profile updated!");
        navigate("/register/step2");
      } else {
        // New user signup flow
        if (!form.email || !form.password) {
          toast.error("Please fill email and password");
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }

        if (!data.user) {
          toast.error("Failed to create account. Please try again.");
          setLoading(false);
          return;
        }

        if (!data.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password,
          });
          if (signInError) {
            toast.success("Account created! Please check your email to verify, then log in.");
            setLoading(false);
            navigate("/login");
            return;
          }
          if (signInData.user) await handleUpdateProfile(signInData.user);
        } else {
          await handleUpdateProfile(data.user);
        }

        toast.success("Account created!");
        navigate("/register/step2");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completion = [form.fullName, isReturningUser ? "done" : form.email, isReturningUser ? "done" : form.password, form.gender].filter(Boolean).length;
  const progress = Math.round((completion / 4) * 33);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(isReturningUser ? "/" : "/login")} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-bold text-foreground">
              {isReturningUser ? "Complete Profile" : "Create Profile"}
            </h1>
            <p className="text-xs text-muted-foreground">Step 1 of 3 · Basic Info</p>
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full gradient-saffron transition-all duration-500 ease-out" style={{ width: `${Math.max(progress, 5)}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md px-5 pt-6 pb-24 space-y-5">
        <div className="animate-fade-up space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" className="pl-10 h-12 rounded-2xl bg-card shadow-soft" />
          </div>
        </div>

        {!isReturningUser && (
          <>
            <div className="animate-fade-up-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" className="pl-10 h-12 rounded-2xl bg-card shadow-soft" />
              </div>
            </div>

            <div className="animate-fade-up-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 6 characters" className="pl-10 h-12 rounded-2xl bg-card shadow-soft" />
              </div>
            </div>
          </>
        )}

        <div className="animate-fade-up-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Gender *</label>
          <div className="grid grid-cols-3 gap-2">
            {genders.map((g) => (
              <button key={g.label} type="button" onClick={() => set("gender", g.label)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-sm font-medium transition-all active:scale-95 ${
                  form.gender === g.label
                    ? "gradient-saffron text-white shadow-glow-primary"
                    : "bg-card border border-border text-foreground shadow-soft hover:shadow-medium"
                }`}>
                <span className="text-lg">{g.emoji}</span>
                <span className="text-xs">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className="h-12 rounded-2xl bg-card shadow-soft" />
        </div>

        <div className="animate-fade-up-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">State</label>
          <select value={form.state} onChange={(e) => set("state", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
            <option value="">Select State</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="animate-fade-up-5 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">City / Village</label>
          <Input value={form.cityVillage} onChange={(e) => set("cityVillage", e.target.value)} placeholder="Your city or village" className="h-12 rounded-2xl bg-card shadow-soft" />
        </div>

        <div className="pt-2 animate-fade-up-5">
          <Button type="submit" disabled={loading}
            className="w-full h-13 rounded-2xl text-sm font-semibold gradient-saffron border-0 text-white shadow-glow-primary active:scale-[0.97] transition-transform">
            {loading ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> {isReturningUser ? "Saving..." : "Creating..."}</span>
            ) : (
              <span className="flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStep1;
