"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { filterButton, filterOption } from "./kudo-feed-styles";

export type HighlightFilterOption = { id: string; label: string };

type HighlightFilterDropdownProps = {
  /** Button text while nothing is chosen ("Hashtag" / "Phòng ban"); also the accessible prefix. */
  label: string;
  /** Accessible name of the list ("Lọc theo hashtag"). */
  listLabel: string;
  /** First item that clears the filter ("Tất cả"). */
  allLabel: string;
  options: HighlightFilterOption[];
  value: string | null;
  onChange(value: string | null): void;
};

/**
 * Single-select filter of the Highlight (E02/E03, Figma 721:5580 / 721:5684): button with the
 * chevron, dark list (bg #00070C, gold border, rounded 8, p6; scrolls when long) whose first item
 * "Tất cả" clears the filter (left-anchored on phones, right-anchored from md where the filters
 * sit at the right edge). The chosen value replaces the button text. Keyboard: focus moves into
 * the list on open (the chosen item, else "Tất cả"); the list is one tab stop (roving tabindex);
 * ↑/↓/Home/End move, Enter/Space pick; Tab closes it and moves on to the next control, Shift+Tab
 * closes it back onto the button; Esc or an outside click close it (Esc refocuses the button).
 */
export function HighlightFilterDropdown({ label, listLabel, allLabel, options, value, onChange }: HighlightFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  const items: { id: string | null; label: string }[] = [{ id: null, label: allLabel }, ...options];
  const selected = options.find((option) => option.id === value) ?? null;

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [open]);

  function toggle() {
    setActiveIndex(Math.max(items.findIndex((item) => item.id === value), 0));
    setOpen((current) => !current);
  }

  function pick(id: string | null) {
    setOpen(false);
    triggerRef.current?.focus();
    if (id !== value) onChange(id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      // Unmount the list first, so the browser's Tab continues from the button to the next control.
      flushSync(() => setOpen(false));
      triggerRef.current?.focus();
      if (event.shiftKey) event.preventDefault();
      return;
    }
    const count = items.length;
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
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={toggle}
        className={filterButton}
      >
        {selected ? (
          <>
            <span className="sr-only">{label}: </span>
            <span className="max-w-48 truncate">{selected.label}</span>
          </>
        ) : (
          label
        )}
        <KudoFeedIcon name="chevron-down" />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={listLabel}
          onKeyDown={handleKeyDown}
          className="absolute top-full left-0 z-50 mt-2 flex md:right-0 md:left-auto max-h-[min(24rem,60dvh)] min-w-full flex-col overflow-y-auto rounded-lg border border-border bg-container-2 p-1.5"
        >
          {items.map((item, index) => {
            const isSelected = item.id === value;
            return (
              <button
                key={item.id ?? "all"}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => pick(item.id)}
                className={`${filterOption} ${isSelected ? "bg-secondary [text-shadow:var(--shadow-gold)]" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
