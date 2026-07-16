import { Bell, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HomeHeaderProps {
  userName: string;
}

const HomeHeader = ({ userName }: HomeHeaderProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="relative overflow-hidden">
      <div className="gradient-saffron px-5 pb-8 pt-12 relative">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 animate-fade-up">
            <div className="flex items-center gap-3">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="h-10 w-10 rounded-2xl object-cover border-2 border-white/20" />
              ) : (
                <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center text-white font-heading font-bold text-sm">
                  {userName[0]}
                </div>
              )}
              <div>
                <p className="text-xs text-white/60">{greeting}</p>
                <h2 className="font-heading text-base font-bold text-white leading-tight">{userName} 🙏</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/settings")} className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm active:scale-95 transition-transform">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">3</span>
              </button>
              <button onClick={() => navigate("/subscription")} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/90 text-accent-foreground backdrop-blur-sm active:scale-95 transition-transform">
                <Crown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Brand */}
          <div className="animate-fade-up-1">
            <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight" style={{ lineHeight: "1.1" }}>
              Banjara Bandhan
            </h1>
            <p className="mt-1.5 text-xs text-white/50 tracking-wider uppercase">
              Connecting Souls of the Wandering Star
            </p>
          </div>
        </div>
      </div>
      {/* Rounded bottom edge */}
      <div className="h-5 bg-background -mt-5 rounded-t-[1.5rem] relative z-10" />
    </header>
  );
};

export default HomeHeader;
