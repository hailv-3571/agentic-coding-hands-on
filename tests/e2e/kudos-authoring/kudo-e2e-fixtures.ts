import { randomUUID } from "node:crypto";
import { KUDO_IMAGE_BUCKET } from "../../../features/kudos-authoring/kudo-authoring-limits";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { test as base, expect, type TestSunner } from "../fixtures/auth-session";

/**
 * F003 composer e2e fixtures on the local Supabase stack (service role, local-only guard in
 * local-sunner-accounts.ts). `kudoUsers` depends on `sunners`, so its teardown runs first: it
 * removes Storage objects, outbox rows and kudos (kudos.sender_id is ON DELETE RESTRICT) before
 * the auth users are deleted. Nothing is left behind, even when a test fails half way.
 */
export type NamedSunner = TestSunner & { fullName: string };
export type KudoPair = { sender: NamedSunner; recipient: NamedSunner };

/** 1×1 transparent PNG (same bytes as the integration fixtures). */
export const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

async function rename(sunner: TestSunner, fullName: string): Promise<NamedSunner> {
  check(await serviceClient.from("profiles").update({ full_name: fullName }).eq("id", sunner.id));
  return { ...sunner, fullName };
}

async function kudoIdsOf(userIds: string[]): Promise<string[]> {
  const list = userIds.join(",");
  const rows = check(
    await serviceClient.from("kudos").select("id").or(`sender_id.in.(${list}),recipient_id.in.(${list})`),
  ) as { id: string }[];
  return rows.map((row) => row.id);
}

/** Storage objects (attached or still pending), outbox rows and kudos of these users. */
async function deleteKudoDataOf(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  const kudoIds = await kudoIdsOf(userIds);
  const attached = kudoIds.length
    ? (check(await serviceClient.from("kudo_images").select("storage_path").in("kudo_id", kudoIds)) as {
        storage_path: string;
      }[])
    : [];
  const pending = check(
    await serviceClient.from("kudo_image_uploads").select("storage_path").in("uploader_id", userIds),
  ) as { storage_path: string }[];
  const paths = [...new Set([...attached, ...pending].map((row) => row.storage_path))];
  if (paths.length) check(await serviceClient.storage.from(KUDO_IMAGE_BUCKET).remove(paths));
  if (kudoIds.length) {
    // The product never deletes a kudo, so a bare DELETE sends no Spotlight event and every board
    // open in another worker stays above the database total. Taking public kudos out the product's
    // way first (public → spam fires `removed`) keeps those boards in step with the database.
    check(await serviceClient.from("kudos").update({ status: "spam" }).in("id", kudoIds).eq("status", "public"));
    check(await serviceClient.from("domain_event_outbox").delete().in("payload->>kudoId", kudoIds));
    check(await serviceClient.from("kudos").delete().in("id", kudoIds));
  }
}

export type StoredKudo = {
  id: string;
  recipient_id: string;
  title: string | null;
  body: string;
  is_anonymous: boolean;
  anonymous_nickname: string | null;
  kudo_hashtags: { hashtag_id: string }[];
  kudo_images: { storage_path: string; position: number }[];
};

/** Every kudo the sender wrote, with its hashtags and images (what the composer persisted). */
export async function kudosSentBy(senderId: string): Promise<StoredKudo[]> {
  return check(
    await serviceClient
      .from("kudos")
      .select(
        "id, recipient_id, title, body, is_anonymous, anonymous_nickname, kudo_hashtags(hashtag_id), kudo_images(storage_path, position)",
      )
      .eq("sender_id", senderId),
  ) as StoredKudo[];
}

/**
 * A `created_at` in a random far-future window, so a seeded kudo sorts above every real one and
 * lands on the first Live board page even while parallel workers seed theirs. `top` windows
 * (years 5000–7899) always sort above `low` ones (2100–4999); each call picks its own window.
 */
export function feedWindow(kind: "top" | "low" = "top"): (offsetMinutes?: number) => string {
  const year = (kind === "top" ? 5000 : 2100) + Math.floor(Math.random() * 2900);
  const base = Date.UTC(year, 0, 1) + Math.floor(Math.random() * 360) * 86_400_000;
  return (offsetMinutes = 0) => new Date(base + offsetMinutes * 60_000).toISOString();
}

/**
 * A `created_at` one minute after the newest public kudo right now, so a kudo inserted with it
 * tops the first Live board page: whatever the viewer loaded earlier is no longer the first item.
 */
export async function newerThanEveryPublicKudo(): Promise<string> {
  const rows = check(
    await serviceClient.from("kudos").select("created_at").eq("status", "public").order("created_at", { ascending: false }).limit(1),
  ) as { created_at: string }[];
  const newest = rows[0] ? Date.parse(rows[0].created_at) : Date.now();
  return new Date(newest + 60_000).toISOString();
}

/** Inserts a kudo directly (service role) so the edit flow has something to open. */
export async function seedKudo(
  pair: KudoPair,
  values: { title: string | null; body: string; hashtagCount: number; createdAt?: string },
) {
  const tags = check(
    await serviceClient
      .from("hashtags")
      .select("id, label_vi")
      .eq("is_active", true)
      .order("sort_order")
      .limit(values.hashtagCount),
  ) as { id: string; label_vi: string }[];
  const kudo = check(
    await serviceClient
      .from("kudos")
      .insert({
        sender_id: pair.sender.id,
        recipient_id: pair.recipient.id,
        title: values.title,
        body: values.body,
        ...(values.createdAt ? { created_at: values.createdAt } : {}),
      })
      .select("id")
      .single(),
  ) as { id: string };
  check(await serviceClient.from("kudo_hashtags").insert(tags.map((tag) => ({ kudo_id: kudo.id, hashtag_id: tag.id }))));
  return { id: kudo.id, hashtagLabels: tags.map((tag) => tag.label_vi) };
}

export const test = base.extend<{ kudoUsers: { pair(): Promise<KudoPair> } }>({
  kudoUsers: async ({ sunners }, provide) => {
    const userIds: string[] = [];
    await provide({
      pair: async () => {
        const token = randomUUID().slice(0, 6);
        const sender = await rename(await sunners.create(), `Người Gửi ${token}`);
        const recipient = await rename(await sunners.create(), `Đồng Đội ${token}`);
        userIds.push(sender.id, recipient.id);
        return { sender, recipient };
      },
    });
    await deleteKudoDataOf(userIds);
  },
});

export { expect };
