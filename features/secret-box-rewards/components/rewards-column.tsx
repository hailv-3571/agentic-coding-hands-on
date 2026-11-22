import { useTranslations } from "next-intl";
import type { RewardsColumnData } from "../schemas/secret-box-views";
import { LatestGiftWinnersList } from "./latest-gift-winners-list";
import { PersonalStatsPanel } from "./personal-stats-panel";

/**
 * Right column of the Live board ALL KUDOS section (SCR-live-board-rewards-column; Figma
 * 2940:13488): personal stats with "Mở Secret Box", then the 10 latest gift winners, gap 24.
 * 422 wide next to the 680 feed from `lg`; below that it stacks under the feed at full width.
 * Each panel fails on its own (`null` data → that panel's error), never the page. Rendered by the
 * phase 05 seam `live-board-rewards-column-slot.tsx`. Server/client neutral.
 */
export function RewardsColumn({ data }: { data: RewardsColumnData }) {
  const t = useTranslations("secretBox.column");
  return (
    <aside aria-label={t("label")} className="flex w-full min-w-0 flex-col gap-6 lg:w-105.5 lg:shrink-0">
      <PersonalStatsPanel stats={data.stats} />
      <LatestGiftWinnersList winners={data.winners} />
    </aside>
  );
}
