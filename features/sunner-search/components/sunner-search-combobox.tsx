"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import type { SunnerOption } from "../schemas/sunner-option";
import { darkListPanel, darkListRow, darkListRowActive, darkListStatus } from "./dark-list-styles";
import { SunnerOptionRow } from "./sunner-option-row";
import { useSunnerSearch } from "./use-sunner-search";

export type SunnerSearchComboboxProps = {
  /** Input id, so a `<label htmlFor>` names the combobox. */
  id: string;
  value: SunnerOption | null;
  onChange(value: SunnerOption | null): void;
  /** Recipient picker: true (no self-send); profile/admin search: false. */
  excludeSelf?: boolean;
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  describedBy?: string;
  /** Visual style of the input comes from the host screen. */
  inputClassName: string;
  /** Decorative icon at the right edge of the input (e.g. a caret). */
  trailingIcon?: ReactNode;
};

/**
 * Shared Sunner combobox (C-06; reused by phases 05/08/12): ARIA 1.2 combobox with a listbox
 * popup, debounced search, ↑/↓/Enter/Esc keyboard support, outside-click close and a polite
 * live region announcing loading, errors, no results and the result count. Typing after a pick clears the selection.
 * Enter never submits the surrounding form; Esc closes only the list while it is open.
 */
export function SunnerSearchCombobox(props: SunnerSearchComboboxProps) {
  const { id, value, onChange, excludeSelf = false, placeholder, invalid, required, describedBy } = props;
  const t = useTranslations("sunnerSearch");
  const [text, setText] = useState(value?.fullName ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  const { status, results } = useSunnerSearch(open ? text : "", { excludeSelf });
  useDismissable(open, close, containerRef, inputRef);

  const optionId = (index: number) => `${listId}-option-${index}`;
  const activeOption = open && active >= 0 && active < results.length ? active : -1;

  function select(option: SunnerOption) {
    onChange(option);
    setText(option.fullName);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(text.trim().length > 0);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => Math.min(Math.max(index + step, 0), results.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeOption >= 0) select(results[activeOption]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  const statusLine =
    status === "loading" ? t("loading")
    : status === "unauthorized" ? t("sessionExpired")
    : status === "error" ? t("failed")
    : status === "ready" && results.length === 0 ? t("noResults")
    : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeOption >= 0 ? optionId(activeOption) : undefined}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(event.target.value.trim().length > 0);
          setActive(-1);
          if (value) onChange(null);
        }}
        onKeyDown={handleKeyDown}
        className={props.inputClassName}
      />
      {props.trailingIcon && (
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2">
          {props.trailingIcon}
        </span>
      )}
      {open && (
        <div className={`${darkListPanel} inset-x-0`}>
          <ul id={listId} role="listbox" aria-label={t("listLabel")} className="flex flex-col gap-1">
            {results.map((option, index) => (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeOption}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => select(option)}
                className={`${darkListRow} ${index === activeOption ? darkListRowActive : "hover:bg-primary/20"}`}
              >
                <SunnerOptionRow option={option} />
              </li>
            ))}
          </ul>
          {statusLine && <p className={darkListStatus}>{statusLine}</p>}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {open ? (statusLine ?? (status === "ready" ? t("resultCount", { count: results.length }) : "")) : ""}
      </span>
    </div>
  );
}
