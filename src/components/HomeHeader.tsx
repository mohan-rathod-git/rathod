import { Bell, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MehendiPattern from "@/components/graphics/MehendiPattern";

interface HomeHeaderProps {
  userName: string;
}

const HomeHeader = ({ userName }: HomeHeaderProps) => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch actual unread notification count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      // Count unread messages
      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      // Count pending interests
      const { count: interestCount } = await supabase
        .from("interests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      setUnreadCount((msgCount || 0) + (interestCount || 0));
    };
    fetchUnread();

    // Refresh on realtime changes
    const channel = supabase
      .channel("header-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="relative overflow-hidden">
      <div className="relative px-5 pb-10 pt-12 overflow-hidden">
        {/* Animated premium gradient */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: "linear-gradient(145deg, hsl(14 80% 52%) 0%, hsl(355 50% 32%) 40%, hsl(14 80% 52%) 70%, hsl(38 75% 55%) 100%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/5 animate-morph" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5" />

        {/* Subtle mehendi corner */}
        <div className="absolute top-0 right-0 pointer-events-none opacity-60">
          <MehendiPattern
            variant="corner-tl"
            color="white"
            opacity={0.06}
            className="w-[180px] h-[180px] transform scale-x-[-1]"
            animate={false}
          />
        </div>

        {/* Floating sparkle */}
        <motion.div
          className="absolute top-16 right-[20%]"
          animate={{ y: [-2, 3, -2], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300/40" />
        </motion.div>

        <div className="relative z-10">
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              {profile?.photo_url ? (
                <motion.img
                  whileTap={{ scale: 0.92 }}
                  src={profile.photo_url}
                  alt=""
                  className="h-11 w-11 rounded-2xl object-cover border-2 border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-pointer"
                  onClick={() => navigate("/my-profile")}
                />
              ) : (
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-heading font-bold text-sm border border-white/10 cursor-pointer"
                  onClick={() => navigate("/my-profile")}
                >
                  {userName[0]}
                </motion.div>
              )}
              <div>
                <p className="text-[11px] text-white/50 font-medium">{greeting}</p>
                <h2 className="font-heading text-base font-bold text-white leading-tight">{userName} 🙏</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate("/notification-preferences")}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm border border-white/8 transition-all hover:bg-white/15"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground shadow-md px-0.5"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate("/subscription")}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/90 text-accent-foreground backdrop-blur-sm shadow-glow-gold active:scale-95 transition-transform border border-accent/30"
              >
                <Crown className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h1 className="font-display text-[26px] font-bold text-white tracking-tight" style={{ lineHeight: "1.1" }}>
              Banjara Bandhan
            </h1>
            <p className="mt-1.5 text-[11px] text-white/40 tracking-[0.15em] uppercase font-medium">
              Connecting Souls of the Wandering Star
            </p>
          </motion.div>
        </div>
      </div>
      {/* Rounded bottom edge */}
      <div className="h-6 bg-background -mt-6 rounded-t-[2rem] relative z-10" />
    </header>
  );
};

export default HomeHeader;
