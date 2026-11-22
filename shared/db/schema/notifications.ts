import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { domainEventOutbox } from "./domain-event-outbox";
import { profiles } from "./profiles";

/**
 * Notifications (F013, phase 13, C-20): one row per (outbox event, recipient, type), written only by
 * the outbox processor (features/notifications/server). RLS on, no client policy, no client grant:
 * reads/writes go through session-gated server code that always filters `recipient_id`.
 * Copy is never stored (BR-010): `type` + `params` + `count`, rendered by next-intl on the client.
 * `params` hold ids/values only (kudoId, tier, giftName, …), never a sender id or name (BR-006).
 * The `notifications` AFTER INSERT / UPDATE OF count trigger (custom migration *_notifications_realtime)
 * sends the content-free Broadcast signal.
 */
export const notificationType = pgEnum("notification_type", [
  "kudo_received",
  "heart_received",
  "secret_box_granted",
  "hero_tier_up",
  "kudo_hidden_spam",
  "icon_set_completed",
  "national_kudos",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    /**
     * The outbox event that produced the row (an aggregated heart row keeps its first event). Set to
     * null when that event is cleaned out of the outbox, so the history survives outbox pruning; the
     * processor always writes it non-null, and a deleted event can never be replayed (BR-001 intact).
     */
    eventId: uuid("event_id").references(() => domainEventOutbox.id, { onDelete: "set null" }),
    /** Non-anonymous kudo sender of `kudo_received`; null otherwise (anonymous, or no actor). */
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    /** `heart_received`: the kudo id (aggregation while unread). `hero_tier_up`: the tier. Else null. */
    dedupeKey: text("dedupe_key"),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    count: integer("count").notNull().default(1),
    /** Time of the latest event folded into the row: list order (BR-009). */
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // BR-001 final guard (inserts always carry a non-null event_id); its leading `event_id` also
    // serves the outbox FK's ON DELETE SET NULL lookup.
    unique("notifications_event_id_recipient_id_type_unique").on(table.eventId, table.recipientId, table.type),
    // BR-004: at most one UNREAD heart row per (recipient, kudo); a read row frees the key.
    uniqueIndex("notifications_unread_heart_dedupe_unique")
      .on(table.recipientId, table.dedupeKey)
      .where(sql`${table.type} = 'heart_received' and ${table.readAt} is null`),
    // BR-005: one tier-up per (recipient, tier), ever.
    uniqueIndex("notifications_hero_tier_dedupe_unique")
      .on(table.recipientId, table.dedupeKey)
      .where(sql`${table.type} = 'hero_tier_up'`),
    // List order `(occurred_at DESC, id DESC)`; `.nullsFirst()` = Postgres' plain DESC (see kudos.ts).
    index("notifications_recipient_occurred_at_id_idx").on(
      table.recipientId,
      table.occurredAt.desc().nullsFirst(),
      table.id.desc().nullsFirst(),
    ),
    index("notifications_recipient_unread_idx").on(table.recipientId).where(sql`${table.readAt} is null`),
    check("notifications_count_positive", sql`${table.count} >= 1`),
    check("notifications_params_object", sql`jsonb_typeof(${table.params}) = 'object'`),
    check(
      "notifications_dedupe_key_matches_type",
      sql`(${table.type} in ('heart_received', 'hero_tier_up')) = (${table.dedupeKey} is not null)`,
    ),
  ],
).enableRLS();

export type NotificationRow = typeof notifications.$inferSelect;
