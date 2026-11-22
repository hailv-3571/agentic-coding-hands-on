"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Infinite scroll: calls `onReach` when the returned sentinel element comes within 160 px of the
 * bottom of `root` (the panel's scroll box) or of the viewport. The observer is rebuilt whenever
 * `enabled` or `version` (the row count) changes, and a fresh observer reports the current
 * intersection at once, so a short page that leaves the sentinel visible keeps loading.
 */
export function useInfiniteScrollSentinel(
  onReach: () => void,
  { enabled, version, root }: { enabled: boolean; version: number; root?: RefObject<HTMLElement | null> },
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onReachRef = useRef(onReach);
  useEffect(() => {
    onReachRef.current = onReach;
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!enabled || !target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachRef.current();
      },
      { root: root?.current ?? null, rootMargin: "0px 0px 160px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, version, root]);

  return sentinelRef;
}
