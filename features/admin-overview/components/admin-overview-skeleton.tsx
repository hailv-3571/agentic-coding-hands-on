import { useTranslations } from "next-intl";
import { settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { AdminTableSkeletonRows } from "@/features/admin-moderation/components/admin-table-skeleton-rows";

/**
 * Loading state of Admin › Overview (spec § 5 "loading"), for app/admin/overview/loading.tsx: the
 * title, the date range and Export as placeholders, then short table rows.
 */
export function AdminOverviewSkeleton() {
  const t = useTranslations("adminOverview");
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="flex w-full gap-4 sm:w-auto">
          <div className="h-13 flex-1 animate-pulse rounded-lg bg-secondary sm:w-74 sm:flex-none" />
          <div className="h-13 w-24 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <AdminTableSkeletonRows rows={8} rowHeight="h-11" />
    </div>
  );
}
