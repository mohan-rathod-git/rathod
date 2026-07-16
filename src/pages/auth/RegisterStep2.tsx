import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GOTRAS, COMMUNITIES } from "@/types";
import { ensureProfileRow } from "@/lib/profilePersistence";

const educationOptions = ["10th", "12th", "Diploma", "Graduate", "Post-Graduate", "Professional"];
const occupationOptions = ["Farmer", "Daily Wage", "Business", "Government Job", "Private Job", "Professional", "Student", "Homemaker"];
const maritalOptions = ["Never Married", "Divorced", "Widowed"];
const motherTongues = ["Banjara/Lambani", "Kannada", "Telugu", "Marathi", "Hindi", "Other"];

const RegisterStep2 = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    community: "", tandaName: "", gotra: "", subCaste: "", motherTongue: "",
    education: "", occupation: "", annualIncome: "", maritalStatus: "", height: "", about: "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  // Redirect to login if no user after auth loading completes
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please log in to continue registration");
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in first");
      navigate("/login", { replace: true });
      return;
    }
    if (!form.community || !form.gotra) {
      toast.error("Community and Gotra are required");
      return;
    }
    setLoading(true);
    try {
      await ensureProfileRow(user, {
        community: form.community,
        tanda_name: form.tandaName || null,
        gotra: form.gotra,
        sub_caste: form.subCaste || null,
        mother_tongue: form.motherTongue || null,
        education: form.education || null,
        occupation: form.occupation || null,
        annual_income: form.annualIncome || null,
        marital_status: form.maritalStatus || null,
        height: form.height || null,
        about: form.about || null,
        registration_step: 3,
      });

      await refreshProfile();
      toast.success("Community details saved!");
      navigate("/register/step3");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filled = [form.community, form.gotra].filter(Boolean).length;
  const progress = 33 + Math.round((filled / 2) * 33);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-bold text-foreground">Community Details</h1>
            <p className="text-xs text-muted-foreground">Step 2 of 3 · Heritage & Identity</p>
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full gradient-saffron transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSave} className="mx-auto max-w-md px-5 pt-6 pb-24 space-y-5">
        <div className="animate-fade-up space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Community *</label>
          <div className="flex flex-wrap gap-2">
            {COMMUNITIES.map((c) => (
              <button key={c} type="button" onClick={() => set("community", c)}
                className={`rounded-2xl px-4 py-2 text-xs font-medium transition-all active:scale-95 ${
                  form.community === c ? "gradient-saffron text-white shadow-glow-primary" : "bg-card border border-border text-foreground shadow-soft"
                }`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tanda / Village Name</label>
          <Input value={form.tandaName} onChange={(e) => set("tandaName", e.target.value)} placeholder="Your tanda name" className="h-12 rounded-2xl bg-card shadow-soft" />
        </div>

        <div className="animate-fade-up-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Gotra *</label>
          <select value={form.gotra} onChange={(e) => set("gotra", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
            <option value="">Select Gotra</option>
            {GOTRAS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="animate-fade-up-2 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Mother Tongue</label>
          <select value={form.motherTongue} onChange={(e) => set("motherTongue", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
            <option value="">Select</option>
            {motherTongues.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="animate-fade-up-2 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Education</label>
            <select value={form.education} onChange={(e) => set("education", e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
              <option value="">Select</option>
              {educationOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Occupation</label>
            <select value={form.occupation} onChange={(e) => set("occupation", e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
              <option value="">Select</option>
              {occupationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="animate-fade-up-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Marital Status</label>
          <div className="grid grid-cols-3 gap-2">
            {maritalOptions.map((m) => (
              <button key={m} type="button" onClick={() => set("maritalStatus", m)}
                className={`rounded-2xl py-2.5 text-xs font-medium transition-all active:scale-95 ${
                  form.maritalStatus === m ? "gradient-saffron text-white shadow-glow-primary" : "bg-card border border-border text-foreground shadow-soft"
                }`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up-3 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Height</label>
          <Input value={form.height} onChange={(e) => set("height", e.target.value)} placeholder="e.g., 5'6&quot;" className="h-12 rounded-2xl bg-card shadow-soft" />
        </div>

        <div className="animate-fade-up-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">About Yourself</label>
          <textarea value={form.about} onChange={(e) => set("about", e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            className="flex w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <span className="text-[10px] text-muted-foreground tabular-nums">{form.about.length} characters</span>
        </div>

        <div className="pt-2 animate-fade-up-4">
          <Button type="submit" disabled={loading}
            className="w-full h-13 rounded-2xl text-sm font-semibold gradient-saffron border-0 text-white shadow-glow-primary active:scale-[0.97] transition-transform">
            {loading ? "Saving..." : <span className="flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStep2;
