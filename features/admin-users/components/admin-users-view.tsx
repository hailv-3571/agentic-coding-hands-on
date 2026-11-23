"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { CampaignSettingsToast, type CampaignNotice } from "@/features/admin-campaigns/components/campaign-settings-toast";
import { AdminLoadErrorPanel } from "@/features/admin-moderation/components/admin-load-error-panel";
import { ReviewExportButton } from "@/features/admin-moderation/components/review-export-button";
import { ReviewPagination } from "@/features/admin-moderation/components/review-pagination";
import { adminUsersExportHref, adminUsersHref, applyUserFilterPatch, nextUserSort } from "../lib/admin-user-url-params";
import type { AdminUserViewRow } from "../lib/admin-user-view-row";
import type { AdminUserFilterValues, AdminUserPage, AdminUserRole, AdminUsersScreenProps } from "../schemas/admin-user-views";
import { AdminUserFilters } from "./admin-user-filters";
import { AdminUserTable } from "./admin-user-table";

type AdminUsersViewProps = Omit<AdminUsersScreenProps, "data"> & {
  rows: AdminUserViewRow[];
  pageCount: number;
  columnTotals: AdminUserPage["columnTotals"];
};

const CLEARED: Partial<AdminUserFilterValues> = { unit: null, level: null, role: null, query: "" };

/**
 * Interactive part of Admin › User. The URL is the single source of the view: every filter,
 * search, sort or page change `router.replace`s it with the shared params (page 1 unless paging)
 * inside a transition; the controls show the new view optimistically and the rows dim until the
 * server answers (spec § 5 "loading"). A role change patches its row from the action's answer at
 * once; the action's revalidation then brings the re-read page (counts, filters, Role column).
 */
export function AdminUsersView({ rows, pageCount, columnTotals, filter, options, actorId, filterError, loadError }: AdminUsersViewProps) {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [view, setView] = useOptimistic(filter);
  const [notice, setNotice] = useState<CampaignNotice | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  // Roles patched after a change; they belong to the rows they were made on.
  const [patched, setPatched] = useState<{ rows: AdminUserViewRow[]; roles: Record<string, AdminUserRole> }>({ rows, roles: {} });
  const roles = patched.rows === rows ? patched.roles : {};

  function navigate(patch: Partial<AdminUserFilterValues>) {
    const next = applyUserFilterPatch(view, patch);
    startNavigation(() => {
      setView(next);
      router.replace(adminUsersHref(next), { scroll: false });
    });
  }

  // The action revalidates /admin/users, so fresh rows arrive with its answer; the patch covers the gap.
  function handleRoleChanged(user: AdminUserViewRow, role: AdminUserRole) {
    setPatched((current) => ({ rows, roles: { ...(current.rows === rows ? current.roles : {}), [user.id]: role } }));
    setNotice({ tone: "success", message: t(`roleChanged.${role}`, { name: user.name }) });
  }

  const hasFilter = Boolean(view.unit !== null || view.level || view.role || view.query);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <ReviewExportButton href={adminUsersExportHref(filter)} fallbackFilename="users.csv" onNotice={setNotice} />
      </div>
      <AdminUserFilters view={view} departments={options.departments} onChange={navigate} />
      {filterError && (
        <p role="alert" className="text-title-small text-error">
          {t(`filterError.${filterError}`)}
        </p>
      )}
      {loadError ? (
        <AdminLoadErrorPanel message={t("table.loadFailed")} retryLabel={t("table.retry")} />
      ) : (
        <>
          <AdminUserTable
            rows={rows}
            roles={roles}
            view={view}
            columnTotals={columnTotals}
            actorId={actorId}
            busy={navigating}
            onSort={(column) => navigate(nextUserSort(view, column))}
            onRoleChanged={handleRoleChanged}
            onClearFilters={hasFilter ? () => navigate(CLEARED) : undefined}
          />
          {/* The server clamps an out-of-range ?page to the last page; the pager follows suit. */}
          <ReviewPagination page={Math.min(view.page, pageCount)} pageCount={pageCount} onPage={(page) => navigate({ page })} />
        </>
      )}
      <CampaignSettingsToast notice={notice} onDone={clearNotice} />
    </div>
  );
}
