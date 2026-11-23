"use client";

import { useTranslations } from "next-intl";
import { AdminFilterSelect, type AdminFilterSelectOption } from "@/features/admin-moderation/components/admin-filter-select";
import { ReviewSearchInput } from "@/features/admin-moderation/components/review-search-input";
import { useExternalResetKey } from "@/features/admin-moderation/components/use-external-reset-key";
import { HERO_TIERS } from "@/features/hero-badges/schemas/hero-tier";
import type { AdminUserFilterOptions, AdminUserFilterValues } from "../schemas/admin-user-views";
import { filterListOption, filterListPanel } from "./admin-users-styles";

type AdminUserFiltersProps = {
  /** The view on screen (optimistic while a filter change navigates). */
  view: AdminUserFilterValues;
  departments: AdminUserFilterOptions["departments"];
  onChange(patch: Partial<AdminUserFilterValues>): void;
};

/**
 * Filter bar (R2, Figma 773:26403): Unit (259), Level and Role selects on the left, the name or
 * email search on the right (stacked on phones). Each list starts with "Tất cả" (clears the
 * filter) and ends with its "none" value where the server has one (unassigned unit, no Hero tier
 * yet). Every change goes up as a patch; the screen turns it into the URL with page 1.
 */
export function AdminUserFilters({ view, departments, onChange }: AdminUserFiltersProps) {
  const t = useTranslations("adminUsers");
  const tHero = useTranslations("hero");
  const [searchKey, markSearchSent] = useExternalResetKey(view.query);

  const all = { value: null, label: t("filters.all") };
  const unitOptions: AdminFilterSelectOption<AdminUserFilterValues["unit"]>[] = [
    all,
    ...departments.map((department) => ({ value: department.id, label: department.name })),
    { value: "none", label: t("filters.unitNone") },
  ];
  const levelOptions: AdminFilterSelectOption<AdminUserFilterValues["level"]>[] = [
    all,
    ...HERO_TIERS.map((tier) => ({ value: tier, label: tHero(`${tier}.label`) })),
    { value: "none", label: t("filters.levelNone") },
  ];
  const roleOptions: AdminFilterSelectOption<AdminUserFilterValues["role"]>[] = [
    all,
    { value: "admin", label: t("role.admin") },
    { value: "user", label: t("role.user") },
  ];
  const listLook = { listClassName: filterListPanel, optionClassName: filterListOption };

  return (
    <div role="search" aria-label={t("filters.region")} className="flex flex-wrap items-end justify-end gap-4">
      <div className="mr-auto flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap md:w-auto">
        <AdminFilterSelect
          label={t("filters.unit")}
          placeholder={t("filters.unitPlaceholder")}
          listLabel={t("filters.unitList")}
          options={unitOptions}
          value={view.unit}
          onChange={(unit) => onChange({ unit })}
          className="sm:w-[259px]"
          {...listLook}
        />
        <AdminFilterSelect
          label={t("filters.level")}
          placeholder={t("filters.levelPlaceholder")}
          listLabel={t("filters.levelList")}
          options={levelOptions}
          value={view.level}
          onChange={(level) => onChange({ level })}
          className="sm:w-36"
          {...listLook}
        />
        <AdminFilterSelect
          label={t("filters.role")}
          placeholder={t("filters.rolePlaceholder")}
          listLabel={t("filters.roleList")}
          options={roleOptions}
          value={view.role}
          onChange={(role) => onChange({ role })}
          className="sm:w-36"
          {...listLook}
        />
      </div>
      <ReviewSearchInput
        key={`search-${searchKey}`}
        initial={view.query}
        label={t("filters.search")}
        placeholder={t("filters.searchPlaceholder")}
        onSearch={(query) => {
          markSearchSent(query);
          onChange({ query });
        }}
      />
    </div>
  );
}
