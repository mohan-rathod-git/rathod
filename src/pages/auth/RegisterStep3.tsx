import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Camera, Check, Loader2, Sparkles } from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import { ensureProfileRow } from "@/lib/profilePersistence";

const rashis = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const manglikOptions = ["Yes", "No", "Partially"];

const RegisterStep3 = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    rashi: "", nakshatra: "", manglik: "", birthTime: "", birthPlace: "",
    prefAgeMin: "18", prefAgeMax: "40",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  // Redirect to login if no user after auth loading completes
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please log in to continue registration");
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(publicUrl);
      toast.success("Photo uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in");
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const completion = calculateProfileCompletion({
        ...form,
        ...user,
        ...{ photo_url: photoUrl || undefined },
        ...{ ...(await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()).data },
      });

        await ensureProfileRow(user, {
        rashi: form.rashi || null,
        nakshatra: form.nakshatra || null,
        manglik: form.manglik || null,
        birth_time: form.birthTime || null,
        birth_place: form.birthPlace || null,
        pref_age_min: parseInt(form.prefAgeMin) || 18,
        pref_age_max: parseInt(form.prefAgeMax) || 60,
        photo_url: photoUrl,
        registration_step: 4,
        profile_completion: completion,
        });

      await refreshProfile();
      setCompleted(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      console.error("Complete error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-scale-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-saffron shadow-glow-primary mb-6 mx-auto">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground" style={{ lineHeight: "1.1" }}>
            You're all set!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Welcome to the Banjara Bandhan family. Your perfect match awaits 🎉
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-primary/40" style={{ animation: `pulse-glow 1.2s ease ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="font-heading text-lg font-bold text-foreground">Final Step</h1>
            <p className="text-xs text-muted-foreground">Step 3 of 3 · Photo & Preferences</p>
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums">90%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[90%] rounded-full gradient-saffron transition-all duration-500 ease-out" />
        </div>
      </div>

      <form onSubmit={handleComplete} className="mx-auto max-w-md px-5 pt-6 pb-24 space-y-5">
        {/* Photo upload */}
        <div className="animate-fade-up">
          <label className="text-xs font-medium text-muted-foreground mb-3 block">Profile Photo</label>
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="group relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card text-muted-foreground overflow-hidden active:scale-95 transition-all shadow-soft hover:shadow-medium hover:border-primary/50">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : photoUrl ? (
              <img src={photoUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <>
                <Camera className="h-7 w-7 mb-1 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-medium">Add Photo</span>
              </>
            )}
          </button>
        </div>

        <div className="animate-fade-up-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Rashi (Moon Sign)</label>
          <select value={form.rashi} onChange={(e) => set("rashi", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
            <option value="">Select Rashi</option>
            {rashis.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="animate-fade-up-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nakshatra</label>
          <Input value={form.nakshatra} onChange={(e) => set("nakshatra", e.target.value)} placeholder="Enter nakshatra" className="h-12 rounded-2xl bg-card shadow-soft" />
        </div>

        <div className="animate-fade-up-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Manglik</label>
          <div className="grid grid-cols-3 gap-2">
            {manglikOptions.map((m) => (
              <button key={m} type="button" onClick={() => set("manglik", m)}
                className={`rounded-2xl py-2.5 text-sm font-medium transition-all active:scale-95 ${
                  form.manglik === m ? "gradient-saffron text-white shadow-glow-primary" : "bg-card border border-border text-foreground shadow-soft"
                }`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up-2 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Birth Time</label>
            <Input type="time" value={form.birthTime} onChange={(e) => set("birthTime", e.target.value)} className="h-12 rounded-2xl bg-card shadow-soft" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Birth Place</label>
            <Input value={form.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} placeholder="Place" className="h-12 rounded-2xl bg-card shadow-soft" />
          </div>
        </div>

        <div className="animate-fade-up-3 border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-heading text-sm font-bold text-foreground">Partner Preferences</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min Age</label>
              <Input type="number" min="18" max="60" value={form.prefAgeMin} onChange={(e) => set("prefAgeMin", e.target.value)} className="h-12 rounded-2xl bg-card shadow-soft tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Age</label>
              <Input type="number" min="18" max="60" value={form.prefAgeMax} onChange={(e) => set("prefAgeMax", e.target.value)} className="h-12 rounded-2xl bg-card shadow-soft tabular-nums" />
            </div>
          </div>
        </div>

        <div className="pt-2 animate-fade-up-4">
          <Button type="submit" disabled={loading}
            className="w-full h-13 rounded-2xl text-sm font-semibold gradient-saffron border-0 text-white shadow-glow-primary active:scale-[0.97] transition-transform">
            {loading ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Completing...</span>
            ) : "Complete Registration ✨"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStep3;
