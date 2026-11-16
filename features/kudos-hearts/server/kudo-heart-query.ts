import "server-only";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudoHearts } from "@/shared/db/schema";
import type { KudoHeartSummary } from "../schemas/kudo-heart-result";

/**
 * KudoHeartQuery#summaryForKudos (F005 A3, FR-201): ONE grouped query per page of cards. The count
 * is raw — one per Sunner, multipliers ignored (D003, decision-log "thẻ hiển thị số thật"). Only
 * `heartedByMe` mentions the viewer; who else hearted never leaves the server (D009). Every
 * requested id is in the result (0 / false when nobody hearted it).
 */
async function summaryForKudos(kudoIds: string[], viewerId: string): Promise<Map<string, KudoHeartSummary>> {
  const summaries = new Map<string, KudoHeartSummary>(kudoIds.map((id) => [id, { heartCount: 0, heartedByMe: false }]));
  if (kudoIds.length === 0) return summaries;
  const rows = await db
    .select({
      kudoId: kudoHearts.kudoId,
      heartCount: sql<number>`count(*)::int`,
      heartedByMe: sql<boolean>`bool_or(${kudoHearts.userId} = ${viewerId}::uuid)`,
    })
    .from(kudoHearts)
    .where(inArray(kudoHearts.kudoId, kudoIds))
    .groupBy(kudoHearts.kudoId);
  for (const row of rows) summaries.set(row.kudoId, { heartCount: row.heartCount, heartedByMe: row.heartedByMe });
  return summaries;
}

export const KudoHeartQuery = { summaryForKudos } as const;
