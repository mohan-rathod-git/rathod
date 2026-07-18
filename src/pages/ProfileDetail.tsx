import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { dbProfileToDisplay } from "@/lib/profileUtils";
import { toast } from "sonner";
import { ArrowLeft, Share2, Heart, MessageCircle, Shield, Crown, MapPin, Briefcase, GraduationCap, Ruler, Users, Star, Ban, Flag } from "lucide-react";
import ProfilePhotoGallery from "@/components/profile/ProfilePhotoGallery";
import { motion } from "framer-motion";
import MehendiPattern from "@/components/graphics/MehendiPattern";
import ShareModal from "@/components/ShareModal";
import { useGoBack } from "@/hooks/useGoBack";

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack("/");
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
    
    // Check if running on desktop or if native share isn't supported
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobile && navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to modal for desktop
        setIsShareModalOpen(true);
      }
    } catch (error: any) {
      // AbortError is thrown when user cancels the share dialog, ignore it
      if (error.name !== 'AbortError') {
        setIsShareModalOpen(true);
      }
    }
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
      goBack();
    }
  };

  const handleReport = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("reports" as any).insert({
      reporter_id: user.id,
      reported_id: profile.userId,
      reason: "Inappropriate content or behavior",
    });
    if (error) {
      toast.error("Failed to submit report");
    } else {
      toast.success("User reported to admins");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <span className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin block" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <span className="h-10 w-10 rounded-full border-3 border-primary block" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <button onClick={goBack} className="text-primary text-sm font-semibold hover:underline underline-offset-4">Go Back</button>
      </div>
    );
  }

  const infoItems = [
    { icon: MapPin, label: "Location", value: profile.location },
    { icon: Briefcase, label: "Work", value: profile.occupation },
    { icon: GraduationCap, label: "Education", value: profile.education },
    { icon: Ruler, label: "Height", value: profile.height || "—" },
    { icon: Users, label: "Community", value: profile.community },
    { icon: Star, label: "Gotra", value: profile.gotra || "—" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── Photo Hero ── */}
      <div className="relative aspect-[3/4] max-h-[55vh] overflow-hidden">
        <ProfilePhotoGallery photos={profile.galleryPhotos || [profile.photo]} alt={profile.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

        {/* Top actions */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-md border border-white/10"
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleBlock}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-md border border-white/10"
            >
              <Ban className="h-5 w-5 text-destructive" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleReport}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/80 shadow-soft backdrop-blur-md border border-white/10"
            >
              <Flag className="h-5 w-5 text-orange-500" />
            </motion.button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-20 left-4 flex gap-2">
          {profile.isPremium && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 rounded-xl bg-accent/90 px-3 py-1.5 text-xs font-bold text-accent-foreground backdrop-blur-sm shadow-md"
            >
              <Crown className="h-3.5 w-3.5" /> Premium
            </motion.span>
          )}
          {profile.isVerified && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1 rounded-xl bg-teal/90 px-3 py-1.5 text-xs font-bold text-teal-foreground backdrop-blur-sm shadow-md"
            >
              <Shield className="h-3.5 w-3.5" /> Verified
            </motion.span>
          )}
        </div>
      </div>

      {/* ── Profile Content ── */}
      <div className="relative -mt-8 rounded-t-[2.5rem] bg-background px-5 pt-7">
        {/* Top pill */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border mt-3" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground" style={{ lineHeight: "1.15" }}>{profile.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.age} years · {profile.maritalStatus}</p>
            </div>
            {profile.isOnline && (
              <span className="mt-1 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            )}
          </div>
        </motion.div>

        {/* Info grid with stagger */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {infoItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-card p-3.5 shadow-soft border border-border/20 hover:shadow-medium hover:border-primary/10 transition-all group"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                  <item.icon className="h-3 w-3 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </motion.div>
          ))}
        </div>

        {profile.about && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6"
          >
            <h3 className="font-heading text-sm font-bold text-foreground mb-2">About</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
          </motion.div>
        )}

        {(profile.rashi || profile.manglik || profile.income) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 relative"
          >
            {/* Decorative mehendi on horoscope section */}
            <div className="absolute -top-2 -right-2 pointer-events-none opacity-30">
              <MehendiPattern
                variant="corner-tl"
                color="hsl(var(--primary))"
                opacity={0.06}
                className="w-[80px] h-[80px] transform scale-x-[-1]"
                animate={false}
              />
            </div>

            <h3 className="font-heading text-sm font-bold text-foreground mb-3">Horoscope & Details</h3>
            <div className="flex gap-2.5">
              {profile.rashi && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center hover:border-primary/20 transition-colors">
                  <p className="text-[10px] text-muted-foreground font-medium">Rashi</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.rashi}</p>
                </div>
              )}
              {profile.manglik && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center hover:border-primary/20 transition-colors">
                  <p className="text-[10px] text-muted-foreground font-medium">Manglik</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.manglik}</p>
                </div>
              )}
              {profile.income && (
                <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-3.5 text-center hover:border-primary/20 transition-colors">
                  <p className="text-[10px] text-muted-foreground font-medium">Income</p>
                  <p className="font-heading font-bold text-sm text-foreground mt-1">{profile.income}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="flex gap-3 bg-card/90 backdrop-blur-2xl border-t border-border/30 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)]">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSendInterest}
            disabled={alreadySent || sending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3.5 font-heading text-sm font-bold transition-all ${
              alreadySent ? "border-muted text-muted-foreground" : "border-primary text-primary hover:bg-primary/5"
            }`}
          >
            <Heart className={`h-4 w-4 ${alreadySent ? "fill-current" : ""}`} /> {alreadySent ? "Sent ✓" : sending ? "Sending..." : "Interest"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/chat/${profile.userId}`)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-saffron py-3.5 font-heading text-sm font-bold text-white shadow-glow-primary hover:shadow-premium transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 animate-shimmer" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", backgroundSize: "200% 100%" }} />
            </div>
            <MessageCircle className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Message</span>
          </motion.button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={window.location.href}
        title={`${profile?.name} - Banjara Bandhan`}
        text={`Check out ${profile?.name}'s profile on Banjara Bandhan!`}
      />
    </div>
  );
};

export default ProfileDetail;
