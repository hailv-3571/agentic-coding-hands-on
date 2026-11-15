import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

/**
 * Reference data owned by the foundation phase (C-15), loaded by `db/seeds/` with
 * upsert-by-key so BTC can edit the seed files and re-run safely.
 * RLS is enabled with no client policies (migration 0002, C-20).
 */

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const hashtags = pgTable("hashtags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  labelVi: text("label_vi").notNull(),
  labelEn: text("label_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export type Department = typeof departments.$inferSelect;
export type Hashtag = typeof hashtags.$inferSelect;
