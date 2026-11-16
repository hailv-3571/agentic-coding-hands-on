import "server-only";
import { randomUUID } from "node:crypto";
import { and, count, eq, gt, inArray, sql } from "drizzle-orm";
import { db, type DbTx } from "@/shared/db/client";
import { kudoImageUploads, kudoImages } from "@/shared/db/schema";
import { getSupabaseServiceClient } from "@/shared/db/supabase-service-client";
import { KUDO_IMAGE_BUCKET, KUDO_IMAGE_EXTENSIONS, KUDO_LIMITS, type KudoImageContentType } from "../kudo-authoring-limits";
import type { KudoImageUploadTicket } from "../schemas/kudo-image-sign-schema";
import { KudoWriteError } from "./kudo-write-error";

/**
 * Kudo image uploads (BR-003 without a sender folder, phase 01: no sender id in object paths).
 * 1. `signKudoImageUpload` issues `kudos/{uuid}.{ext}`, records who asked for it in
 *    `kudo_image_uploads`, and returns a signed upload URL for the browser.
 * 2. `claimKudoImageUploads` (inside the write transaction) accepts a path only if that row names
 *    the sender AND the object really exists in `storage.objects`; on edit, paths already attached
 *    to the same Kudo are accepted too.
 */
export async function signKudoImageUpload(
  uploaderId: string,
  contentType: KudoImageContentType,
): Promise<KudoImageUploadTicket> {
  const path = `kudos/${randomUUID()}.${KUDO_IMAGE_EXTENSIONS[contentType]}`;
  await recordUploadWithinCap(uploaderId, path);
  // The signed URL is built from the configured Supabase URL, never from the request's Host.
  const { data, error } = await getSupabaseServiceClient().storage.from(KUDO_IMAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    await db.delete(kudoImageUploads).where(eq(kudoImageUploads.storagePath, path));
    throw error ?? new Error("createSignedUploadUrl returned no data");
  }
  return { path, token: data.token, signedUrl: data.signedUrl };
}

/**
 * Inserts the upload row unless the Sunner already holds PENDING_UPLOADS_MAX pending uploads
 * from the last PENDING_UPLOADS_WINDOW_HOURS (review W2) → UPLOAD_LIMIT. A transaction-scoped
 * advisory lock per uploader serializes the count + insert, so a parallel burst cannot overshoot;
 * other uploaders and the write path never wait on it. Index: (uploader_id, created_at).
 */
async function recordUploadWithinCap(uploaderId: string, path: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('kudo_image_uploads'), hashtext(${uploaderId}))`);
    const windowStart = sql`now() - make_interval(hours => ${KUDO_LIMITS.PENDING_UPLOADS_WINDOW_HOURS}::int)`;
    const [{ pending }] = await tx
      .select({ pending: count() })
      .from(kudoImageUploads)
      .where(and(eq(kudoImageUploads.uploaderId, uploaderId), gt(kudoImageUploads.createdAt, windowStart)));
    if (pending >= KUDO_LIMITS.PENDING_UPLOADS_MAX) throw new KudoWriteError("UPLOAD_LIMIT");
    await tx.insert(kudoImageUploads).values({ storagePath: path, uploaderId });
  });
}

/**
 * Checks every path in `paths` and returns the fresh ones (not yet attached to `kudoId`), whose
 * upload rows the caller deletes once attached. Upload rows are locked FOR UPDATE, so two writes
 * racing for one path cannot both win: the loser re-reads a deleted row and gets IMAGE_INVALID.
 * They are locked in storage_path order (review W1): two writes claiming overlapping paths in a
 * different order then queue on the first shared row instead of deadlocking.
 */
export async function claimKudoImageUploads(
  tx: DbTx,
  senderId: string,
  paths: string[],
  kudoId?: string,
): Promise<string[]> {
  if (paths.length === 0) return [];
  const attached = kudoId
    ? await tx
        .select({ path: kudoImages.storagePath })
        .from(kudoImages)
        .where(and(eq(kudoImages.kudoId, kudoId), inArray(kudoImages.storagePath, paths)))
    : [];
  const attachedPaths = new Set(attached.map((row) => row.path));
  const fresh = paths.filter((path) => !attachedPaths.has(path));
  if (fresh.length === 0) return [];

  const usable = await tx
    .select({ path: kudoImageUploads.storagePath })
    .from(kudoImageUploads)
    .where(
      and(
        inArray(kudoImageUploads.storagePath, fresh),
        eq(kudoImageUploads.uploaderId, senderId),
        sql`exists (select 1 from storage.objects o
                    where o.bucket_id = ${KUDO_IMAGE_BUCKET} and o.name = ${kudoImageUploads.storagePath})`,
      ),
    )
    .orderBy(kudoImageUploads.storagePath)
    .for("update");
  if (usable.length !== fresh.length) throw new KudoWriteError("IMAGE_INVALID", { imagePaths: ["imageNotOwned"] });
  return fresh;
}
