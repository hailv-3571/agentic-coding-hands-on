import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import { ADMIN_KUDO_PARAMS, type AdminKudoFilterValues, type AdminKudoSort } from "../schemas/admin-kudo-row";

/** CSV export of the current filter (BR-002: same params, same order as the table). */
export const ADMIN_KUDO_EXPORT_PATH = "/api/admin/kudos/export";

/**
 * Query string of a Review content view with the shared param names (`ADMIN_KUDO_PARAMS`).
 * Defaults are left out (page 1, newest first, no filter, blank search), so the default view is the
 * bare route. Pure: no React, safe to unit test.
 */
function reviewSearchParams(filter: AdminKudoFilterValues, withPage: boolean): URLSearchParams {
  const params = new URLSearchParams();
  const entries: [string, string | null][] = [
    [ADMIN_KUDO_PARAMS.query, filter.query.trim() || null],
    [ADMIN_KUDO_PARAMS.sender, filter.senderId],
    [ADMIN_KUDO_PARAMS.receiver, filter.receiverId],
    [ADMIN_KUDO_PARAMS.status, filter.status],
    [ADMIN_KUDO_PARAMS.from, filter.from],
    [ADMIN_KUDO_PARAMS.to, filter.to],
    [ADMIN_KUDO_PARAMS.sort, filter.sort === "newest" ? null : filter.sort],
    [ADMIN_KUDO_PARAMS.page, withPage && filter.page > 1 ? String(filter.page) : null],
  ];
  for (const [key, value] of entries) if (value) params.set(key, value);
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** `/admin/review?…` for a view. */
export function reviewHref(filter: AdminKudoFilterValues): string {
  return withQuery(ADMIN_ROUTES.review, reviewSearchParams(filter, true));
}

/** Export URL of a view: its filter and order, never its page. */
export function reviewExportHref(filter: AdminKudoFilterValues): string {
  return withQuery(ADMIN_KUDO_EXPORT_PATH, reviewSearchParams(filter, false));
}

/** Applies a change to the view. Anything but a page change goes back to page 1 (FR-402). */
export function applyFilterPatch(filter: AdminKudoFilterValues, patch: Partial<AdminKudoFilterValues>): AdminKudoFilterValues {
  return { ...filter, ...patch, page: patch.page ?? 1 };
}

const HEART_SORT_CYCLE: Record<AdminKudoSort, AdminKudoSort> = {
  newest: "hearts_desc",
  hearts_desc: "hearts_asc",
  hearts_asc: "newest",
};

/** Heart header click: newest first → most hearts → fewest hearts → newest first. */
export function nextHeartSort(sort: AdminKudoSort): AdminKudoSort {
  return HEART_SORT_CYCLE[sort];
}

/** `aria-sort` of the Heart header ("none" while the table is sorted by date). */
export function heartAriaSort(sort: AdminKudoSort): "descending" | "ascending" | "none" {
  return sort === "hearts_desc" ? "descending" : sort === "hearts_asc" ? "ascending" : "none";
}
