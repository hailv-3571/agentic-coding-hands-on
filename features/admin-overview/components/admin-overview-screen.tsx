"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { CampaignSettingsToast, type CampaignNotice } from "@/features/admin-campaigns/components/campaign-settings-toast";
import { AdminLoadErrorPanel } from "@/features/admin-moderation/components/admin-load-error-panel";
import { ReviewDateRangeFilter } from "@/features/admin-moderation/components/review-date-range-filter";
import { ReviewExportButton } from "@/features/admin-moderation/components/review-export-button";
import { useExternalResetKey } from "@/features/admin-moderation/components/use-external-reset-key";
import { overviewExportHref, overviewHref } from "../lib/overview-url-params";
import type { AdminOverviewScreenProps, OverviewFilterValues } from "../schemas/unit-stats-views";
import { OverviewUnitStatsTable } from "./overview-unit-stats-table";

const ALL_TIME: OverviewFilterValues = { from: null, to: null };

/**
 * Admin › Overview body (F015, Figma 620:7712), rendered by app/admin/overview/page.tsx with the
 * server-read table. The URL holds the range: each complete date change `router.replace`s it
 * inside a transition (the table dims until the server answers, then a reload reproduces the
 * numbers). A reversed range is refused inline by the phase 08 date range and the table stays;
 * a bad range in the URL shows `filterError` over the all-time table, and Export then exports
 * that same all-time table.
 */
export function AdminOverviewScreen({ data, filter, filterError, loadError }: AdminOverviewScreenProps) {
  const t = useTranslations("adminOverview");
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [view, setView] = useOptimistic(filter);
  const [notice, setNotice] = useState<CampaignNotice | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  const [dateKey, markDatesSent] = useExternalResetKey(`${view.from ?? ""}|${view.to ?? ""}`);

  function navigate(next: OverviewFilterValues) {
    startNavigation(() => {
      setView(next);
      router.replace(overviewHref(next), { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="flex w-full flex-wrap items-start gap-4 sm:w-auto">
          <ReviewDateRangeFilter
            key={dateKey}
            from={view.from}
            to={view.to}
            groupLabel={t("dateRange.group")}
            onChange={({ from, to }) => {
              markDatesSent(`${from ?? ""}|${to ?? ""}`);
              navigate({ from, to });
            }}
          />
          <ReviewExportButton href={overviewExportHref(filterError ? ALL_TIME : filter)} fallbackFilename="overview.csv" onNotice={setNotice} />
        </div>
      </div>
      {filterError && (
        <p role="alert" className="text-title-small text-error">
          {t(`filterError.${filterError}`)}
        </p>
      )}
      {loadError || !data ? (
        <AdminLoadErrorPanel message={t("table.loadFailed")} retryLabel={t("table.retry")} />
      ) : (
        <OverviewUnitStatsTable table={data} busy={navigating} />
      )}
      <CampaignSettingsToast notice={notice} onDone={clearNotice} />
    </div>
  );
}
