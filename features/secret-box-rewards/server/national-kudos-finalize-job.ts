import "server-only";
import { eq, inArray } from "drizzle-orm";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { HeartRankingQuery, heartCountsSubquery } from "@/features/kudos-hearts/server/heart-ranking-query";
import { env } from "@/shared/config/env";
import { db, type Db, type DbTx } from "@/shared/db/client";
import { kudos, nationalKudos } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { NATIONAL_KUDOS_COUNT } from "../secret-box-config";
import { lockNationalKudosFinalize } from "./secret-box-advisory-lock";

/**
 * NationalKudosFinalizeJob (A7, ALG-003, BR-007/008, FR-406, C-19), run by the internal tick. Before
 * NATIONAL_KUDOS_FINALIZE_AT: no-op. After: once. Top NATIONAL_KUDOS_COUNT public kudos by RAW hearts
 * created up to FINALIZE_AT through phase 06's single ranking query (tie → older kudo first), hearts ≥ 1;
 * spam status is read now (finalize time); anonymous kudos rank like any other and their real
 * `senderId` goes in the event only (phase 13 must not reveal it). The ranking is read BEFORE the
 * transaction (no pool read under the lock); the advisory lock + "already finalized?" re-check +
 * UNIQUE(rank)/(kudo_id) make concurrent runs write 5 rows and one `NationalKudosFinalized`, once.
 * No hearted public kudo → nothing written; the next tick checks again.
 */
export type NationalKudosOutcome = { status: "not_due" | "already_finalized" | "nothing_to_finalize" | "finalized"; count: number };
type Winner = { kudoId: string; senderId: string; hearts: number; rank: number };

async function isFinalized(executor: Db | DbTx = db): Promise<boolean> {
  return (await executor.select({ kudoId: nationalKudos.kudoId }).from(nationalKudos).limit(1)).length > 0;
}

async function rankWinners(asOf: Date): Promise<Winner[]> {
  const ids = await HeartRankingQuery.rankKudoIds(KudoPublicQuery.publicKudoIdsSubquery(), NATIONAL_KUDOS_COUNT, { asOf, tieBreak: "oldest" });
  if (ids.length === 0) return [];
  const counts = heartCountsSubquery(ids, asOf);
  const rows = await db
    .select({ kudoId: kudos.id, senderId: kudos.senderId, hearts: counts.rawCount })
    .from(kudos)
    .innerJoin(counts, eq(counts.kudoId, kudos.id))
    .where(inArray(kudos.id, ids));
  const byId = new Map(rows.map((row) => [row.kudoId, row]));
  // `ids` is ranked best first and unhearted kudos sort last: keep the order, drop those.
  return ids
    .flatMap((id) => {
      const row = byId.get(id);
      return row && row.hearts >= 1 ? [row] : [];
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function run(now: Date = new Date()): Promise<NationalKudosOutcome> {
  if (now.getTime() < env.NATIONAL_KUDOS_FINALIZE_AT) return { status: "not_due", count: 0 };
  if (await isFinalized()) return { status: "already_finalized", count: 0 };
  const winners = await rankWinners(new Date(env.NATIONAL_KUDOS_FINALIZE_AT));
  if (winners.length === 0) return { status: "nothing_to_finalize", count: 0 };

  return db.transaction(async (tx): Promise<NationalKudosOutcome> => {
    await lockNationalKudosFinalize(tx);
    if (await isFinalized(tx)) return { status: "already_finalized", count: 0 };
    await tx.insert(nationalKudos).values(winners.map((winner) => ({ kudoId: winner.kudoId, rank: winner.rank, heartsAtFinalize: winner.hearts })));
    await DomainEventOutbox.add(tx, "NationalKudosFinalized", {
      items: winners.map(({ kudoId, senderId, rank }) => ({ kudoId, senderId, rank })),
    });
    return { status: "finalized", count: winners.length };
  });
}

export const NationalKudosFinalizeJob = { run } as const;
