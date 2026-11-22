"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SEARCH_DEBOUNCE_MS, SEARCH_MAX_LENGTH } from "../lib/spotlight-ui-config";

type SpotlightSearchInputProps = {
  /** Receives the text after a short typing pause (A4, debounced). */
  onSearch(query: string): void;
  className?: string;
};

/**
 * "Tìm kiếm" pill (E03, Figma 219×39 at left 24 / top 25): 10 % gold fill, 0.68 px #998C5F border,
 * radius 46, search icon 16 + Medium 10.9/16.4 white text. Max 50 characters; filtering happens in
 * the cloud on the names already shown (D003), never on the server.
 */
export function SpotlightSearchInput({ onSearch, className = "" }: SpotlightSearchInputProps) {
  const t = useTranslations("spotlight");
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <label
      className={`flex h-[39px] items-center gap-[5.5px] rounded-[46px] border-[0.68px] border-border bg-secondary px-[11px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${className}`}
    >
      <Image src="/images/spotlight/ic-search.svg" alt="" width={16} height={16} aria-hidden className="shrink-0" />
      <span className="sr-only">{t("searchLabel")}</span>
      <input
        type="search"
        value={value}
        maxLength={SEARCH_MAX_LENGTH}
        onChange={(event) => setValue(event.target.value.slice(0, SEARCH_MAX_LENGTH))}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent text-[11px] leading-4 font-medium text-text outline-none placeholder:text-text"
      />
    </label>
  );
}
