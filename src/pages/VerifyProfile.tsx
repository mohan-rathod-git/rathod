import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, ShieldCheck, Clock, XCircle, Loader2, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerifyProfile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("verification_requests" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setRequest(data);
        setLoading(false);
      });
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size is 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/verification/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: insertError } = await supabase.from("verification_requests" as any).insert({
        user_id: user.id,
        id_photo_url: publicUrl,
        status: "pending",
      } as any);
      if (insertError) throw insertError;

      setRequest({ status: "pending", id_photo_url: publicUrl, created_at: new Date().toISOString() });
      toast.success("Verification request submitted! We'll review it within 24-48 hours.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string; desc: string }> = {
    pending: {
      icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20",
      label: "Under Review", desc: "Your ID is being reviewed by our team. This usually takes 24-48 hours."
    },
    approved: {
      icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20",
      label: "Verified ✓", desc: "Your profile has been verified! A verified badge is now visible on your profile."
    },
    rejected: {
      icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20",
      label: "Rejected", desc: "Your verification was not approved. Please upload a clearer photo and try again."
    },
  };

  const isVerified = profile?.is_verified;
  const currentStatus = request?.status;
  const config = currentStatus ? statusConfig[currentStatus] : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUpload} />

      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Verify Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5 animate-fade-up">
        {/* Already verified */}
        {isVerified && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex items-start gap-4">
            <ShieldCheck className="h-8 w-8 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-700">Profile Verified</h3>
              <p className="text-xs text-emerald-600/80 mt-1">Your identity has been verified. The verified badge is displayed on your profile.</p>
            </div>
          </div>
        )}

        {/* Current request status */}
        {!isVerified && config && (
          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${config.bg}`}>
            <config.icon className={`h-8 w-8 ${config.color} flex-shrink-0`} />
            <div>
              <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
              <p className={`text-xs ${config.color} opacity-80 mt-1`}>{config.desc}</p>
              {request?.admin_notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">Note: {request.admin_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">How verification works</h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Upload an ID Photo", desc: "Take a clear photo of your Aadhaar Card, PAN Card, Voter ID, or Driving License" },
              { step: "2", title: "Our Team Reviews", desc: "We verify your identity within 24-48 hours" },
              { step: "3", title: "Get Verified Badge", desc: "A verified badge appears on your profile, boosting trust" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-saffron text-white text-xs font-bold flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload guidelines */}
        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Photo Guidelines</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {[
              "Photo must be clear and not blurry",
              "All four corners of the ID must be visible",
              "No editing or cropping of the ID",
              "Your face on the ID must be clearly visible",
              "Accepted: Aadhaar, PAN, Voter ID, Driving License, Passport",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload button */}
        {(!currentStatus || currentStatus === "rejected") && !isVerified && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-saffron py-4 text-sm font-bold text-white shadow-glow-primary active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</>
            ) : (
              <><Camera className="h-5 w-5" /> Upload ID Photo</>
            )}
          </button>
        )}

        {/* Previously uploaded photo preview */}
        {request?.id_photo_url && (
          <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Submitted Photo</p>
            <img src={request.id_photo_url} alt="Verification ID" className="w-full rounded-xl object-contain max-h-48 bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyProfile;
