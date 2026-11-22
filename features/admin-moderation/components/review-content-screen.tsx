"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { secondaryButton, settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { CampaignSettingsToast, type CampaignNotice } from "@/features/admin-campaigns/components/campaign-settings-toast";
import type { AdminKudoFilterValues, AdminKudoPage, AdminKudoStatus, ReviewContentScreenProps } from "../schemas/admin-kudo-row";
import type { KudoModerationResult } from "../schemas/kudo-moderation-result";
import { ReviewDateRangeFilter } from "./review-date-range-filter";
import { ReviewExportButton } from "./review-export-button";
import { ReviewFilters } from "./review-filters";
import { ReviewPagination } from "./review-pagination";
import { ReviewTable } from "./review-table";
import { applyFilterPatch, nextHeartSort, reviewHref } from "./review-url-params";
import { useExternalResetKey } from "./use-external-reset-key";

const CLEARED: Partial<AdminKudoFilterValues> = { senderId: null, receiverId: null, status: null, from: null, to: null, query: "" };

/**
 * Admin › Review content body (F007, Figma 722:16251), rendered by app/admin/review/page.tsx with
 * the server-read page. The URL is the single source of the view: every filter, search, sort or
 * page change `router.replace`s it with the shared params (page 1 unless paging, FR-402) inside a
 * transition, the controls show the new view optimistically and the rows dim until the server
 * answers. Mark Spam / Un Spam patch their row from the action's returned status (no reload).
 */
export function ReviewContentScreen({ data, filter, selectedSender, selectedReceiver, filterError, loadError }: ReviewContentScreenProps) {
  const t = useTranslations("adminModeration");
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [view, setView] = useOptimistic(filter);
  const [notice, setNotice] = useState<CampaignNotice | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  // Row statuses patched after a moderation; they belong to the page they were made on.
  const [patched, setPatched] = useState<{ page: AdminKudoPage; statuses: Record<string, AdminKudoStatus> }>({ page: data, statuses: {} });
  const statuses = patched.page === data ? patched.statuses : {};
  const [dateKey, markDatesSent] = useExternalResetKey(`${view.from ?? ""}|${view.to ?? ""}`);

  function navigate(patch: Partial<AdminKudoFilterValues>) {
    const next = applyFilterPatch(view, patch);
    startNavigation(() => {
      setView(next);
      router.replace(reviewHref(next), { scroll: false });
    });
  }

  function handleModerated(kudoId: string, result: KudoModerationResult) {
    if (!result.ok) {
      setNotice({ tone: "error", message: result.code === "not_found" ? t("moderation.notFound") : t("moderation.failed") });
      return;
    }
    setPatched((current) => ({ page: data, statuses: { ...(current.page === data ? current.statuses : {}), [kudoId]: result.status } }));
    const message = !result.changed ? t("moderation.alreadyChanged") : result.status === "spam" ? t("moderation.markedSpam") : t("moderation.unSpammed");
    setNotice({ tone: "success", message });
  }

  const hasFilter = Boolean(view.senderId || view.receiverId || view.status || view.from || view.to || view.query);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="flex w-full flex-wrap items-start gap-4 sm:w-auto">
          <ReviewDateRangeFilter
            key={dateKey}
            from={view.from}
            to={view.to}
            onChange={({ from, to }) => {
              markDatesSent(`${from ?? ""}|${to ?? ""}`);
              navigate({ from, to });
            }}
          />
          <ReviewExportButton filter={filter} onNotice={setNotice} />
        </div>
      </div>
      <ReviewFilters view={view} selectedSender={selectedSender} selectedReceiver={selectedReceiver} onChange={navigate} />
      {filterError && (
        <p role="alert" className="text-title-small text-error">
          {t(`filterError.${filterError}`)}
        </p>
      )}
      {loadError ? (
        <div role="alert" className="flex flex-col items-center gap-4 rounded border border-divider bg-container-2 px-4 py-10 text-center">
          <p className="text-title-medium text-text-muted">{t("table.loadFailed")}</p>
          <button
            type="button"
            aria-disabled={navigating || undefined}
            onClick={() => !navigating && startNavigation(() => router.refresh())}
            className={secondaryButton}
          >
            {t("table.retry")}
          </button>
        </div>
      ) : (
        <>
          <ReviewTable
            rows={data.rows}
            statuses={statuses}
            sort={view.sort}
            busy={navigating}
            onSortHearts={() => navigate({ sort: nextHeartSort(view.sort) })}
            onModerated={handleModerated}
            onClearFilters={hasFilter ? () => navigate(CLEARED) : undefined}
          />
          {/* The URL page is unclamped (?page=99); the server clamps the rows to the last page, so the
              pager follows suit. Once the server answers this equals `data.page`; while navigating it
              still shows the optimistic page. */}
          <ReviewPagination page={Math.min(view.page, data.pageCount)} pageCount={data.pageCount} onPage={(page) => navigate({ page })} />
        </>
      )}
      <CampaignSettingsToast notice={notice} onDone={clearNotice} />
    </div>
  );
}
