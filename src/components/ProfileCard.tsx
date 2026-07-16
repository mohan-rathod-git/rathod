import { Heart, Shield, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Profile } from "@/types";

interface ProfileCardProps {
  profile: Profile;
  compact?: boolean;
  delay?: number;
}

const ProfileCard = ({ profile, compact = false, delay = 0 }: ProfileCardProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/profile/${profile.id}`)}
        className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md active:scale-[0.98] w-full text-left"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="relative h-14 w-14 flex-shrink-0">
          <img src={profile.photo} alt={profile.name} className="h-full w-full rounded-xl object-cover" />
          {profile.isOnline && (
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate font-heading text-sm font-semibold text-foreground">{profile.name}</h4>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 flex-shrink-0 text-teal" />}
          </div>
          <p className="text-xs text-muted-foreground">{profile.age} yrs • {profile.location.split(",")[0]}</p>
          <p className="text-xs text-muted-foreground">{profile.occupation}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 active:scale-95"
        >
          <Heart className="h-4 w-4" />
        </button>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/profile/${profile.id}`)}
      className="group relative w-44 flex-shrink-0 overflow-hidden rounded-2xl bg-card shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {profile.isPremium && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground backdrop-blur-sm">
            <Crown className="h-3 w-3" /> Premium
          </span>
        )}
        {profile.isOnline && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">
            Online
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1">
            <h3 className="truncate font-heading text-sm font-bold text-primary-foreground">{profile.name}</h3>
            {profile.isVerified && <Shield className="h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />}
          </div>
          <p className="text-xs text-primary-foreground/80">{profile.age} • {profile.location.split(",")[0]}</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-2.5">
        <span className="text-[11px] text-muted-foreground">{profile.community}</span>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
    </button>
  );
};

export default ProfileCard;
