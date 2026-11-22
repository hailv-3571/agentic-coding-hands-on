import { decodeKudoFeedCursor } from "@/features/kudos-feed/server/kudo-feed-cursor";
import { NOTIFICATION_MAX_PAGE_SIZE, NOTIFICATION_PAGE_SIZE } from "../notification-config";

/** Position of the last row of a page: `(occurred_at, id)` with Postgres' microsecond precision. */
export type NotificationCursor = { occurredAt: string; id: string };

export type NotificationListParams = { ok: true; limit: number; cursor: NotificationCursor | null } | { ok: false };

const POSITIVE_INTEGER = /^[1-9]\d{0,5}$/;

/**
 * Query of GET /api/notifications (A5): `limit` (positive integer, default 20, clamped to 50) and
 * `cursor`. The cursor reuses phase 05's strict `(timestamp µs, uuid)` codec (C-05) — its
 * `createdAt` field carries the notification's `occurred_at`. Anything else → `{ ok: false }` (400).
 */
export function parseNotificationListParams(params: URLSearchParams): NotificationListParams {
  const rawLimit = params.get("limit");
  const rawCursor = params.get("cursor");
  if (rawLimit !== null && !POSITIVE_INTEGER.test(rawLimit)) return { ok: false };
  const limit = rawLimit === null ? NOTIFICATION_PAGE_SIZE : Math.min(Number(rawLimit), NOTIFICATION_MAX_PAGE_SIZE);
  if (rawCursor === null) return { ok: true, limit, cursor: null };
  const decoded = decodeKudoFeedCursor(rawCursor);
  return decoded ? { ok: true, limit, cursor: { occurredAt: decoded.createdAt, id: decoded.id } } : { ok: false };
}
