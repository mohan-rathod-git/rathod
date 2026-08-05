/**
 * SetupProfile — Standalone "Set up your profile" onboarding page.
 *
 * Collects: Full Name, Mobile Number, Gotra, Profile Photo.
 * Features rich Banjara/Rajasthani mehendi SVG decorations and a
 * premium gradient hero — matching the overall brand aesthetic.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, User, Phone, CheckCircle2, ArrowRight, Loader2, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GOTRAS } from "@/types";
import { toast } from "sonner";
import MehendiPattern from "@/components/graphics/MehendiPattern";

// ─── Inline mehendi side-panel SVG ──────────────────────────────────────────

const MehendiSidePanel = () => (
  <svg
    viewBox="0 0 160 600"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Vertical spine vine */}
    <path
      d="M80 0 Q70 60 80 120 Q90 180 80 240 Q70 300 80 360 Q90 420 80 480 Q70 540 80 600"
      stroke="hsl(14 80% 52%)" strokeWidth="1.5" fill="none" opacity="0.35"
      strokeDasharray="6 4"
    />

    {/* Top mandala */}
    <g transform="translate(80,60)">
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -10 Q5 -22 0 -38 Q-5 -22 0 -10Z"
            fill="hsl(14 80% 52%)" fillOpacity="0.18"
            stroke="hsl(14 80% 52%)" strokeWidth="0.6" strokeOpacity="0.4"
          />
        </g>
      ))}
      <circle cx="0" cy="0" r="8" stroke="hsl(14 80% 52%)" strokeWidth="1" fill="none" opacity="0.3"/>
      <circle cx="0" cy="0" r="3" fill="hsl(14 80% 52%)" fillOpacity="0.25"/>
    </g>

    {/* Upper-left paisley */}
    <g transform="translate(20,130) rotate(-20) scale(0.65)">
      <path d="M40 5 C65 5, 80 28, 72 52 C64 76, 38 84, 22 68 C6 52, 14 22, 40 5Z"
        stroke="hsl(38 75% 55%)" strokeWidth="1.2" fill="none" opacity="0.45"/>
      <path d="M37 18 C54 18, 65 34, 59 50 C53 66, 36 70, 26 60 C16 50, 22 30, 37 18Z"
        stroke="hsl(38 75% 55%)" strokeWidth="0.8" fill="none" opacity="0.3"/>
      <path d="M42 8 Q48 2, 53 10 Q48 6, 42 8Z" fill="hsl(38 75% 55%)" fillOpacity="0.3"/>
    </g>

    {/* Right-side paisley */}
    <g transform="translate(90,180) rotate(15) scale(0.55)">
      <path d="M40 5 C65 5, 80 28, 72 52 C64 76, 38 84, 22 68 C6 52, 14 22, 40 5Z"
        stroke="hsl(355 60% 42%)" strokeWidth="1.2" fill="none" opacity="0.4"/>
      <path d="M37 18 C54 18, 65 34, 59 50 C53 66, 36 70, 26 60 C16 50, 22 30, 37 18Z"
        stroke="hsl(355 60% 42%)" strokeWidth="0.7" fill="none" opacity="0.25"/>
    </g>

    {/* Mid lotus */}
    <g transform="translate(80,290)">
      {[0,45,90,135,180,225,270,315].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -5 Q4 -14, 0 -24 Q-4 -14, 0 -5Z"
            fill="hsl(14 80% 52%)" fillOpacity="0.16"
            stroke="hsl(14 80% 52%)" strokeWidth="0.5" strokeOpacity="0.4"
          />
        </g>
      ))}
      <circle cx="0" cy="0" r="5" stroke="hsl(14 80% 52%)" strokeWidth="0.8" fill="none" opacity="0.3"/>
      <circle cx="0" cy="0" r="2" fill="hsl(14 80% 52%)" fillOpacity="0.2"/>
    </g>

    {/* Dot trail left */}
    {[0,1,2,3,4,5,6].map((i) => (
      <circle key={`dl-${i}`}
        cx={32 + Math.sin(i * 0.9) * 14}
        cy={350 + i * 22}
        r={2 + (i % 3 === 0 ? 1 : 0)}
        fill="hsl(38 75% 55%)" fillOpacity={0.22 + (i % 2) * 0.08}
      />
    ))}

    {/* Dot trail right */}
    {[0,1,2,3,4,5,6].map((i) => (
      <circle key={`dr-${i}`}
        cx={128 - Math.sin(i * 0.9) * 14}
        cy={350 + i * 22}
        r={2 + (i % 3 === 0 ? 1 : 0)}
        fill="hsl(355 60% 42%)" fillOpacity={0.22 + (i % 2) * 0.08}
      />
    ))}

    {/* Lower-left paisley */}
    <g transform="translate(14,460) rotate(10) scale(0.5)">
      <path d="M40 5 C65 5, 80 28, 72 52 C64 76, 38 84, 22 68 C6 52, 14 22, 40 5Z"
        stroke="hsl(38 75% 55%)" strokeWidth="1.2" fill="none" opacity="0.4"/>
    </g>

    {/* Lower-right paisley */}
    <g transform="translate(110,470) rotate(-10) scale(0.5)">
      <path d="M40 5 C65 5, 80 28, 72 52 C64 76, 38 84, 22 68 C6 52, 14 22, 40 5Z"
        stroke="hsl(355 60% 42%)" strokeWidth="1.2" fill="none" opacity="0.4"/>
    </g>

    {/* Bottom mandala */}
    <g transform="translate(80,550)">
      {[0,60,120,180,240,300].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -8 Q4 -18 0 -30 Q-4 -18 0 -8Z"
            fill="hsl(14 80% 52%)" fillOpacity="0.15"
            stroke="hsl(14 80% 52%)" strokeWidth="0.5" strokeOpacity="0.35"
          />
        </g>
      ))}
      <circle cx="0" cy="0" r="5" stroke="hsl(14 80% 52%)" strokeWidth="0.7" fill="none" opacity="0.25"/>
    </g>

    {/* Wave border left edge */}
    <path
      d="M8 100 Q14 130, 8 160 Q2 190, 8 220 Q14 250, 8 280 Q2 310, 8 340 Q14 370, 8 400 Q2 430, 8 460 Q14 490, 8 520"
      stroke="hsl(14 80% 52%)" strokeWidth="0.8" fill="none" opacity="0.2"
    />

    {/* Teardrop accents */}
    {[140,220,310,400,490].map((y, i) => (
      <path key={`td-${i}`}
        d={`M${i % 2 === 0 ? 50 : 110} ${y} Q${i % 2 === 0 ? 55 : 115} ${y - 7}, ${i % 2 === 0 ? 60 : 120} ${y}`}
        fill="hsl(38 75% 55%)" fillOpacity="0.22"
      />
    ))}
  </svg>
);

// ─── Input field component (stable ref — defined OUTSIDE render) ─────────────

const inputCls =
  "w-full h-12 rounded-2xl border border-border/60 bg-white/80 dark:bg-card px-4 text-base text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

const selectCls =
  "w-full h-12 rounded-2xl border border-border/60 bg-white/80 dark:bg-card px-4 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none";

// ─── Page ────────────────────────────────────────────────────────────────────

const SetupProfile = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    gotra: "",
  });

  // ── Completion guard: never show setup to users who already finished ────────
  useEffect(() => {
    if (!user) return;
    const p = (user as any)?.profile;
    if (p && (p.profile_completion >= 80 || p.registration_step >= 4)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const update = useCallback(
    (key: string, val: string) => setForm((p) => ({ ...p, [key]: val })),
    []
  );

  // ── Photo selection ────────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Upload photo to Supabase storage ──────────────────────────────────────
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    setUploadingPhoto(true);
    try {
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, photoFile, { upsert: true });
      if (error) {
        toast.error("Photo upload failed: " + error.message);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!form.gotra) {
      toast.error("Please select your Gotra");
      return;
    }
    if (!user) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      // Upload photo first if selected
      const photoUrl = photoFile ? await uploadPhoto() : null;

      const updates: Record<string, any> = {
        full_name: form.full_name.trim(),
        gotra: form.gotra,
      };

      if (form.mobile.trim()) updates.phone = form.mobile.trim();
      if (photoUrl) updates.photo_url = photoUrl;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to save: " + error.message);
        return;
      }

      await refreshProfile();
      toast.success("Profile set up successfully! 🎉");
      navigate("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Progress ring calculation
  const filled = [form.full_name, form.mobile, form.gotra, photoPreview].filter(Boolean).length;
  const pct = Math.round((filled / 4) * 100);

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── LEFT: Mehendi decorative panel (hidden on mobile) ── */}
      <aside
        className="hidden md:flex w-36 lg:w-48 flex-shrink-0 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, hsl(355 60% 12%) 0%, hsl(14 80% 18%) 50%, hsl(38 60% 14%) 100%)",
        }}
      >
        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(ellipse at 50% 20%, hsl(38 75% 55%) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 w-full h-full flex items-center justify-center py-8 px-2">
          <MehendiSidePanel />
        </div>
        {/* Brand text at bottom */}
        <div className="absolute bottom-6 w-full text-center">
          <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
            Banjara Bandhan
          </p>
        </div>
      </aside>

      {/* ── RIGHT: Main form area ── */}
      <main className="flex-1 flex flex-col min-h-screen relative">

        {/* Mobile top mehendi strip */}
        <div className="md:hidden relative h-36 overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, hsl(355 60% 22%) 0%, hsl(14 80% 52%) 50%, hsl(38 75% 55%) 100%)",
          }}
        >
          {/* Corner patterns */}
          <MehendiPattern variant="corner-tl" color="white" opacity={0.12} className="w-40 h-40 absolute -top-4 -left-4" />
          <MehendiPattern variant="corner-br" color="white" opacity={0.10} className="w-32 h-32 absolute -bottom-4 -right-4" />

          {/* Hero text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-heading text-xl font-bold text-white drop-shadow">
              Set Up Your Profile
            </h1>
            <p className="text-xs text-white/75">Just a few details to get started</p>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block px-8 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow border border-border/40">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Set Up Your Profile</h1>
              <p className="text-xs text-muted-foreground">Tell us a little about yourself to find your perfect match</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(pct, 3)}%`,
                  background: "linear-gradient(90deg, hsl(355 60% 42%), hsl(14 80% 52%), hsl(38 75% 55%))",
                }}
              />
            </div>
            <span className="text-xs font-bold text-primary tabular-nums min-w-[36px] text-right">
              {pct}%
            </span>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 3)}%`,
                  background: "linear-gradient(90deg, hsl(355 60% 42%), hsl(14 80% 52%), hsl(38 75% 55%))",
                }}
              />
            </div>
            <span className="text-xs font-bold text-primary tabular-nums">{pct}%</span>
          </div>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSave}
          className="flex-1 px-5 md:px-8 pb-10 space-y-6 max-w-md mx-auto w-full md:pt-2"
          style={{ scrollPaddingTop: "20px" }}
        >

          {/* Profile Photo */}
          <section className="flex flex-col items-center gap-3 py-2">
            <div className="relative group">
              {/* Avatar ring */}
              <div
                className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center bg-muted transition-all"
                style={{
                  borderColor: photoPreview ? "hsl(14 80% 52%)" : "hsl(var(--border))",
                  boxShadow: photoPreview
                    ? "0 0 0 4px hsl(14 80% 52% / 0.15), 0 8px 30px hsl(14 80% 52% / 0.2)"
                    : undefined,
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground/40" />
                )}
              </div>

              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, hsl(355 60% 42%), hsl(14 80% 52%))" }}
                aria-label="Upload profile photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {photoPreview ? "Looking great! ✨" : "Add Profile Photo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {photoPreview ? "Tap to change" : "Tap camera icon to upload"}
              </p>
            </div>
          </section>

          {/* Mehendi divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <Sparkles className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="setup-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="setup-name"
                type="text"
                className={`${inputCls} pl-10`}
                placeholder="Your full name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                autoComplete="name"
              />
              {form.full_name.trim().length >= 2 && (
                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label htmlFor="setup-mobile" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              {/* Country code badge */}
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/70 select-none">
                +91
              </span>
              <input
                id="setup-mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={`${inputCls} pl-20`}
                placeholder="10-digit number"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                autoComplete="tel"
              />
              {form.mobile.length === 10 && (
                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Gotra */}
          <div className="space-y-1.5">
            <label htmlFor="setup-gotra" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gotra <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                id="setup-gotra"
                className={selectCls}
                value={form.gotra}
                onChange={(e) => update("gotra", e.target.value)}
              >
                <option value="">Select your Gotra</option>
                {GOTRAS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {/* Custom arrow */}
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                {form.gotra ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Gotra chip preview */}
          {form.gotra && (
            <div className="flex items-center gap-2 animate-fade-up">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow"
                style={{ background: "linear-gradient(90deg, hsl(355 60% 42%), hsl(14 80% 52%))" }}
              >
                🌿 {form.gotra} Gotra
              </span>
            </div>
          )}

          {/* Decorative mehendi border */}
          <div className="overflow-hidden rounded-xl opacity-60">
            <MehendiPattern
              variant="border"
              color="hsl(14, 80%, 52%)"
              opacity={0.4}
              animate={false}
              className="h-8"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-13 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              height: "52px",
              background:
                saving
                  ? "hsl(var(--muted))"
                  : "linear-gradient(135deg, hsl(355 60% 42%) 0%, hsl(14 80% 52%) 55%, hsl(38 75% 55%) 100%)",
              boxShadow: saving
                ? "none"
                : "0 4px 20px hsl(14 80% 52% / 0.35), 0 1px 4px hsl(14 80% 52% / 0.2)",
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip for now, I'll finish later
          </button>
        </form>
      </main>
    </div>
  );
};

export default SetupProfile;
