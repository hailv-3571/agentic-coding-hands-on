import "server-only";
import { serializeCsv, type CsvCell } from "@/shared/admin/csv-serializer";
import type { UnitStatsRow, UnitStatsTable } from "../schemas/unit-stats-views";

/**
 * Admin › Overview CSV (F015 A2, FR-402/602): the table's seven columns (D010 labels), the "All" row
 * first, then the units numbered 1..n in table order (unassigned last), through the phase 01 serializer
 * (UTF-8 BOM, RFC 4180 quoting, formula guard — unit names are admin data but still guarded). One row
 * per unit, so no row cap applies (spec A2).
 */
export const OVERVIEW_CSV_HEADER = [
  "No",
  "Unit",
  "Total member",
  "Total sent kudos",
  "Total received kudos",
  "Total users with at least 1 kudo",
  "Total received secret box",
] as const;

type UnitNumbers = UnitStatsTable["all"];

const numbersOf = (row: UnitNumbers): CsvCell[] => [
  row.totalMembers,
  row.kudosSent,
  row.kudosReceived,
  row.usersWithReceivedKudo,
  row.secretBoxesReceived,
];

export function serializeOverviewCsv(table: UnitStatsTable): string {
  const units = table.rows.map((row: UnitStatsRow, index) => [index + 1, row.unitName, ...numbersOf(row)]);
  return serializeCsv(OVERVIEW_CSV_HEADER, [["", "All", ...numbersOf(table.all)], ...units]);
}
