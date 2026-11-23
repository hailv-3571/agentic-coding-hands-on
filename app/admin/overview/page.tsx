import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminOverviewScreen } from "@/features/admin-overview/components/admin-overview-screen";
import { ALL_TIME_OVERVIEW_FILTER, parseOverviewParams } from "@/features/admin-overview/schemas/overview-params-schema";
import type { UnitStatsTable } from "@/features/admin-overview/schemas/unit-stats-views";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";
import type { AdminDateRange } from "@/shared/admin/date-range-filter";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { defaultLocale, isLocale, type Locale } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminOverview");
  return { title: t("metaTitle") };
}

const ALL_TIME: AdminDateRange = { start: undefined, end: undefined };

/** A failed read becomes the screen's error state with retry (FR-207) instead of failing the page. */
async function loadTable(range: AdminDateRange, locale: Locale): Promise<UnitStatsTable | null> {
  try {
    return await UnitStatsQuery.forRange(range, locale);
  } catch (error) {
    console.error("[admin-overview] loading unit statistics failed", error);
    return null;
  }
}

/**
 * Admin › Overview `/admin/overview` (F015, Figma 620:7712). RSC wiring only: `requireAdmin()` first
 * (the admin layout and proxy step 4b already answer 403; data pages still guard themselves), then the
 * URL range `from` / `to` (FR-401: a reload or a shared link reproduces the numbers) → the per-unit
 * table with its "All" row. A reversed or malformed range shows `filterError` over the all-time table
 * (FR-403). Request-time route: session, `searchParams` and the DB are read per request; no cache.
 */
export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const parsed = parseOverviewParams(await searchParams);
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const data = await loadTable(parsed.ok ? parsed.range : ALL_TIME, locale);

  return (
    <AdminOverviewScreen
      data={data}
      filter={parsed.ok ? parsed.value : ALL_TIME_OVERVIEW_FILTER}
      filterError={parsed.ok ? null : parsed.error}
      loadError={data === null}
    />
  );
}
