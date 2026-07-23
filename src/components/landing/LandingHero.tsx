/**
 * LandingHero — Animated 3-Phone Hero Landing Page
 *
 * Reads marketing tagline & stat numbers from `landing_content` DB table.
 * Vector-only phone mockups, staggered entrance animations, and social proof count-up.
 */

import React, { useEffect, useState } from 'react';
import PhoneMockup from './PhoneMockup';
import { BadgeCheck, Heart, Sparkles, User, MessageCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LandingContentData {
  tagline_line1: string;
  tagline_line2: string;
  stat_profiles: number;
  stat_matches: number;
  stat_success: number;
  hero_photo_url?: string;
  cta_text: string;
  cta_link: string;
}

const DEFAULT_CONTENT: LandingContentData = {
  tagline_line1: 'Find Your',
  tagline_line2: 'Sacred Bond',
  stat_profiles: 12500,
  stat_matches: 3400,
  stat_success: 890,
  cta_text: 'Begin Your Journey',
  cta_link: '/register',
};

// Count-up hook using requestAnimationFrame
function useCountUp(end: number, duration: number = 2200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<LandingContentData>(DEFAULT_CONTENT);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadContent() {
      const { data } = await supabase
        .from('landing_content' as any)
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (data) {
        setContent({
          tagline_line1: data.tagline_line1 || DEFAULT_CONTENT.tagline_line1,
          tagline_line2: data.tagline_line2 || DEFAULT_CONTENT.tagline_line2,
          stat_profiles: data.stat_profiles || DEFAULT_CONTENT.stat_profiles,
          stat_matches: data.stat_matches || DEFAULT_CONTENT.stat_matches,
          stat_success: data.stat_success || DEFAULT_CONTENT.stat_success,
          hero_photo_url: data.hero_photo_url,
          cta_text: data.cta_text || DEFAULT_CONTENT.cta_text,
          cta_link: data.cta_link || DEFAULT_CONTENT.cta_link,
        });
      }
    }
    loadContent();
  }, []);

  const profilesCount = useCountUp(content.stat_profiles);
  const matchesCount = useCountUp(content.stat_matches);
  const successCount = useCountUp(content.stat_success);

  return (
    <div className="relative w-full overflow-hidden font-sans bg-[#1A0E0E] text-white min-h-screen flex flex-col justify-between">
      {/* Background radial gradient & ambient lights */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2E1010] via-[#1A0E0E] to-[#120808] z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7A2E2E]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#C9A227]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-30 px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {/* Logo SVG lockup */}
          <svg className="w-8 h-8 text-[#C9A227]" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 8L19.5 12.5H12.5L16 8Z" fill="currentColor" />
            <circle cx="16" cy="18" r="4" fill="#7A2E2E" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="font-heading text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-[#FBF6EC] to-[#C9A227] bg-clip-text text-transparent">
            Banjara Bandhan
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate(content.cta_link)}
            className="px-4 py-2 rounded-xl gradient-saffron text-white text-xs font-extrabold shadow-glow-primary hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Headline section */}
      <div className="relative z-10 text-center px-4 pt-4 pb-8 max-w-3xl mx-auto animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/30 text-[#C9A227] text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Premium Matrimony for Banjara Community
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          {content.tagline_line1}{' '}
          <span className="bg-gradient-to-r from-[#C9A227] via-[#E5BF45] to-[#7A2E2E] bg-clip-text text-transparent">
            {content.tagline_line2}
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-xl mx-auto font-medium">
          Trusted matchmaking designed exclusively for our community. Verified profiles, private messaging, and traditional horoscope compatibility.
        </p>
      </div>

      {/* 3-Phone Row */}
      <div className="relative z-20 px-4 py-6 max-w-6xl mx-auto w-full">
        {/* Desktop / Tablet layout: 3 phones side-by-side */}
        <div className="hidden md:flex items-end justify-center gap-6 lg:gap-10">
          {/* Phone 1: Profile Card */}
          <div className="animate-fade-up style-delay-300 transition-transform hover:-translate-y-2 duration-300">
            <PhoneMockup badgeText="Verified Profiles">
              {/* Screen 1 Content */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#1E1212] to-[#120A0A] text-white">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1 text-[#C9A227] font-bold">
                      <BadgeCheck className="w-4 h-4" /> 100% Verified
                    </span>
                    <span>Hyderabad</span>
                  </div>
                  <h3 className="font-heading text-xl font-extrabold text-white">Priya Rathod, 26</h3>
                  <p className="text-xs text-neutral-400 mt-1">Software Engineer · Rathod Gotra</p>
                </div>

                <div className="relative h-64 my-4 rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center border border-white/10">
                  {content.hero_photo_url ? (
                    <img src={content.hero_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-20 h-20 rounded-full gradient-saffron flex items-center justify-center text-2xl font-bold mx-auto mb-2 shadow-glow-primary">
                        PR
                      </div>
                      <p className="text-xs text-neutral-300 font-semibold">Verified Member</p>
                    </div>
                  )}
                  {/* Blur-mask cutout */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-md"
                    style={{
                      maskImage: 'linear-gradient(to bottom, transparent 0%, black 70%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 70%)',
                    }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                    <span>B.Tech, IT</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(content.cta_link)}
                  className="w-full py-3 rounded-xl gradient-saffron text-white text-xs font-extrabold shadow-glow-primary flex items-center justify-center gap-2"
                >
                  Express Interest <Heart className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </PhoneMockup>
          </div>

          {/* Phone 2: Raised Hero Phone - Social Proof / Stats */}
          <div className="animate-fade-up style-delay-500 -mb-6 z-10 transition-transform hover:-translate-y-2 duration-300">
            <PhoneMockup badgeText="Platform Trust">
              {/* Screen 2 Content */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#2A1414] via-[#1A0E0E] to-[#140808] text-white">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A227]">Community Impact</span>
                  <h3 className="font-heading text-lg font-bold text-white mt-1">Our Growing Family</h3>
                </div>

                <div className="space-y-6 my-auto">
                  <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="font-heading text-4xl font-extrabold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                      {profilesCount.toLocaleString()}+
                    </p>
                    <p className="text-xs text-neutral-400 font-medium mt-1">Verified Banjara Profiles</p>
                  </div>

                  <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="font-heading text-4xl font-extrabold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                      {matchesCount.toLocaleString()}+
                    </p>
                    <p className="text-xs text-neutral-400 font-medium mt-1">Matches Made</p>
                  </div>

                  <div className="text-center p-4 rounded-2xl bg-gradient-to-r from-[#7A2E2E]/40 to-[#C9A227]/30 border border-[#C9A227]/40 shadow-glow-primary">
                    <p className="font-heading text-4xl font-extrabold text-[#C9A227]">
                      {successCount.toLocaleString()}+
                    </p>
                    <p className="text-xs text-white font-bold mt-1">Happy Success Stories</p>
                  </div>
                </div>

                <div className="text-center text-[10px] text-neutral-400 font-medium">
                  🔒 100% Privacy Protected & Encrypted
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Phone 3: Chat / Match Moment */}
          <div className="animate-fade-up style-delay-700 transition-transform hover:-translate-y-2 duration-300">
            <PhoneMockup badgeText="Match & Chat">
              {/* Screen 3 Content */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#181016] to-[#0E0A0F] text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold">
                      VR
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Vijay Pawar</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">Online</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    95% Match
                  </span>
                </div>

                {/* Sample Chat Bubbles */}
                <div className="space-y-3 my-4 text-xs">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-neutral-200">
                    Ram Ram! I saw your profile and noticed we share similar family values.
                  </div>
                  <div className="gradient-saffron p-3 rounded-2xl rounded-tr-none max-w-[80%] ml-auto text-white font-medium shadow-soft">
                    Ram Ram Vijay! Thank you. I would love to connect and learn more.
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-neutral-200">
                    Sounds wonderful! Shall we speak over a call?
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-neutral-300">
                  <span>Voice Call Unlocked</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>

        {/* Mobile Layout: Stacked Phone Preview */}
        <div className="md:hidden flex flex-col items-center gap-8 py-4">
          <PhoneMockup badgeText="Verified Banjara Profiles">
            <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#1E1212] to-[#120A0A] text-white">
              <div className="text-center py-6">
                <span className="text-xs font-bold text-[#C9A227] uppercase tracking-widest">Featured Profiles</span>
                <h3 className="font-heading text-xl font-extrabold mt-1">Find Your Life Partner</h3>
                <p className="text-xs text-neutral-400 mt-2">Connecting Banjara families across India with trust & privacy.</p>
              </div>

              <div className="space-y-4 my-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-2xl font-extrabold text-[#C9A227]">{profilesCount.toLocaleString()}+</p>
                    <p className="text-xs text-neutral-300">Active Profiles</p>
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-extrabold text-white">{matchesCount.toLocaleString()}+</p>
                    <p className="text-xs text-neutral-300">Matches Made</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(content.cta_link)}
                className="w-full py-3.5 rounded-xl gradient-saffron text-white text-xs font-extrabold shadow-glow-primary"
              >
                {content.cta_text}
              </button>
            </div>
          </PhoneMockup>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-20 text-center py-8 border-t border-white/10 bg-black/40">
        <button
          onClick={() => navigate(content.cta_link)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-saffron text-white font-heading font-extrabold text-base shadow-glow-primary hover:scale-105 active:scale-95 transition-all"
        >
          {content.cta_text} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LandingHero;
