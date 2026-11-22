import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/shared/db/client";
import { departments, profiles } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { ProfileView } from "../schemas/profile-views";

/**
 * ProfileQuery (F012, FR-001): one Sunner's profile ⨝ department, read-only. Explicit columns only:
 * no email, role or last login ever leaves through it. A malformed id answers null like an unknown
 * one (the pages call `notFound()`, the routes answer 404), without touching the database.
 * React `cache()` makes it one read per render pass: another Sunner's page and its first KUDOS page
 * (listProfileKudos) share it (review Low). Outside a render (route handlers, tests) it is a plain call.
 */
async function getById(userId: string, locale: Locale): Promise<ProfileView | null> {
  if (!z.uuid().safeParse(userId).success) return null;
  const [row] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      departmentCode: departments.code,
      departmentName: locale === "en" ? departments.nameEn : departments.nameVi,
    })
    .from(profiles)
    .leftJoin(departments, eq(departments.id, profiles.departmentId))
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!row) return null;
  const department = row.departmentCode && row.departmentName ? { code: row.departmentCode, name: row.departmentName } : null;
  return { id: row.id, fullName: row.fullName, avatarUrl: row.avatarUrl, department };
}

export const ProfileQuery = { getById: cache(getById) } as const;
