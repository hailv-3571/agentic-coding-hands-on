"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { filterLabel, whiteField } from "./review-content-styles";

export type AdminFilterSelectOption<T> = { value: T; label: string };

type AdminFilterSelectProps<T> = {
  label: string;
  /** Shown on the white field while the value is null ("Chọn …"). */
  placeholder: string;
  /** Accessible name of the open list. */
  listLabel: string;
  options: readonly AdminFilterSelectOption<T>[];
  value: T;
  onChange(value: T): void;
  /** Width of the labelled field, e.g. `sm:w-[259px]`. */
  className: string;
  /** List panel and option looks (Review content chips, Admin › User centred rows). */
  listClassName: string;
  optionClassName: string;
};

/**
 * Admin filter select (phase 08 Status, phase 14 Unit / Level / Role): a labelled white field
 * showing the placeholder or the chosen option; its listbox holds the options. Keyboard like the
 * Highlight filters: focus moves to the chosen option on open, ↑/↓/Home/End move (roving
 * tabindex), Enter/Space pick, Tab closes and moves on, Shift+Tab closes back onto the button, Esc
 * or an outside click close. Picking puts focus back on the button.
 */
export function AdminFilterSelect<T>({
  label,
  placeholder,
  listLabel,
  options,
  value,
  onChange,
  className,
  listClassName,
  optionClassName,
}: AdminFilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const valueId = useId();
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  const selectedIndex = options.findIndex((option) => Object.is(option.value, value));
  const selected = value === null ? undefined : options[selectedIndex];

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [open]);

  function toggle() {
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen((current) => !current);
  }

  function pick(option: T) {
    setOpen(false);
    triggerRef.current?.focus();
    if (!Object.is(option, value)) onChange(option);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      // Unmount the list first, so Tab continues from the button to the next control.
      flushSync(() => setOpen(false));
      triggerRef.current?.focus();
      if (event.shiftKey) event.preventDefault();
      return;
    }
    const count = options.length;
    const next =
      event.key === "Home" ? 0
      : event.key === "End" ? count - 1
      : event.key === "ArrowDown" ? (activeIndex + 1) % count
      : event.key === "ArrowUp" ? (activeIndex - 1 + count) % count
      : null;
    if (next === null) return;
    event.preventDefault();
    listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.focus();
  }

  return (
    <div className={`flex w-full flex-col gap-0.5 ${className}`}>
      <span id={labelId} className={filterLabel}>
        {label}
      </span>
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-labelledby={`${labelId} ${valueId}`}
          onClick={toggle}
          className={`${whiteField} flex items-center justify-between gap-1 pr-2 pl-4 text-left ${open ? "border-primary" : ""}`}
        >
          <span id={valueId} className={`truncate ${selected ? "" : "text-text-muted"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <AdminModerationIcon name="caret-select" />
        </button>
        {open && (
          <div ref={listRef} id={listId} role="listbox" aria-label={listLabel} onKeyDown={handleKeyDown} className={listClassName}>
            {options.map((option, index) => (
              <button
                key={String(option.value ?? "all")}
                type="button"
                role="option"
                aria-selected={Object.is(option.value, value)}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => pick(option.value)}
                className={optionClassName}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
