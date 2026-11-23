import "server-only";
import type { HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import { formatAdminDateTime } from "@/shared/admin/admin-date-time-format";
import { serializeCsv, type CsvCell } from "@/shared/admin/csv-serializer";
import { toAdminZone } from "@/shared/admin/timezone";
import type { AdminUserRow } from "../schemas/admin-user-views";

/**
 * Admin › User CSV (F014 A4, D012): the table's columns minus Actions, in table order, through the
 * phase 01 serializer (UTF-8 BOM, RFC 4180 quoting, formula guard — FR-603; never hand-rolled).
 * Instants are `dd/MM/yyyy HH:mm` in ADMIN_TIMEZONE, the table's format; "—" cells are left empty; the
 * full uuid is exported (the table shows 8 characters). Header labels are the table's (English) ones.
 */
export const USER_CSV_HEADER = [
  "ID",
  "User",
  "Email",
  "Sent Kudos",
  "Received Kudos",
  "Total Heart",
  "Level",
  "Number of Badges",
  "Time to get 6 Badges",
  "Last Logged in",
  "Role",
] as const;

const TIER_LABEL: Record<HeroTier, string> = { new: "New Hero", rising: "Rising Hero", super: "Super Hero", legend: "Legend Hero" };
const ROLE_LABEL: Record<AdminUserRow["role"], string> = { admin: "Admin", user: "User" };

const zonedDateTime = (iso: string | null) => (iso ? formatAdminDateTime(toAdminZone(new Date(iso))) : "");

export function toAdminUserCsvRow(row: AdminUserRow): CsvCell[] {
  return [
    row.id,
    row.name,
    row.email,
    row.kudosSent,
    row.kudosReceived,
    row.totalHearts,
    row.level ? TIER_LABEL[row.level] : "",
    row.badgeCount,
    zonedDateTime(row.sixBadgesAt),
    zonedDateTime(row.lastLoginAt),
    ROLE_LABEL[row.role],
  ];
}

export function serializeAdminUserCsv(rows: readonly AdminUserRow[]): string {
  return serializeCsv(USER_CSV_HEADER, rows.map(toAdminUserCsvRow));
}
