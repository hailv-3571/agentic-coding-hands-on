import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { departments } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";

export type DepartmentOption = { id: string; name: string };

/** Seeded departments (phase 01, C-15) for the first-login picker, in seed order. */
export async function listDepartmentOptions(locale: Locale): Promise<DepartmentOption[]> {
  const rows = await db
    .select({ id: departments.id, nameVi: departments.nameVi, nameEn: departments.nameEn })
    .from(departments)
    .orderBy(asc(departments.sortOrder), asc(departments.code));
  return rows.map((row) => ({ id: row.id, name: locale === "en" ? row.nameEn : row.nameVi }));
}
