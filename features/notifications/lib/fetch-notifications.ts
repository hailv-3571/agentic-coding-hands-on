import type { NotificationPage, NotificationSignal, UnreadCount } from "../schemas/notification-views";

/** A failed read; `status` is the HTTP status (0 for a network error). */
export class NotificationFetchError extends Error {
  constructor(readonly status: number) {
    super(`notification request failed (${status})`);
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new NotificationFetchError(response.status);
  return (await response.json()) as T;
}

/** GET /api/notifications?limit&cursor — newest first, `nextCursor` null on the last page. */
export function fetchNotificationPage(
  { limit, cursor }: { limit: number; cursor?: string | null },
  signal?: AbortSignal,
): Promise<NotificationPage> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  return getJson<NotificationPage>(`/api/notifications?${query}`, signal);
}

/** GET /api/notifications/unread-count. */
export async function fetchUnreadCount(signal?: AbortSignal): Promise<number> {
  const { unread } = await getJson<UnreadCount>("/api/notifications/unread-count", signal);
  return unread;
}

/** The Broadcast payload carries ids only; anything else is ignored. */
export function isNotificationSignal(payload: unknown): payload is NotificationSignal {
  if (!payload || typeof payload !== "object") return false;
  const { notificationId, type, occurredAt } = payload as Record<string, unknown>;
  return typeof notificationId === "string" && typeof type === "string" && typeof occurredAt === "string";
}

/** A server action result counts as failed when it throws or returns `{ ok: false }`. */
export function isFailedActionResult(result: unknown): boolean {
  return Boolean(result && typeof result === "object" && "ok" in result && (result as { ok: unknown }).ok === false);
}
