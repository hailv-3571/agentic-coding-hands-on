import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Transactional outbox shared by every feature (C-16/C-01/C-03), consumed by F013.
 * Rows are written only through `DomainEventOutbox.add(tx, …)` inside the business
 * transaction; payloads hold ids only (validated in shared/events/domain-event-types.ts).
 */
export const domainEventOutbox = pgTable(
  "domain_event_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    /** Earliest retry after a failed attempt (exponential backoff, phase 13); null = due now. */
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    lastError: text("last_error"),
  },
  (table) => [
    // Processor scan order for pending events (`FOR UPDATE SKIP LOCKED`, phase 13).
    index("domain_event_outbox_pending_idx")
      .on(table.occurredAt, table.id)
      .where(sql`${table.consumedAt} is null and ${table.failedAt} is null`),
  ],
);

export type DomainEventOutboxRow = typeof domainEventOutbox.$inferSelect;
