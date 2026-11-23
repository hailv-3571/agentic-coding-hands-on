"use client";

import { useTranslations } from "next-intl";
import { headerDivider } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { AdminSortCarets } from "@/features/admin-moderation/components/admin-sort-carets";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { userAriaSort } from "../lib/admin-user-url-params";
import type { AdminUserFilterValues, AdminUserSort } from "../schemas/admin-user-views";
import { denseHeaderCell } from "./admin-users-styles";

type AdminUserSortableHeaderProps = {
  column: AdminUserSort;
  label: string;
  view: AdminUserFilterValues;
  onSort(column: AdminUserSort): void;
};

/**
 * Sortable column header (E10–E16, Figma label + sorter): the label and the phase 08 carets in one
 * button; the lit caret and `aria-sort` show the current direction. Labels wrap (two lines in Figma).
 */
export function AdminUserSortableHeader({ column, label, view, onSort }: AdminUserSortableHeaderProps) {
  const t = useTranslations("adminUsers.table");
  const ariaSort = userAriaSort(view, column);
  const direction = ariaSort === "ascending" ? "asc" : ariaSort === "descending" ? "desc" : null;
  return (
    <th scope="col" aria-sort={ariaSort} className={`${denseHeaderCell} ${headerDivider}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        title={t("sortHint")}
        className={`inline-flex items-center gap-1.5 rounded text-left ${focusRing}`}
      >
        <span>{label}</span>
        <AdminSortCarets direction={direction} />
      </button>
    </th>
  );
}
