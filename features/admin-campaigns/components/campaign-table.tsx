"use client";

import { useTranslations } from "next-intl";
import type { CampaignListItem } from "../schemas/campaign-admin-result";
import { CampaignRowMenu } from "./campaign-row-menu";
import { actionsCell, bodyCell, headerCell, headerDivider } from "./campaign-settings-styles";

type CampaignTableProps = {
  campaigns: CampaignListItem[];
  onEdit(campaign: CampaignListItem): void;
  onDelete(campaign: CampaignListItem): void;
};

/** "dd/MM/yyyy - HH:mm" (ADMIN_TIMEZONE, pre-formatted by the server) as date, dash, time with gap 8. */
function CampaignInstant({ display }: { display: string }) {
  const [date, time] = display.split(" - ");
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <span>{date}</span>
      <span aria-hidden="true">-</span>
      <span>{time}</span>
    </span>
  );
}

/**
 * Campaign table (E03–E07, Figma 820:10492): ID (60, centred) | Name (480, one line with an
 * ellipsis, full name on hover) | Time (start and end, gap 40; stacked on phones) | Actions (80;
 * its header text is visually hidden on phones, where the column is only as wide as the button).
 * Rows come ordered by start DESC from the server (FR-202, no paging). The "⋯" menu exists only
 * for upcoming and active campaigns (DEC-001). No rows → the E13 empty message in the row style.
 */
export function CampaignTable({ campaigns, onEdit, onDelete }: CampaignTableProps) {
  const t = useTranslations("adminCampaigns.table");
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">{t("caption")}</caption>
      <colgroup>
        <col className="w-9 md:w-15" />
        <col className="md:w-120" />
        <col className="w-40 md:w-auto" />
        <col className="w-12 md:w-20" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={`${headerCell} text-center`}>
            {t("id")}
          </th>
          <th scope="col" className={`${headerCell} ${headerDivider}`}>
            {t("name")}
          </th>
          <th scope="col" className={`${headerCell} ${headerDivider}`}>
            {t("time")}
          </th>
          <th scope="col" className={`${headerCell} ${headerDivider} text-center`}>
            <span className="sr-only md:not-sr-only">{t("actions")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {campaigns.length === 0 ? (
          <tr>
            <td colSpan={4} className={`${bodyCell} text-center text-text-muted`}>
              {t("empty")}
            </td>
          </tr>
        ) : (
          campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td className={`${bodyCell} text-center`}>{campaign.id}</td>
              <td className={bodyCell}>
                <span className="block truncate" title={campaign.name}>
                  {campaign.name}
                </span>
              </td>
              <td className={bodyCell}>
                <span className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-x-10">
                  <CampaignInstant display={campaign.startsAtDisplay} />
                  <span className="sr-only">{t("until")}</span>
                  <CampaignInstant display={campaign.endsAtDisplay} />
                </span>
              </td>
              <td className={actionsCell}>
                {campaign.phase !== "ended" && (
                  <CampaignRowMenu campaignName={campaign.name} onEdit={() => onEdit(campaign)} onDelete={() => onDelete(campaign)} />
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
