import { inArray, or, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { KUDO_IMAGE_BUCKET } from "@/features/kudos-authoring/kudo-authoring-limits";
import { domainEventOutbox, kudos, profiles } from "@/shared/db/schema";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";
import { testDb, testSql } from "../../setup/integration-db";
import { createAuthUser, deleteAuthUsers, departmentIdByCode, uniqueEmail } from "../auth/auth-test-users";

/**
 * Fixtures for the F003 integration tests on the local Supabase stack: onboarded Sunners,
 * seeded hashtags, real Storage uploads, and cleanup that leaves no kudos, outbox rows,
 * objects or auth users behind (kudos.sender_id is ON DELETE RESTRICT, so kudos go first).
 */
export type Sunner = { id: string; email: string; fullName: string };

const storage = createClient(
  assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
).storage.from(KUDO_IMAGE_BUCKET);

/** 1×1 transparent PNG. */
export const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

export async function createSunner(prefix: string, fullName: string): Promise<Sunner> {
  const email = uniqueEmail(prefix);
  const { id } = await createAuthUser(email, { full_name: fullName });
  const departmentId = await departmentIdByCode("CEVC1");
  await testDb.update(profiles).set({ departmentId }).where(sql`${profiles.id} = ${id}`);
  return { id, email, fullName };
}

/** Ids of the first `count` active seeded hashtags, in seed order. */
export async function activeHashtagIds(count: number): Promise<string[]> {
  const rows = await testSql<{ id: string }[]>`
    select id from public.hashtags where is_active order by sort_order limit ${count}`;
  if (rows.length < count) throw new Error("hashtags are not seeded (run npm run db:reset)");
  return rows.map((row) => row.id);
}

/** Every object this test file uploaded: images dropped on edit are in neither table any more. */
const uploadedPaths = new Set<string>();

/** Uploads a tiny PNG through the signed upload URL, exactly as the browser would. */
export async function uploadWithSignedToken(path: string, token: string): Promise<void> {
  const { error } = await storage.uploadToSignedUrl(path, token, PNG_BYTES, { contentType: "image/png" });
  if (error) throw error;
  uploadedPaths.add(path);
}

/** Removes Storage objects under `kudos/` (by path); missing ones are fine. */
export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await storage.remove(paths);
  if (error) throw error;
}

export async function deleteKudosOf(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  const rows = await testDb
    .select({ id: kudos.id })
    .from(kudos)
    .where(or(inArray(kudos.senderId, userIds), inArray(kudos.recipientId, userIds)));
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return;
  await testDb.delete(domainEventOutbox).where(inArray(sql`${domainEventOutbox.payload} ->> 'kudoId'`, ids));
  await testDb.delete(kudos).where(inArray(kudos.id, ids));
}

/** Full teardown: Storage objects (uploaded, attached or pending), kudos (+ outbox rows), auth users. */
export async function cleanupSunners(users: Sunner[]): Promise<void> {
  const ids = users.map((user) => user.id).filter(Boolean);
  if (ids.length === 0) return;
  const objects = await testSql<{ path: string }[]>`
    select i.storage_path as path from public.kudo_images i join public.kudos k on k.id = i.kudo_id
    where k.sender_id = any(${ids}::uuid[]) or k.recipient_id = any(${ids}::uuid[])
    union
    select storage_path from public.kudo_image_uploads where uploader_id = any(${ids}::uuid[])`;
  await removeObjects([...new Set([...uploadedPaths, ...objects.map((row) => row.path)])]);
  uploadedPaths.clear();
  await deleteKudosOf(ids);
  await deleteAuthUsers(ids);
}

/** Row count of a kudo-owned table for a sender (proves "no rows written"). */
export async function kudoCountBySender(senderId: string): Promise<number> {
  const [row] = await testSql<{ count: number }[]>`
    select count(*)::int as count from public.kudos where sender_id = ${senderId}`;
  return row.count;
}
