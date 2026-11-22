import { inArray } from "drizzle-orm";
import { NotificationEventProcessor } from "@/features/notifications/server/notification-event-processor";
import type { NotificationType } from "@/features/notifications/schemas/notification-views";
import { domainEventOutbox } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import type { DomainEventPayload, DomainEventType } from "@/shared/events/domain-event-types";
import { testDb, testSql } from "../../setup/integration-db";
import { cleanupSunners, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Phase 13 integration helpers (local Supabase stack). Valid events go through the producers' own
 * `DomainEventOutbox.add` (the shared contract); malformed ones are raw SQL. Every outbox row created
 * here is deleted in cleanup (its notifications keep their row, event_id → null), then the Sunners
 * (kudos, auth users; their notifications cascade with the recipient's profile).
 */
const createdEvents = new Set<string>();

export async function addEvent<T extends DomainEventType>(type: T, payload: DomainEventPayload<T>): Promise<string> {
  const { id } = await testDb.transaction((tx) => DomainEventOutbox.add(tx, type, payload));
  createdEvents.add(id);
  return id;
}

/** An outbox row exactly as given (no contract check): malformed / unknown events, or a set occurred_at. */
export async function insertRawEvent(type: string, payload: unknown, occurredAt?: string): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`
    insert into public.domain_event_outbox (event_type, payload, occurred_at)
    values (${type}, ${JSON.stringify(payload)}::jsonb, coalesce(${occurredAt ?? null}::timestamptz, now())) returning id`;
  createdEvents.add(row.id);
  return row.id;
}

export type StoredNotification = {
  id: string;
  type: NotificationType;
  /** Null once the producing outbox event was cleaned up (FK ON DELETE SET NULL). */
  event_id: string | null;
  actor_id: string | null;
  dedupe_key: string | null;
  params: Record<string, unknown>;
  count: number;
  read: boolean;
  occurred_at: string;
};

export const notificationsOf = (userId: string) =>
  testSql<StoredNotification[]>`
    select id, type::text as type, event_id, actor_id, dedupe_key, params, count, read_at is not null as read,
           to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as occurred_at
    from public.notifications where recipient_id = ${userId} order by notifications.occurred_at, notifications.type, notifications.created_at, notifications.id`;

export type OutboxState = { consumed: boolean; attempts: number; failed: boolean; last_error: string | null };

export async function outboxStateOf(id: string): Promise<OutboxState> {
  const [row] = await testSql<OutboxState[]>`
    select consumed_at is not null as consumed, attempts, failed_at is not null as failed, last_error
    from public.domain_event_outbox where id = ${id}`;
  return row;
}

/** Seconds until the event's next retry is due (negative = overdue, null = no retry scheduled). */
export async function secondsUntilRetry(id: string): Promise<number | null> {
  const [row] = await testSql<{ seconds: number | null }[]>`
    select extract(epoch from next_attempt_at - now())::float8 as seconds from public.domain_event_outbox where id = ${id}`;
  return row.seconds;
}

/** Fast-forwards the event's backoff: its retry is due now. */
export async function makeRetryDue(id: string): Promise<void> {
  await testSql`update public.domain_event_outbox set next_attempt_at = now() where id = ${id}`;
}

/** Drains until a run handles nothing (backlog of other files included); fails loudly if it never settles. */
export async function drainUntilIdle(): Promise<void> {
  for (let run = 0; run < 20; run += 1) {
    const outcome = await NotificationEventProcessor.drain();
    if (outcome.processed + outcome.malformed + outcome.retrying + outcome.failed === 0) return;
  }
  throw new Error("the outbox did not settle after 20 drains");
}

/** One notification row seeded directly (its own consumed outbox event), for read-side tests. */
export async function seedNotification(
  recipient: Sunner,
  seed: { type?: NotificationType; params?: Record<string, unknown>; occurredAt?: string; read?: boolean; actorId?: string | null; count?: number } = {},
): Promise<string> {
  const eventId = await insertRawEvent("SeededForTest", {});
  await testSql`update public.domain_event_outbox set consumed_at = now() where id = ${eventId}`;
  const type = seed.type ?? "secret_box_granted";
  const dedupeKey = type === "heart_received" ? String(seed.params?.kudoId ?? eventId) : type === "hero_tier_up" ? String(seed.params?.tier ?? "new") : null;
  const [row] = await testSql<{ id: string }[]>`
    insert into public.notifications (recipient_id, type, event_id, actor_id, dedupe_key, params, count, occurred_at, read_at)
    values (${recipient.id}, ${type}, ${eventId}, ${seed.actorId ?? null}, ${dedupeKey}, ${JSON.stringify(seed.params ?? {})}::jsonb,
            ${seed.count ?? 1}, coalesce(${seed.occurredAt ?? null}::timestamptz, now()), ${seed.read ? new Date().toISOString() : null})
    returning id`;
  return row.id;
}

export async function cleanupNotificationTest(users: Sunner[]): Promise<void> {
  const ids = [...createdEvents];
  createdEvents.clear();
  if (ids.length > 0) await testDb.delete(domainEventOutbox).where(inArray(domainEventOutbox.id, ids));
  await cleanupSunners(users);
}
