"use client";

import { useEffect, useReducer } from "react";
import { cachedSunnerCard, refreshSunnerCard } from "../lib/sunner-card-cache";
import type { SunnerCardView } from "../schemas/profile-views";

/**
 * The hover card of `userId` once loaded (null while loading, after a failure, or when `userId` is
 * null). Opening it (re)loads the data only when this page holds no copy younger than
 * SUNNER_CARD_TTL_MS; an older copy shows until the new one arrives.
 */
export function useSunnerCard(userId: string | null): SunnerCardView | null {
  const [, rerender] = useReducer((version: number) => version + 1, 0);

  useEffect(() => {
    if (!userId) return;
    const refresh = refreshSunnerCard(userId);
    if (!refresh) return;
    let active = true;
    void refresh.then(() => {
      if (active) rerender();
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // `userId` is only set after a pointer/keyboard open, so this never runs during SSR.
  return userId ? cachedSunnerCard(userId) : null;
}
