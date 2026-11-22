import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, primaryKey, smallint, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { kudos } from "./kudos";
import { profiles } from "./profiles";

/**
 * Secret Box rewards (F010, phase 10, C-20): 5 tables, RLS on, no client policy, trigger-free.
 * Icon codes = SECRET_BOX_ICON_CODES (features/secret-box-rewards/schemas/secret-box-views.ts), in
 * the same order; the migration test inserts every code of that list to keep the two in sync.
 */
const ICON_CODES_SQL = sql.raw(`('REVIVAL', 'TOUCH_OF_LIGHT', 'STAY_GOLD', 'FLOW_TO_HORIZON', 'BEYOND_THE_BOUNDARY', 'ROOT_FURTHER')`);

/**
 * Prize catalog (C-15, D003), loaded from db/seeds/secret-box-prize-catalog.ts by code. Icons are
 * unlimited (stock NULL), so the icon fallback pool is never empty; gifts keep `stock_total` (BTC's
 * number) and `stock_remaining` (decremented atomically on draw) so a re-seed preserves issued stock.
 */
export const secretBoxPrizes = pgTable(
  "secret_box_prizes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    kind: text("kind").notNull().$type<"icon" | "gift">(),
    iconCode: text("icon_code"),
    name: text("name").notNull(),
    weight: integer("weight").notNull(),
    stockTotal: integer("stock_total"),
    stockRemaining: integer("stock_remaining"),
    active: boolean("active").notNull().default(true),
  },
  (table) => [
    unique("secret_box_prizes_code_unique").on(table.code),
    uniqueIndex("secret_box_prizes_icon_code_unique").on(table.iconCode).where(sql`${table.kind} = 'icon'`),
    check("secret_box_prizes_kind_valid", sql`${table.kind} in ('icon', 'gift')`),
    check("secret_box_prizes_icon_code_matches_kind", sql`(${table.kind} = 'icon') = (${table.iconCode} is not null)`),
    check("secret_box_prizes_icon_code_valid", sql`${table.iconCode} is null or ${table.iconCode} in ${ICON_CODES_SQL}`),
    check("secret_box_prizes_name_not_blank", sql`btrim(${table.name}) <> ''`),
    check("secret_box_prizes_weight_positive", sql`${table.weight} > 0`),
    check(
      "secret_box_prizes_stock_valid",
      sql`(${table.stockTotal} is null) = (${table.stockRemaining} is null) and (${table.stockRemaining} is null or ${table.stockRemaining} between 0 and ${table.stockTotal})`,
    ),
    check("secret_box_prizes_icons_unlimited", sql`${table.kind} <> 'icon' or ${table.stockTotal} is null`),
  ],
).enableRLS();

/**
 * One granted box (SM-001). `seq` numbers a user's boxes 1..n: UNIQUE(user_id, seq) backs the grant,
 * UNIQUE(user_id, open_request_id) the Idempotency-Key replay. `unopened → opened` only, with its result.
 */
export const secretBoxes = pgTable(
  "secret_boxes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    status: text("status").notNull().default("unopened").$type<"unopened" | "opened">(),
    prizeId: uuid("prize_id").references(() => secretBoxPrizes.id),
    openRequestId: uuid("open_request_id"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
  },
  (table) => [
    unique("secret_boxes_user_id_seq_unique").on(table.userId, table.seq),
    unique("secret_boxes_user_id_open_request_id_unique").on(table.userId, table.openRequestId),
    index("secret_boxes_user_id_status_idx").on(table.userId, table.status),
    index("secret_boxes_status_opened_at_idx").on(table.status, table.openedAt.desc()),
    check("secret_boxes_seq_positive", sql`${table.seq} >= 1`),
    check("secret_boxes_status_valid", sql`${table.status} in ('unopened', 'opened')`),
    check(
      "secret_boxes_opened_has_result",
      sql`(${table.status} = 'opened') = (${table.prizeId} is not null and ${table.openedAt} is not null and ${table.openRequestId} is not null)`,
    ),
  ],
).enableRLS();

/** Icons collected per user (FR-304): a duplicate only increments `quantity`. */
export const userIcons = pgTable(
  "user_icons",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    iconCode: text("icon_code").notNull(),
    quantity: integer("quantity").notNull().default(1),
    firstObtainedAt: timestamp("first_obtained_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ name: "user_icons_pk", columns: [table.userId, table.iconCode] }),
    check("user_icons_icon_code_valid", sql`${table.iconCode} in ${ICON_CODES_SQL}`),
    check("user_icons_quantity_positive", sql`${table.quantity} >= 1`),
  ],
).enableRLS();

/**
 * The one mystery gift per user for the 6-icon set (BR-005). `completed_at` = the opening box's
 * `opened_at` (same transaction, both `now()`) and is phase 14's "Time to get 6 Badges".
 */
export const mysteryGiftAwards = pgTable(
  "mystery_gift_awards",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    giftName: text("gift_name").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("mystery_gift_awards_gift_name_not_blank", sql`btrim(${table.giftName}) <> ''`)],
).enableRLS();

/** Kudos Quốc Dân (BR-008, ALG-003): at most 5 rows, written once. */
export const nationalKudos = pgTable(
  "national_kudos",
  {
    kudoId: uuid("kudo_id")
      .primaryKey()
      .references(() => kudos.id, { onDelete: "cascade" }),
    rank: smallint("rank").notNull(),
    heartsAtFinalize: integer("hearts_at_finalize").notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("national_kudos_rank_unique").on(table.rank),
    check("national_kudos_rank_range", sql`${table.rank} between 1 and 5`),
    check("national_kudos_hearts_positive", sql`${table.heartsAtFinalize} >= 1`),
  ],
).enableRLS();

export type SecretBoxPrize = typeof secretBoxPrizes.$inferSelect;
export type SecretBox = typeof secretBoxes.$inferSelect;
