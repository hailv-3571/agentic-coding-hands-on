import "server-only";
import { and, asc, eq, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { departments, profiles } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { SunnerOption } from "../schemas/sunner-option";

/**
 * SunnerSearch (C-06): the single Sunner lookup, used over HTTP by GET /api/sunners/search and
 * in-process by phases 08/12. Name match is diacritic- and case-insensitive (`f_unaccent`,
 * migration *_kudos_constraints), email match is a case-insensitive prefix. User input is
 * escaped so `%`, `_` and `\` are literal characters, never wildcards.
 */
export type SearchSunnersOptions = { viewerId: string; limit: number; excludeSelf: boolean; locale: Locale };

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

const optionColumns = {
  id: profiles.id,
  fullName: profiles.fullName,
  email: profiles.email,
  avatarUrl: profiles.avatarUrl,
  departmentId: departments.id,
  departmentNameVi: departments.nameVi,
  departmentNameEn: departments.nameEn,
};

type OptionRow = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  departmentId: string | null;
  departmentNameVi: string | null;
  departmentNameEn: string | null;
};

function toSunnerOption(row: OptionRow, locale: Locale): SunnerOption {
  const name = locale === "en" ? row.departmentNameEn : row.departmentNameVi;
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    avatarUrl: row.avatarUrl,
    department: row.departmentId && name ? { id: row.departmentId, name } : null,
  };
}

function selectOptions(where: SQL | undefined) {
  return db
    .select(optionColumns)
    .from(profiles)
    .leftJoin(departments, eq(departments.id, profiles.departmentId))
    .where(where);
}

export async function searchSunners(q: string, options: SearchSunnersOptions): Promise<SunnerOption[]> {
  const pattern = escapeLikePattern(q.trim());
  const matches = or(
    sql`public.f_unaccent(${profiles.fullName}) ilike '%' || public.f_unaccent(${pattern}) || '%' escape '\\'`,
    sql`${profiles.email} ilike ${pattern} || '%' escape '\\'`,
  );
  const rows = await selectOptions(and(matches, options.excludeSelf ? ne(profiles.id, options.viewerId) : undefined))
    .orderBy(asc(profiles.fullName), asc(profiles.id))
    .limit(options.limit);
  return rows.map((row) => toSunnerOption(row, options.locale));
}

/** SunnerOption rows for known ids (e.g. the locked recipient of an edited Kudo), any order. */
export async function findSunnerOptionsByIds(ids: string[], locale: Locale): Promise<SunnerOption[]> {
  if (ids.length === 0) return [];
  const rows = await selectOptions(inArray(profiles.id, ids));
  return rows.map((row) => toSunnerOption(row, locale));
}
