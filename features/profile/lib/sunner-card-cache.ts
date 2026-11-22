import type { SunnerCardView } from "../schemas/profile-views";

/** How long a loaded hover card is served without asking again (review W2: counts and EVENT_END move). */
export const SUNNER_CARD_TTL_MS = 60_000;

/**
 * Browser-side hover card data (RISK-01: dozens of avatars on the Live board). Keyed by user id and
 * dropped when the path changes; concurrent opens share one request. A copy older than the TTL is
 * still shown while the next open refreshes it; `invalidateSunnerCard` (a Kudo sent to that Sunner)
 * drops it outright, along with any answer still in flight. A failed load is never cached (the next
 * open retries) and leaves no card (spec § 5: never an empty card).
 */
const loaded = new Map<string, { card: SunnerCardView; loadedAt: number }>();
const pending = new Map<string, Promise<void>>();
let cachedPath = "";

function resetOnNewPage(): void {
  if (window.location.pathname === cachedPath) return;
  cachedPath = window.location.pathname;
  loaded.clear();
  pending.clear();
}

function load(userId: string): Promise<void> {
  const inFlight = pending.get(userId);
  if (inFlight) return inFlight;
  const request: Promise<void> = fetch(`/api/sunners/${encodeURIComponent(userId)}/card`, { headers: { accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`sunner card answered ${response.status}`);
      const card = (await response.json()) as SunnerCardView;
      // Dropped (sent Kudo, new page) while in flight: this answer may predate the change.
      if (pending.get(userId) === request) loaded.set(userId, { card, loadedAt: Date.now() });
    })
    .catch((error: unknown) => console.error("[profile] loading a sunner card failed", error))
    .finally(() => {
      if (pending.get(userId) === request) pending.delete(userId);
    });
  pending.set(userId, request);
  return request;
}

/** The card of `userId` loaded on this very page, whatever its age (render reads; it never fetches). */
export function cachedSunnerCard(userId: string): SunnerCardView | null {
  return cachedPath === window.location.pathname ? (loaded.get(userId)?.card ?? null) : null;
}

/** On open: null while this page holds a fresh copy, else the (shared) request that loads a new one. */
export function refreshSunnerCard(userId: string): Promise<void> | null {
  resetOnNewPage();
  const entry = loaded.get(userId);
  if (entry && Date.now() - entry.loadedAt < SUNNER_CARD_TTL_MS) return null;
  return load(userId);
}

/** Forget `userId`'s card (its counts just changed): the next open loads it again. */
export function invalidateSunnerCard(userId: string): void {
  loaded.delete(userId);
  pending.delete(userId);
}
