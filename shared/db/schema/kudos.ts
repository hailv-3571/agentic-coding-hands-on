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

export const kudos = pgTable("kudos", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

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
