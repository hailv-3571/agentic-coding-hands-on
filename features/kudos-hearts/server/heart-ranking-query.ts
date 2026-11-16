import "server-only";
import { and, desc, eq, inArray, lte, sql, type SQLWrapper } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudoHearts } from "@/shared/db/schema";
import type { PublicKudoIdsSubquery } from "@/features/kudos-feed/server/kudo-public-filters";

/**
 * HeartRankingQuery (C-19): the ONE "rank kudos by hearts" query, shared by the Highlight carousel
 * (phase 05 seam) and Kudos Quốc Dân (phase 10). Ranks by the RAW count (multipliers never change
 * the order, D003), then newest, then id — a total order, so pages and ties are stable.
 */

/**
 * The kudos whose hearts get counted: a one-column select of kudo ids (e.g.
 * `db.select({ id: kudos.id }).from(kudos).where(adminFilters)`) or a list of ids.
 */
export type KudoIdSet = SQLWrapper | readonly string[];

/**
 * `(kudoId, rawCount)` per hearted kudo in `kudoIds`, hearts created up to `asOf` when given. The
 * ONE heart count SQL fragment: also joined by the phase 08 admin table sort (no second count
 * anywhere). The GROUP BY reads only the hearts of `kudoIds` (`kudo_id IN (…)`, served by the
 * unique (kudo_id, user_id) index), never the whole table — pass the set the outer query reads.
 */
export function heartCountsSubquery(kudoIds: KudoIdSet, asOf?: Date) {
  return db
    .select({ kudoId: kudoHearts.kudoId, rawCount: sql<number>`count(*)::int`.as("raw_count") })
    .from(kudoHearts)
    .where(and(inArray(kudoHearts.kudoId, kudoIds), asOf ? lte(kudoHearts.createdAt, asOf) : undefined))
    .groupBy(kudoHearts.kudoId)
    .as("heart_counts");
}

/**
 * Ids of the top `limit` candidates (any public-kudo subquery with `id` + `createdAt`, e.g.
 * `KudoPublicQuery.publicKudoIdsSubquery(filters)`), best first: raw count DESC (no hearts = 0),
 * created_at DESC, id DESC. The candidates carry no sender column, so ranking cannot leak one.
 */
async function rankKudoIds(candidates: PublicKudoIdsSubquery, limit: number, asOf?: Date): Promise<string[]> {
  const counts = heartCountsSubquery(db.select({ id: candidates.id }).from(candidates), asOf);
  const rows = await db
    .select({ id: candidates.id })
    .from(candidates)
    .leftJoin(counts, eq(counts.kudoId, candidates.id))
    .orderBy(desc(sql`coalesce(${counts.rawCount}, 0)`), desc(candidates.createdAt), desc(candidates.id))
    .limit(limit);
  return rows.map((row) => row.id);
}

export const HeartRankingQuery = { rankKudoIds } as const;
