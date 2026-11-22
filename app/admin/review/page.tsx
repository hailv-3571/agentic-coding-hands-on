import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ReviewContentScreen } from "@/features/admin-moderation/components/review-content-screen";
import { DEFAULT_ADMIN_KUDO_FILTER, parseAdminKudoFilter } from "@/features/admin-moderation/schemas/admin-kudo-filter-schema";
import type { AdminKudoFilterValues, AdminKudoPage } from "@/features/admin-moderation/schemas/admin-kudo-row";
import { resolveSelectedPeople, type SelectedPeople } from "@/features/admin-moderation/server/admin-kudo-selected-people";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { defaultLocale, isLocale, type Locale } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminModeration");
  return { title: t("metaTitle") };
}

const EMPTY_PAGE: AdminKudoPage = { rows: [], total: 0, page: 1, pageCount: 1 };

/** A failed read becomes the screen's error state with retry (FR-407) instead of failing the page. */
async function loadReview(filter: AdminKudoFilterValues, locale: Locale): Promise<[AdminKudoPage, SelectedPeople] | null> {
  try {
    return await Promise.all([KudoAdminQuery.list(filter, locale), resolveSelectedPeople(filter, locale)]);
  } catch (error) {
    console.error("[admin-moderation] loading the review table failed", error);
    return null;
  }
}

/**
 * Admin › Review content `/admin/review` (F007, Figma 722:16251). RSC wiring only: `requireAdmin()`
 * first (app/admin/layout.tsx and proxy step 4b already answer 403 to non-admins; data pages still
 * guard themselves), then URL params → filter → table page + labels of the selected people. Invalid
 * params (e.g. a reversed date range) show `filterError` over the unfiltered page 1. Request-time
 * route: the session, `searchParams` and the DB are read per request; loading.tsx is the Suspense
 * fallback. Only the admin-only `AdminKudoRow` DTOs cross into the client screen.
 */
export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const parsed = parseAdminKudoFilter(await searchParams);
  const filter = parsed.ok ? parsed.value : DEFAULT_ADMIN_KUDO_FILTER;
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const loaded = await loadReview(filter, locale);

  return (
    <ReviewContentScreen
      data={loaded?.[0] ?? EMPTY_PAGE}
      filter={filter}
      selectedSender={loaded?.[1].selectedSender ?? null}
      selectedReceiver={loaded?.[1].selectedReceiver ?? null}
      filterError={parsed.ok ? null : parsed.error}
      loadError={loaded === null}
    />
  );
}
