"use client";

import { useFormatter, useTranslations } from "next-intl";
import { headerDivider, secondaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";
import type { AdminUserViewRow } from "../lib/admin-user-view-row";
import type { AdminUserFilterValues, AdminUserPage, AdminUserRole, AdminUserSort } from "../schemas/admin-user-views";
import { AdminUserSortableHeader } from "./admin-user-sortable-header";
import { AdminUserTableRow } from "./admin-user-table-row";
import { denseBodyCell, denseHeaderCell } from "./admin-users-styles";

type AdminUserTableProps = {
  rows: AdminUserViewRow[];
  /** Roles patched in place after a change, by user id. */
  roles: Record<string, AdminUserRole>;
  view: AdminUserFilterValues;
  columnTotals: AdminUserPage["columnTotals"];
  actorId: string;
  /** A filter change is loading: rows dim, the filters stay usable. */
  busy: boolean;
  onSort(column: AdminUserSort): void;
  onRoleChanged(user: AdminUserViewRow, role: AdminUserRole): void;
  /** Shown in the empty state when a filter is active ("Xoá bộ lọc"). */
  onClearFilters?: () => void;
};

/**
 * Column widths: the 12 columns fit the 1152 px admin frame at 1440 (Figma draws 1280, so headers
 * wrap to more lines). Each sortable column fits its longest header word plus the carets ("Received"),
 * ID the 8-character id, Role the "Admin · env" badge, Actions its label; User and Email share the rest.
 */
const COLUMN_WIDTHS = ["w-24", "", "", "w-22", "w-26", "w-20", "w-20", "w-24", "w-24", "w-24", "w-26", "w-20"];

/**
 * User table (R3, Figma 773:26403) in the phase 06 table tokens (#00101A header with 22 px rules,
 * #00070C rows): ID · User · Email · Σ sent (n) · Σ received (n) · Total Heart · Level · Number of
 * Badges · Time to get 6 Badges · Last Logged in (all sortable) · Role · Actions. "(n)" is the
 * column total over the whole current filter. Narrow screens scroll the table inside its box.
 */
export function AdminUserTable({ rows, roles, view, columnTotals, actorId, busy, onSort, onRoleChanged, onClearFilters }: AdminUserTableProps) {
  const t = useTranslations("adminUsers");
  const format = useFormatter();
  const divided = `${denseHeaderCell} ${headerDivider}`;
  const sortable = (column: AdminUserSort, label: string) => <AdminUserSortableHeader column={column} label={label} view={view} onSort={onSort} />;

  return (
    <div className="overflow-x-auto" aria-busy={busy}>
      <table className={`w-full min-w-288 table-fixed border-collapse transition-opacity ${busy ? "opacity-60" : ""}`}>
        <caption className="sr-only">{t("table.caption")}</caption>
        <colgroup>
          {COLUMN_WIDTHS.map((width, index) => (
            <col key={index} className={width || undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={`${denseHeaderCell} text-center`}>
              {t("table.id")}
            </th>
            <th scope="col" className={divided}>
              {t("table.user")}
            </th>
            <th scope="col" className={divided}>
              {t("table.email")}
            </th>
            {sortable("sent", t("table.sent", { total: format.number(columnTotals.kudosSent) }))}
            {sortable("received", t("table.received", { total: format.number(columnTotals.kudosReceived) }))}
            {sortable("hearts", t("table.hearts"))}
            {sortable("level", t("table.level"))}
            {sortable("badges", t("table.badges"))}
            {sortable("six_badges_at", t("table.sixBadges"))}
            {sortable("last_login_at", t("table.lastLogin"))}
            <th scope="col" className={`${divided} text-center`}>
              {t("table.role")}
            </th>
            <th scope="col" className={`${divided} text-center`}>
              {t("table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_WIDTHS.length} className={denseBodyCell}>
                <span className="flex flex-col items-center gap-4 py-6 text-center text-text-muted">
                  {t("table.empty")}
                  {onClearFilters && (
                    <button type="button" onClick={onClearFilters} className={secondaryButton}>
                      {t("filters.clear")}
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <AdminUserTableRow key={row.id} row={row} role={roles[row.id] ?? row.role} actorId={actorId} onRoleChanged={onRoleChanged} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
