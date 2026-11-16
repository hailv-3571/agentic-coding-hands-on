import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { KUDO_IMAGE_BUCKET } from "@/features/kudos-authoring/kudo-authoring-limits";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";
import { testSql } from "../../setup/integration-db";
import { departmentIdByCode } from "../auth/auth-test-users";
import { PNG_BYTES, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Seed helpers for the F004 read-side tests on the local Supabase stack. Kudos are inserted with
 * SQL (explicit `created_at`, status, anonymity) — the write path is phase 04's and has its own
 * tests. Teardown reuses phase 04's `cleanupSunners` (Storage objects of attached images, kudos,
 * outbox rows, auth users) plus `deleteProbeHashtags`, so nothing is left behind.
 */
export type SeedKudo = {
  sender: Sunner;
  recipient: Sunner;
  body?: string;
  title?: string | null;
  nickname?: string | null;
  status?: "public" | "spam";
  createdAt?: string;
  hashtagIds?: string[];
};

const storage = createClient(
  assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
).storage.from(KUDO_IMAGE_BUCKET);

export async function insertKudo(seed: SeedKudo): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`
    insert into public.kudos (sender_id, recipient_id, title, body, is_anonymous, anonymous_nickname, status, created_at)
    values (${seed.sender.id}, ${seed.recipient.id}, ${seed.title ?? null}, ${seed.body ?? "Cảm ơn bạn"},
            ${Boolean(seed.nickname)}, ${seed.nickname ?? null}, ${seed.status ?? "public"},
            ${seed.createdAt ?? new Date().toISOString()})
    returning id`;
  for (const hashtagId of seed.hashtagIds ?? []) {
    await testSql`insert into public.kudo_hashtags (kudo_id, hashtag_id) values (${row.id}, ${hashtagId})`;
  }
  return row.id;
}

/** Uploads one real PNG per position (Storage) and attaches it; returns paths by position. */
export async function attachImages(kudoId: string, positions: number[]): Promise<string[]> {
  const paths: string[] = [];
  for (const position of positions) {
    const path = `kudos/${randomUUID()}.png`;
    const { error } = await storage.upload(path, PNG_BYTES, { contentType: "image/png" });
    if (error) throw error;
    await testSql`insert into public.kudo_images (kudo_id, storage_path, position) values (${kudoId}, ${path}, ${position})`;
    paths[position] = path;
  }
  return paths;
}

/** Moves a Sunner to a seeded department; returns its id. */
export async function moveToDepartment(sunner: Sunner, code: string): Promise<string> {
  const departmentId = await departmentIdByCode(code);
  await testSql`update public.profiles set department_id = ${departmentId} where id = ${sunner.id}`;
  return departmentId;
}

export async function setAvatar(sunner: Sunner, avatarUrl: string): Promise<void> {
  await testSql`update public.profiles set avatar_url = ${avatarUrl} where id = ${sunner.id}`;
}

/** Active hashtags only used by this test file (sort_order below the seeds, so they list first). */
export async function createProbeHashtags(count: number): Promise<{ id: string; label: string }[]> {
  const suffix = randomUUID().slice(0, 8);
  const created: { id: string; label: string }[] = [];
  for (let index = 0; index < count; index += 1) {
    const [row] = await testSql<{ id: string; label_vi: string }[]>`
      insert into public.hashtags (slug, label_vi, label_en, sort_order, is_active)
      values (${`feed-probe-${suffix}-${index}`}, ${`#THỬ${index}`}, ${`#PROBE${index}`}, ${-100 + index}, true)
      returning id, label_vi`;
    created.push({ id: row.id, label: row.label_vi });
  }
  return created;
}

/** Run after `cleanupSunners` (kudo_hashtags rows RESTRICT the delete until their kudos are gone). */
export async function deleteProbeHashtags(ids: string[]): Promise<void> {
  if (ids.length > 0) await testSql`delete from public.hashtags where id = any(${ids}::uuid[])`;
}

/** A timestamp far in the future so seeded rows sort first in the global (unfiltered) feed. */
export function futureInstant(offsetSeconds = 0): string {
  return new Date(Date.UTC(2100, 0, 1) + offsetSeconds * 1000).toISOString();
}
