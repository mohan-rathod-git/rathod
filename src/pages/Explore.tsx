import { useState, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import FilterModal from "@/components/FilterModal";
import type { FilterState } from "@/components/FilterModal";
import BottomNav from "@/components/BottomNav";
import PremiumProfileCard from "@/components/PremiumProfileCard";
import { ArrowLeft, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COMMUNITIES } from "@/types";
import { useRealtimeProfiles } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { dbProfileToDisplay } from "@/lib/profileUtils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ExplorePageSkeleton } from "@/components/SkeletonLoaders";

const Explore = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeChip, setActiveChip] = useState("All");
  const [advancedFilters, setAdvancedFilters] = useState<FilterState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { profiles, loading } = useRealtimeProfiles();
  const { user } = useAuth();

  const chips = ["All", ...COMMUNITIES];

  const filtered = profiles
    .filter((p) => p.user_id !== user?.id)
    .filter((p) => activeChip === "All" || p.community === activeChip)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.gotra || "").toLowerCase().includes(q) ||
        (p.city_village || "").toLowerCase().includes(q) ||
        (p.state || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q) ||
        (p.occupation || "").toLowerCase().includes(q) ||
        (p.education || "").toLowerCase().includes(q)
      );
    })
    .filter((p) => {
      if (!advancedFilters) return true;
      if (advancedFilters.community && p.community !== advancedFilters.community) return false;
      if (advancedFilters.state && p.state !== advancedFilters.state) return false;
      if (advancedFilters.gotra && p.gotra !== advancedFilters.gotra) return false;
      if (advancedFilters.education && p.education !== advancedFilters.education) return false;
      if (advancedFilters.maritalStatus && p.marital_status !== advancedFilters.maritalStatus) return false;
      if (p.date_of_birth) {
        const age = Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31557600000);
        if (age < advancedFilters.ageMin || age > advancedFilters.ageMax) return false;
      }
      return true;
    })
    .map(dbProfileToDisplay);

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 1200));
  }, []);

  const { containerRef, onTouchStart, onTouchMove, onTouchEnd, PullIndicator } = usePullToRefresh(handleRefresh);

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className="min-h-screen bg-background pb-20 overflow-y-auto">
      <PullIndicator />
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pb-3 pt-12">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex-1 font-heading text-lg font-bold text-foreground">Explore</h1>
          <div className="flex rounded-xl bg-muted p-0.5">
            <button onClick={() => setView("grid")} className={`rounded-lg p-2 transition-all ${view === "grid" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={`rounded-lg p-2 transition-all ${view === "list" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <SearchBar onFilterClick={() => setFilterOpen(true)} value={searchQuery} onChange={setSearchQuery} />
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          {chips.map((c) => (
            <button key={c} onClick={() => setActiveChip(c)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all active:scale-95 ${
                c === activeChip ? "gradient-saffron text-white shadow-glow-primary" : "bg-card border border-border text-foreground shadow-soft"
              }`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {loading ? (
          <ExplorePageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-card shadow-soft mx-4 border border-border/50">
            <p className="text-sm font-medium text-foreground">No profiles found</p>
            <p className="text-xs text-muted-foreground mt-1">Try different filters</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground font-medium">{filtered.length} profiles</p>
            {view === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((p, i) => (
                  <PremiumProfileCard key={p.id} profile={p} index={i} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((p, i) => (
                  <PremiumProfileCard key={p.id} profile={p} index={i} variant="list" />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={setAdvancedFilters} />
    </div>
  );
};

export default Explore;
