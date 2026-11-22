import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudos, profiles } from "@/shared/db/schema";
import { SpotlightSnapshotSchema } from "../schemas/spotlight-event-schema";
import type { SpotlightSnapshot } from "../schemas/spotlight-views";
import { NAME_CLOUD_MAX, TICKER_HISTORY_ON_LOAD } from "../spotlight-config";

/**
 * SpotlightSnapshotQuery (A1, BR-001/003, D001/D002/D006): the Spotlight Board's state from public
 * kudos only, in 2 parallel statements (no N+1):
 *   1. public kudos grouped by recipient (+ profiles name): top NAME_CLOUD_MAX by count desc, id asc;
 *      the all-time public total rides along as a window sum over every group (computed before
 *      LIMIT), so no group → no row → total 0. Index: kudos_public_recipient_sender_idx (partial).
 *   2. the latest TICKER_HISTORY_ON_LOAD public kudos, returned oldest first (ticker preload).
 *      Index: kudos_status_created_at_id_idx.
 * Selects no sender column at all (Drizzle runs as the server role and bypasses RLS, so the column
 * whitelist IS the protection), then parses through the Zod contract. No cache (Mark Spam applies
 * on the next load).
 */
const publicOnly = eq(kudos.status, "public");
const recipientCount = sql<number>`count(*)::int`;

async function topNames() {
  return db
    .select({
      recipientId: profiles.id,
      name: profiles.fullName,
      count: recipientCount,
      total: sql<number>`(sum(count(*)) over ())::int`,
    })
    .from(kudos)
    .innerJoin(profiles, eq(profiles.id, kudos.recipientId))
    .where(publicOnly)
    .groupBy(profiles.id)
    .orderBy(desc(recipientCount), asc(profiles.id))
    .limit(NAME_CLOUD_MAX);
}

async function latestKudos() {
  return db
    .select({ kudoId: kudos.id, recipientId: kudos.recipientId, recipientName: profiles.fullName, occurredAt: kudos.createdAt })
    .from(kudos)
    .innerJoin(profiles, eq(profiles.id, kudos.recipientId))
    .where(publicOnly)
    .orderBy(desc(kudos.createdAt), desc(kudos.id))
    .limit(TICKER_HISTORY_ON_LOAD);
}

async function load(): Promise<SpotlightSnapshot> {
  const [names, latest] = await Promise.all([topNames(), latestKudos()]);
  return SpotlightSnapshotSchema.parse({
    total: names[0]?.total ?? 0,
    names: names.map(({ recipientId, name, count }) => ({ recipientId, name, count })),
    recent: latest.reverse().map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() })),
  });
}

export const SpotlightSnapshotQuery = { load } as const;
