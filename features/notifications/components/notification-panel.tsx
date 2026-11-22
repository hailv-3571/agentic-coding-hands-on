"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { useNotificationList } from "../hooks/use-notification-list";
import { useNotificationSync } from "../hooks/use-notification-sync";
import { emitNotificationSync } from "../lib/notification-sync-events";
import { NOTIFICATION_DROPDOWN_LIMIT } from "../notification-config";
import type { NotificationView } from "../schemas/notification-views";
import { NotificationList } from "./notification-list";
import {
  notificationIconAction,
  notificationSurface,
  notificationTextAction,
  notificationTitle,
  notificationTitleRow,
} from "./notification-styles";

const SOURCE = "panel";

/**
 * Bell dropdown (SCR-notification-dropdown, Figma 589:9152): 528 wide under the bell (full width
 * minus gutters on phones), at most viewport − 120 high with the rows scrolling inside. Title
 * "Thông báo", "Xem tất cả" → /notifications, the ≡ icon button marks all read. A non-modal
 * dialog that takes focus when it opens; Esc / outside click close it (the bell handles both).
 * Mounted only while open: every open loads the newest page, signals merge a fresh first page.
 */
export function NotificationPanel({ id, onClose }: { id: string; onClose(): void }) {
  const t = useTranslations("notifications");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const list = useNotificationList(NOTIFICATION_DROPDOWN_LIMIT);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useNotificationSync(SOURCE, (kind) => {
    if (kind === "incoming") void list.refresh();
    else if (kind === "read") void list.reload();
  });

  function openItem(item: NotificationView) {
    onClose();
    if (item.read) return;
    void list.markRead(item).then(() => emitNotificationSync("read", SOURCE));
  }

  async function markAll() {
    if (markingAll) return;
    setMarkingAll(true);
    emitNotificationSync("all-read", SOURCE);
    await list.markAllRead();
    emitNotificationSync("read", SOURCE);
    setMarkingAll(false);
  }

  return (
    <div
      ref={dialogRef}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`${notificationSurface} fixed inset-x-4 top-22 z-50 max-h-[calc(100dvh-104px)] outline-none md:absolute md:inset-x-auto md:top-full md:-right-7 md:mt-9 md:max-h-[calc(100dvh-120px)] md:w-132`}
    >
      <div className={`${notificationTitleRow} shrink-0`}>
        <h2 id={titleId} className={notificationTitle}>
          {t("title")}
        </h2>
        <div className="flex items-center gap-2">
          <Link href={APP_ROUTES.notifications} onClick={onClose} className={notificationTextAction}>
            {t("viewAll")}
          </Link>
          <button
            type="button"
            onClick={markAll}
            aria-disabled={markingAll}
            aria-label={t("markAllRead")}
            title={t("markAllRead")}
            className={notificationIconAction}
          >
            <Image src="/images/notifications/ic-mark-all-read.svg" width={24} height={24} alt="" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="-mx-1 min-h-0 overflow-y-auto overscroll-contain px-1">
        <NotificationList
          items={list.items}
          status={list.status}
          moreStatus={list.moreStatus}
          hasMore={list.hasMore}
          onRetry={list.reload}
          onLoadMore={list.loadMore}
          onOpen={openItem}
          scrollRoot={scrollRef}
          label={t("title")}
        />
      </div>
    </div>
  );
}
