import { Heart, Shield, Crown, Star, MapPin, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import type { Profile } from "@/types";
import { logEngagementEvent } from "@/lib/engagementLogger";

interface PremiumProfileCardProps {
  profile: Profile;
  index?: number;
  variant?: "carousel" | "grid" | "list";
}

const PremiumProfileCard = ({ profile, index = 0, variant = "carousel" }: PremiumProfileCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [sending, setSending] = useState(false);
  const matchScore = 75 + ((index * 7) % 25);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || liked || sending) return;
    setSending(true);
    const { error } = await supabase.from("interests").insert({
      sender_id: user.id,
      receiver_id: profile.userId,
    });
    setSending(false);
    if (error) {
      if (error.code === "23505") {
        setLiked(true);
        toast("Interest already sent");
      } else {
        toast.error("Failed to send interest");
      }
      return;
    }
    setLiked(true);
    toast.success("Interest sent! 💕");
    logEngagementEvent(user.id, profile.userId, 'interest_sent', { source: `card_${variant}` });
  };

  if (variant === "list") {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => {
          logEngagementEvent(user?.id, profile.userId, 'profile_click', { source: 'list_card', position: index });
          navigate(`/profile/${profile.id}`);
        }}
        className="flex items-center gap-4 rounded-3xl bg-card p-3.5 shadow-soft border border-border/30 w-full text-left active:scale-[0.98] hover:shadow-elevated transition-all duration-300 group"
      >
        <div className="relative">
          <div className="h-[68px] w-[68px] rounded-2xl overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </div>
          {profile.isOnline && (
            <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-[2.5px] border-card bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          )}
          {profile.isPremium && (
            <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-md">
              <Crown className="h-3 w-3 text-accent-foreground" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate font-heading text-[15px] font-bold text-foreground">{profile.name}</h4>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 text-teal flex-shrink-0" />}
            <span className="ml-auto flex items-center gap-0.5 rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent">
              <Star className="h-2.5 w-2.5 fill-accent" />{matchScore}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{profile.age} yrs</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
              <MapPin className="h-2.5 w-2.5" />{profile.location.split(",")[0]}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Briefcase className="h-2.5 w-2.5 text-muted-foreground/60" />
            <span className="text-[11px] text-muted-foreground/70 truncate">{profile.occupation || profile.community}</span>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
            liked ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          }`}
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </motion.div>
      </motion.button>
    );
  }

  const isCarousel = variant === "carousel";

  return (
    <motion.button
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        logEngagementEvent(user?.id, profile.userId, 'profile_click', { source: `${variant}_card`, position: index });
        navigate(`/profile/${profile.id}`);
      }}
      className={`group relative overflow-hidden rounded-3xl bg-card shadow-soft hover:shadow-elevated text-left active:scale-[0.96] transition-all duration-300 ${isCarousel ? "w-[170px] flex-shrink-0" : "w-full"}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          {profile.isPremium ? (
            <span className="flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-1 text-[9px] font-bold text-accent-foreground shadow-lg backdrop-blur-sm">
              <Crown className="h-2.5 w-2.5" /> PRO
            </span>
          ) : <span />}
          {profile.isOnline && (
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)] border-2 border-white/30" />
          )}
        </div>
        <div className="absolute right-2.5 bottom-[4.5rem] flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-xl px-2.5 py-1 border border-white/10">
          <Star className="h-3 w-3 text-accent fill-accent" />
          <span className="text-[10px] font-bold text-white tabular-nums">{matchScore}%</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-heading text-[15px] font-bold text-white drop-shadow-md">{profile.name}</h3>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0 drop-shadow-md" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-white/80">{profile.age}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/40" />
            <span className="text-[11px] text-white/70 truncate flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{profile.location.split(",")[0]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground font-medium truncate block">{profile.community}</span>
          {profile.occupation && (
            <span className="text-[9px] text-muted-foreground/60 truncate block">{profile.occupation}</span>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.2, rotate: -10 }}
          whileTap={{ scale: 0.85 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
            liked ? "bg-primary text-primary-foreground shadow-glow-primary" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow-primary"
          }`}
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </motion.div>
      </div>
    </motion.button>
  );
};

export default PremiumProfileCard;
