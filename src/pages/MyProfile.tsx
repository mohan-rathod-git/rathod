import { useState, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { Camera, ChevronRight, Crown, Eye, Heart, LogOut, Settings, Users, Star, BookOpen, Loader2, Pencil, Share2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateProfileCompletion } from "@/lib/profileUtils";

const MyProfile = () => {
  const navigate = useNavigate();
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name || "Your Name";
  const community = profile?.community || "Banjara";
  const gotra = profile?.gotra || "";
  const completion = profile ? calculateProfileCompletion(profile) : 0;
  const galleryPhotos: string[] = profile?.additional_photos || [];

  const handleLogout = async () => { await signOut(); navigate("/login", { replace: true }); };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ photo_url: publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    setAvatarUploading(false);
    toast.success("Photo updated!");
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;

    const remainingSlots = Math.max(0, 6 - galleryPhotos.length);
    if (remainingSlots === 0) {
      toast.error("You can upload up to 6 gallery photos");
      e.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each photo must be under 5MB");
      e.target.value = "";
      return;
    }

    setGalleryUploading(true);

    try {
      const uploadedUrls = await Promise.all(selectedFiles.map(async (file, index) => {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/gallery/${Date.now()}-${index}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, file);
        if (error) throw error;
        return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }));

      const nextPhotos = [...galleryPhotos, ...uploadedUrls].slice(0, 6);
      const { error } = await supabase.from("profiles").update({ additional_photos: nextPhotos }).eq("user_id", user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""} added`);
    } catch {
      toast.error("Gallery upload failed");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryPhoto = async (photoToRemove: string) => {
    if (!user) return;

    const nextPhotos = galleryPhotos.filter((photo) => photo !== photoToRemove);
    const { error } = await supabase.from("profiles").update({ additional_photos: nextPhotos }).eq("user_id", user.id);

    if (error) {
      toast.error("Couldn't remove photo");
      return;
    }

    await refreshProfile();
    toast.success("Photo removed");
  };

  const handleShare = async () => {
    const shareData = {
      title: `${displayName} - Banjara Bandhan`,
      text: `Check out ${displayName}'s profile on Banjara Bandhan!`,
      url: `${window.location.origin}/profile/${profile?.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Profile link copied!");
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input type="file" ref={galleryRef} accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />

      <div className="gradient-saffron relative h-32 overflow-hidden">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/5" />
        <button onClick={handleShare} className="absolute top-12 right-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm active:scale-95 transition-transform">
          <Share2 className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="mx-auto max-w-md px-5">
        <div className="relative -mt-14 flex justify-center mb-4">
          <div className="relative animate-fade-up">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={displayName} className="h-28 w-28 rounded-3xl border-4 border-card shadow-elevated object-cover" />
            ) : (
              <div className="h-28 w-28 rounded-3xl border-4 border-card bg-card shadow-elevated flex items-center justify-center text-3xl font-heading font-extrabold text-primary">
                {displayName[0]}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl gradient-saffron text-white shadow-glow-primary active:scale-90 transition-transform">
              {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="text-center animate-fade-up-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="font-heading text-xl font-extrabold text-foreground">{displayName}</h1>
            {profile?.is_verified && <ShieldCheck className="h-5 w-5 text-emerald-500" />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{community}{gotra ? ` · ${gotra}` : ""}</p>
        </div>

        {!profile?.is_verified && (
          <button onClick={() => navigate("/verify-profile")} className="w-full mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform animate-fade-up-1">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-emerald-700">Verify Your Profile</p>
              <p className="text-[10px] text-emerald-600/70">Upload an ID to get a verified badge</p>
            </div>
            <ChevronRight className="h-4 w-4 text-emerald-600" />
          </button>
        )}

        <div className="mt-5 rounded-2xl bg-card p-4 shadow-soft animate-fade-up-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">
              {completion === 100 ? "✅ Profile Complete!" : `Profile ${completion}% complete`}
            </span>
            <button onClick={() => navigate("/edit-profile")} className="text-[10px] text-primary font-bold flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${completion === 100 ? "bg-teal" : "gradient-saffron"}`} style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5 animate-fade-up-3">
          {[
            { icon: Eye, label: "Views", value: "—" },
            { icon: Heart, label: "Interests", value: "—" },
            { icon: Users, label: "Matches", value: "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-3.5 text-center shadow-soft">
              <s.icon className="mx-auto h-4 w-4 text-primary mb-1.5" />
              <p className="font-heading text-lg font-extrabold text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/subscription")} className="w-full mt-5 rounded-2xl gradient-gold p-4 text-left shadow-soft active:scale-[0.98] transition-transform animate-fade-up-3">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-accent-foreground" />
            <h3 className="font-heading text-sm font-bold text-accent-foreground">Go Premium</h3>
          </div>
          <p className="text-xs text-accent-foreground/70">3x more views & unlimited messaging</p>
        </button>

        <section className="mt-5 rounded-2xl bg-card p-4 shadow-soft animate-fade-up-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-sm font-bold text-foreground">Photo Gallery</h2>
              <p className="text-xs text-muted-foreground">Add up to 6 extra photos for your profile</p>
            </div>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={galleryUploading}
              className="rounded-xl gradient-saffron px-3 py-2 text-xs font-bold text-white shadow-glow-primary active:scale-95 transition-transform disabled:opacity-60"
            >
              {galleryUploading ? "Uploading..." : "Add Photos"}
            </button>
          </div>

          {galleryPhotos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No gallery photos yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                  <img src={photo} alt={`${displayName} gallery ${index + 1}`} className="aspect-[3/4] h-full w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryPhoto(photo)}
                    className="absolute right-2 top-2 rounded-lg bg-card/85 px-2 py-1 text-[10px] font-semibold text-foreground shadow-soft backdrop-blur-sm active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-5 rounded-2xl bg-card shadow-soft overflow-hidden divide-y divide-border/50 animate-fade-up-5">
          {[
            { icon: Star, label: "Horoscope Matching", path: "/horoscope" },
            { icon: BookOpen, label: "Success Stories", path: "/success-stories" },
            { icon: Settings, label: "Settings", path: "/settings" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-foreground active:bg-muted/30 transition-colors">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl mt-4 py-3.5 text-destructive bg-destructive/5 active:scale-[0.98] transition-transform animate-fade-up-5">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyProfile;
