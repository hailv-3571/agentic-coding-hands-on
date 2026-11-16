import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { hashtags, kudoHashtags, kudoImageUploads, kudoImages, kudos, profiles } from "@/shared/db/schema";
import type { KudoCreateData, KudoUpdateData } from "../schemas/kudo-input-schema";
import { claimKudoImageUploads } from "./kudo-image-upload-service";
import { KudoWriteError } from "./kudo-write-error";

/**
 * Transaction steps of the Kudo write side (tech spec A4/A5). Each check throws KudoWriteError,
 * which rolls the caller's transaction back. Cross-row rules (1–5 active hashtags, ≤ 5 owned
 * images) live here; single-row rules are also DB CHECKs (`*_kudos_constraints.sql`).
 * There is deliberately no delete of `kudos` anywhere (decision-log: nobody deletes a Kudo).
 */

type EditableFields = Pick<KudoUpdateData, "title" | "body" | "hashtagIds" | "imagePaths" | "isAnonymous" | "anonymousNickname">;

async function assertRecipientExists(tx: DbTx, recipientId: string): Promise<void> {
  const [row] = await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, recipientId)).limit(1);
  if (!row) throw new KudoWriteError("RECIPIENT_INVALID", { recipientId: ["recipientInvalid"] });
}

/** FR-002 + decision-log: every hashtag must exist in the seeded list and still be active. */
async function assertHashtagsActive(tx: DbTx, hashtagIds: string[]): Promise<void> {
  const rows = await tx
    .select({ id: hashtags.id })
    .from(hashtags)
    .where(and(inArray(hashtags.id, hashtagIds), eq(hashtags.isActive, true)));
  if (rows.length !== hashtagIds.length) throw new KudoWriteError("HASHTAG_INVALID", { hashtagIds: ["hashtagInactive"] });
}

/** Replaces the Kudo's hashtag and image sets; images keep the given order as position 0..4. */
async function replaceChildren(tx: DbTx, kudoId: string, fields: EditableFields, freshUploads: string[]): Promise<void> {
  await tx.delete(kudoHashtags).where(eq(kudoHashtags.kudoId, kudoId));
  await tx.insert(kudoHashtags).values(fields.hashtagIds.map((hashtagId) => ({ kudoId, hashtagId })));
  await tx.delete(kudoImages).where(eq(kudoImages.kudoId, kudoId));
  if (fields.imagePaths.length > 0) {
    await tx
      .insert(kudoImages)
      .values(fields.imagePaths.map((storagePath, position) => ({ kudoId, storagePath, position })));
  }
  // A consumed upload row can never be claimed again (by this or any other Kudo).
  if (freshUploads.length > 0) {
    await tx.delete(kudoImageUploads).where(inArray(kudoImageUploads.storagePath, freshUploads));
  }
}

const contentOf = (fields: EditableFields) => ({
  title: fields.title,
  body: fields.body,
  isAnonymous: fields.isAnonymous,
  anonymousNickname: fields.anonymousNickname,
});

/** Inserts the Kudo (status = DB default 'public') with its hashtags and images; returns its id. */
export async function insertKudoGraph(tx: DbTx, senderId: string, data: KudoCreateData): Promise<string> {
  await assertRecipientExists(tx, data.recipientId);
  await assertHashtagsActive(tx, data.hashtagIds);
  const freshUploads = await claimKudoImageUploads(tx, senderId, data.imagePaths);
  const [kudo] = await tx
    .insert(kudos)
    .values({ senderId, recipientId: data.recipientId, ...contentOf(data) })
    .returning({ id: kudos.id });
  await replaceChildren(tx, kudo.id, data, freshUploads);
  return kudo.id;
}

/**
 * C-17: one conditional UPDATE (owner AND status = 'public') — race-safe against a concurrent
 * Mark Spam, which either waits for this row lock or makes this UPDATE match nothing. Zero rows
 * → re-read to classify NOT_FOUND / FORBIDDEN / SPAM_LOCKED (no content in any of them).
 * Recipient, sender, status, created_at and hearts are never touched.
 */
export async function updateOwnPublicKudo(tx: DbTx, kudoId: string, senderId: string, data: EditableFields): Promise<void> {
  const updated = await tx
    .update(kudos)
    .set({ ...contentOf(data), updatedAt: sql`now()` })
    .where(and(eq(kudos.id, kudoId), eq(kudos.senderId, senderId), eq(kudos.status, "public")))
    .returning({ id: kudos.id });
  if (updated.length === 0) {
    const [row] = await tx.select({ senderId: kudos.senderId }).from(kudos).where(eq(kudos.id, kudoId)).limit(1);
    if (!row) throw new KudoWriteError("NOT_FOUND");
    throw new KudoWriteError(row.senderId === senderId ? "SPAM_LOCKED" : "FORBIDDEN");
  }
  await assertHashtagsActive(tx, data.hashtagIds);
  const freshUploads = await claimKudoImageUploads(tx, senderId, data.imagePaths, kudoId);
  await replaceChildren(tx, kudoId, data, freshUploads);
}
