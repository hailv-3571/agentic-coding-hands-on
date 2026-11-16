import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { env } from "@/shared/config/env";
import { isEventWritingOpen } from "@/shared/config/event-window";
import { db, type DbTx } from "@/shared/db/client";
import { kudoHearts } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import type { HeartErrorCode } from "../schemas/kudo-heart-result";
import { HeartMultiplierResolver } from "./heart-multiplier-resolver";

/**
 * KudoHeartService (F005 A1/A2). Callers pass a session user id and a valid uuid (the actions do).
 * - add: ONE `INSERT … SELECT … ON CONFLICT DO NOTHING RETURNING` holds every guard (public,
 *   not the sender — anonymous included —, before EVENT_END_AT) so guard + write are atomic
 *   against a concurrent Mark Spam; the `HeartAdded` outbox row is written in the same
 *   transaction ONLY when a row was inserted (C-01), so 20 parallel clicks give 1 row + 1 event.
 *   The multiplier is resolved before and snapshotted on the row (BR-004).
 * - remove: plain DELETE, idempotent, allowed on spam (spec A2), blocked from EVENT_END_AT.
 *   No `HeartRemoved` event: consumers reconcile from totals (YAGNI).
 */
export class KudoHeartError extends Error {
  constructor(readonly code: Exclude<HeartErrorCode, "UNEXPECTED">) {
    super(code);
    this.name = "KudoHeartError";
  }
}

export type HeartAddOutcome = "added" | "unchanged";

const eventEndIso = () => new Date(env.EVENT_END_AT).toISOString();

async function insertHeartIfAllowed(tx: DbTx, kudoId: string, userId: string, multiplier: number): Promise<boolean> {
  const inserted = await tx.execute<{ id: string }>(sql`
    insert into "kudo_hearts" ("kudo_id", "user_id", "multiplier")
    select k."id", ${userId}::uuid, ${multiplier}::smallint
    from "kudos" k
    where k."id" = ${kudoId}::uuid and k."status" = 'public' and k."sender_id" <> ${userId}::uuid
      and now() < ${eventEndIso()}::timestamptz
    on conflict ("kudo_id", "user_id") do nothing
    returning "id"`);
  return inserted.length > 0;
}

/**
 * Nothing was inserted: say why (no content in any answer). Every guard passing means "already hearted".
 * A second statement under READ COMMITTED: a kudo marked spam in between yields KUDO_UNAVAILABLE, and a
 * heart inserted just before a Mark Spam stays on the row, harmless because spam is filtered at read time
 * (D006). Closing that window needs `FOR SHARE` on the kudo row, a lock on a hot row: not worth it.
 */
async function classifyNoInsert(tx: DbTx, kudoId: string, userId: string): Promise<HeartAddOutcome> {
  const [kudo] = await tx.execute<{ is_public: boolean; is_own: boolean; is_open: boolean }>(sql`
    select k."status" = 'public' as is_public, k."sender_id" = ${userId}::uuid as is_own,
           now() < ${eventEndIso()}::timestamptz as is_open
    from "kudos" k where k."id" = ${kudoId}::uuid`);
  if (!kudo?.is_public) throw new KudoHeartError("KUDO_UNAVAILABLE");
  if (kudo.is_own) throw new KudoHeartError("SELF_HEART");
  if (!kudo.is_open) throw new KudoHeartError("EVENT_ENDED");
  return "unchanged"; // BR-001: a second heart is a silent no-op
}

async function add(kudoId: string, userId: string, now: Date = new Date()): Promise<HeartAddOutcome> {
  if (!isEventWritingOpen(now)) throw new KudoHeartError("EVENT_ENDED");
  const multiplier = await HeartMultiplierResolver.resolve(now);
  return db.transaction(async (tx) => {
    if (!(await insertHeartIfAllowed(tx, kudoId, userId, multiplier))) return classifyNoInsert(tx, kudoId, userId);
    await DomainEventOutbox.add(tx, "HeartAdded", { kudoId, heartUserId: userId });
    return "added";
  });
}

async function remove(kudoId: string, userId: string, now: Date = new Date()): Promise<void> {
  if (!isEventWritingOpen(now)) throw new KudoHeartError("EVENT_ENDED");
  await db.delete(kudoHearts).where(and(eq(kudoHearts.kudoId, kudoId), eq(kudoHearts.userId, userId)));
}

export const KudoHeartService = { add, remove } as const;
