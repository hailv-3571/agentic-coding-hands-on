import { sql } from "drizzle-orm";
import { check, index, pgTable, smallint, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { kudos } from "./kudos";
import { profiles } from "./profiles";

/**
 * Hearts on Kudos (F005, phase 06). One row per (Kudo, Sunner) — the UNIQUE constraint makes
 * `INSERT … ON CONFLICT DO NOTHING` idempotent under concurrent clicks (BR-001, FR-403); it also
 * serves every lookup by `kudo_id`. `multiplier` is snapshotted at heart time (1, or the x2
 * campaign multiplier) and never updated (BR-004). Spam is filtered at query time (D006), so rows
 * are kept. RLS on, no client policy (C-20, overrides the spec's `user_id = auth.uid()` policy).
 */
export const kudoHearts = pgTable(
  "kudo_hearts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kudoId: uuid("kudo_id")
      .notNull()
      .references(() => kudos.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    multiplier: smallint("multiplier").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("kudo_hearts_kudo_id_user_id_unique").on(table.kudoId, table.userId),
    index("kudo_hearts_user_id_idx").on(table.userId),
    check("kudo_hearts_multiplier_positive", sql`${table.multiplier} >= 1`),
  ],
).enableRLS();

export type KudoHeart = typeof kudoHearts.$inferSelect;
