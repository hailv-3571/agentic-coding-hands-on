import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationListPageClient } from "@/features/notifications/components/notification-list-page-client";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import { requireSunner } from "@/shared/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("metaTitle") };
}

/** Session check per request: a blocking route, like the other Sunner pages. */
export const instant = false;

/**
 * Tất cả thông báo `/notifications` (F013, Figma 589:9132): the Live board keyvisual under the
 * translucent header, then the 680-wide notification panel centred (top 192 in the 1440 frame).
 * Rows load in the browser from GET /api/notifications (session cookies, no-store), so the list
 * and the bell share one client path.
 */
export default async function NotificationsPage() {
  await requireSunner();
  return (
    <main className="relative isolate -mt-20 flex flex-col items-center overflow-x-clip px-4 pt-32 pb-24 md:pt-48">
      <LiveBoardKeyvisualBackground />
      <NotificationListPageClient />
    </main>
  );
}
