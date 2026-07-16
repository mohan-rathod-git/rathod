import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { GOTRAS, COMMUNITIES, STATES } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const EDUCATIONS = ["10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Doctorate"];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
}

export interface FilterState {
  ageMin: number;
  ageMax: number;
  community: string;
  state: string;
  gotra: string;
  education: string;
  maritalStatus: string;
}

const initialFilters: FilterState = {
  ageMin: 18, ageMax: 45, community: "", state: "", gotra: "", education: "", maritalStatus: "",
};

const FilterModal = ({ isOpen, onClose, onApply }: FilterModalProps) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const update = (key: keyof FilterState, val: any) => setFilters((p) => ({ ...p, [key]: val }));

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  const handleReset = () => setFilters(initialFilters);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-card"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 px-5 py-4 backdrop-blur-sm">
              <h3 className="font-heading text-lg font-bold text-foreground">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted active:scale-95 transition-transform">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted active:scale-95 transition-transform">
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-5">
              {/* Age Range */}
              <div>
                <label className="text-sm font-semibold text-foreground">Age Range</label>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{filters.ageMin} – {filters.ageMax} years</p>
                <div className="flex gap-4 mt-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground">Min</span>
                    <input type="range" min={18} max={60} value={filters.ageMin}
                      onChange={(e) => update("ageMin", Math.min(+e.target.value, filters.ageMax))}
                      className="mt-1 w-full accent-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground">Max</span>
                    <input type="range" min={18} max={60} value={filters.ageMax}
                      onChange={(e) => update("ageMax", Math.max(+e.target.value, filters.ageMin))}
                      className="mt-1 w-full accent-primary" />
                  </div>
                </div>
              </div>

              {/* Community */}
              <div>
                <label className="text-sm font-semibold text-foreground">Community</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COMMUNITIES.map((c) => (
                    <button key={c} onClick={() => update("community", c === filters.community ? "" : c)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
                        c === filters.community ? "gradient-saffron text-white shadow-glow-primary" : "bg-muted text-foreground"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="text-sm font-semibold text-foreground">Education</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EDUCATIONS.map((e) => (
                    <button key={e} onClick={() => update("education", e === filters.education ? "" : e)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
                        e === filters.education ? "gradient-saffron text-white shadow-glow-primary" : "bg-muted text-foreground"
                      }`}>{e}</button>
                  ))}
                </div>
              </div>

              {/* State */}
              <div>
                <label className="text-sm font-semibold text-foreground">State / Location</label>
                <select value={filters.state} onChange={(e) => update("state", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">All States</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Gotra */}
              <div>
                <label className="text-sm font-semibold text-foreground">Gotra</label>
                <select value={filters.gotra} onChange={(e) => update("gotra", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Any Gotra</option>
                  {GOTRAS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="text-sm font-semibold text-foreground">Marital Status</label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {["Never Married", "Divorced", "Widowed"].map((s) => (
                    <button key={s} onClick={() => update("maritalStatus", s === filters.maritalStatus ? "" : s)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
                        s === filters.maritalStatus ? "gradient-saffron text-white shadow-glow-primary" : "bg-muted text-foreground"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-border/50 bg-card p-5">
              <button onClick={handleReset} className="flex-1 rounded-2xl border border-border py-3.5 text-sm font-semibold text-foreground active:scale-[0.98] transition-transform">
                Reset All
              </button>
              <button onClick={handleApply} className="flex-1 rounded-2xl gradient-saffron py-3.5 text-sm font-bold text-white shadow-glow-primary active:scale-[0.98] transition-transform">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
