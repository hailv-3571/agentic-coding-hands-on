"use client";

import { useTranslations } from "next-intl";
import { HighlightCarousel } from "./highlight-carousel";
import { HighlightFilterDropdown, type HighlightFilterOption } from "./highlight-filter-dropdown";
import { pageColumn } from "./kudo-feed-styles";
import { KudoFeedStatusMessage } from "./kudo-feed-status-message";
import { LiveBoardSectionHeader } from "./live-board-section-header";
import { useHighlightKudos, type HighlightResult } from "./use-highlight-kudos";

type HighlightSectionProps = {
  /** "Tất cả" result from the RSC (`listHighlightKudos`); null when it failed to load. */
  initial: HighlightResult | null;
  hashtags: HighlightFilterOption[];
  departments: HighlightFilterOption[];
  /** `isKudoWritingOpen()`: the owner's pen hides once writing closes. */
  writingOpen: boolean;
};

/**
 * HIGHLIGHT KUDOS (R2): header with the Hashtag and Phòng ban filters, then the carousel and its
 * pager (gap 40). No match → "Chưa có Kudo nào phù hợp." while the filters stay usable; a failed
 * load → inline error with retry for this region only.
 */
export function HighlightSection({ initial, hashtags, departments, writingOpen }: HighlightSectionProps) {
  const t = useTranslations("kudosFeed");
  const highlight = useHighlightKudos(initial);
  const { result, failure } = highlight;

  return (
    <section className="flex flex-col gap-10">
      <div className={pageColumn}>
        <LiveBoardSectionHeader title={t("highlight.title")}>
          <div className="flex flex-wrap gap-2">
            <HighlightFilterDropdown
              label={t("filters.hashtag")}
              listLabel={t("filters.hashtagList")}
              allLabel={t("filters.all")}
              options={hashtags}
              value={highlight.filters.hashtag}
              onChange={(value) => highlight.setFilter("hashtag", value)}
            />
            <HighlightFilterDropdown
              label={t("filters.department")}
              listLabel={t("filters.departmentList")}
              allLabel={t("filters.all")}
              options={departments}
              value={highlight.filters.department}
              onChange={(value) => highlight.setFilter("department", value)}
            />
          </div>
        </LiveBoardSectionHeader>
      </div>
      {failure || result.items.length === 0 ? (
        <div className={pageColumn}>
          <KudoFeedStatusMessage state={highlight.pending ? "loading" : (failure ?? "empty")} onRetry={highlight.retry} />
        </div>
      ) : (
        <HighlightCarousel
          items={result.items}
          active={highlight.active}
          onActiveChange={highlight.setActive}
          busy={highlight.pending}
          writingOpen={writingOpen}
        />
      )}
    </section>
  );
}
