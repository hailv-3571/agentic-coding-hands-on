import "server-only";
import { and, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { adminDateRangeSchema } from "@/shared/admin/date-range-filter";
import { kudos } from "@/shared/db/schema";
import type { AdminKudoFilterValues } from "../schemas/admin-kudo-row";

/**
 * The ONE Review content filter (BR-002), shared by the table, its count and the CSV export: every
 * condition AND-ed, absent = "Tất cả". Dates are whole days in ADMIN_TIMEZONE as the half-open UTC
 * range of the phase 01 `adminDateRangeSchema`. Sender is the REAL sender, anonymous Kudos included
 * (D001, admin only). Content search (D009) folds case and diacritics with `public.f_unaccent`
 * (migration 0007) over title + message; user input is escaped so `%`, `_`, `\` stay literal.
 * Expects values already validated by `parseAdminKudoFilter` (a reversed range throws here).
 */
export type AdminKudoWhereInput = Pick<AdminKudoFilterValues, "status" | "senderId" | "receiverId" | "from" | "to" | "query">;

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

function contentMatches(query: string): SQL {
  const pattern = escapeLikePattern(query);
  return sql`public.f_unaccent(coalesce(${kudos.title}, '') || ' ' || ${kudos.body}) ilike '%' || public.f_unaccent(${pattern}) || '%' escape '\\'`;
}

export function buildAdminKudoWhere(filter: AdminKudoWhereInput): SQL | undefined {
  const { start, end } = adminDateRangeSchema.parse({ from: filter.from ?? undefined, to: filter.to ?? undefined });
  return and(
    filter.status ? eq(kudos.status, filter.status) : undefined,
    filter.senderId ? eq(kudos.senderId, filter.senderId) : undefined,
    filter.receiverId ? eq(kudos.recipientId, filter.receiverId) : undefined,
    start ? gte(kudos.createdAt, start) : undefined,
    end ? lt(kudos.createdAt, end) : undefined,
    filter.query ? contentMatches(filter.query) : undefined,
  );
}
