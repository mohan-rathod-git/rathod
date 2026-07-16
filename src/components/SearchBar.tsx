import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  onFilterClick?: () => void;
  value?: string;
  onChange?: (query: string) => void;
}

const SearchBar = ({ onFilterClick, value = "", onChange }: SearchBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Search by name, gotra, location..."
          className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:shadow-medium transition-all"
        />
      </div>
      <button
        onClick={onFilterClick}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl gradient-saffron text-white shadow-glow-primary active:scale-95 transition-transform"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
};

export default SearchBar;
