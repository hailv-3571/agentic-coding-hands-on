import "server-only";
import { asc, eq } from "drizzle-orm";
import { findSunnerOptionsByIds } from "@/features/sunner-search/server/sunner-search-query";
import { db } from "@/shared/db/client";
import { kudoImages, kudos } from "@/shared/db/schema";
import { getSupabaseServiceClient } from "@/shared/db/supabase-service-client";
import type { Locale } from "@/shared/i18n/locales";
import { KUDO_IMAGE_BUCKET } from "../kudo-authoring-limits";
import type { KudoEditPrefill } from "../schemas/kudo-edit-prefill";
import { listActiveHashtagsOfKudo } from "./hashtag-list-query";

/**
 * Edit-mode load (FR-401, C-17 edit side). Owner only; a non-owner learns nothing but
 * "forbidden". A spam Kudo still loads for its owner, flagged `locked`.
 */
export type KudoEditLookup = { status: "ok"; prefill: KudoEditPrefill } | { status: "not_found" } | { status: "forbidden" };

/** Lifetime of the signed preview URLs of already attached images (the bucket is private). */
const PREVIEW_URL_SECONDS = 10 * 60;

async function previewUrlsByPath(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await getSupabaseServiceClient()
    .storage.from(KUDO_IMAGE_BUCKET)
    .createSignedUrls(paths, PREVIEW_URL_SECONDS);
  if (error || !data) {
    console.error("[kudos] signing image previews failed", error);
    return new Map(); // the form still opens; thumbnails fall back to a placeholder
  }
  return new Map(data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])));
}

export async function getKudoForEdit(kudoId: string, viewerId: string, locale: Locale): Promise<KudoEditLookup> {
  const [kudo] = await db
    .select({
      id: kudos.id,
      senderId: kudos.senderId,
      recipientId: kudos.recipientId,
      title: kudos.title,
      body: kudos.body,
      isAnonymous: kudos.isAnonymous,
      anonymousNickname: kudos.anonymousNickname,
      status: kudos.status,
    })
    .from(kudos)
    .where(eq(kudos.id, kudoId))
    .limit(1);
  if (!kudo) return { status: "not_found" };
  if (kudo.senderId !== viewerId) return { status: "forbidden" };

  const [[recipient], hashtags, images] = await Promise.all([
    findSunnerOptionsByIds([kudo.recipientId], locale),
    listActiveHashtagsOfKudo(kudo.id, locale),
    db
      .select({ path: kudoImages.storagePath, position: kudoImages.position })
      .from(kudoImages)
      .where(eq(kudoImages.kudoId, kudo.id))
      .orderBy(asc(kudoImages.position)),
  ]);
  const previews = await previewUrlsByPath(images.map((image) => image.path));

  return {
    status: "ok",
    prefill: {
      id: kudo.id,
      recipient,
      title: kudo.title,
      body: kudo.body,
      hashtags,
      images: images.map((image) => ({ ...image, previewUrl: previews.get(image.path) ?? null })),
      isAnonymous: kudo.isAnonymous,
      anonymousNickname: kudo.anonymousNickname,
      locked: kudo.status !== "public",
    },
  };
}
