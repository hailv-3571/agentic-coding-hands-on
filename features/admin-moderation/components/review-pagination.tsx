"use client";

import { useTranslations } from "next-intl";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { currentPageButton, pageButton } from "./review-content-styles";
import { pageWindow } from "./review-page-window";

/**
 * Pagination (E19, Figma "< 1 2 3 4 5 >", 10 per page, D010): previous, up to five numbered
 * squares around the current page (marked `aria-current`), next; centred under the table and
 * hidden when there is a single page. Ends use `aria-disabled` so they keep their focus.
 */
export function ReviewPagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage(page: number): void }) {
  const t = useTranslations("adminModeration.pagination");
  if (pageCount <= 1) return null;
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav aria-label={t("label")} className="flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            aria-label={t("previous")}
            aria-disabled={atStart || undefined}
            onClick={() => !atStart && onPage(page - 1)}
            className={pageButton}
          >
            <AdminModerationIcon name="pager-next" className="rotate-180" />
          </button>
        </li>
        {pageWindow(page, pageCount).map((number) => (
          <li key={number}>
            <button
              type="button"
              aria-label={t("page", { page: number })}
              aria-current={number === page ? "page" : undefined}
              onClick={() => number !== page && onPage(number)}
              className={number === page ? currentPageButton : pageButton}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button type="button" aria-label={t("next")} aria-disabled={atEnd || undefined} onClick={() => !atEnd && onPage(page + 1)} className={pageButton}>
            <AdminModerationIcon name="pager-next" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
