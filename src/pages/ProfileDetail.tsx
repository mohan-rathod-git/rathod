import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { dbProfileToDisplay } from "@/lib/profileUtils";
import { toast } from "sonner";
import { ArrowLeft, Share2, Heart, MessageCircle, Shield, Crown, MapPin, Briefcase, GraduationCap, Ruler, Users, Star, Ban } from "lucide-react";
import ProfilePhotoGallery from "@/components/profile/ProfilePhotoGallery";

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (data) {
        const galleryPhotos = Array.from(new Set([data.photo_url, ...(data.additional_photos || [])].filter(Boolean)));
        setProfile({
          ...dbProfileToDisplay(data),
          galleryPhotos: galleryPhotos.length > 0 ? galleryPhotos : [data.photo_url || "/placeholder.svg"],
        });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!user || !profile) return;
    supabase.from("interests").select("id").eq("sender_id", user.id).eq("receiver_id", profile.userId)
      .then(({ data }) => { if (data && data.length > 0) setAlreadySent(true); });
  }, [user, profile]);

  const handleSendInterest = async () => {
    if (!user || !profile) return;
    setSending(true);
    const { error } = await supabase.from("interests").insert({ sender_id: user.id, receiver_id: profile.userId });
    setSending(false);
    if (error) {
      if (error.code === "23505") {
        setAlreadySent(true);
        toast("Interest already sent");
      } else {
        toast.error("Failed to send interest");
      }
      return;
    }
    setAlreadySent(true);
    toast.success("Interest sent! 💫");
  };

  const handleShare = async () => {
    const shareData = {
      title: `${profile?.name} - Banjara Bandhan`,
      text: `Check out ${profile?.name}'s profile on Banjara Bandhan!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Profile link copied!");
      }
    } catch {}
  };

  const handleBlock = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("blocked_users" as any).insert({
      blocker_id: user.id,
      blocked_id: profile.userId,
    });
    if (error) {
      toast.error("Failed to block user");
    } else {
      toast.success("User blocked");
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-semibold hover:underline underline-offset-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="relative aspect-[3/4] max-h-[55vh] overflow-hidden">
        <ProfilePhotoGallery photos={profile.galleryPhotos || [profile.photo]} alt={profile.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-sm active:scale-95 transition-transform">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-sm active:scale-95 transition-transform">
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
            <button onClick={handleBlock} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-sm active:scale-95 transition-transform">
              <Ban className="h-5 w-5 text-destructive" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-20 left-4 flex gap-2">
          {profile.isPremium && (
            <span className="flex items-center gap-1 rounded-xl bg-accent/90 px-3 py-1.5 text-xs font-bold text-accent-foreground backdrop-blur-sm">
              <Crown className="h-3.5 w-3.5" /> Premium
            </span>
          )}
          {profile.isVerified && (
            <span className="flex items-center gap-1 rounded-xl bg-teal/90 px-3 py-1.5 text-xs font-bold text-teal-foreground backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="relative -mt-8 rounded-t-[2rem] bg-background px-5 pt-7">
        <div className="animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-foreground" style={{ lineHeight: "1.15" }}>{profile.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.age} years · {profile.maritalStatus}</p>
            </div>
            {profile.isOnline && (
              <span className="mt-1 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 animate-fade-up-1">
          {[
            { icon: MapPin, label: "Location", value: profile.location },
            { icon: Briefcase, label: "Work", value: profile.occupation },
            { icon: GraduationCap, label: "Education", value: profile.education },
            { icon: Ruler, label: "Height", value: profile.height || "—" },
            { icon: Users, label: "Community", value: profile.community },
            { icon: Star, label: "Gotra", value: profile.gotra || "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-card p-3.5 shadow-soft">
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {profile.about && (
          <div className="mt-6 animate-fade-up-2">
            <h3 className="font-heading text-sm font-bold text-foreground mb-2">About</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
          </div>
        )}

        {(profile.rashi || profile.manglik || profile.income) && (
          <div className="mt-6 animate-fade-up-3">
            <h3 className="font-heading text-sm font-bold text-foreground mb-3">Horoscope</h3>
            <div className="flex gap-2.5">
              {profile.rashi && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Rashi</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.rashi}</p>
                </div>
              )}
              {profile.manglik && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Manglik</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.manglik}</p>
                </div>
              )}
              {profile.income && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Income</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.income}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 bg-card/90 backdrop-blur-xl border-t border-border/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button onClick={handleSendInterest} disabled={alreadySent || sending}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3.5 font-heading text-sm font-bold transition-all active:scale-[0.97] ${
            alreadySent ? "border-muted text-muted-foreground" : "border-primary text-primary"
          }`}>
          <Heart className={`h-4 w-4 ${alreadySent ? "fill-current" : ""}`} /> {alreadySent ? "Sent ✓" : sending ? "Sending..." : "Interest"}
        </button>
        <button onClick={() => navigate(`/chat/${profile.userId}`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-saffron py-3.5 font-heading text-sm font-bold text-white shadow-glow-primary active:scale-[0.97] transition-transform">
          <MessageCircle className="h-4 w-4" /> Message
        </button>
      </div>
    </div>
  );
};

export default ProfileDetail;
