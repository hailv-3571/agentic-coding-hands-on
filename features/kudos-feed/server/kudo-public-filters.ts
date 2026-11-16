import "server-only";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudoHashtags, kudos, profiles } from "@/shared/db/schema";

/**
 * Content filters shared by the feed list and the Highlight candidates (BR-004: AND; an absent
 * filter means "Tất cả"). Department is the RECIPIENT's department (D002). Each filter is an
 * `IN (subquery)` on an indexed column, so it composes with any ORDER BY / LIMIT.
 */
export type KudoContentFilters = { hashtagId?: string; departmentId?: string };

export function kudoContentConditions({ hashtagId, departmentId }: KudoContentFilters): SQL[] {
  const conditions: SQL[] = [];
  if (hashtagId !== undefined) {
    const tagged = db.select({ kudoId: kudoHashtags.kudoId }).from(kudoHashtags).where(eq(kudoHashtags.hashtagId, hashtagId));
    conditions.push(inArray(kudos.id, tagged));
  }
  if (departmentId !== undefined) {
    const members = db.select({ id: profiles.id }).from(profiles).where(eq(profiles.departmentId, departmentId));
    conditions.push(inArray(kudos.recipientId, members));
  }
  return conditions;
}

/**
 * `(id, createdAt)` of every PUBLIC Kudo matching the filters, as a Drizzle subquery — the input
 * of the Highlight ranking (heart seam → phase 06 `HeartRankingQuery.rankKudoIds`) and of phase
 * 10 (Kudos Quốc Dân, no filters). Carries no sender column, so ranking can never leak one.
 */
export function publicKudoIdsSubquery(filters: KudoContentFilters = {}) {
  return db
    .select({ id: kudos.id, createdAt: kudos.createdAt })
    .from(kudos)
    .where(and(eq(kudos.status, "public"), ...kudoContentConditions(filters)))
    .as("public_kudo_ids");
}

export type PublicKudoIdsSubquery = ReturnType<typeof publicKudoIdsSubquery>;
