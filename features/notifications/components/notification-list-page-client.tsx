"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useNotificationList } from "../hooks/use-notification-list";
import { useNotificationSync } from "../hooks/use-notification-sync";
import { emitNotificationSync } from "../lib/notification-sync-events";
import { NOTIFICATION_PAGE_SIZE } from "../notification-config";
import type { NotificationView } from "../schemas/notification-views";
import { NotificationList } from "./notification-list";
import { notificationSurface, notificationTextAction, notificationTitle, notificationTitleRow } from "./notification-styles";

const SOURCE = "page";

/**
 * "Tất cả thông báo" body (SCR-all-notifications, Figma 589:9132): a 680-wide panel with the same
 * rows as the bell dropdown, "Đánh dấu đọc tất cả" (icon + text) in the title row, 20 rows per
 * load with infinite scroll, empty and error states. New signals merge a fresh first page; a mark
 * made in the bell panel reloads the rows.
 */
export function NotificationListPageClient() {
  const t = useTranslations("notifications");
  const [markingAll, setMarkingAll] = useState(false);
  const list = useNotificationList(NOTIFICATION_PAGE_SIZE);

  useNotificationSync(SOURCE, (kind) => {
    if (kind === "incoming") void list.refresh();
    else if (kind === "read") void list.reload();
  });

  function openItem(item: NotificationView) {
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
    <section aria-labelledby="notifications-heading" className={`${notificationSurface} w-full max-w-170`}>
      <div className={notificationTitleRow}>
        <h1 id="notifications-heading" className={notificationTitle}>
          {t("title")}
        </h1>
        <button type="button" onClick={markAll} aria-disabled={markingAll} className={notificationTextAction}>
          <Image src="/images/notifications/ic-mark-all-read.svg" width={24} height={24} alt="" aria-hidden />
          {t("markAllRead")}
        </button>
      </div>
      <NotificationList
        items={list.items}
        status={list.status}
        moreStatus={list.moreStatus}
        hasMore={list.hasMore}
        onRetry={list.reload}
        onLoadMore={list.loadMore}
        onOpen={openItem}
        label={t("title")}
      />
    </section>
  );
}
