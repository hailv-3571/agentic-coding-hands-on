"use client";

import { useSyncExternalStore } from "react";
import type { KudoHeartSummary } from "@/features/kudos-feed/schemas/kudo-card-view";
import { readHeartSummaryEntry, resolveHeartSummary, subscribeHeartSummaries } from "./heart-summary-store";

/**
 * The summary a card should show: the shared confirmed answer for this Kudo (heart-summary-store)
 * while the card's server props still match what that answer was based on, else its server props.
 * SSR and hydration always use the server props.
 */
export function useSharedHeartSummary(kudoId: string, server: KudoHeartSummary): KudoHeartSummary {
  const entry = useSyncExternalStore(
    subscribeHeartSummaries,
    () => readHeartSummaryEntry(kudoId),
    () => undefined,
  );
  return resolveHeartSummary(entry, server);
}
