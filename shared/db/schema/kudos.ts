import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { hashtags } from "./reference-data";

/**
 * Kudos write model (F003, phase 04). CHECK constraints, the unaccent search helper and the
 * explicit REVOKEs live in the hand-written `*_kudos_constraints.sql` migration. RLS on, no
 * client policy (C-20). Phase 08 adds moderation columns to `kudos`; it never re-creates
 * `kudo_status` or `status`. Phase 04 never writes `status` (always the DB default).
 */

/** DISC (C-08, owned by F007): moderation state. New Kudos are always `public` (BR-005). */
export const kudoStatus = pgEnum("kudo_status", ["public", "spam"]);

export const kudos = pgTable(
  "kudos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    /** Immutable after create (decision-log: edit every field except the recipient). */
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    /** Danh hiệu, optional (D006). */
    title: varchar("title", { length: 50 }),
    /** Raw restricted Markdown, never HTML (decision-log 2026-11-15). */
    body: text("body").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    /** Shown instead of the sender's name; set exactly when `is_anonymous` (CHECK). */
    anonymousNickname: varchar("anonymous_nickname", { length: 30 }),
    status: kudoStatus("status").notNull().default("public"),
    /** Admin of the latest Mark Spam / Un Spam (phase 08, D008); null once that profile is deleted. */
    moderatedBy: uuid("moderated_by").references(() => profiles.id, { onDelete: "set null" }),
    /** Time of the latest moderation; set whenever `moderated_by` is (CHECK, migration 0013). */
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  /**
   * Feed order `(created_at DESC, id DESC)` per filter (phase 05, migration *_kudos_feed_indexes).
   * `.nullsFirst()` makes drizzle emit Postgres' plain `DESC` (= NULLS FIRST), the order the feed's
   * `ORDER BY … DESC` asks for; drizzle's own default would be `DESC NULLS LAST`, which no
   * forward or backward scan can serve for that ORDER BY.
   */
  (table) => {
    // A fresh pair per index: drizzle resets a column's sort config once `.on()` has read it.
    const feedOrder = () => [table.createdAt.desc().nullsFirst(), table.id.desc().nullsFirst()] as const;
    return [
      index("kudos_status_created_at_id_idx").on(table.status, ...feedOrder()),
      index("kudos_recipient_id_created_at_id_idx").on(table.recipientId, ...feedOrder()),
      index("kudos_sender_id_created_at_id_idx").on(table.senderId, ...feedOrder()),
      // Hero tier aggregate (phase 09, migration *_kudos_hero_tier_index): COUNT(DISTINCT sender_id)
      // per recipient over public kudos reads only this index.
      index("kudos_public_recipient_sender_idx").on(table.recipientId, table.senderId).where(sql`${table.status} = 'public'`),
    ];
  },
).enableRLS();

/** 1–5 active hashtags per Kudo (cross-row rule enforced in the write transaction). */
export const kudoHashtags = pgTable(
  "kudo_hashtags",
  {
    kudoId: uuid("kudo_id")
      .notNull()
      .references(() => kudos.id, { onDelete: "cascade" }),
    hashtagId: uuid("hashtag_id")
      .notNull()
      .references(() => hashtags.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.kudoId, table.hashtagId] }),
    index("kudo_hashtags_hashtag_id_idx").on(table.hashtagId),
  ],
).enableRLS();

/** Up to 5 images per Kudo, ordered by `position` 0..4. Paths are `kudos/{uuid}.{ext}`. */
export const kudoImages = pgTable(
  "kudo_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kudoId: uuid("kudo_id")
      .notNull()
      .references(() => kudos.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull().unique(),
    position: smallint("position").notNull(),
  },
  (table) => [unique("kudo_images_kudo_id_position_unique").on(table.kudoId, table.position)],
).enableRLS();

/**
 * Upload paths issued by POST /api/kudos/images/sign. Replaces "path under the sender folder"
 * (BR-003): a write accepts a path only when its row names the sender AND the object exists in
 * storage.objects. Consumed rows are deleted when the path is attached to a Kudo. The sign route
 * caps pending rows per uploader in a rolling window (index below; migration 0008).
 */
export const kudoImageUploads = pgTable(
  "kudo_image_uploads",
  {
    storagePath: text("storage_path").primaryKey(),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("kudo_image_uploads_uploader_id_created_at_idx").on(table.uploaderId, table.createdAt)],
).enableRLS();

export type Kudo = typeof kudos.$inferSelect;
export type KudoStatus = (typeof kudoStatus.enumValues)[number];
