import "server-only";
import { KUDO_IMAGE_BUCKET } from "@/features/kudos-authoring/kudo-authoring-limits";
import { getSupabaseServiceClient } from "@/shared/db/supabase-service-client";

/**
 * Signed READ URLs for private `kudo-images` objects, one Storage call per page (never per card).
 * Same mechanism as the edit prefill (`kudo-edit-query.ts`, whose private helper is not exported
 * and is phase 04's file); this one is the feed's. 30 minutes: long enough for a Live board tab
 * that lazy-loads images while scrolling, short enough to stay a capability rather than a link.
 */
export const KUDO_IMAGE_READ_URL_SECONDS = 30 * 60;

/** path → signed URL. Missing entries mean "not signed" (the card shows a placeholder). */
export async function signKudoImageReadUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  try {
    const { data, error } = await getSupabaseServiceClient()
      .storage.from(KUDO_IMAGE_BUCKET)
      .createSignedUrls(paths, KUDO_IMAGE_READ_URL_SECONDS);
    if (error || !data) throw error ?? new Error("createSignedUrls returned no data");
    return new Map(data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])));
  } catch (error) {
    console.error("[kudos-feed] signing image read URLs failed", error);
    return new Map(); // the feed still renders; images fall back to a placeholder
  }
}
