"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { BellIcon } from "@/features/app-shell/components/shell-icons";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { useNotificationChannel } from "../hooks/use-notification-channel";
import { useNotificationSync } from "../hooks/use-notification-sync";
import { fetchUnreadCount } from "../lib/fetch-notifications";
import { emitNotificationSync } from "../lib/notification-sync-events";
import { NotificationPanel } from "./notification-panel";

const SOURCE = "bell";

type NotificationBellProps = {
  /** Session user: the private topic is `notifications:{userId}`. */
  userId: string;
  /** Unread count read by the layout on the server (0 if that read failed; the first join resyncs). */
  initialUnread: number;
};

/**
 * Header bell (phase 03 slot, SCR-notification-dropdown E01): red dot while anything is unread
 * (D002: a dot, no number), toggles the panel (`aria-expanded`/`aria-controls`). Owns the tab's one
 * Realtime channel: a signal sets the dot at once, announces politely and tells open lists to merge
 * a fresh first page; every (re)join, tab-visible and settled mark re-reads the exact unread count.
 */
export function NotificationBell({ userId, initialUnread }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(initialUnread > 0);
  const [announcement, setAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const countSeq = useRef(0);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismissable(open, close, containerRef, triggerRef);

  const refreshUnread = useCallback(async () => {
    const seq = ++countSeq.current;
    try {
      const unread = await fetchUnreadCount();
      if (seq === countSeq.current) setHasUnread(unread > 0);
    } catch (error) {
      console.error("[notifications] reading the unread count failed", error);
    }
  }, []);

  useNotificationChannel(userId, {
    onSignal() {
      countSeq.current++; // a count read already in flight may predate this signal
      setHasUnread(true);
      // A trailing no-break space alternates so a repeated message is announced again.
      setAnnouncement((previous) => (previous.endsWith(" ") ? t("bell.newArrived") : `${t("bell.newArrived")} `));
      emitNotificationSync("incoming", SOURCE);
    },
    onResync() {
      void refreshUnread();
      emitNotificationSync("incoming", SOURCE);
    },
  });

  useNotificationSync(SOURCE, (kind) => {
    if (kind === "all-read") {
      countSeq.current++;
      setHasUnread(false);
    } else if (kind === "read") {
      void refreshUnread();
    }
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={hasUnread ? t("bell.labelUnread") : t("bell.label")}
        title={t("bell.label")}
        data-unread={hasUnread}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex size-10 items-center justify-center rounded text-text transition-colors hover:text-primary ${focusRing}`}
      >
        <BellIcon />
        {hasUnread && <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-error" />}
      </button>
      {open && <NotificationPanel id={panelId} onClose={close} />}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
