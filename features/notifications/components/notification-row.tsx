"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { defaultLocale, isLocale } from "@/shared/i18n/locales";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { formatNotificationMessage } from "../lib/notification-message";
import { formatNotificationRelativeTime } from "../lib/notification-relative-time";
import type { NotificationView } from "../schemas/notification-views";
import { NotificationTypeIcon } from "./notification-type-icon";

type NotificationRowProps = {
  item: NotificationView;
  now: Date;
  /** Click on the row: mark read (optimistic) while the link navigates. */
  onOpen(item: NotificationView): void;
};

/**
 * One notification (Figma item: border-b #2E3940, rounded 2, pt8 pb16 pl16, gap 24): type icon,
 * message Bold 16/24 white (tracking .5), relative time Bold 12/16 #999, and for an unread row the
 * 8 px red dot on the right (pr16 instead of pr48; phones use gap 16 / pr40 to give the text room). The whole row is the link to `href`
 * (stretched link, hover/focus bg rgba(255,234,158,.1)); the spam-hidden row adds an inline
 * "Tiêu chuẩn cộng đồng" link that sits above the stretched area, so links never nest.
 */
export function NotificationRow({ item, now, onOpen }: NotificationRowProps) {
  const t = useTranslations();
  const raw = useLocale();
  const locale = isLocale(raw) ? raw : defaultLocale;
  const lines = formatNotificationMessage(item, t);

  return (
    <li
      data-notification-id={item.id}
      data-read={item.read}
      className={`relative flex gap-4 rounded-xs border-b border-divider pt-2 pb-4 pl-4 transition-colors focus-within:bg-secondary hover:bg-secondary md:gap-6 ${item.read ? "pr-10 md:pr-12" : "pr-4"}`}
    >
      <NotificationTypeIcon type={item.type} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link
          href={item.href}
          onClick={() => onOpen(item)}
          className="text-body-large font-bold break-words text-text outline-none after:absolute after:inset-0 after:rounded-xs after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
        >
          {!item.read && <span className="sr-only">{`${t("notifications.unread")}: `}</span>}
          {lines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </Link>
        {item.type === "kudo_hidden_spam" && (
          <Link
            href={APP_ROUTES.communityStandards}
            className="relative z-10 inline-flex items-center gap-1 self-start rounded whitespace-nowrap text-title-small font-bold text-text underline underline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("notifications.communityStandards")}
            <Image src="/images/notifications/ic-arrow-up-right-light.svg" width={24} height={24} alt="" aria-hidden />
          </Link>
        )}
        <time dateTime={item.occurredAt} className="text-xs font-bold tracking-[0.4px] text-text-muted">
          {formatNotificationRelativeTime(item.occurredAt, now, locale)}
        </time>
      </div>
      {!item.read && <span aria-hidden className="size-2 shrink-0 self-center rounded-full bg-error" />}
    </li>
  );
}
