import "server-only";
import { and, eq } from "drizzle-orm";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import type { DbTx } from "@/shared/db/client";
import { kudos, notifications } from "@/shared/db/schema";
import type { DomainEvent } from "@/shared/events/domain-event-types";
import { detectHeroTierUp, type HeroTierUp } from "./detect-hero-tier-up";
import type { EventContext, KudoFacts } from "./map-event-to-notifications";

/**
 * Reads, inside the event's transaction, what ALG-001 needs beyond the payload:
 * - KudoCreated / HeartAdded: the kudo's CURRENT sender, recipient, anonymity and status (FR-408 re-check).
 * - KudoCreated on a live kudo: the tier-up (ALG-002) — phase 09's distinct-sender count through
 *   `HeroTierQuery.getDistinctSenderCounts(ids, tx)` (C-04, no second counting query) and the tiers
 *   this recipient was already notified of.
 * Other events need nothing (their payload carries the recipient).
 */
async function readKudo(tx: DbTx, kudoId: string): Promise<KudoFacts | null> {
  const [row] = await tx
    .select({ id: kudos.id, senderId: kudos.senderId, recipientId: kudos.recipientId, isAnonymous: kudos.isAnonymous, status: kudos.status })
    .from(kudos)
    .where(eq(kudos.id, kudoId));
  return row ? { id: row.id, senderId: row.senderId, recipientId: row.recipientId, isAnonymous: row.isAnonymous, isPublic: row.status === "public" } : null;
}

async function readTierUp(tx: DbTx, recipientId: string): Promise<HeroTierUp | null> {
  const counts = await HeroTierQuery.getDistinctSenderCounts([recipientId], tx);
  const notified = await tx
    .select({ tier: notifications.dedupeKey })
    .from(notifications)
    .where(and(eq(notifications.recipientId, recipientId), eq(notifications.type, "hero_tier_up")));
  return detectHeroTierUp(counts.get(recipientId) ?? 0, notified.map((row) => row.tier ?? ""));
}

async function load(tx: DbTx, event: DomainEvent): Promise<EventContext> {
  if (event.type !== "KudoCreated" && event.type !== "HeartAdded") return { kudo: null, tierUp: null };
  const kudo = await readKudo(tx, event.payload.kudoId);
  const liveNewKudo = event.type === "KudoCreated" && kudo?.isPublic && kudo.senderId !== kudo.recipientId;
  return { kudo, tierUp: liveNewKudo ? await readTierUp(tx, kudo.recipientId) : null };
}

export const NotificationEventContext = { load } as const;
