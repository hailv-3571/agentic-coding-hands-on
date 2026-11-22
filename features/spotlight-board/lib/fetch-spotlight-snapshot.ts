import { SpotlightEventSchema, SpotlightSnapshotSchema } from "../schemas/spotlight-event-schema";
import type { SpotlightEvent, SpotlightSnapshot } from "../schemas/spotlight-views";

/**
 * What reaches the board from outside is parsed before it touches state (technical-spec A3): every
 * Broadcast payload, and the snapshot refetch (A1, `GET /api/spotlight`, session cookie, no-store).
 * Anything malformed is dropped, never thrown.
 */
export function parseSpotlightEvent(payload: unknown): SpotlightEvent | null {
  return SpotlightEventSchema.safeParse(payload).data ?? null;
}

/** `GET /api/spotlight`; null on any failure (network, 401, 5xx, bad body) or when aborted. */
export async function fetchSpotlightSnapshot(signal?: AbortSignal): Promise<SpotlightSnapshot | null> {
  try {
    const response = await fetch("/api/spotlight", { cache: "no-store", headers: { accept: "application/json" }, signal });
    if (!response.ok) return null;
    return SpotlightSnapshotSchema.safeParse(await response.json()).data ?? null;
  } catch {
    return null;
  }
}
