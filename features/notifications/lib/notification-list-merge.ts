import type { NotificationPage, NotificationView } from "../schemas/notification-views";

/** What a notification list holds: loaded rows (newest first) and the cursor of the next older page. */
export type NotificationListState = NotificationPage;

/**
 * Appends an older page (GET ?cursor). The first copy of an id wins, so a row that the server
 * moved between pages (an aggregated heart bumped to the top) never renders twice.
 */
export function appendNotificationPage(state: NotificationListState, page: NotificationPage): NotificationListState {
  const known = new Set(state.items.map((item) => item.id));
  return {
    items: [...state.items, ...page.items.filter((item) => !known.has(item.id))],
    nextCursor: page.nextCursor,
  };
}

/**
 * Merges a refetched first page (after a realtime signal, a reconnect or the tab becoming visible)
 * into what is loaded. Fresh rows go on top and the fresh copy of an id wins — an aggregated heart
 * moves up with its new count (spec §5.3 Q6: de-dupe by id). Older loaded rows the fresh page does
 * not hold stay below it with their cursor. The fresh page replaces everything when it already holds
 * every loaded row, ends the list, or does not reach the loaded rows at all (a gap would hide rows).
 */
export function mergeFirstNotificationPage(
  state: NotificationListState,
  fresh: NotificationPage,
): NotificationListState {
  const freshIds = new Set(fresh.items.map((item) => item.id));
  const rest = state.items.filter((item) => !freshIds.has(item.id));
  const overlaps = rest.length < state.items.length;
  if (rest.length === 0 || fresh.nextCursor === null || !overlaps) return fresh;
  return { items: [...fresh.items, ...rest], nextCursor: state.nextCursor };
}

/** Optimistic mark-one-read (the server action runs in the background). */
export function markNotificationReadIn(items: NotificationView[], id: string): NotificationView[] {
  return items.map((item) => (item.id === id && !item.read ? { ...item, read: true } : item));
}

/** Optimistic mark-all-read. */
export function markAllNotificationsReadIn(items: NotificationView[]): NotificationView[] {
  return items.map((item) => (item.read ? item : { ...item, read: true }));
}
