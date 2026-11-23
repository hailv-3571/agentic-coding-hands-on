"use client";

import { useTranslations } from "next-intl";
import type { AdminKudoStatus } from "../schemas/admin-kudo-row";
import { AdminFilterSelect } from "./admin-filter-select";
import { statusChip, statusListPanel } from "./review-content-styles";

const OPTIONS: (AdminKudoStatus | null)[] = [null, "public", "spam"];

/**
 * Status filter (E07, Figma mms_C.3 + list 1002:15559): a labelled 259 px white select showing
 * "Chọn trạng thái" or the chosen value; its list (right-aligned, #00070C) holds outlined chips
 * "Tất cả" (clears, spec default) / "Public" / "Spam". Mechanics and keyboard: `AdminFilterSelect`.
 */
export function ReviewStatusFilter({ value, onChange }: { value: AdminKudoStatus | null; onChange(value: AdminKudoStatus | null): void }) {
  const t = useTranslations("adminModeration");
  return (
    <AdminFilterSelect
      label={t("filters.status")}
      placeholder={t("filters.statusPlaceholder")}
      listLabel={t("filters.statusList")}
      options={OPTIONS.map((option) => ({ value: option, label: option ? t(`status.${option}`) : t("filters.all") }))}
      value={value}
      onChange={onChange}
      className="sm:w-[259px]"
      listClassName={statusListPanel}
      optionClassName={statusChip}
    />
  );
}
