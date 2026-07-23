import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { dbProfileToDisplay } from "@/lib/profileUtils";
import { applyPrivacyFilter, getViewerRelationship, canView } from "@/lib/privacyUtils";
import type { PrivacyMode } from "@/lib/privacyUtils";
import { useMatchStatus } from "@/hooks/useMatchStatus";
import { logEngagementEvent } from "@/lib/engagementLogger";
import { toast } from "sonner";
import { ArrowLeft, Share2, Heart, MessageCircle, Shield, Crown, MapPin, Briefcase, GraduationCap, Ruler, Users, Star, Ban, Flag, Lock, UserX } from "lucide-react";
import ProfilePhotoGallery from "@/components/profile/ProfilePhotoGallery";
import { motion } from "framer-motion";
import MehendiPattern from "@/components/graphics/MehendiPattern";
import ShareModal from "@/components/ShareModal";
import { useGoBack } from "@/hooks/useGoBack";
import GotraWarningBanner from "@/components/GotraWarningBanner";
import { blockUser, reportUser, ReportReason, REPORT_REASONS } from "@/lib/blockReport";

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack("/");
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [rawProfile, setRawProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const viewStartRef = useRef<number>(Date.now());

  // Use the centralized match status hook
  const matchStatus = useMatchStatus(rawProfile?.user_id);
  const isMatched = matchStatus.state === 'matched';
  const interestSent = matchStatus.state === 'interest_sent';
  const interestReceived = matchStatus.state === 'interest_received';

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (data) {
        // Hidden profile: non-owner gets a blocked view (RLS also enforces this server-side)
        const isOwner = user?.id === data.user_id;
        if ((data as any).is_hidden && !isOwner) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setRawProfile(data);

        // Determine viewer relationship and apply privacy filter
        const relationship = getViewerRelationship(
          user?.id,
          data.user_id,
          false, // will be updated once matchStatus loads
          myProfile?.is_verified ?? false
        );
        const privacyMode = (data.privacy_mode as PrivacyMode) || 'public';
        const filtered = applyPrivacyFilter(data, relationship, privacyMode);

        const galleryPhotos = Array.from(
          new Set([filtered.photo_url, ...(filtered.additional_photos || [])].filter(Boolean))
        );
        setProfile({
          ...dbProfileToDisplay(filtered),
          galleryPhotos: galleryPhotos.length > 0 ? galleryPhotos : [filtered.photo_url || "/placeholder.svg"],
          _photo_blurred: filtered._photo_blurred,
          privacyMode,
        });

        // Log profile view event
        logEngagementEvent(user?.id, data.user_id, 'view', { source: 'profile_detail' });
      }
      setLoading(false);
    };
    load();
    viewStartRef.current = Date.now();
  }, [id, user?.id, myProfile?.is_verified]);

  // Re-apply privacy filter when match status changes
  useEffect(() => {
    if (!rawProfile || matchStatus.loading) return;
    const relationship = getViewerRelationship(
      user?.id,
      rawProfile.user_id,
      isMatched,
      myProfile?.is_verified ?? false
    );
    const privacyMode = (rawProfile.privacy_mode as PrivacyMode) || 'public';
    const filtered = applyPrivacyFilter(rawProfile, relationship, privacyMode);
    const galleryPhotos = Array.from(
      new Set([filtered.photo_url, ...(filtered.additional_photos || [])].filter(Boolean))
    );
    setProfile((prev: any) => prev ? {
      ...dbProfileToDisplay(filtered),
      galleryPhotos: galleryPhotos.length > 0 ? galleryPhotos : [filtered.photo_url || "/placeholder.svg"],
      _photo_blurred: filtered._photo_blurred,
      privacyMode,
    } : prev);
  }, [isMatched, matchStatus.loading, rawProfile, user?.id, myProfile?.is_verified]);

  // Log long view (>10 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rawProfile) {
        logEngagementEvent(user?.id, rawProfile.user_id, 'view_long', { source: 'profile_detail', duration_ms: 10000 });
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [rawProfile, user?.id]);

  const handleSendInterest = async () => {
    if (!user || !rawProfile) return;
    const success = await matchStatus.sendInterest();
    if (success) {
      toast.success("Interest sent! 💫");
      logEngagementEvent(user.id, rawProfile.user_id, 'interest_sent', { source: 'profile_detail' });
    } else {
      toast.error("Failed to send interest");
    }
  };

  const handleAcceptInterest = async () => {
    const success = await matchStatus.acceptInterest();
    if (success) {
      toast.success("Interest accepted! You're now matched! 🎉");
      logEngagementEvent(user!.id, rawProfile.user_id, 'accept', { source: 'profile_detail' });
    } else {
      toast.error("Failed to accept interest");
    }
  };

  const handleDeclineInterest = async () => {
    const success = await matchStatus.declineInterest();
    if (success) {
      toast("Interest declined");
      logEngagementEvent(user!.id, rawProfile.user_id, 'reject', { source: 'profile_detail' });
    } else {
      toast.error("Failed to decline interest");
    }
  };

  const handleUnmatch = async () => {
    const success = await matchStatus.unmatch();
    if (success) {
      toast("Unmatched");
    } else {
      toast.error("Failed to unmatch");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${profile?.name} - Banjara Bandhan`,
      text: `Check out ${profile?.name}'s profile on Banjara Bandhan!`,
      url: window.location.href,
    };
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobile && navigator.share) {
        await navigator.share(shareData);
      } else {
        setIsShareModalOpen(true);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setIsShareModalOpen(true);
      }
    }
  };

  const handleBlock = async () => {
    if (!user || !profile) return;
    const ok = await blockUser(user.id, profile.userId);
    if (ok) {
      toast.success("User blocked");
      goBack();
    } else {
      toast.error("Failed to block user");
    }
  };

  const handleReport = async () => {
    if (!user || !profile) return;
    const ok = await reportUser(user.id, profile.userId, "harassment");
    if (ok) {
      toast.success("Report submitted. User blocked.");
      goBack();
    } else {
      toast.error("Failed to submit report");
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

  // Determine which bottom actions to show based on match state
  const renderBottomActions = () => {
    if (matchStatus.loading) return null;

    switch (matchStatus.state) {
      case 'matched':
        return (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUnmatch}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-destructive/30 text-destructive py-3.5 px-4 font-heading text-sm font-bold transition-all hover:bg-destructive/5"
            >
              <UserX className="h-4 w-4" /> Unmatch
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
          </>
        );

      case 'interest_received':
        return (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDeclineInterest}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-destructive/30 text-destructive py-3.5 font-heading text-sm font-bold transition-all hover:bg-destructive/5"
            >
              Decline
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAcceptInterest}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-saffron py-3.5 font-heading text-sm font-bold text-white shadow-glow-primary hover:shadow-premium transition-all"
            >
              <Heart className="h-4 w-4" /> Accept Interest
            </motion.button>
          </>
        );

      case 'interest_sent':
        return (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-muted text-muted-foreground py-3.5 font-heading text-sm font-bold"
            >
              <Heart className="h-4 w-4 fill-current" /> Interest Sent ✓
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-muted py-3.5 font-heading text-sm font-bold text-muted-foreground"
              title="You can message after a mutual match"
            >
              <Lock className="h-4 w-4" />
              <span>Match to Chat</span>
            </motion.button>
          </>
        );

      case 'unmatched':
      case 'declined':
        return (
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-muted text-muted-foreground py-3.5 font-heading text-sm font-bold"
          >
            Not Available
          </motion.button>
        );

      default: // 'none'
        return (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendInterest}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary text-primary py-3.5 font-heading text-sm font-bold transition-all hover:bg-primary/5"
            >
              <Heart className="h-4 w-4" /> Send Interest
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-muted py-3.5 font-heading text-sm font-bold text-muted-foreground"
              title="You can message after a mutual match"
            >
              <Lock className="h-4 w-4" />
              <span>Match to Chat</span>
            </motion.button>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── Photo Hero ── */}
      <div className="relative aspect-[3/4] max-h-[55vh] overflow-hidden">
        <ProfilePhotoGallery
          photos={profile.galleryPhotos || [profile.photo]}
          alt={profile.name}
        />
        {/* Blur overlay for private-mode photos */}
        {profile._photo_blurred && (
          <div className="absolute inset-0 backdrop-blur-xl bg-background/40 flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Photo visible after match</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

        {/* Top actions */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12 z-20">
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
        <div className="absolute bottom-20 left-4 flex gap-2 z-20">
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

        {/* Match status badge */}
        {isMatched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex items-center gap-2 rounded-2xl bg-teal/10 border border-teal/20 p-3"
          >
            <Heart className="h-4 w-4 text-teal fill-current" />
            <span className="text-sm font-semibold text-teal">You're matched! You can now chat and see full contact details.</span>
          </motion.div>
        )}

        {/* Gotra Exogamy Advisory Banner */}
        <div className="mt-3">
          <GotraWarningBanner
            viewerGotra={myProfile?.gotra}
            targetGotra={rawProfile?.gotra}
          />
        </div>

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

      {/* ── Bottom Action Bar — state-machine driven ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="flex gap-3 bg-card/90 backdrop-blur-2xl border-t border-border/30 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)]">
          {renderBottomActions()}
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
