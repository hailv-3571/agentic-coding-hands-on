"use client";

import { useTranslations } from "next-intl";
import { bodyCell, headerCell, headerDivider, secondaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import type { AdminKudoRow, AdminKudoSort, AdminKudoStatus } from "../schemas/admin-kudo-row";
import type { KudoModerationResult } from "../schemas/kudo-moderation-result";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { ReviewTableRow } from "./review-table-row";
import { heartAriaSort } from "./review-url-params";

type ReviewTableProps = {
  rows: AdminKudoRow[];
  /** Statuses patched in place after a moderation, by Kudo id. */
  statuses: Record<string, AdminKudoStatus>;
  sort: AdminKudoSort;
  /** A filter change is loading: rows dim, the filters stay usable (spec § 5 "loading"). */
  busy: boolean;
  onSortHearts(): void;
  onModerated(kudoId: string, result: KudoModerationResult): void;
  /** Shown in the empty state when a filter is active ("xoá bộ lọc"). */
  onClearFilters?: () => void;
};

/** Heart header (E14, Figma "Heart" + sorter): a button cycling the sort; the active caret is lit. */
function HeartSortButton({ sort, onClick }: { sort: AdminKudoSort; onClick(): void }) {
  const t = useTranslations("adminModeration.table");
  return (
    <button type="button" onClick={onClick} title={t("heartSort")} className={`inline-flex items-center gap-2 rounded ${focusRing}`}>
      {t("heart")}
      <span aria-hidden className="flex flex-col">
        <AdminModerationIcon name="sort-up" className={`-mb-0.5 ${sort === "hearts_asc" ? "brightness-200" : "opacity-40"}`} />
        <AdminModerationIcon name="sort-down" className={`-mt-0.5 ${sort === "hearts_desc" ? "brightness-200" : "opacity-40"}`} />
      </span>
    </button>
  );
}

/**
 * Kudo table (R3, Figma mms_D_Review content): ID · Sender · Receiver · Content · Hashtag · Heart
 * (sortable) · Status · Actions, in the phase 06 table tokens (#00101A header, #00070C rows,
 * #2E3940 rules). Fixed column widths from Figma with the Content column taking the rest; ID and
 * Actions are wider than Figma (60 / 80) to fit the 8-character id (D011) and the legible button.
 * Labels and values share the header's left edge. Narrow screens scroll the table sideways.
 */
export function ReviewTable({ rows, statuses, sort, busy, onSortHearts, onModerated, onClearFilters }: ReviewTableProps) {
  const t = useTranslations("adminModeration");
  const divided = `${headerCell} ${headerDivider}`;
  return (
    <div className="overflow-x-auto" aria-busy={busy}>
      <table className={`w-full min-w-240 table-fixed border-collapse transition-opacity ${busy ? "opacity-60" : ""}`}>
        <caption className="sr-only">{t("table.caption")}</caption>
        <colgroup>
          <col className="w-24" />
          <col className="w-30" />
          <col className="w-30" />
          <col />
          <col className="w-40" />
          <col className="w-22" />
          <col className="w-30" />
          <col className="w-28" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={headerCell}>
              {t("table.id")}
            </th>
            <th scope="col" className={divided}>
              {t("table.sender")}
            </th>
            <th scope="col" className={divided}>
              {t("table.receiver")}
            </th>
            <th scope="col" className={divided}>
              {t("table.content")}
            </th>
            <th scope="col" className={divided}>
              {t("table.hashtag")}
            </th>
            <th scope="col" aria-sort={heartAriaSort(sort)} className={divided}>
              <HeartSortButton sort={sort} onClick={onSortHearts} />
            </th>
            <th scope="col" className={divided}>
              {t("table.status")}
            </th>
            <th scope="col" className={divided}>
              {t("table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={bodyCell}>
                <span className="flex flex-col items-center gap-4 py-6 text-center text-text-muted">
                  {t("table.empty")}
                  {onClearFilters && (
                    <button type="button" onClick={onClearFilters} className={secondaryButton}>
                      {t("filters.clear")}
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ) : (
            rows.map((row) => <ReviewTableRow key={row.id} row={row} status={statuses[row.id] ?? row.status} onModerated={onModerated} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
