import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import { ADMIN_USER_PARAMS, type AdminUserFilterValues, type AdminUserSort } from "../schemas/admin-user-views";

/** CSV export of the current filter and order (same params as the table, BR-004). */
export const ADMIN_USER_EXPORT_PATH = "/api/admin/users/export";

/**
 * Query string of an Admin › User view with the shared param names (`ADMIN_USER_PARAMS`). Defaults
 * are left out (page 1, name order, no filter, blank search) so the default view is the bare route;
 * `dir` is written only next to a sorted column, and then always (never relies on a server default).
 * Pure: no React, safe to unit test.
 */
function userSearchParams(filter: AdminUserFilterValues, withPage: boolean): URLSearchParams {
  const params = new URLSearchParams();
  const entries: [string, string | null][] = [
    [ADMIN_USER_PARAMS.query, filter.query.trim() || null],
    [ADMIN_USER_PARAMS.unit, filter.unit],
    [ADMIN_USER_PARAMS.level, filter.level],
    [ADMIN_USER_PARAMS.role, filter.role],
    [ADMIN_USER_PARAMS.sort, filter.sort],
    [ADMIN_USER_PARAMS.dir, filter.sort ? filter.dir : null],
    [ADMIN_USER_PARAMS.page, withPage && filter.page > 1 ? String(filter.page) : null],
  ];
  for (const [key, value] of entries) if (value) params.set(key, value);
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** `/admin/users?…` for a view. */
export function adminUsersHref(filter: AdminUserFilterValues): string {
  return withQuery(ADMIN_ROUTES.users, userSearchParams(filter, true));
}

/** Export URL of a view: its filter and order, never its page. */
export function adminUsersExportHref(filter: AdminUserFilterValues): string {
  return withQuery(ADMIN_USER_EXPORT_PATH, userSearchParams(filter, false));
}

/** Applies a change to the view. Anything but a page change goes back to page 1 (spec § 4). */
export function applyUserFilterPatch(filter: AdminUserFilterValues, patch: Partial<AdminUserFilterValues>): AdminUserFilterValues {
  return { ...filter, ...patch, page: patch.page ?? 1 };
}

/**
 * Header click on a sortable column: a new column starts with the largest value first (top
 * senders, latest login), the sorted column toggles between descending and ascending.
 */
export function nextUserSort(view: AdminUserFilterValues, column: AdminUserSort): Pick<AdminUserFilterValues, "sort" | "dir"> {
  if (view.sort !== column) return { sort: column, dir: "desc" };
  return { sort: column, dir: view.dir === "desc" ? "asc" : "desc" };
}

/** `aria-sort` of a sortable header ("none" unless the table is sorted by that column). */
export function userAriaSort(view: AdminUserFilterValues, column: AdminUserSort): "ascending" | "descending" | "none" {
  if (view.sort !== column) return "none";
  return view.dir === "desc" ? "descending" : "ascending";
}
