"use client";

import { useEffect, useState } from "react";
import type { SunnerOption } from "../schemas/sunner-option";
import { SUNNER_SEARCH_LIMITS } from "../schemas/sunner-search-params-schema";

export type SunnerSearchStatus = "idle" | "loading" | "ready" | "error" | "unauthorized";

export type SunnerSearchOptions = {
  /** Leave the viewer out (recipient picker: true; mentions/profile search: false). */
  excludeSelf?: boolean;
  limit?: number;
  debounceMs?: number;
};

type Settled = { query: string; status: Exclude<SunnerSearchStatus, "idle" | "loading">; results: SunnerOption[] };

/**
 * Debounced GET /api/sunners/search (C-06). An empty query is idle; while a new query waits for
 * its debounce or response the status is "loading" (an older answer is never shown for it,
 * and an in-flight request for a stale query is aborted). Any 401 means the session expired.
 */
export function useSunnerSearch(query: string, { excludeSelf = false, limit, debounceMs = 250 }: SunnerSearchOptions = {}) {
  const q = query.trim().slice(0, SUNNER_SEARCH_LIMITS.Q_MAX);
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q, excludeSelf: String(excludeSelf) });
      if (limit) params.set("limit", String(limit));
      try {
        const response = await fetch(`/api/sunners/search?${params}`, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (response.status === 401) return setSettled({ query: q, status: "unauthorized", results: [] });
        if (!response.ok) return setSettled({ query: q, status: "error", results: [] });
        setSettled({ query: q, status: "ready", results: (await response.json()) as SunnerOption[] });
      } catch {
        if (!controller.signal.aborted) setSettled({ query: q, status: "error", results: [] });
      }
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, excludeSelf, limit, debounceMs]);

  if (!q) return { status: "idle" as SunnerSearchStatus, results: [] as SunnerOption[] };
  if (settled?.query !== q) return { status: "loading" as SunnerSearchStatus, results: [] as SunnerOption[] };
  return { status: settled.status as SunnerSearchStatus, results: settled.results };
}
