import { formatAdminDateTime } from "@/shared/admin/admin-date-time-format";
import { toAdminZone } from "@/shared/admin/timezone";
import type { AdminUserViewRow } from "../lib/admin-user-view-row";
import type { AdminUserRow, AdminUsersScreenProps } from "../schemas/admin-user-views";
import { AdminUsersView } from "./admin-users-view";

/** `dd/MM/yyyy HH:mm` on the ADMIN_TIMEZONE wall clock, null stays null ("—"). */
function instantLabel(iso: string | null): string | null {
  return iso === null ? null : formatAdminDateTime(toAdminZone(new Date(iso)));
}

function toViewRow(row: AdminUserRow): AdminUserViewRow {
  return { ...row, sixBadgesAtLabel: instantLabel(row.sixBadgesAt), lastLoginAtLabel: instantLabel(row.lastLoginAt) };
}

/**
 * Admin › User body (F014, Figma 773:26403), rendered by app/admin/users/page.tsx with the
 * server-read page. A Server Component on purpose: it writes "Time to get 6 Badges" and "Last
 * Logged in" in ADMIN_TIMEZONE (shared `toAdminZone`, like the phase 06/08 admin tables and CSVs)
 * before anything reaches the browser, then hands the interactive table to `AdminUsersView`.
 */
export function AdminUsersScreen({ data, filter, options, actorId, filterError, loadError }: AdminUsersScreenProps) {
  return (
    <AdminUsersView
      rows={data.rows.map(toViewRow)}
      pageCount={data.pageCount}
      columnTotals={data.columnTotals}
      filter={filter}
      options={options}
      actorId={actorId}
      filterError={filterError}
      loadError={loadError}
    />
  );
}
