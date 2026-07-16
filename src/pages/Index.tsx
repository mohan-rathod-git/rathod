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

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className="min-h-screen bg-background pb-20 overflow-y-auto">
      <PullIndicator />
      <HomeHeader userName={userName} />

      {loading ? (
        <HomePageSkeleton />
      ) : (
        <div className="mx-auto max-w-md px-4 -mt-1 relative z-10 space-y-6">
          <div className="animate-fade-up-1">
            <SearchBar onFilterClick={() => setFilterOpen(true)} value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="animate-fade-up-2 grid grid-cols-3 gap-2.5">
            {[
              { icon: TrendingUp, label: "Profiles", value: String(profiles.length), color: "text-primary", onClick: () => navigate("/explore") },
              { icon: Heart, label: "Matches", value: String(profiles.length > 5 ? '12+' : '0'), color: "text-secondary", onClick: () => navigate("/matches") },
              { icon: Eye, label: "Views", value: "—", color: "text-accent", onClick: () => {} },
            ].map((stat) => (
              <div 
                key={stat.label} 
                onClick={stat.onClick}
                className="rounded-2xl bg-card p-3.5 text-center shadow-soft border border-border/50 hover:shadow-medium hover:border-primary/20 transition-all active:scale-95 cursor-pointer"
              >
                <stat.icon className={`mx-auto h-4 w-4 ${stat.color} mb-1.5`} />
                <p className="font-heading text-xl font-extrabold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <SectionDivider />

          <section className="animate-fade-up-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-heading text-base font-bold text-foreground">Today's Picks</h3>
              </div>
              <button onClick={() => navigate("/explore")} className="flex items-center gap-0.5 text-xs font-semibold text-primary active:scale-95 transition-transform">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {displayProfiles.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center shadow-soft border border-border/50">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No profiles yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to join!</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                {displayProfiles.slice(0, 10).map((p, i) => (
                  <PremiumProfileCard key={p.id} profile={p} index={i} variant="carousel" />
                ))}
              </div>
            )}
          </section>

          <SectionDivider />

          <section className="animate-fade-up-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-foreground">Recently Joined</h3>
              <button onClick={() => navigate("/explore")} className="flex items-center gap-0.5 text-xs font-semibold text-primary active:scale-95 transition-transform">
                See All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {displayProfiles.slice(0, 4).map((p, i) => (
                <PremiumProfileCard key={p.id} profile={p} index={i} variant="list" />
              ))}
            </div>
          </section>

          <SectionDivider />

          <section className="animate-fade-up-5">
            <h3 className="mb-3 font-heading text-base font-bold text-foreground">Success Stories</h3>
            <SuccessStoryBanner />
          </section>

          <div className="h-4" />
        </div>
      )}

      <BottomNav />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={setFilters} />
    </div>
  );
};

export default Index;
