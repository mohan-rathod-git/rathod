import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { COMMUNITIES, GOTRAS, STATES } from "@/types";
import { calculateProfileCompletion } from "@/lib/profileUtils";

const EDUCATIONS = ["10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Doctorate", "Other"];
const HEIGHTS = Array.from({ length: 37 }, (_, i) => {
  const total = 48 + i;
  return `${Math.floor(total / 12)}'${total % 12}"`;
});
const INCOMES = ["Below 2 Lakh", "2-5 Lakh", "5-10 Lakh", "10-15 Lakh", "15-25 Lakh", "25-50 Lakh", "50 Lakh+"];
const MARITAL = ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"];

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", about: "", date_of_birth: "", gender: "", community: "",
    gotra: "", state: "", district: "", city_village: "", tanda_name: "",
    education: "", occupation: "", annual_income: "", height: "",
    marital_status: "", mother_tongue: "", religion: "Hindu",
    rashi: "", nakshatra: "", manglik: "", birth_time: "", birth_place: "",
    pref_age_min: 18, pref_age_max: 60,
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        about: profile.about || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        community: profile.community || "",
        gotra: profile.gotra || "",
        state: profile.state || "",
        district: profile.district || "",
        city_village: profile.city_village || "",
        tanda_name: profile.tanda_name || "",
        education: profile.education || "",
        occupation: profile.occupation || "",
        annual_income: profile.annual_income || "",
        height: profile.height || "",
        marital_status: profile.marital_status || "",
        mother_tongue: profile.mother_tongue || "",
        religion: profile.religion || "Hindu",
        rashi: profile.rashi || "",
        nakshatra: profile.nakshatra || "",
        manglik: profile.manglik || "",
        birth_time: profile.birth_time || "",
        birth_place: profile.birth_place || "",
        pref_age_min: profile.pref_age_min || 18,
        pref_age_max: profile.pref_age_max || 60,
      }));
    }
  }, [profile]);

  const update = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Calculate completion dynamically
    const completion = calculateProfileCompletion({ ...profile, ...form });
    const { error } = await supabase.from("profiles").update({
      ...form,
      profile_completion: completion,
    }).eq("user_id", user.id);
    if (error) { toast.error("Save failed"); setSaving(false); return; }
    await refreshProfile();
    setSaving(false);
    if (completion === 100) {
      toast.success("🎉 Profile 100% complete!");
    } else {
      toast.success(`Profile updated! (${completion}% complete)`);
    }
    navigate("/my-profile");
  };

  const currentCompletion = calculateProfileCompletion({ ...profile, ...form });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );

  const inputCls = "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow";
  const selectCls = inputCls;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-bold text-foreground">Edit Profile</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-saffron transition-all duration-500" style={{ width: `${currentCompletion}%` }} />
              </div>
              <span className="text-[10px] font-bold text-primary tabular-nums">{currentCompletion}%</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 rounded-2xl gradient-saffron px-4 py-2.5 text-xs font-bold text-white shadow-glow-primary active:scale-95 transition-transform disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-8">
        <section className="space-y-4 animate-fade-up">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Basic Information</h2>
          <Field label="Full Name">
            <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your full name" />
          </Field>
          <Field label="About">
            <textarea className={`${inputCls} min-h-[80px] resize-none`} value={form.about} onChange={(e) => update("about", e.target.value)} placeholder="Tell about yourself..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth">
              <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
            </Field>
            <Field label="Gender">
              <select className={selectCls} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up-1">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Community Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Community">
              <select className={selectCls} value={form.community} onChange={(e) => update("community", e.target.value)}>
                <option value="">Select</option>
                {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Gotra">
              <select className={selectCls} value={form.gotra} onChange={(e) => update("gotra", e.target.value)}>
                <option value="">Select</option>
                {GOTRAS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Mother Tongue">
            <input className={inputCls} value={form.mother_tongue} onChange={(e) => update("mother_tongue", e.target.value)} placeholder="e.g. Lambadi, Hindi" />
          </Field>
        </section>

        <section className="space-y-4 animate-fade-up-2">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Location</h2>
          <Field label="State">
            <select className={selectCls} value={form.state} onChange={(e) => update("state", e.target.value)}>
              <option value="">Select State</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="District">
              <input className={inputCls} value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="District" />
            </Field>
            <Field label="City / Village">
              <input className={inputCls} value={form.city_village} onChange={(e) => update("city_village", e.target.value)} placeholder="City or Village" />
            </Field>
          </div>
          <Field label="Tanda Name">
            <input className={inputCls} value={form.tanda_name} onChange={(e) => update("tanda_name", e.target.value)} placeholder="Tanda name (optional)" />
          </Field>
        </section>

        <section className="space-y-4 animate-fade-up-3">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Professional</h2>
          <Field label="Education">
            <select className={selectCls} value={form.education} onChange={(e) => update("education", e.target.value)}>
              <option value="">Select</option>
              {EDUCATIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Occupation">
              <input className={inputCls} value={form.occupation} onChange={(e) => update("occupation", e.target.value)} placeholder="Your work" />
            </Field>
            <Field label="Income">
              <select className={selectCls} value={form.annual_income} onChange={(e) => update("annual_income", e.target.value)}>
                <option value="">Select</option>
                {INCOMES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height">
              <select className={selectCls} value={form.height} onChange={(e) => update("height", e.target.value)}>
                <option value="">Select</option>
                {HEIGHTS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </Field>
            <Field label="Marital Status">
              <select className={selectCls} value={form.marital_status} onChange={(e) => update("marital_status", e.target.value)}>
                <option value="">Select</option>
                {MARITAL.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 animate-fade-up-4">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Horoscope</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rashi">
              <input className={inputCls} value={form.rashi} onChange={(e) => update("rashi", e.target.value)} placeholder="e.g. Mesh" />
            </Field>
            <Field label="Nakshatra">
              <input className={inputCls} value={form.nakshatra} onChange={(e) => update("nakshatra", e.target.value)} placeholder="e.g. Ashwini" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Birth Time">
              <input type="time" className={inputCls} value={form.birth_time} onChange={(e) => update("birth_time", e.target.value)} />
            </Field>
            <Field label="Manglik">
              <select className={selectCls} value={form.manglik} onChange={(e) => update("manglik", e.target.value)}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Don't Know">Don't Know</option>
              </select>
            </Field>
          </div>
          <Field label="Birth Place">
            <input className={inputCls} value={form.birth_place} onChange={(e) => update("birth_place", e.target.value)} placeholder="Place of birth" />
          </Field>
        </section>

        <section className="space-y-4 animate-fade-up-5">
          <h2 className="font-heading text-sm font-bold text-foreground border-b border-border/50 pb-2">Partner Preferences</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Min Age: ${form.pref_age_min}`}>
              <input type="range" min={18} max={60} value={form.pref_age_min} onChange={(e) => update("pref_age_min", +e.target.value)} className="w-full accent-primary" />
            </Field>
            <Field label={`Max Age: ${form.pref_age_max}`}>
              <input type="range" min={18} max={60} value={form.pref_age_max} onChange={(e) => update("pref_age_max", +e.target.value)} className="w-full accent-primary" />
            </Field>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
