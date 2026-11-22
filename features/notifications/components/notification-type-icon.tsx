import Image from "next/image";
import type { NotificationType } from "../schemas/notification-views";

/**
 * 40 px type icons exported from Figma 589:9152 (public/images/notifications). Kudos Quốc Dân has
 * no drawn icon and reuses the 6-icon-set one (decision-log 2026-11-23).
 */
const ICON_FILE: Record<NotificationType, string> = {
  kudo_received: "ic-noti-kudo-received",
  heart_received: "ic-noti-heart",
  secret_box_granted: "ic-noti-secret-box",
  hero_tier_up: "ic-noti-hero-tier",
  kudo_hidden_spam: "ic-noti-spam-hidden",
  icon_set_completed: "ic-noti-set-completed",
  national_kudos: "ic-noti-set-completed",
};

/** Decorative: the row's text says what happened. */
export function NotificationTypeIcon({ type }: { type: NotificationType }) {
  return (
    <Image
      src={`/images/notifications/${ICON_FILE[type]}.svg`}
      width={40}
      height={40}
      alt=""
      aria-hidden
      draggable={false}
      className="size-10 shrink-0"
    />
  );
}
