/**
 * HomeHeader — Animated Hero Section
 *
 * Features:
 * - Animated gradient that shifts from the active theme's heroGradient
 * - Floating orbs with morphing animations
 * - Sparkle particles
 * - Video or image banner mode (set by admin via AdminHeroBanner)
 * - Full theme-awareness via ThemeContext
 */

import { Crown, Sparkles, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";

interface HomeHeaderProps {
  userName: string;
}

const HomeHeader = ({ userName }: HomeHeaderProps) => {
  const { profile } = useAuth();
  const { activeTheme, heroType, heroUrl } = useTheme();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="relative overflow-hidden">
      <div className="relative px-5 pb-10 pt-12 overflow-hidden min-h-[190px]">

        {/* ── Background Layer: Video / Image / Animated Gradient ── */}
        {heroType === 'video' && heroUrl ? (
          <>
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={heroUrl}
              autoPlay
              muted
              loop
              playsInline
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : heroType === 'image' && heroUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroUrl})` }}
            />
            <div className="absolute inset-0 bg-black/35" />
          </>
        ) : (
          /* Animated gradient — uses active theme heroGradient */
          <>
            <motion.div
              className="absolute inset-0"
              style={{
                background: activeTheme.heroGradient,
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%', '0% 0%'],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Floating orb 1 — large */}
            <motion.div
              className="absolute -top-16 -right-16 h-52 w-52 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.15, 0.95, 1.1, 1],
                x: [0, 10, -5, 8, 0],
                y: [0, -8, 5, -12, 0],
                borderRadius: [
                  '60% 40% 30% 70% / 60% 30% 70% 40%',
                  '40% 60% 70% 30% / 40% 60% 30% 70%',
                  '60% 40% 30% 70% / 60% 30% 70% 40%',
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating orb 2 — medium */}
            <motion.div
              className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/8"
              animate={{
                scale: [1, 1.2, 0.9, 1.15, 1],
                x: [0, -8, 5, -10, 0],
                y: [0, 10, -6, 8, 0],
                borderRadius: [
                  '30% 70% 70% 30% / 30% 30% 70% 70%',
                  '60% 40% 30% 70% / 60% 30% 70% 40%',
                  '30% 70% 70% 30% / 30% 30% 70% 70%',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Floating orb 3 — small accent */}
            <motion.div
              className="absolute top-1/3 right-1/4 h-20 w-20 rounded-full bg-white/6"
              animate={{
                scale: [1, 1.3, 0.8, 1.2, 1],
                opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />

            {/* Sparkle particles */}
            {[
              { top: '20%', left: '15%', delay: 0 },
              { top: '60%', left: '75%', delay: 1.5 },
              { top: '35%', left: '88%', delay: 0.8 },
            ].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ top: pos.top, left: pos.left }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1, 0.5],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: pos.delay,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="h-3 w-3 text-white/50" />
              </motion.div>
            ))}
          </>
        )}

        {/* ── Content ── */}
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
                  className="h-11 w-11 rounded-2xl object-cover border-2 border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.2)] cursor-pointer"
                  onClick={() => navigate("/my-profile")}
                />
              ) : (
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-heading font-bold text-sm border border-white/15 cursor-pointer"
                  onClick={() => navigate("/my-profile")}
                >
                  {userName[0]}
                </motion.div>
              )}
              <div>
                <p className="text-[11px] text-white/55 font-medium">{greeting}</p>
                <h2 className="font-heading text-base font-bold text-white leading-tight">{userName} 🙏</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate("/subscription")}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 transition-transform border border-white/10"
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
            <h1
              className="font-display text-[26px] font-bold text-white tracking-tight"
              style={{ lineHeight: '1.1', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
            >
              Banjara Bandhan
            </h1>
            <p className="mt-1.5 text-[11px] text-white/45 tracking-[0.15em] uppercase font-medium">
              Connecting Souls of the Wandering Star
            </p>
          </motion.div>
        </div>
      </div>

      {/* Rounded bottom edge — uses theme background color */}
      <div className="h-6 bg-background -mt-6 rounded-t-[2rem] relative z-10" />
    </header>
  );
};

export default HomeHeader;
