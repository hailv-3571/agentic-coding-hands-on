"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { whiteFieldInput } from "./review-content-styles";

/** Spec E08: the table filters after typing pauses (~300 ms) or on Enter; at most 100 characters. */
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MAX_LENGTH = 100;

/**
 * "Search by content" (E08, Figma mms_C.4: white, w360, h48, rounded 8, search icon at the end).
 * Keeps its own text and sends the trimmed query after a pause or on Enter, never the same query
 * twice in a row. Key it with `useExternalResetKey` so an outside change (Xoá bộ lọc, back button)
 * remounts it with the new `initial` text. `label` / `placeholder` default to the Review content
 * copy; Admin › User passes its own (name or email, "Search").
 */
export function ReviewSearchInput({ initial, onSearch, label, placeholder }: { initial: string; onSearch(query: string): void; label?: string; placeholder?: string }) {
  const t = useTranslations("adminModeration.filters");
  const name = label ?? t("search");
  const id = useId();
  const [text, setText] = useState(initial);
  const sent = useRef(initial.trim());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The timer fires after later renders; it must call the newest callback (it carries the newest view).
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  function send(value: string) {
    clearTimeout(timer.current);
    const query = value.trim();
    if (query === sent.current) return;
    sent.current = query;
    onSearchRef.current(query);
  }

  return (
    <div className="relative w-full md:w-auto md:max-w-90 md:min-w-64 md:flex-1">
      <label htmlFor={id} className="sr-only">
        {name}
      </label>
      <input
        id={id}
        type="search"
        value={text}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder={placeholder ?? name}
        autoComplete="off"
        onChange={(event) => {
          const value = event.target.value;
          setText(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => send(value), SEARCH_DEBOUNCE_MS);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          send(text);
        }}
        className={`${whiteFieldInput} [&::-webkit-search-cancel-button]:hidden`}
      />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2">
        <AdminModerationIcon name="search" />
      </span>
    </div>
  );
}
