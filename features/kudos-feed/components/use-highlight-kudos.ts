"use client";

import { useEffect, useRef, useState } from "react";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { failureOf, type KudoLoadFailure } from "./kudo-feed-status-message";

export type HighlightResult = { items: KudoCardView[]; total: number };
export type HighlightFilters = { hashtag: string | null; department: string | null };

/**
 * Highlight data (E02–E04, BR-002): the server's "Tất cả" result until a filter changes, then
 * GET /api/kudos/highlight?hashtag&department (absent = "Tất cả"; hashtag AND department). Every
 * change re-fetches and resets the carousel to the first card (spec rule) when the new result is
 * applied, so the old cards never slide back while the request is pending. A newer request aborts
 * the older one, so a slow answer never overwrites the current filters. `initial` null = the
 * server read failed: the error state shows until a retry succeeds.
 */
export function useHighlightKudos(initial: HighlightResult | null) {
  const [filters, setFilters] = useState<HighlightFilters>({ hashtag: null, department: null });
  const [fetched, setFetched] = useState<HighlightResult | null>(null);
  const [failure, setFailure] = useState<KudoLoadFailure | null>(initial ? null : "error");
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function load(next: HighlightFilters) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setFilters(next);
    setPending(true);
    setFailure(null);
    const params = new URLSearchParams();
    if (next.hashtag) params.set("hashtag", next.hashtag);
    if (next.department) params.set("department", next.department);
    try {
      const query = params.toString();
      const response = await fetch(`/api/kudos/highlight${query ? `?${query}` : ""}`, {
        signal: request.signal,
        headers: { accept: "application/json" },
      });
      if (response.ok) {
        const result = (await response.json()) as HighlightResult;
        setFetched(result);
        setActive(0);
      } else {
        setFailure(failureOf(response));
      }
    } catch (error) {
      if (request.signal.aborted) return;
      console.error("[kudos-feed] loading the highlight failed", error);
      setFailure("error");
    } finally {
      if (controller.current === request) setPending(false);
    }
  }

  const result = fetched ?? initial ?? { items: [], total: 0 };
  return {
    filters,
    result,
    failure,
    pending,
    // A refresh can shrink the list under the current card.
    active: Math.min(active, Math.max(result.items.length - 1, 0)),
    setActive,
    setFilter: (key: keyof HighlightFilters, value: string | null) => load({ ...filters, [key]: value }),
    retry: () => load(filters),
  };
}
