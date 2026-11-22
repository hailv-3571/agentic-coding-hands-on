"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "../server/notification-actions";
import { fetchNotificationPage, isFailedActionResult } from "../lib/fetch-notifications";
import {
  appendNotificationPage,
  markAllNotificationsReadIn,
  markNotificationReadIn,
  mergeFirstNotificationPage,
  type NotificationListState,
} from "../lib/notification-list-merge";
import type { NotificationPage, NotificationView } from "../schemas/notification-views";

export type NotificationListStatus = "loading" | "ready" | "error";
export type NotificationMoreStatus = "idle" | "loading" | "error";

const EMPTY: NotificationListState = { items: [], nextCursor: null };

/** Runs a read-state server action; a throw or `{ ok: false }` is a failure. */
async function settles(action: () => Promise<unknown>): Promise<boolean> {
  try {
    return !isFailedActionResult(await action());
  } catch (error) {
    console.error("[notifications] marking as read failed", error);
    return false;
  }
}

/**
 * Rows of the bell panel or the `/notifications` page. Loads the first page on mount, appends older
 * pages (`loadMore`), merges a refetched first page after a signal (`refresh`, rows stay on screen
 * meanwhile) and marks rows read optimistically (server actions in the background, reverted on
 * failure). Read is one-way, so ids marked here stay read over any response that was already in
 * flight; a first-page response older than the latest first-page request is dropped.
 */
export function useNotificationList(pageSize: number) {
  const [list, setList] = useState<NotificationListState>(EMPTY);
  const [status, setStatus] = useState<NotificationListStatus>("loading");
  const [moreStatus, setMoreStatus] = useState<NotificationMoreStatus>("idle");
  const listRef = useRef(list);
  const locallyRead = useRef(new Set<string>());
  const firstPageSeq = useRef(0);
  const loadingMore = useRef(false);
  const controllers = useRef(new Set<AbortController>());

  useEffect(() => {
    listRef.current = list;
  });

  useEffect(() => {
    const open = controllers.current;
    return () => open.forEach((controller) => controller.abort());
  }, []);

  const withLocalReads = useCallback(
    (page: NotificationPage): NotificationPage => ({
      ...page,
      items: page.items.map((item) => (locallyRead.current.has(item.id) && !item.read ? { ...item, read: true } : item)),
    }),
    [],
  );

  const request = useCallback(async (cursor: string | null) => {
    const controller = new AbortController();
    controllers.current.add(controller);
    try {
      return await fetchNotificationPage({ limit: pageSize, cursor }, controller.signal);
    } finally {
      controllers.current.delete(controller);
    }
  }, [pageSize]);

  /**
   * First page: `replace` starts over (mount, retry, a mark made elsewhere), `merge` folds it into
   * the loaded rows. Rows already on screen stay while it loads, and stay if it fails.
   */
  const loadFirst = useCallback(
    (mode: "replace" | "merge"): Promise<void> => {
      const seq = ++firstPageSeq.current;
      // State changes only in the settled callbacks: the mount effect below starts this load.
      return request(null).then(
        (raw) => {
          if (seq !== firstPageSeq.current) return;
          const page = withLocalReads(raw);
          setList((previous) => (mode === "replace" ? page : mergeFirstNotificationPage(previous, page)));
          setStatus("ready");
        },
        (error: unknown) => {
          if (seq !== firstPageSeq.current || (error instanceof DOMException && error.name === "AbortError")) return;
          console.error("[notifications] loading notifications failed", error);
          setStatus((previous) => (previous === "ready" ? previous : "error"));
        },
      );
    },
    [request, withLocalReads],
  );

  useEffect(() => {
    void loadFirst("replace");
  }, [loadFirst]);

  /** Starts over; from the error state the skeleton shows again while it loads ("Thử lại"). */
  const reload = useCallback(() => {
    setStatus((previous) => (previous === "error" ? "loading" : previous));
    return loadFirst("replace");
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    const cursor = listRef.current.nextCursor;
    if (loadingMore.current || !cursor) return;
    loadingMore.current = true;
    setMoreStatus("loading");
    try {
      const page = withLocalReads(await request(cursor));
      // The list may have been replaced meanwhile; a page for another cursor no longer fits.
      setList((previous) => (previous.nextCursor === cursor ? appendNotificationPage(previous, page) : previous));
      setMoreStatus("idle");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[notifications] loading more notifications failed", error);
      setMoreStatus("error");
    } finally {
      loadingMore.current = false;
    }
  }, [request, withLocalReads]);

  const revert = useCallback((ids: string[]) => {
    ids.forEach((id) => locallyRead.current.delete(id));
    const reverted = new Set(ids);
    setList((previous) => ({
      ...previous,
      items: previous.items.map((item) => (reverted.has(item.id) ? { ...item, read: false } : item)),
    }));
  }, []);

  /** Optimistic mark-one; resolves false when the server refused (the row is unread again). */
  const markRead = useCallback(
    async (item: NotificationView) => {
      if (item.read || locallyRead.current.has(item.id)) return true;
      locallyRead.current.add(item.id);
      setList((previous) => ({ ...previous, items: markNotificationReadIn(previous.items, item.id) }));
      const ok = await settles(() => markNotificationRead(item.id));
      if (!ok) revert([item.id]);
      return ok;
    },
    [revert],
  );

  /** Optimistic mark-all (every loaded row; the server marks the rest). */
  const markAllRead = useCallback(async () => {
    const changed = listRef.current.items.filter((item) => !item.read).map((item) => item.id);
    changed.forEach((id) => locallyRead.current.add(id));
    setList((previous) => ({ ...previous, items: markAllNotificationsReadIn(previous.items) }));
    const ok = await settles(() => markAllNotificationsRead());
    if (!ok) revert(changed);
    return ok;
  }, [revert]);

  return {
    items: list.items,
    hasMore: list.nextCursor !== null,
    status,
    moreStatus,
    reload,
    refresh: useCallback(() => loadFirst("merge"), [loadFirst]),
    loadMore,
    markRead,
    markAllRead,
  };
}
