import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Camera, User, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CropModal from "@/components/CropModal";
import { COMMUNITIES, GOTRAS, STATES } from "@/types";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import { uploadWithQuotaCheck } from "@/lib/storageQuota";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const EDUCATIONS = ["10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Doctorate", "Other"];
const HEIGHTS = Array.from({ length: 37 }, (_, i) => {
  const total = 48 + i;
  return `${Math.floor(total / 12)}'${total % 12}"`;
});
const INCOMES = ["Below 2 Lakh", "2-5 Lakh", "5-10 Lakh", "10-15 Lakh", "15-25 Lakh", "25-50 Lakh", "50 Lakh+"];
const MARITAL = ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"];

// ─── Stable helper components (MUST be outside EditProfile to avoid remount on every keystroke) ───

const inputCls =
  "w-full h-11 sm:h-12 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-base sm:text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";
const selectCls = inputCls;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────────────

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    about: "",
    date_of_birth: "",
    gender: "",
    community: "",
    gotra: "",
    state: "",
    district: "",
    city_village: "",
    tanda_name: "",
    education: "",
    occupation: "",
    annual_income: "",
    height: "",
    marital_status: "",
    mother_tongue: "",
    religion: "Hindu",
    rashi: "",
    nakshatra: "",
    manglik: "",
    birth_time: "",
    birth_place: "",
    pref_age_min: 18,
    pref_age_max: 60,
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
    try {
      const completion = calculateProfileCompletion({ ...profile, ...form });
      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          profile_completion: completion,
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Save failed: " + error.message);
        setSaving(false);
        return;
      }

      await refreshProfile();
      setSaving(false);

      if (completion === 100) {
        toast.success("🎉 Profile 100% complete!");
      } else {
        toast.success(`Profile updated! (${completion}% complete)`);
      }
      navigate("/my-profile");
    } catch (err: any) {
      toast.error("An error occurred while saving profile");
      setSaving(false);
    }
  };

  // Photo Select & Crop Flow
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedPhoto = async (croppedBlob: Blob) => {
    if (!user) return;
    setCropImageSrc(null);
    setUploadingPhoto(true);
    try {
      const file = new File([croppedBlob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
      const filePath = `${user.id}/${Date.now()}.jpg`;

      // FIXED: correct arg order is (file, userId, storagePath, bucket, options)
      const quotaCheck = await uploadWithQuotaCheck(file, user.id, filePath, "avatars", { upsert: true });
      if (!quotaCheck.success) {
        toast.error(quotaCheck.error || "Storage quota exceeded");
        setUploadingPhoto(false);
        return;
      }

      const photoUrl = quotaCheck.publicUrl!;

      await supabase
        .from("profiles")
        .update({ photo_url: photoUrl })
        .eq("user_id", user.id);

      await refreshProfile();
      toast.success("Profile photo updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const currentCompletion = calculateProfileCompletion({ ...profile, ...form });

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/50 px-4 pt-10 pb-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-lg font-bold text-foreground truncate">
              Edit Profile
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gradient-saffron transition-all duration-500"
                  style={{ width: `${currentCompletion}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary tabular-nums">
                {currentCompletion}%
              </span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl gradient-saffron px-4 py-2.5 text-xs font-bold text-white shadow-glow-primary active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </button>
        </div>
      </header>

      {/* Main Content Form — pb-28 clears the fixed BottomNav */}
      <main className="mx-auto max-w-lg w-full px-4 pt-6 pb-28 space-y-6">
        {/* Photo Upload Section */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft flex flex-col items-center text-center animate-fade-up">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-md bg-muted flex items-center justify-center">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Profile Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full gradient-saffron text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
          </div>
          <h3 className="mt-3 font-heading font-semibold text-sm text-foreground">
            {profile?.full_name || "Upload Profile Photo"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap camera to change photo
          </p>
        </section>

        {/* Section 1: Basic Info */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Basic Information
            </h2>
          </div>

          <Field label="Full Name">
            <input
              className={inputCls}
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Your full name"
            />
          </Field>

          <Field label="About Me">
            <textarea
              className={`${inputCls} min-h-[90px] resize-none py-3`}
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              placeholder="Write a brief introduction about yourself..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of Birth">
              <input
                type="date"
                className={inputCls}
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
              />
            </Field>

            <Field label="Gender">
              <select
                className={selectCls}
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Section 2: Community Details */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Community & Heritage
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Community">
              <select
                className={selectCls}
                value={form.community}
                onChange={(e) => update("community", e.target.value)}
              >
                <option value="">Select Community</option>
                {COMMUNITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Gotra">
              <select
                className={selectCls}
                value={form.gotra}
                onChange={(e) => update("gotra", e.target.value)}
              >
                <option value="">Select Gotra</option>
                {GOTRAS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Mother Tongue">
            <input
              className={inputCls}
              value={form.mother_tongue}
              onChange={(e) => update("mother_tongue", e.target.value)}
              placeholder="e.g. Gor Bhasha / Lambadi, Hindi"
            />
          </Field>
        </section>

        {/* Section 3: Location */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Location Details
            </h2>
          </div>

          <Field label="State">
            <select
              className={selectCls}
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
            >
              <option value="">Select State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="District">
              <input
                className={inputCls}
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="District"
              />
            </Field>

            <Field label="City / Village">
              <input
                className={inputCls}
                value={form.city_village}
                onChange={(e) => update("city_village", e.target.value)}
                placeholder="City or Village"
              />
            </Field>
          </div>

          <Field label="Tanda Name">
            <input
              className={inputCls}
              value={form.tanda_name}
              onChange={(e) => update("tanda_name", e.target.value)}
              placeholder="Tanda name (optional)"
            />
          </Field>
        </section>

        {/* Section 4: Professional & Lifestyle */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Education & Career
            </h2>
          </div>

          <Field label="Education Level">
            <select
              className={selectCls}
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
            >
              <option value="">Select Education</option>
              {EDUCATIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Occupation">
              <input
                className={inputCls}
                value={form.occupation}
                onChange={(e) => update("occupation", e.target.value)}
                placeholder="Your occupation"
              />
            </Field>

            <Field label="Annual Income">
              <select
                className={selectCls}
                value={form.annual_income}
                onChange={(e) => update("annual_income", e.target.value)}
              >
                <option value="">Select Income</option>
                {INCOMES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Height">
              <select
                className={selectCls}
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
              >
                <option value="">Select Height</option>
                {HEIGHTS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Marital Status">
              <select
                className={selectCls}
                value={form.marital_status}
                onChange={(e) => update("marital_status", e.target.value)}
              >
                <option value="">Select Status</option>
                {MARITAL.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Section 5: Horoscope */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Horoscope Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Rashi">
              <input
                className={inputCls}
                value={form.rashi}
                onChange={(e) => update("rashi", e.target.value)}
                placeholder="e.g. Mesh"
              />
            </Field>

            <Field label="Nakshatra">
              <input
                className={inputCls}
                value={form.nakshatra}
                onChange={(e) => update("nakshatra", e.target.value)}
                placeholder="e.g. Ashwini"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Birth Time">
              <input
                type="time"
                className={inputCls}
                value={form.birth_time}
                onChange={(e) => update("birth_time", e.target.value)}
              />
            </Field>

            <Field label="Manglik">
              <select
                className={selectCls}
                value={form.manglik}
                onChange={(e) => update("manglik", e.target.value)}
              >
                <option value="">Select Manglik</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Don't Know">Don't Know</option>
              </select>
            </Field>
          </div>

          <Field label="Birth Place">
            <input
              className={inputCls}
              value={form.birth_place}
              onChange={(e) => update("birth_place", e.target.value)}
              placeholder="Place of birth"
            />
          </Field>
        </section>

        {/* Section 6: Partner Preferences */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Partner Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`Min Preferred Age: ${form.pref_age_min}`}>
              <input
                type="range"
                min={18}
                max={60}
                value={form.pref_age_min}
                onChange={(e) => update("pref_age_min", +e.target.value)}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </Field>

            <Field label={`Max Preferred Age: ${form.pref_age_max}`}>
              <input
                type="range"
                min={18}
                max={60}
                value={form.pref_age_max}
                onChange={(e) => update("pref_age_max", +e.target.value)}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </Field>
          </div>
        </section>
      </main>

      {/* Crop Modal */}
      {cropImageSrc && (
        <CropModal
          imageUrl={cropImageSrc}
          onConfirm={handleCroppedPhoto}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
      <BottomNav />

    </div>
  );
};

export default EditProfile;
