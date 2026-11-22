import "server-only";
import { and, countDistinct, eq, inArray, ne } from "drizzle-orm";
import { db, type Db, type DbTx } from "@/shared/db/client";
import { kudos } from "@/shared/db/schema";
import type { HeroTier } from "../schemas/hero-tier";
import { HERO_QUERY_MAX_IDS } from "./hero-tier-constants";
import { tierFromCount } from "./tier-from-count";

/**
 * HeroTierQuery (F009 A1) — the ONE Hero tier source, computed on read (DEC-002, no stored tier):
 * DISTINCT senders of public kudos per recipient. Spam is excluded by `status = 'public'`
 * (BR-001: Mark Spam lowers, Un Spam restores on the next read); anonymous kudos count (BR-003,
 * decision-log: `sender_id` is always stored); a self-sent row never counts (BR-002,
 * defence in depth over the `kudos_no_self_send` CHECK). One statement per batch of up to
 * `HERO_QUERY_MAX_IDS` ids, served by the partial index `kudos_public_recipient_sender_idx`
 * (migration 0014). No caching (Cache Components: uncached unless `use cache`), so every page load
 * reads current data. Results carry counts or tier names keyed by the REQUESTED ids only — never
 * a sender id (FR-602). Callers are session-gated server code (FR-601); there is no route.
 */
const countsPublicSenders = and(eq(kudos.status, "public"), ne(kudos.senderId, kudos.recipientId));

/**
 * Distinct public senders per requested recipient (0 when none). Ids are de-duplicated; an empty
 * batch issues no statement. `executor` lets phase 13 read before/after a Kudo write inside its
 * own transaction (C-04); every other caller uses the shared pool.
 */
async function getDistinctSenderCounts(recipientIds: string[], executor: Db | DbTx = db): Promise<Map<string, number>> {
  const ids = [...new Set(recipientIds)];
  const counts = new Map<string, number>(ids.map((id) => [id, 0]));
  for (let start = 0; start < ids.length; start += HERO_QUERY_MAX_IDS) {
    const rows = await executor
      .select({ recipientId: kudos.recipientId, senderCount: countDistinct(kudos.senderId) })
      .from(kudos)
      .where(and(countsPublicSenders, inArray(kudos.recipientId, ids.slice(start, start + HERO_QUERY_MAX_IDS))))
      .groupBy(kudos.recipientId);
    for (const row of rows) counts.set(row.recipientId, row.senderCount);
  }
  return counts;
}

/** Tier per requested recipient; a person without a tier (0 senders) has no key (DEC-001). */
async function getTiersByRecipientIds(recipientIds: string[]): Promise<Record<string, HeroTier>> {
  const tiers: Record<string, HeroTier> = {};
  for (const [id, count] of await getDistinctSenderCounts(recipientIds)) {
    const tier = tierFromCount(count);
    if (tier) tiers[id] = tier;
  }
  return tiers;
}

/**
 * `(recipient_id, sender_count)` for every recipient with at least one counted sender, same rule
 * as above. Phase 14 joins it and filters the Level column with `tierCountRange(tier)` bounds, so
 * the thresholds are never restated in SQL.
 */
function distinctSenderCountSubquery() {
  return db
    .select({ recipientId: kudos.recipientId, senderCount: countDistinct(kudos.senderId).as("sender_count") })
    .from(kudos)
    .where(countsPublicSenders)
    .groupBy(kudos.recipientId)
    .as("hero_sender_counts");
}

export const HeroTierQuery = { getDistinctSenderCounts, getTiersByRecipientIds, distinctSenderCountSubquery } as const;
