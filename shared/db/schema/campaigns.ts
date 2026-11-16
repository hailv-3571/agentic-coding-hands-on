import { sql } from "drizzle-orm";
import { bigint, check, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * x2 heart campaigns (F011, phase 06). Instants are stored in UTC and entered/displayed in
 * ADMIN_TIMEZONE (BR-006). `id` is an identity number because Admin › Settings shows it in the
 * narrow ID column (Figma 820:10492, tech spec § 4.2). The phase (upcoming / active / ended) is
 * computed, never stored. No-overlap on `tstzrange(starts_at, ends_at, '[)')` is an EXCLUDE
 * constraint drizzle cannot express: hand-written migration *_campaigns_no_overlap_exclude.sql.
 * RLS on, no client policy (C-20).
 */
export const campaigns = pgTable(
  "campaigns",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    /** 1–100 characters after trim (D007); the Server Action trims, duplicates are allowed. */
    name: varchar("name", { length: 100 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("campaigns_ends_after_starts", sql`${table.endsAt} > ${table.startsAt}`),
    check("campaigns_name_not_blank", sql`btrim(${table.name}) <> ''`),
  ],
).enableRLS();

export type Campaign = typeof campaigns.$inferSelect;
