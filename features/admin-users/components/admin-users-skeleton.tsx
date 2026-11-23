import { useTranslations } from "next-intl";
import { settingsTitle } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { AdminTableSkeletonRows } from "@/features/admin-moderation/components/admin-table-skeleton-rows";

/** Placeholder widths of the Unit, Level and Role selects (as in `AdminUserFilters`). */
const FILTER_WIDTHS = ["sm:w-[259px]", "sm:w-36", "sm:w-36"];

/**
 * Loading state of Admin › User (spec § 5 "loading"), for app/admin/users/loading.tsx: the title,
 * the Export button, the three selects and the search as placeholders, then the table skeleton.
 */
export function AdminUsersSkeleton() {
  const t = useTranslations("adminUsers");
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="h-13 w-24 animate-pulse rounded bg-secondary" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
          {FILTER_WIDTHS.map((width, field) => (
            <div key={field} className={`mt-6.5 h-12 w-full animate-pulse rounded-lg bg-secondary ${width}`} />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded-lg bg-secondary md:w-90" />
      </div>
      <AdminTableSkeletonRows />
    </div>
  );
}
