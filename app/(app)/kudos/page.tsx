import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { listDepartmentOptions } from "@/features/auth/server/department-options-query";
import { KudoComposerLauncher } from "@/features/kudos-authoring/components/kudo-composer-launcher";
import { listActiveHashtags } from "@/features/kudos-authoring/server/hashtag-list-query";
import { isKudoWritingOpen } from "@/features/kudos-authoring/server/kudo-write-window";
import { AllKudosFeed } from "@/features/kudos-feed/components/all-kudos-feed";
import { HighlightSection } from "@/features/kudos-feed/components/highlight-section";
import { pageColumn } from "@/features/kudos-feed/components/kudo-feed-styles";
import { LiveBoardHeading, LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import { LiveBoardRewardsColumnSlot } from "@/features/kudos-feed/components/live-board-rewards-column-slot";
import { LiveBoardSectionHeader } from "@/features/kudos-feed/components/live-board-section-header";
import { LiveBoardSkeleton } from "@/features/kudos-feed/components/live-board-skeleton";
import { LiveBoardSpotlightSlot } from "@/features/kudos-feed/components/live-board-spotlight-slot";
import { SunnerProfileSearch } from "@/features/kudos-feed/components/sunner-profile-search";
import { listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { requireSunner } from "@/shared/auth/current-user";
import { defaultLocale, isLocale } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kudosFeed");
  return { title: t("metaTitle") };
}

/** A failed read becomes that region's inline error (spec § 5) instead of failing the page. */
async function settle<T>(read: Promise<T>, region: string): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    console.error(`[kudos-feed] loading the ${region} failed`, error);
    return null;
  }
}

/**
 * Request-time part of the Live board: session viewer + request locale → first feed page,
 * "Tất cả" Highlight, filter options and the writing window. Only `KudoCardView`s cross into
 * client components (FR-602: the RSC payload is a response too).
 */
async function LiveBoardContent() {
  const { userId } = await requireSunner();
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = await getTranslations("kudosFeed");
  const [writingOpen, feed, highlight, hashtags, departments] = await Promise.all([
    isKudoWritingOpen(),
    settle(KudoPublicQuery.list({ viewerId: userId, locale }), "feed"),
    settle(listHighlightKudos({ viewerId: userId, locale }), "highlight"),
    settle(listActiveHashtags(locale), "hashtag filter"),
    settle(listDepartmentOptions(locale), "department filter"),
  ]);
  const feedKey = feed ? `${feed.items[0]?.id ?? "empty"}:${feed.nextCursor ?? "end"}` : "failed";

  return (
    <div className="flex flex-col gap-16">
      <div className={`${pageColumn} grid items-start gap-4 lg:grid-cols-[738fr_381fr] lg:gap-8`}>
        <KudoComposerLauncher writingOpen={writingOpen} />
        <SunnerProfileSearch />
      </div>
      <HighlightSection
        initial={highlight}
        hashtags={hashtags ?? []}
        departments={(departments ?? []).map((department) => ({ id: department.id, label: department.name }))}
        writingOpen={writingOpen}
      />
      <LiveBoardSpotlightSlot />
      <section aria-labelledby="all-kudos-heading" className={`${pageColumn} flex flex-col gap-10`}>
        <LiveBoardSectionHeader title={t("allKudos.title")} headingId="all-kudos-heading" />
        <div className="flex flex-col gap-12.5 lg:flex-row">
          <div className="w-full lg:w-170 lg:shrink-0">
            <AllKudosFeed key={feedKey} initialPage={feed} writingOpen={writingOpen} />
          </div>
          <LiveBoardRewardsColumnSlot />
        </div>
      </section>
    </div>
  );
}

/**
 * Sun* Kudos Live board `/kudos` (F004; Figma 2940:13431): KV, action row (composer launcher +
 * Sunner search), HIGHLIGHT KUDOS, Spotlight slot (phase 11), ALL KUDOS with the rewards column
 * slot (phase 10). The keyvisual runs under the translucent 80 px header (`-mt-20`); the
 * request-time part streams behind a skeleton.
 */
export default function KudosLiveBoardPage() {
  return (
    <main className="relative isolate -mt-20 flex flex-col gap-16 overflow-x-clip pt-36 pb-24 md:pt-46">
      <LiveBoardKeyvisualBackground />
      <div className={pageColumn}>
        <LiveBoardHeading />
      </div>
      <Suspense fallback={<LiveBoardSkeleton />}>
        <LiveBoardContent />
      </Suspense>
    </main>
  );
}
