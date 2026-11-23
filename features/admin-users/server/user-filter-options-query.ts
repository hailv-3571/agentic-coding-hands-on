import "server-only";
import { db } from "@/shared/db/client";
import { departments } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { AdminUserFilterOptions } from "../schemas/admin-user-views";

/**
 * Options of the Admin › User filters (F014 A2, FR-203). Only the Unit list is data: every department
 * with its localized name, natural A–Z (CEVC2 before CEVC10, like the Overview units, D011). The Level
 * options (4 Hero tiers + "none") and the two roles are constants the UI owns. Admin-only caller.
 */
const unitNameOrder = new Intl.Collator("vi", { numeric: true });

async function get(locale: Locale): Promise<AdminUserFilterOptions> {
  const rows = await db.select({ id: departments.id, nameVi: departments.nameVi, nameEn: departments.nameEn }).from(departments);
  const options = rows.map((row) => ({ id: row.id, name: locale === "en" ? row.nameEn : row.nameVi }));
  return { departments: options.sort((a, b) => unitNameOrder.compare(a.name, b.name)) };
}

export const UserFilterOptionsQuery = { get } as const;
