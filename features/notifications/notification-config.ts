/**
 * F013 configuration (spec § 4.6). Client-safe constants: the bell / panel / page and the server
 * share them. Not env: nothing changes them at runtime. The drain secret is env OUTBOX_DRAIN_SECRET.
 */
/** Rows the header panel shows on each open (D011). */
export const NOTIFICATION_DROPDOWN_LIMIT = 10;
/** Rows per "Tải thêm" on /notifications, and the list route's default `limit` (D011). */
export const NOTIFICATION_PAGE_SIZE = 20;
/** Ceiling of the list route's `limit` (larger values are clamped). */
export const NOTIFICATION_MAX_PAGE_SIZE = 50;

/** Private Broadcast topic per recipient: `notifications:{userId}` (realtime.messages policy). */
export const NOTIFICATION_TOPIC_PREFIX = "notifications";
/** Broadcast event name sent by the `notifications_publish_signal` trigger. */
export const NOTIFICATION_SIGNAL_EVENT = "notification";

export function notificationTopicFor(userId: string): string {
  return `${NOTIFICATION_TOPIC_PREFIX}:${userId}`;
}

/** Outbox events claimed per drain run (NotificationEventProcessor). */
export const OUTBOX_BATCH_SIZE = 50;
/** Failed attempts before an event is parked with `failed_at` (alert, no more retries). */
export const OUTBOX_MAX_ATTEMPTS = 5;
/**
 * Exponential backoff between attempts: failure n waits BASE × 2^(n-1) before the next try
 * (60 s, 2 min, 4 min, 8 min), so the 5 attempts span ~15 minutes, not 5 drain ticks (~25 s).
 */
export const OUTBOX_RETRY_BASE_DELAY_SECONDS = 60;
