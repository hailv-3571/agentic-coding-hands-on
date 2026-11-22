import "server-only";
import { asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { heartCountsSubquery } from "@/features/kudos-hearts/server/heart-ranking-query";
import { db } from "@/shared/db/client";
import { hashtags, kudoHashtags, kudos, profiles } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { AdminKudoRow, AdminKudoSort } from "../schemas/admin-kudo-row";

/**
 * Admin rows for a filter (`buildAdminKudoWhere`) in table order — the shared core of the table page
 * and the CSV export (BR-002: one order). ADMIN-ONLY: joins the REAL sender (C-13); it never reuses
 * kudos-feed masking and nothing public may import it. Hearts are the raw count of phase 06
 * `heartCountsSubquery` (D010), bounded to the page's ids for "newest" and to the filtered set for a
 * Heart sort; every order ends with `id DESC`, a total order, so pages never repeat or skip a row.
 * Hashtags load in one statement for the whole page (no N+1).
 */
export type AdminKudoPageWindow = { limit: number; offset: number };

const sender = alias(profiles, "sender");
const receiver = alias(profiles, "receiver");
const moderator = alias(profiles, "moderator");

const newestFirst = [desc(kudos.createdAt), desc(kudos.id)];

function heartCounts(where: SQL | undefined, sort: AdminKudoSort, window?: AdminKudoPageWindow) {
  const filtered = db.select({ id: kudos.id }).from(kudos).where(where).$dynamic();
  if (sort === "newest" && window) filtered.orderBy(...newestFirst).limit(window.limit).offset(window.offset);
  return heartCountsSubquery(filtered);
}

async function hashtagLabelsByKudo(kudoIds: string[], locale: Locale): Promise<Map<string, string[]>> {
  const labels = new Map<string, string[]>();
  if (kudoIds.length === 0) return labels;
  const rows = await db
    .select({ kudoId: kudoHashtags.kudoId, labelVi: hashtags.labelVi, labelEn: hashtags.labelEn })
    .from(kudoHashtags)
    .innerJoin(hashtags, eq(hashtags.id, kudoHashtags.hashtagId))
    .where(inArray(kudoHashtags.kudoId, kudoIds))
    .orderBy(asc(hashtags.sortOrder), asc(hashtags.slug));
  for (const row of rows) {
    const label = locale === "en" ? row.labelEn : row.labelVi;
    const list = labels.get(row.kudoId) ?? [];
    list.push(label.startsWith("#") ? label : `#${label}`);
    labels.set(row.kudoId, list);
  }
  return labels;
}

export async function selectAdminKudoRows(
  where: SQL | undefined,
  sort: AdminKudoSort,
  locale: Locale,
  window?: AdminKudoPageWindow,
): Promise<AdminKudoRow[]> {
  const counts = heartCounts(where, sort, window);
  const heartCount = sql<number>`coalesce(${counts.rawCount}, 0)`.mapWith(Number);
  const order =
    sort === "newest" ? newestFirst : [sort === "hearts_asc" ? asc(heartCount) : desc(heartCount), desc(kudos.id)];
  const query = db
    .select({
      id: kudos.id,
      createdAt: kudos.createdAt,
      title: kudos.title,
      body: kudos.body,
      isAnonymous: kudos.isAnonymous,
      anonymousNickname: kudos.anonymousNickname,
      status: kudos.status,
      moderatedAt: kudos.moderatedAt,
      senderId: sender.id,
      senderName: sender.fullName,
      senderEmail: sender.email,
      receiverId: receiver.id,
      receiverName: receiver.fullName,
      receiverEmail: receiver.email,
      moderatorId: moderator.id,
      moderatorName: moderator.fullName,
      heartCount,
    })
    .from(kudos)
    .innerJoin(sender, eq(sender.id, kudos.senderId))
    .innerJoin(receiver, eq(receiver.id, kudos.recipientId))
    .leftJoin(moderator, eq(moderator.id, kudos.moderatedBy))
    .leftJoin(counts, eq(counts.kudoId, kudos.id))
    .where(where)
    .orderBy(...order)
    .$dynamic();
  if (window) query.limit(window.limit).offset(window.offset);
  const rows = await query;
  const labels = await hashtagLabelsByKudo(
    rows.map((row) => row.id),
    locale,
  );

  return rows.map((row) => ({
    id: row.id,
    shortId: row.id.slice(0, 8),
    createdAt: row.createdAt.toISOString(),
    sender: { id: row.senderId, name: row.senderName, email: row.senderEmail },
    isAnonymous: row.isAnonymous,
    anonymousNickname: row.anonymousNickname,
    receiver: { id: row.receiverId, name: row.receiverName, email: row.receiverEmail },
    title: row.title,
    message: row.body,
    hashtags: labels.get(row.id) ?? [],
    heartCount: row.heartCount,
    status: row.status,
    moderatedBy: row.moderatorId && row.moderatorName ? { id: row.moderatorId, name: row.moderatorName } : null,
    moderatedAt: row.moderatedAt?.toISOString() ?? null,
  }));
}
