import "server-only";
import { count as countRows, type SQL } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudos } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { AdminKudoFilterValues, AdminKudoPage, AdminKudoRow, AdminKudoSort } from "../schemas/admin-kudo-row";
import { buildAdminKudoWhere, type AdminKudoWhereInput } from "./admin-kudo-where-builder";
import { selectAdminKudoRows } from "./admin-kudo-row-select";

/**
 * KudoAdminQuery (A1/A4, C-13): Admin › Review content reads — every Kudo, public AND spam, with the
 * real sender. A separate module from kudos-feed's `KudoPublicQuery` on purpose (no shared mapper).
 * NO guard inside: every caller (page, route handlers) passes `requireAdmin()` /
 * `resolveAdminAccess()` first; Drizzle bypasses RLS (C-20), so never call it from a non-admin path.
 * Numbered pages of 10, newest first by default (D010); a page past the end is clamped to the last.
 */
export const ADMIN_KUDO_PAGE_SIZE = 10;

async function countWhere(where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ total: countRows() }).from(kudos).where(where);
  return row?.total ?? 0;
}

/** One table page: total over the whole filter, page clamped to [1, pageCount]. */
async function list(filter: AdminKudoFilterValues, locale: Locale): Promise<AdminKudoPage> {
  const where = buildAdminKudoWhere(filter);
  const total = await countWhere(where);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_KUDO_PAGE_SIZE));
  const page = Math.min(filter.page, pageCount);
  const rows =
    total === 0
      ? []
      : await selectAdminKudoRows(where, filter.sort, locale, {
          limit: ADMIN_KUDO_PAGE_SIZE,
          offset: (page - 1) * ADMIN_KUDO_PAGE_SIZE,
        });
  return { rows, total, page, pageCount };
}

/**
 * At most `maxRows` matching rows in table order, from the first row (CSV export, DEC-002). The
 * export asks for EXPORT_MAX_ROWS + 1 and refuses the file when it gets them all, so the limit check
 * and the rows come from one read and a Kudo inserted meanwhile cannot push the file past the limit.
 */
async function listForExport(
  filter: AdminKudoWhereInput & { sort: AdminKudoSort },
  locale: Locale,
  maxRows: number,
): Promise<AdminKudoRow[]> {
  return selectAdminKudoRows(buildAdminKudoWhere(filter), filter.sort, locale, { limit: maxRows, offset: 0 });
}

export const KudoAdminQuery = { list, listForExport } as const;
