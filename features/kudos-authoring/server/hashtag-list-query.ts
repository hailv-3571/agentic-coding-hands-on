import "server-only";
import { and, asc, eq, type SQL } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { hashtags, kudoHashtags } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { HashtagOption } from "../schemas/kudo-edit-prefill";

/**
 * Hashtag choices (FR-002: only the seeded list, never free text), active only, in seed order,
 * label by locale. Shared by GET /api/hashtags and the edit prefill.
 */
async function selectActiveHashtags(locale: Locale, kudoId?: string): Promise<HashtagOption[]> {
  const active: SQL = eq(hashtags.isActive, true);
  const columns = { id: hashtags.id, labelVi: hashtags.labelVi, labelEn: hashtags.labelEn };
  const rows = kudoId
    ? await db
        .select(columns)
        .from(kudoHashtags)
        .innerJoin(hashtags, eq(hashtags.id, kudoHashtags.hashtagId))
        .where(and(eq(kudoHashtags.kudoId, kudoId), active))
        .orderBy(asc(hashtags.sortOrder), asc(hashtags.slug))
    : await db.select(columns).from(hashtags).where(active).orderBy(asc(hashtags.sortOrder), asc(hashtags.slug));
  return rows.map((row) => ({ id: row.id, label: locale === "en" ? row.labelEn : row.labelVi }));
}

export function listActiveHashtags(locale: Locale): Promise<HashtagOption[]> {
  return selectActiveHashtags(locale);
}

/** The Kudo's hashtags that are still active (an inactive one has to be re-picked on edit). */
export function listActiveHashtagsOfKudo(kudoId: string, locale: Locale): Promise<HashtagOption[]> {
  return selectActiveHashtags(locale, kudoId);
}
