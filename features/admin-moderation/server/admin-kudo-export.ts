import "server-only";
import { serializeCsv, type CsvCell } from "@/shared/admin/csv-serializer";
import { formatInZone, toAdminZone } from "@/shared/admin/timezone";
import type { AdminKudoRow } from "../schemas/admin-kudo-row";

/**
 * Admin › Review content CSV (A4, D007): the rows of the current filter in table order, through the
 * phase 01 serializer (UTF-8 BOM, RFC 4180 quoting, formula guard — FR-604 / BR-004; never hand-rolled).
 * Columns per phase-08 plan § Architecture; instants in ADMIN_TIMEZONE. Anonymous Kudos carry the real
 * sender plus "Có" (D001, admin-only file). The full uuid is exported (the table shows 8 characters).
 */
export const ADMIN_KUDO_CSV_HEADER = [
  "ID",
  "Ngày gửi",
  "Người gửi",
  "Email người gửi",
  "Ẩn danh",
  "Người nhận",
  "Tiêu đề",
  "Lời nhắn",
  "Hashtag",
  "Tim",
  "Trạng thái",
  "Kiểm duyệt bởi",
  "Kiểm duyệt lúc",
] as const;

const STATUS_LABEL: Record<AdminKudoRow["status"], string> = { public: "Public", spam: "Spam" };

export function toAdminKudoCsvRow(row: AdminKudoRow): CsvCell[] {
  return [
    row.id,
    formatInZone(new Date(row.createdAt)),
    row.sender.name,
    row.sender.email,
    row.isAnonymous ? "Có" : "Không",
    row.receiver.name,
    row.title ?? "",
    row.message,
    row.hashtags.join(", "),
    row.heartCount,
    STATUS_LABEL[row.status],
    row.moderatedBy?.name ?? "",
    row.moderatedAt ? formatInZone(new Date(row.moderatedAt)) : "",
  ];
}

export function serializeAdminKudoCsv(rows: readonly AdminKudoRow[]): string {
  return serializeCsv(ADMIN_KUDO_CSV_HEADER, rows.map(toAdminKudoCsvRow));
}

/** `kudos-{yyyyMMdd-HHmm}.csv`, wall clock of `now` in ADMIN_TIMEZONE. */
export function adminKudoExportFilename(now: Date): string {
  const p = toAdminZone(now);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `kudos-${pad(p.year, 4)}${pad(p.month)}${pad(p.day)}-${pad(p.hour)}${pad(p.minute)}.csv`;
}
