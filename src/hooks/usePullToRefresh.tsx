import { useState, useRef, useCallback } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [pulling, refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    setPulling(false);
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  const PullIndicator = () => (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-300"
      style={{ height: pullDistance, opacity: progress }}
    >
      <div
        className={`h-8 w-8 rounded-full border-[2.5px] border-primary/20 border-t-primary ${refreshing ? "animate-spin" : ""}`}
        style={{ transform: `rotate(${progress * 360}deg)`, transition: refreshing ? "none" : "transform 0.1s" }}
      />
    </div>
  );

  return {
    containerRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    PullIndicator,
    refreshing,
  };
}
