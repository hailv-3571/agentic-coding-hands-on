import type { KudoHeartSummary } from "@/features/kudos-feed/schemas/kudo-card-view";

/**
 * The viewer's last confirmed heart state per Kudo, shared by every copy of its card on the page
 * (one Kudo can sit in the Highlight and in All Kudos at once, and the actions do not revalidate:
 * D008). An entry only applies while a card still shows the server numbers it was based on, so
 * fresher server props (a reload, a Highlight refetch, a soft navigation) always win over it.
 * Plain module state, read through `useSharedHeartSummary`; written only from client event handlers.
 */
export type HeartSummaryEntry = { base: KudoHeartSummary; value: KudoHeartSummary };

const entries = new Map<string, HeartSummaryEntry>();
const listeners = new Set<() => void>();

export function subscribeHeartSummaries(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readHeartSummaryEntry(kudoId: string): HeartSummaryEntry | undefined {
  return entries.get(kudoId);
}

/** Records the server's answer to a toggle; `base` is the server summary the card was rendered with. */
export function publishHeartSummary(kudoId: string, base: KudoHeartSummary, value: KudoHeartSummary): void {
  entries.set(kudoId, { base, value });
  for (const listener of listeners) listener();
}

const sameSummary = (a: KudoHeartSummary, b: KudoHeartSummary) => a.heartCount === b.heartCount && a.heartedByMe === b.heartedByMe;

/** What a card shows: the shared answer while its server props still equal the entry's base, else the props. */
export function resolveHeartSummary(entry: HeartSummaryEntry | undefined, server: KudoHeartSummary): KudoHeartSummary {
  return entry && sameSummary(entry.base, server) ? entry.value : server;
}
