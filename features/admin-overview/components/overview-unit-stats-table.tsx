"use client";

import { useFormatter, useTranslations } from "next-intl";
import { headerCell, headerDivider } from "@/features/admin-campaigns/components/campaign-settings-styles";
import type { UnitStatsRow, UnitStatsTable } from "../schemas/unit-stats-views";

type Counts = UnitStatsTable["all"];

/** Count columns, left to right (labels per D010: "received", "at least 1 kudo"). */
const COUNT_COLUMNS = ["totalMembers", "kudosSent", "kudosReceived", "usersWithReceivedKudo", "secretBoxesReceived"] as const satisfies readonly (keyof Counts)[];

/** Body cell without its own fill: the zebra colour sits on the row (Figma rgba(16,20,23,.8) / #00070C). */
const cell = "border-b border-divider px-2 pt-3 pb-[13px] text-left align-middle text-body-medium font-normal text-text md:px-3";
const zebraRow = "odd:bg-container even:bg-container-2";

function CountCells({ counts }: { counts: Counts }) {
  const format = useFormatter();
  return COUNT_COLUMNS.map((column) => (
    <td key={column} className={`${cell} tabular-nums`}>
      {format.number(counts[column])}
    </td>
  ));
}

/**
 * Unit statistics (R2, Figma 620:24669): No · Unit · Total member · Total sent kudos · Total received
 * kudos · Total users with at least 1 kudo · Total received secret box, header cells with the 22 px
 * left rules of phase 06, zebra rows, Regular 14/20 white. The "All" totals row comes first (its
 * No left empty, spec E05 note), then one row per unit numbered from 1, "Chưa gán đơn vị" last when
 * present. No paging, no sorting (D011). Narrow screens scroll the table inside its box.
 */
export function OverviewUnitStatsTable({ table, busy }: { table: UnitStatsTable; busy: boolean }) {
  const t = useTranslations("adminOverview.table");
  const divided = `${headerCell} ${headerDivider}`;
  const unitName = (row: UnitStatsRow) => (row.unitId === null ? t("unassigned") : row.unitName);

  return (
    <div className="overflow-x-auto" aria-busy={busy}>
      <table className={`w-full min-w-240 table-fixed border-collapse transition-opacity ${busy ? "opacity-60" : ""}`}>
        <caption className="sr-only">{t("caption")}</caption>
        <colgroup>
          <col className="w-14" />
          <col className="w-[18%]" />
          <col />
          <col />
          <col />
          <col className="w-[19%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={`${headerCell} text-center`}>
              {t("no")}
            </th>
            <th scope="col" className={divided}>
              {t("unit")}
            </th>
            {COUNT_COLUMNS.map((column) => (
              <th key={column} scope="col" className={divided}>
                {t(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className={zebraRow}>
            <td className={cell} />
            <th scope="row" className={`${cell} font-medium`}>
              {t("all")}
            </th>
            <CountCells counts={table.all} />
          </tr>
          {table.rows.map((row, index) => (
            <tr key={row.unitId ?? "unassigned"} className={zebraRow}>
              <td className={`${cell} text-center tabular-nums`}>{index + 1}</td>
              <th scope="row" className={`${cell} wrap-anywhere`}>
                {unitName(row)}
              </th>
              <CountCells counts={row} />
            </tr>
          ))}
          {table.rows.length === 0 && (
            <tr className={zebraRow}>
              <td colSpan={COUNT_COLUMNS.length + 2} className={`${cell} text-center text-text-muted`}>
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
