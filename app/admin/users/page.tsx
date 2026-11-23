import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminUsersScreen } from "@/features/admin-users/components/admin-users-screen";
import type { AdminUserFilterOptions, AdminUserFilterValues, AdminUserPage } from "@/features/admin-users/schemas/admin-user-views";
import { DEFAULT_ADMIN_USER_FILTER, parseUserListParams } from "@/features/admin-users/schemas/user-list-params-schema";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { UserFilterOptionsQuery } from "@/features/admin-users/server/user-filter-options-query";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { defaultLocale, isLocale, type Locale } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminUsers");
  return { title: t("metaTitle") };
}

const EMPTY_PAGE: AdminUserPage = { rows: [], total: 0, page: 1, pageCount: 1, columnTotals: { kudosSent: 0, kudosReceived: 0 } };
const NO_OPTIONS: AdminUserFilterOptions = { departments: [] };

/**
 * A failed table read becomes the screen's error state with retry (FR-407); failed Unit options only
 * empty the dropdown (spec § 5 "filter-options-error": the table stays usable).
 */
async function loadUsers(filter: AdminUserFilterValues, locale: Locale): Promise<{ data: AdminUserPage | null; options: AdminUserFilterOptions }> {
  const [page, options] = await Promise.allSettled([UserAdminQuery.listPage(filter, locale), UserFilterOptionsQuery.get(locale)]);
  if (page.status === "rejected") console.error("[admin-users] loading the user table failed", page.reason);
  if (options.status === "rejected") console.error("[admin-users] loading the unit options failed", options.reason);
  return {
    data: page.status === "fulfilled" ? page.value : null,
    options: options.status === "fulfilled" ? options.value : NO_OPTIONS,
  };
}

/**
 * Admin › User `/admin/users` (F014, Figma 773:26403). RSC wiring only: `requireAdmin()` first (the
 * admin layout and proxy step 4b already answer 403; data pages still guard themselves), then URL
 * params → filter → table page + Unit options. Invalid params (q over 100 characters, an unknown sort…)
 * show `filterError` over the unfiltered page 1. The actor id lets the role menu hide self-demotion.
 * Request-time route: session, `searchParams` and the DB are read per request (URL = state, FR-402).
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await requireAdmin();
  const parsed = parseUserListParams(await searchParams);
  const filter = parsed.ok ? parsed.value : DEFAULT_ADMIN_USER_FILTER;
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const { data, options } = await loadUsers(filter, locale);

  return (
    <AdminUsersScreen
      data={data ?? EMPTY_PAGE}
      filter={filter}
      options={options}
      actorId={userId}
      filterError={parsed.ok ? null : parsed.error}
      loadError={data === null}
    />
  );
}
