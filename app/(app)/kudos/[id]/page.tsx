import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { KudoDetailView } from "@/features/kudos-feed/components/kudo-detail-view";
import { filterButton, statusText } from "@/features/kudos-feed/components/kudo-feed-styles";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import type { KudoCardView } from "@/features/kudos-feed/schemas/kudo-card-view";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { requireSunner } from "@/shared/auth/current-user";
import { defaultLocale, isLocale } from "@/shared/i18n/locales";
import { APP_ROUTES } from "@/shared/ui/app-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kudosFeed.detail");
  return { title: t("metaTitle") };
}

/**
 * Blocking route (like the login and onboarding pages). Without this, dev validation flags the
 * uncached read outside <Suspense>. It does not guarantee a 404 status: in production the shell
 * may already have streamed, so not-found is a soft 404 (decision-log 2026-11-16).
 */
export const instant = false;

/** Distinguishes a failed read (inline error, spec § 5) from "not visible" (null → 404). */
async function findKudo(id: string, viewerId: string): Promise<KudoCardView | null | "failed"> {
  const raw = await getLocale();
  try {
    return await KudoPublicQuery.findForViewer(id, viewerId, isLocale(raw) ? raw : defaultLocale);
  } catch (error) {
    console.error("[kudos-feed] loading a kudo failed", error);
    return "failed";
  }
}

/**
 * Kudo detail at its fixed URL `/kudos/{id}` (D004; drawn like Figma View Kudo 520:18779: the
 * centred 680 panel over the dimmed keyvisual). Bad uuid, unknown id and someone else's spam
 * all give the same `notFound()` (no existence oracle, C-17), called outside any try/catch.
 * The not-found content is identical in every case; the status may be 200 (soft 404).
 */
export default async function KudoDetailPage({ params }: PageProps<"/kudos/[id]">) {
  const { userId } = await requireSunner();
  const { id } = await params;
  const t = await getTranslations("kudosFeed");
  const kudo = await findKudo(id, userId);
  if (kudo === null) notFound();

  return (
    <main className="relative isolate -mt-20 flex flex-1 flex-col items-center px-4 pt-24 pb-16">
      <LiveBoardKeyvisualBackground dimmed />
      <h1 className="sr-only">{t("detail.heading")}</h1>
      {kudo === "failed" ? (
        <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
          <p className={statusText}>{t("detail.loadFailed")}</p>
          <a href={`${APP_ROUTES.kudos}/${encodeURIComponent(id)}`} className={filterButton}>
            {t("status.retry")}
          </a>
        </div>
      ) : (
        <KudoDetailView kudo={kudo} />
      )}
    </main>
  );
}
