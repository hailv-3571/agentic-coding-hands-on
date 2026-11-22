/**
 * Answers of the read-state Server Actions (features/notifications/server/notification-actions.ts).
 * Client-safe: types only. A guest never gets an answer: the action redirects to /login.
 * `unread` is the caller's fresh unread count after the write (the bell's red dot, DEC-003).
 */
export type MarkNotificationReadResult =
  | { ok: true; unread: number }
  /** `not_found`: someone else's, unknown or malformed id — one answer for all (no existence oracle). */
  | { ok: false; code: "not_found" | "unexpected" };

export type MarkAllNotificationsReadResult = { ok: true; updated: number; unread: number } | { ok: false; code: "unexpected" };
