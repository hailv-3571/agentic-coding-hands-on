"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SunnerSearchCombobox } from "@/features/sunner-search/components/sunner-search-combobox";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { focusRing, pillSurface } from "./kudo-feed-styles";

/**
 * "Tìm kiếm profile Sunner" pill (E08/E09, Figma 2940:13431: w381 next to the launcher). Reuses
 * the shared Sunner combobox (C-06, `excludeSelf=false`: you may look yourself up); picking a
 * result opens `/profile/{id}` (phase 12).
 */
export function SunnerProfileSearch() {
  const t = useTranslations("kudosFeed.search");
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState<SunnerOption | null>(null);

  function handleChange(option: SunnerOption | null) {
    setValue(option);
    if (option) router.push(`${APP_ROUTES.profile}/${option.id}`);
  }

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 z-10 flex -translate-y-1/2">
        <KudoFeedIcon name="search" />
      </span>
      <SunnerSearchCombobox
        id={id}
        value={value}
        onChange={handleChange}
        excludeSelf={false}
        placeholder={t("placeholder")}
        inputClassName={`${pillSurface} w-full pr-4 pl-14 placeholder:text-text ${focusRing}`}
      />
    </div>
  );
}
