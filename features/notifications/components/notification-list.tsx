"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { useInfiniteScrollSentinel } from "../hooks/use-infinite-scroll-sentinel";
import { useMinuteClock } from "../hooks/use-minute-clock";
import type { NotificationMoreStatus, NotificationListStatus } from "../hooks/use-notification-list";
import type { NotificationView } from "../schemas/notification-views";
import { NotificationRow } from "./notification-row";
import { notificationRetryButton, notificationStatusText } from "./notification-styles";

type NotificationListProps = {
  items: NotificationView[];
  status: NotificationListStatus;
  moreStatus: NotificationMoreStatus;
  hasMore: boolean;
  onRetry(): void;
  onLoadMore(): void;
  onOpen(item: NotificationView): void;
  /** Scroll box that holds the list (the panel); the viewport when omitted (the page). */
  scrollRoot?: RefObject<HTMLElement | null>;
  /** Accessible name of the list. */
  label: string;
};

/** Placeholder rows while the first page loads (same paddings as a real row, nothing jumps). */
function NotificationRowsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-6 border-b border-divider pt-2 pb-4 pl-4 pr-12">
          <div className="size-10 shrink-0 animate-pulse rounded bg-secondary" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-full animate-pulse rounded bg-secondary" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The notification rows shared by the bell panel and the page, with the list states of the spec
 * (§5): loading skeleton, empty ("Bạn chưa có thông báo nào"), error with "Thử lại", and infinite
 * scroll — a sentinel under the last row loads the next older page; a failed page offers a retry
 * there. Status lines are polite live regions; errors are alerts.
 */
export function NotificationList(props: NotificationListProps) {
  const { items, status, moreStatus, hasMore, onRetry, onLoadMore, onOpen, scrollRoot, label } = props;
  const t = useTranslations("notifications");
  const now = useMinuteClock();
  const sentinelRef = useInfiniteScrollSentinel(onLoadMore, {
    enabled: status === "ready" && hasMore && moreStatus === "idle",
    version: items.length,
    root: scrollRoot,
  });

  if (status === "loading") {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("loading")}
        </p>
        <NotificationRowsSkeleton />
      </div>
    );
  }
  if (status === "error" && items.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
        <p className={notificationStatusText}>{t("loadFailed")}</p>
        <button type="button" onClick={onRetry} className={notificationRetryButton}>
          {t("retry")}
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p role="status" className={`${notificationStatusText} py-6 text-center`}>
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <ul aria-label={label} className="flex flex-col">
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} now={now} onOpen={onOpen} />
        ))}
      </ul>
      {moreStatus === "error" ? (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 py-4">
          <p className={notificationStatusText}>{t("loadFailed")}</p>
          <button type="button" onClick={onLoadMore} className={notificationRetryButton}>
            {t("retry")}
          </button>
        </div>
      ) : (
        <p role="status" className={`${notificationStatusText} py-3 text-center ${moreStatus === "loading" ? "" : "sr-only"}`}>
          {moreStatus === "loading" ? t("loadingMore") : ""}
        </p>
      )}
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </div>
  );
}
