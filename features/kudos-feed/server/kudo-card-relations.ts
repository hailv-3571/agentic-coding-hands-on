import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { hashtags, kudoHashtags, kudoImages } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { KudoCardHashtag, KudoCardImage } from "../schemas/kudo-card-view";
import type { KudoCardRelations } from "./kudo-row-mask";
import { signKudoImageReadUrls } from "./kudo-image-read-urls";

/**
 * Hashtags and images of a whole page in two statements (by id list, never per card), then one
 * Storage call to sign every image of the page. Hashtags keep seed order, images `position` order.
 * Every attached hashtag is shown, including one BTC deactivated later (it was valid when sent).
 */
function groupBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const group = groups.get(keyOf(row));
    if (group) group.push(row);
    else groups.set(keyOf(row), [row]);
  }
  return groups;
}

export async function loadKudoCardRelations(kudoIds: string[], locale: Locale): Promise<Map<string, KudoCardRelations>> {
  if (kudoIds.length === 0) return new Map();
  const [tagRows, imageRows] = await Promise.all([
    db
      .select({ kudoId: kudoHashtags.kudoId, id: hashtags.id, labelVi: hashtags.labelVi, labelEn: hashtags.labelEn })
      .from(kudoHashtags)
      .innerJoin(hashtags, eq(hashtags.id, kudoHashtags.hashtagId))
      .where(inArray(kudoHashtags.kudoId, kudoIds))
      .orderBy(asc(hashtags.sortOrder), asc(hashtags.slug)),
    db
      .select({ kudoId: kudoImages.kudoId, path: kudoImages.storagePath, position: kudoImages.position })
      .from(kudoImages)
      .where(inArray(kudoImages.kudoId, kudoIds))
      .orderBy(asc(kudoImages.kudoId), asc(kudoImages.position)),
  ]);
  const signed = await signKudoImageReadUrls(imageRows.map((row) => row.path));
  const tagsByKudo = groupBy(tagRows, (row) => row.kudoId);
  const imagesByKudo = groupBy(imageRows, (row) => row.kudoId);

  return new Map(
    kudoIds.map((kudoId) => {
      const tags: KudoCardHashtag[] = (tagsByKudo.get(kudoId) ?? []).map((row) => ({
        id: row.id,
        label: locale === "en" ? row.labelEn : row.labelVi,
      }));
      const images: KudoCardImage[] = (imagesByKudo.get(kudoId) ?? []).map((row) => ({
        position: row.position,
        url: signed.get(row.path) ?? null,
      }));
      return [kudoId, { hashtags: tags, images }];
    }),
  );
}
