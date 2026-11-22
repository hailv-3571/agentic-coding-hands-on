import "server-only";
import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { kudos } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { buildKudoCardViews } from "./build-kudo-card-views";
import { decodeKudoFeedCursor, encodeKudoFeedCursor, InvalidKudoFeedCursorError, type KudoFeedCursor } from "./kudo-feed-cursor";
import { kudoContentConditions, publicKudoIdsSubquery } from "./kudo-public-filters";
import { selectKudoPublicRows } from "./kudo-public-select";

/**
 * KudoPublicQuery — the ONE public read path for Kudos (Live board feed + Highlight + detail in
 * phase 05, profile in phase 12). Base filter `status = 'public'`; every row goes through
 * `maskKudoRow`. Admins get no special treatment (their view of real senders is phase 08's).
 * Order `(created_at DESC, id DESC)`, keyset cursor, index-backed (migration *_kudos_feed_indexes).
 */
export const FEED_PAGE_SIZE = 10;
export const FEED_PAGE_SIZE_MAX = 50;

export type KudoListOptions = {
  viewerId: string;
  locale: Locale;
  recipientId?: string;
  senderId?: string;
  hashtagId?: string;
  departmentId?: string;
  /** Opaque, from a previous page's `nextCursor`. */
  cursor?: string;
  /** 1..50, default 10. */
  limit?: number;
  /** Honoured ONLY when `senderId === viewerId`: adds the viewer's own spam, flagged `isSpam`. */
  includeOwnSpam?: boolean;
};

export type KudoListPage = { items: KudoCardView[]; nextCursor?: string };

/** The row filters of `list` (no paging, no locale): what `count` takes. */
export type KudoListFilters = Omit<KudoListOptions, "locale" | "cursor" | "limit">;

const ListOptionsSchema = z.object({
  viewerId: z.uuid(),
  recipientId: z.uuid().optional(),
  senderId: z.uuid().optional(),
  hashtagId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  limit: z.number().int().min(1).max(FEED_PAGE_SIZE_MAX).optional(),
});

function listConditions(options: KudoListFilters, cursor: KudoFeedCursor | null): SQL | undefined {
  const { viewerId, senderId, recipientId } = options;
  const ownSentList = senderId !== undefined && senderId === viewerId;
  return and(
    ownSentList && options.includeOwnSpam ? inArray(kudos.status, ["public", "spam"]) : eq(kudos.status, "public"),
    recipientId === undefined ? undefined : eq(kudos.recipientId, recipientId),
    // C-05: filtering by sender must not reveal who sent anonymous Kudos (set difference).
    senderId === undefined ? undefined : and(eq(kudos.senderId, senderId), or(eq(kudos.isAnonymous, false), eq(kudos.senderId, viewerId))),
    ...kudoContentConditions(options),
    cursor ? sql`(${kudos.createdAt}, ${kudos.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)` : undefined,
  );
}

/**
 * One page of masked cards. Throws `InvalidKudoFeedCursorError` for a cursor it did not issue and
 * `RangeError` for malformed ids or limit (route handlers validate with Zod and answer 400 first).
 */
async function list(options: KudoListOptions): Promise<KudoListPage> {
  if (!ListOptionsSchema.safeParse(options).success) throw new RangeError("invalid KudoPublicQuery.list options");
  const cursor = options.cursor === undefined ? null : decodeKudoFeedCursor(options.cursor);
  if (options.cursor !== undefined && !cursor) throw new InvalidKudoFeedCursorError();
  const limit = options.limit ?? FEED_PAGE_SIZE;

  const rows = await selectKudoPublicRows(listConditions(options, cursor))
    .orderBy(desc(kudos.createdAt), desc(kudos.id))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const items = await buildKudoCardViews(page, options.viewerId, options.locale);
  if (rows.length <= limit || !last) return { items };
  return { items, nextCursor: encodeKudoFeedCursor({ createdAt: last.cursorAt, id: last.id }) };
}

/**
 * Detail (C-17, FR-403): a public Kudo for anyone; a spam Kudo only for its sender (`isSpam: true`,
 * read-only). A malformed id, an unknown id and someone else's spam all give the same null → the
 * page calls `notFound()` once, so the answer is no existence oracle.
 */
async function findForViewer(id: string, viewerId: string, locale: Locale): Promise<KudoCardView | null> {
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(viewerId).success) return null;
  const visible = or(eq(kudos.status, "public"), and(eq(kudos.status, "spam"), eq(kudos.senderId, viewerId)));
  const rows = await selectKudoPublicRows(and(eq(kudos.id, id), visible)).limit(1);
  const [view] = await buildKudoCardViews(rows, viewerId, locale);
  return view ?? null;
}

/**
 * How many rows `list` serves across all its pages for the same filters (phase 12 BR-006: the
 * profile's "Đã gửi (n)" / "Đã nhận (n)" equal what paginating shows). Same `listConditions`, so the
 * C-05 sender guard and `includeOwnSpam` apply identically; `kudos.sender_id`/`recipient_id` are
 * NOT NULL foreign keys, so the joins of `list` never drop a row this count includes.
 */
async function count(filters: KudoListFilters): Promise<number> {
  if (!ListOptionsSchema.safeParse(filters).success) throw new RangeError("invalid KudoPublicQuery.count filters");
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(kudos).where(listConditions(filters, null));
  return row?.total ?? 0;
}

export const KudoPublicQuery = { list, count, findForViewer, publicKudoIdsSubquery } as const;
