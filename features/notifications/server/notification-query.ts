import "server-only";
import { sql } from "drizzle-orm";
import { encodeKudoFeedCursor } from "@/features/kudos-feed/server/kudo-feed-cursor";
import { db } from "@/shared/db/client";
import type { NotificationPage, NotificationType } from "../schemas/notification-views";
import type { NotificationCursor } from "./notification-list-params";
import { toNotificationView } from "./notification-view-mapper";

/**
 * NotificationQuery (A5; the unread count is notification-unread-query.ts). Callers pass the SESSION user id; every statement filters
 * `recipient_id` (Drizzle bypasses RLS, C-20). No caching: every call reads current data.
 */
type ListRow = {
  id: string;
  type: NotificationType;
  count: number;
  params: Record<string, unknown>;
  occurred_at: string;
  cursor_at: string;
  read_at: string | null;
  actor_name: string | null;
  anonymous_nickname: string | null;
  kudo_recipient_name: string | null;
};

const UUID_TEXT = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

/**
 * Newest first by `(occurred_at, id)` (BR-009), keyset-paged with phase 05's µs cursor. Names are
 * joined fresh (never copied into rows). Anonymity follows the kudo's CURRENT state (it is editable):
 * the actor's name is selected only for a kudo that is not anonymous now, the nickname only for one
 * that is (BR-006) — the other value never leaves the database. Heart rows get the kudo's recipient.
 */
async function list(userId: string, options: { limit: number; cursor: NotificationCursor | null }): Promise<NotificationPage> {
  const after = options.cursor
    ? sql`and (n.occurred_at, n.id) < (${options.cursor.occurredAt}::timestamptz, ${options.cursor.id}::uuid)`
    : sql``;
  const rows = await db.execute<ListRow>(sql`
    select n.id, n.type::text as type, n.count, n.params, n.read_at::text as read_at,
           to_char(n.occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as occurred_at,
           to_char(n.occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_at,
           case when n.type = 'kudo_received' and k.is_anonymous is not true then actor.full_name end as actor_name,
           case when n.type = 'kudo_received' and k.is_anonymous then k.anonymous_nickname end as anonymous_nickname,
           case when n.type = 'heart_received' then kudo_recipient.full_name end as kudo_recipient_name
    from public.notifications n
    left join public.kudos k
      on n.type in ('kudo_received', 'heart_received')
     and k.id = case when n.params ->> 'kudoId' ~* ${UUID_TEXT} then (n.params ->> 'kudoId')::uuid end
    left join public.profiles actor on actor.id = n.actor_id
    left join public.profiles kudo_recipient on n.type = 'heart_received' and kudo_recipient.id = k.recipient_id
    where n.recipient_id = ${userId}::uuid ${after}
    order by n.occurred_at desc, n.id desc
    limit ${options.limit + 1}`);

  const page = rows.slice(0, options.limit);
  const last = page.at(-1);
  return {
    items: page.map((row) =>
      toNotificationView({
        id: row.id,
        type: row.type,
        occurredAt: row.occurred_at,
        readAt: row.read_at,
        count: row.count,
        params: row.params,
        actorName: row.actor_name,
        anonymousNickname: row.anonymous_nickname,
        kudoRecipientName: row.kudo_recipient_name,
      }),
    ),
    nextCursor: rows.length > options.limit && last ? encodeKudoFeedCursor({ createdAt: last.cursor_at, id: last.id }) : null,
  };
}

export const NotificationQuery = { list } as const;
