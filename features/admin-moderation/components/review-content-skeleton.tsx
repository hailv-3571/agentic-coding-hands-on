import { useTranslations } from "next-intl";
import { settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { AdminTableSkeletonRows } from "./admin-table-skeleton-rows";

/**
 * Loading state of Admin › Review content (spec § 5 "loading"): the title, placeholder filter
 * fields, a header bar and five pulsing rows, in the table tokens of phase 06.
 */
export function ReviewContentSkeleton() {
  const t = useTranslations("adminModeration");
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="flex gap-4">
          <div className="h-13 w-74 animate-pulse rounded-lg bg-secondary" />
          <div className="h-13 w-24 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[0, 1, 2].map((field) => (
          <div key={field} className="mt-6.5 h-12 w-full animate-pulse rounded-lg bg-secondary sm:w-[259px]" />
        ))}
      </div>
      <AdminTableSkeletonRows />
    </div>
  );
}
