import "server-only";
import { asc, sql } from "drizzle-orm";
import type { ZodError } from "zod";
import { db, type DbTx } from "@/shared/db/client";
import { domainEventOutbox } from "@/shared/db/schema";
import { domainEventSchema } from "@/shared/events/domain-event-types";
import { OUTBOX_BATCH_SIZE, OUTBOX_MAX_ATTEMPTS, OUTBOX_RETRY_BASE_DELAY_SECONDS } from "../notification-config";
import { NotificationEventContext } from "./load-notification-event-context";
import { mapEventToNotifications } from "./map-event-to-notifications";
import { NotificationWriter } from "./notification-writer";

/**
 * NotificationEventProcessor (A1, INT-001, C-01/C-16) — the ONLY consumer of
 * `domain_event_outbox.consumed_at`. Layered idempotency:
 *   1. candidates = the oldest pending AND due ids (no lock), at most OUTBOX_BATCH_SIZE per run;
 *   2. per event, its OWN transaction re-reads the row `FOR UPDATE SKIP LOCKED` WHERE still pending and
 *      due: a concurrent drainer holding it is skipped, one that committed or failed it is filtered out;
 *   3. notifications AND consumed_at are written in that same transaction (all or nothing);
 *   4. UNIQUE(event_id, recipient_id, type) is the final guard (NotificationWriter).
 * A failing event rolls back alone and gets attempts + 1 and an exponential backoff (next_attempt_at =
 * now() + BASE × 2^(attempts-1): 1, 2, 4, 8 min, so 5 attempts span ~15 min, not ~25 s of 5 s ticks);
 * drains skip it until then. The failure record also requires it to be due, so two overlapping drains
 * count one attempt. At OUTBOX_MAX_ATTEMPTS it is parked with failed_at (never retried, logged for an
 * alert). A malformed payload or unknown type (shared Zod contract) is consumed with a log line.
 * Manual replay of parked events once the cause is fixed (the next drain picks them up; guards 2-4
 * make the replay safe):
 *   update public.domain_event_outbox set failed_at = null, attempts = 0, next_attempt_at = null
 *   where consumed_at is null and failed_at is not null;  -- one event: and id = '<event uuid>'
 */
export type DrainOutcome = { processed: number; malformed: number; retrying: number; failed: number };
type EventOutcome = keyof DrainOutcome | "skipped";

const ERROR_TEXT_MAX = 500;

/** Pending (not consumed, not parked) AND due (backoff elapsed): every read and write below uses it. */
const PENDING_AND_DUE = sql.raw(
  "consumed_at is null and failed_at is null and (next_attempt_at is null or next_attempt_at <= now())",
);

async function pendingEventIds(limit: number): Promise<string[]> {
  const rows = await db
    .select({ id: domainEventOutbox.id })
    .from(domainEventOutbox)
    .where(PENDING_AND_DUE)
    .orderBy(asc(domainEventOutbox.occurredAt), asc(domainEventOutbox.id))
    .limit(limit);
  return rows.map((row) => row.id);
}

/** Paths and messages only (Zod echoes no values), so last_error never stores a payload. */
const describeMalformed = (eventType: string, error: ZodError) =>
  `${eventType.slice(0, 64)}: ${error.issues.map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`).join("; ")}`.slice(0, ERROR_TEXT_MAX);

async function markConsumed(tx: DbTx, id: string, lastError?: string): Promise<void> {
  await tx.execute(sql`
    update public.domain_event_outbox set consumed_at = now(), last_error = coalesce(${lastError ?? null}, last_error)
    where id = ${id}::uuid`);
}

async function consume(id: string): Promise<EventOutcome> {
  return db.transaction(async (tx) => {
    const [row] = await tx.execute<{ event_type: string; payload: unknown }>(sql`
      select event_type, payload from public.domain_event_outbox
      where id = ${id}::uuid and ${PENDING_AND_DUE}
      for update skip locked`);
    if (!row) return "skipped";
    const parsed = domainEventSchema.safeParse({ type: row.event_type, payload: row.payload });
    if (!parsed.success) {
      const reason = describeMalformed(row.event_type, parsed.error);
      console.warn(`[notifications] consumed malformed outbox event ${id}: ${reason}`);
      await markConsumed(tx, id, `malformed ${reason}`);
      return "malformed";
    }
    const context = await NotificationEventContext.load(tx, parsed.data);
    await NotificationWriter.write(tx, id, mapEventToNotifications(parsed.data, context));
    await markConsumed(tx, id);
    return "processed";
  });
}

async function recordFailure(id: string, error: unknown): Promise<EventOutcome> {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, ERROR_TEXT_MAX);
  try {
    // SET expressions read the pre-update row: `attempts` here is the count before this failure.
    const [row] = await db.execute<{ failed: boolean }>(sql`
      update public.domain_event_outbox
      set attempts = attempts + 1, last_error = ${message},
          next_attempt_at = now() + make_interval(secs => ${OUTBOX_RETRY_BASE_DELAY_SECONDS}::float8 * power(2, attempts)),
          failed_at = case when attempts + 1 >= ${OUTBOX_MAX_ATTEMPTS} then now() end
      where id = ${id}::uuid and ${PENDING_AND_DUE}
      returning failed_at is not null as failed`);
    const failed = row?.failed === true;
    console.error(`[notifications] outbox event ${id} failed${failed ? `; parked after ${OUTBOX_MAX_ATTEMPTS} attempts` : ", will retry with backoff"}`, error);
    return failed ? "failed" : "retrying";
  } catch (recordError) {
    console.error(`[notifications] outbox event ${id} failed and its attempt could not be recorded`, error, recordError);
    return "retrying";
  }
}

async function processEvent(id: string): Promise<EventOutcome> {
  try {
    return await consume(id);
  } catch (error) {
    return recordFailure(id, error);
  }
}

/** One run: the oldest pending events, in order. Throws only when the candidates cannot be read. */
async function drain(batchSize: number = OUTBOX_BATCH_SIZE): Promise<DrainOutcome> {
  const outcome: DrainOutcome = { processed: 0, malformed: 0, retrying: 0, failed: 0 };
  for (const id of await pendingEventIds(batchSize)) {
    const result = await processEvent(id);
    if (result !== "skipped") outcome[result] += 1;
  }
  return outcome;
}

export const NotificationEventProcessor = { drain } as const;
