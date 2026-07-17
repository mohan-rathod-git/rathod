import { useState, useCallback } from "react";
import HomeHeader from "@/components/HomeHeader";
import SearchBar from "@/components/SearchBar";
import SectionDivider from "@/components/SectionDivider";
import SuccessStoryBanner from "@/components/SuccessStoryBanner";
import FilterModal from "@/components/FilterModal";
import type { FilterState } from "@/components/FilterModal";
import BottomNav from "@/components/BottomNav";
import PremiumProfileCard from "@/components/PremiumProfileCard";
import { ChevronRight, Sparkles, Heart, TrendingUp, Users, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeProfiles } from "@/hooks/useRealtime";
import { dbProfileToDisplay } from "@/lib/profileUtils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { HomePageSkeleton } from "@/components/SkeletonLoaders";
import { motion } from "framer-motion";
import EmptyStateGraphic from "@/components/graphics/EmptyStateGraphic";

const Index = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { profiles, loading } = useRealtimeProfiles();

  const userName = profile?.full_name?.split(" ")[0] || "There";

  const applyFilters = (list: any[]) => {
    let result = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.gotra || "").toLowerCase().includes(q) ||
        (p.city_village || "").toLowerCase().includes(q) ||
        (p.state || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q)
      );
    }
    if (!filters) return result;
    return result.filter((p) => {
      if (filters.community && p.community !== filters.community) return false;
      if (filters.state && p.state !== filters.state) return false;
      if (filters.gotra && p.gotra !== filters.gotra) return false;
      if (filters.education && p.education !== filters.education) return false;
      if (filters.maritalStatus && p.marital_status !== filters.maritalStatus) return false;
      if (p.date_of_birth) {
        const age = Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31557600000);
        if (age < filters.ageMin || age > filters.ageMax) return false;
      }
      return true;
    });
  };

  const displayProfiles = applyFilters(profiles.filter((p) => p.user_id !== user?.id)).map(dbProfileToDisplay);

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 1200));
  }, []);

  const { containerRef, onTouchStart, onTouchMove, onTouchEnd, PullIndicator } = usePullToRefresh(handleRefresh);

  const stats = [
    { icon: TrendingUp, label: "Profiles", value: String(profiles.length), color: "text-primary", bgColor: "bg-primary/8", onClick: () => navigate("/explore") },
    { icon: Heart, label: "Matches", value: String(profiles.length > 5 ? '12+' : '0'), color: "text-secondary", bgColor: "bg-secondary/8", onClick: () => navigate("/matches") },
    { icon: Eye, label: "Views", value: "—", color: "text-accent", bgColor: "bg-accent/8", onClick: () => {} },
  ];

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className="min-h-screen bg-background pb-20 overflow-y-auto">
      <PullIndicator />
      <HomeHeader userName={userName} />

      {loading ? (
        <HomePageSkeleton />
      ) : (
        <div className="mx-auto max-w-md px-4 -mt-1 relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <SearchBar onFilterClick={() => setFilterOpen(true)} value={searchQuery} onChange={setSearchQuery} />
          </motion.div>

          {/* Stats grid with enhanced cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                whileTap={{ scale: 0.93 }}
                onClick={stat.onClick}
                className="rounded-2xl bg-card p-3.5 text-center shadow-soft border border-border/30 hover:shadow-medium hover:border-primary/15 transition-all cursor-pointer group"
              >
                <div className={`mx-auto h-8 w-8 rounded-xl ${stat.bgColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="font-heading text-xl font-extrabold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <SectionDivider />

          {/* Today's Picks */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">Today's Picks</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/explore")}
                className="flex items-center gap-0.5 text-xs font-semibold text-primary transition-transform"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            </div>
            {displayProfiles.length === 0 ? (
              <EmptyStateGraphic
                variant="no-profiles"
                title="No profiles yet"
                subtitle="Be among the first to join our growing community!"
                action={{ label: "Complete Profile", onClick: () => navigate("/edit-profile") }}
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                {displayProfiles.slice(0, 10).map((p, i) => (
                  <PremiumProfileCard key={p.id} profile={p} index={i} variant="carousel" />
                ))}
              </div>
            )}
          </motion.section>

          <SectionDivider />

          {/* Recently Joined */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-foreground">Recently Joined</h3>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/explore")}
                className="flex items-center gap-0.5 text-xs font-semibold text-primary transition-transform"
              >
                See All <ChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            </div>
            <div className="space-y-2.5">
              {displayProfiles.slice(0, 4).map((p, i) => (
                <PremiumProfileCard key={p.id} profile={p} index={i} variant="list" />
              ))}
            </div>
          </motion.section>

          <SectionDivider />

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="mb-3 font-heading text-base font-bold text-foreground">Success Stories</h3>
            <SuccessStoryBanner />
          </motion.section>

          <div className="h-4" />
        </div>
      )}

      <BottomNav />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={setFilters} />
    </div>
  );
};

export default Index;
