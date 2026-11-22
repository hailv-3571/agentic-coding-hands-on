import Module from "node:module";
import type { Browser, Locator, Page } from "@playwright/test";
import { serviceClient } from "../setup/local-sunner-accounts";
import { fillRequired, openComposer, waitForRouterRefresh } from "./kudos-authoring/kudo-composer-e2e-steps";
import { expect, type KudoPair } from "./kudos-authoring/kudo-e2e-fixtures";
import { signedInContext } from "./spotlight-board-e2e-helpers";

/**
 * Phase 13 Notifications e2e helpers (local Supabase, Vietnamese default locale). Kudos are sent
 * through the real composer by a second signed-in browser, so the app writes the outbox event.
 * Locally nothing drains the outbox (no Vault secrets for pg_cron, no OUTBOX_DRAIN_SECRET in the dev
 * server), so the test process runs the backend's real `NotificationEventProcessor.drain()` over
 * the local DB (plan: "Local/tests call the drain service directly"); its inserts fire the real
 * Realtime trigger. Seeded rows (paging) go in with the service role; deleting the users cascades
 * their notifications, and `removeSeededEvents` drops the seeded outbox rows (FK ON DELETE SET NULL).
 */
export const bell = (page: Page): Locator => page.getByRole("button", { name: /^Thông báo/ });
export const panel = (page: Page): Locator => page.getByRole("dialog", { name: "Thông báo" });
export const rows = (scope: Locator): Locator => scope.locator("li[data-notification-id]");
export const rowWith = (scope: Locator, text: string): Locator => rows(scope).filter({ hasText: text });

function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/** Resolves once the bell re-read the unread count, i.e. after its private channel joined. */
export const nextUnreadCountRead = (page: Page) =>
  page.waitForResponse((response) => new URL(response.url()).pathname === "/api/notifications/unread-count");

/**
 * One run of the backend's real outbox drain in this Node process (idempotent, safe to overlap with
 * other workers' drains). `server-only` throws outside the React Server bundle (Next resolves it to
 * an empty module there, the vitest config aliases it to a stub), so it is registered as an empty
 * module before the processor loads. `.env.local` is already loaded by local-sunner-accounts.
 */
async function drainOutbox(): Promise<void> {
  const serverOnly = require.resolve("server-only");
  require.cache[serverOnly] ??= Object.assign(new Module(serverOnly), { filename: serverOnly, loaded: true, exports: {} });
  const { NotificationEventProcessor } = await import("../../features/notifications/server/notification-event-processor");
  await NotificationEventProcessor.drain();
}

export async function notificationCount(recipientId: string): Promise<number> {
  const { count, error } = await serviceClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId);
  if (error) throw error;
  return count ?? 0;
}

/** Drains (oldest 50 pending per run, older backlog first) until `recipientId` holds `atLeast` rows. */
export async function drainUntil(recipientId: string, atLeast: number): Promise<void> {
  await expect
    .poll(async () => {
      await drainOutbox();
      return notificationCount(recipientId);
    }, { timeout: 60_000, intervals: [100, 250, 500] })
    .toBeGreaterThanOrEqual(atLeast);
}

export async function unreadIdsOf(recipientId: string): Promise<string[]> {
  const found = check(
    await serviceClient.from("notifications").select("id").eq("recipient_id", recipientId).is("read_at", null),
  ) as { id: string }[];
  return found.map((row) => row.id);
}

/** The sender sends one kudo through the composer in their own browser; returns its id. */
export async function sendKudoThroughComposer(
  browser: Browser,
  baseURL: string,
  pair: KudoPair,
  options: { anonymousNickname?: string } = {},
): Promise<string> {
  const context = await signedInContext(browser, baseURL, pair.sender);
  try {
    const page = await context.newPage();
    const dialog = await openComposer(page);
    await fillRequired(dialog, pair);
    if (options.anonymousNickname) {
      await dialog.getByRole("checkbox", { name: "Gửi lời cám ơn và ghi nhận ẩn danh" }).check();
      await dialog.getByRole("textbox", { name: "Nickname ẩn danh" }).fill(options.anonymousNickname);
    }
    const refreshed = waitForRouterRefresh(page);
    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(dialog).toBeHidden();
    await refreshed;
  } finally {
    await context.close();
  }
  const [latest] = check(
    await serviceClient
      .from("kudos")
      .select("id")
      .eq("sender_id", pair.sender.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ) as { id: string }[];
  return latest.id;
}

/**
 * `count` unread "Secret Box" notifications for `recipientId`, one minute apart (newest first =
 * index 0), each on its own consumed outbox row. Returns the outbox ids for cleanup.
 */
export async function seedSecretBoxNotifications(recipientId: string, count: number): Promise<string[]> {
  const base = Date.now() - 60 * 60_000;
  const events = check(
    await serviceClient
      .from("domain_event_outbox")
      .insert(
        Array.from({ length: count }, () => ({
          event_type: "BoxGranted",
          payload: { userId: recipientId, e2e: "notifications" },
          consumed_at: new Date().toISOString(),
        })),
      )
      .select("id"),
  ) as { id: string }[];
  check(
    await serviceClient.from("notifications").insert(
      events.map((event, index) => ({
        recipient_id: recipientId,
        type: "secret_box_granted",
        event_id: event.id,
        params: {},
        occurred_at: new Date(base - index * 60_000).toISOString(),
      })),
    ),
  );
  return events.map((event) => event.id);
}

/** Removes seeded outbox rows (their notifications stay, event_id → null, until the users are deleted). */
export async function removeSeededEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length) check(await serviceClient.from("domain_event_outbox").delete().in("id", eventIds));
}
