import { Skeleton } from "@/components/ui/skeleton";

export const HomePageSkeleton = () => (
  <div className="mx-auto max-w-md px-4 space-y-6 pt-4">
    {/* Search bar */}
    <Skeleton className="h-12 w-full rounded-2xl" />

    {/* Stat cards */}
    <div className="grid grid-cols-3 gap-2.5">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>

    {/* Section title */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-4 w-16" />
    </div>

    {/* Carousel cards */}
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-52 w-40 flex-shrink-0 rounded-2xl" />
      ))}
    </div>

    {/* Section title */}
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-14" />
    </div>

    {/* List cards */}
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-3 border border-border/50">
        <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    ))}
  </div>
);

export const ExplorePageSkeleton = () => (
  <div className="mx-auto max-w-md px-4 pt-4 space-y-4">
    <Skeleton className="h-4 w-20 mb-2" />
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  </div>
);
