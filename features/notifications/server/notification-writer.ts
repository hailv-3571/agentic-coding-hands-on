import "server-only";
import { sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import type { NotificationDraft } from "./map-event-to-notifications";

/**
 * Writes the drafts of ONE outbox event inside the processor's transaction (A1 write step).
 * - Every row takes the event's `occurred_at` (BR-009: the time of the fact, not of the drain).
 * - A recipient whose profile no longer exists is skipped (`INSERT … SELECT … FROM profiles`), so a
 *   deleted account never turns an event into a retry loop.
 * - heart_received upserts the recipient's UNREAD row for that kudo (partial unique index, BR-004):
 *   count + 1 and occurred_at moved to the latest event (never back). Concurrent upserts serialize on
 *   the index; a row read meanwhile no longer matches the predicate, so a new unread row is opened.
 * - every other type is `ON CONFLICT DO NOTHING` over all unique keys: (event_id, recipient_id, type)
 *   for a re-delivered event (BR-001) and (recipient_id, dedupe_key) for a tier already notified (BR-005).
 * Both statements fire the realtime signal trigger (INSERT, or UPDATE OF count).
 */
async function upsertUnreadHeart(tx: DbTx, eventId: string, draft: NotificationDraft): Promise<void> {
  await tx.execute(sql`
    insert into public.notifications (recipient_id, type, event_id, dedupe_key, params, occurred_at)
    select p.id, 'heart_received', e.id, ${draft.dedupeKey}, ${JSON.stringify(draft.params)}::jsonb, e.occurred_at
    from public.profiles p, public.domain_event_outbox e
    where p.id = ${draft.recipientId}::uuid and e.id = ${eventId}::uuid
    on conflict (recipient_id, dedupe_key) where type = 'heart_received' and read_at is null
    do update set count = public.notifications.count + 1,
                  occurred_at = greatest(public.notifications.occurred_at, excluded.occurred_at)`);
}

async function insertOnce(tx: DbTx, eventId: string, draft: NotificationDraft): Promise<void> {
  await tx.execute(sql`
    insert into public.notifications (recipient_id, type, event_id, actor_id, dedupe_key, params, occurred_at)
    select p.id, ${draft.type}::public.notification_type, e.id, ${draft.actorId}::uuid, ${draft.dedupeKey},
           ${JSON.stringify(draft.params)}::jsonb, e.occurred_at
    from public.profiles p, public.domain_event_outbox e
    where p.id = ${draft.recipientId}::uuid and e.id = ${eventId}::uuid
    on conflict do nothing`);
}

async function write(tx: DbTx, eventId: string, drafts: NotificationDraft[]): Promise<void> {
  for (const draft of drafts) {
    await (draft.type === "heart_received" ? upsertUnreadHeart(tx, eventId, draft) : insertOnce(tx, eventId, draft));
  }
}

export const NotificationWriter = { write } as const;
