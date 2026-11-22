import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { focusRing } from "@/features/kudos-feed/components/kudo-feed-styles";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import { APP_ROUTES } from "@/shared/ui/app-routes";

/**
 * Not-found of `/profile/{userId}` (FR-104, edge case "Không tìm thấy Sunner này."): one message for
 * a malformed or unknown id, and a way back to the Live board. Rendered inside the Sunner shell.
 */
export default async function SunnerNotFound() {
  const t = await getTranslations("profile.notFound");
  return (
    <main className="relative isolate -mt-20 flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-36 pb-24 text-center">
      <LiveBoardKeyvisualBackground dimmed />
      <h1 className="max-w-170 text-headline-small font-bold text-text md:text-headline-large">{t("message")}</h1>
      <Link
        href={APP_ROUTES.kudos}
        className={`rounded bg-primary px-8 py-3 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`}
      >
        {t("back")}
      </Link>
    </main>
  );
}
