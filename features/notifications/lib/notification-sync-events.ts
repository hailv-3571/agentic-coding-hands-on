/**
 * In-tab sync between the header bell (it owns the single Realtime channel), its panel and the
 * `/notifications` page, which live in different subtrees of the layout:
 * - `"incoming"` — the bell got a signal or must resync → open lists merge a fresh first page;
 * - `"all-read"` — a list just marked everything read (optimistic) → the bell drops its dot now;
 * - `"read"` — a mark (one or all) settled → the bell re-reads the unread count and the other
 *   list reloads its rows.
 * A window event keeps the parts decoupled without a context provider in the server layout.
 */
export type NotificationSyncKind = "incoming" | "all-read" | "read";

type NotificationSyncDetail = { kind: NotificationSyncKind; source: string };

const EVENT_NAME = "saa:notifications-sync";

export function emitNotificationSync(kind: NotificationSyncKind, source: string): void {
  window.dispatchEvent(new CustomEvent<NotificationSyncDetail>(EVENT_NAME, { detail: { kind, source } }));
}

/** Listens for sync events from OTHER sources (`source` filters out the caller's own events). */
export function onNotificationSync(source: string, listener: (kind: NotificationSyncKind) => void): () => void {
  const handle = (event: Event) => {
    const { detail } = event as CustomEvent<NotificationSyncDetail>;
    if (detail && detail.source !== source) listener(detail.kind);
  };
  window.addEventListener(EVENT_NAME, handle);
  return () => window.removeEventListener(EVENT_NAME, handle);
}
