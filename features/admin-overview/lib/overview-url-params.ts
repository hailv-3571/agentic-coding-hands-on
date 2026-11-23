import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import type { OverviewFilterValues } from "../schemas/unit-stats-views";

/** CSV export of the table on screen ("All" row first, same range). */
export const OVERVIEW_EXPORT_PATH = "/api/admin/overview/export";

/** `from` / `to` (`yyyy-MM-dd`, read in ADMIN_TIMEZONE by the server); an empty end is left out. Pure. */
function rangeQuery(path: string, { from, to }: OverviewFilterValues): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** `/admin/overview?…` for a range (bare route = all time). */
export function overviewHref(filter: OverviewFilterValues): string {
  return rangeQuery(ADMIN_ROUTES.overview, filter);
}

/** Export URL of the same range. */
export function overviewExportHref(filter: OverviewFilterValues): string {
  return rangeQuery(OVERVIEW_EXPORT_PATH, filter);
}
