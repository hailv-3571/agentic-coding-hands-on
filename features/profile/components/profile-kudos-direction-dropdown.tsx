"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { KudoFeedIcon } from "@/features/kudos-feed/components/kudo-feed-icon";
import { filterButton, filterOption } from "@/features/kudos-feed/components/kudo-feed-styles";
import type { ProfileKudosDirection } from "../schemas/profile-views";

type ProfileKudosDirectionDropdownProps = {
  direction: ProfileKudosDirection;
  counts: { sent: number; received: number };
  onChange(direction: ProfileKudosDirection): void;
};

const ORDER: ProfileKudosDirection[] = ["sent", "received"];

/**
 * "Đã gửi (n)" / "Đã nhận (n)" filter of the own profile's KUDOS header (FR-204, Figma 362:5037):
 * the Live board filter look (secondary fill, 1 px #998C5F, rounded 4, px24 py16, caret 24) and its
 * dark list. The button names the current list with its count (BR-006). Keyboard like the Live
 * board filters: focus moves into the list on open (the current item), one tab stop, ↑/↓/Home/End
 * move, Enter/Space pick; Tab moves on and closes it, Shift+Tab closes it back onto the button;
 * Esc or an outside press close it (Esc refocuses the button).
 */
export function ProfileKudosDirectionDropdown({ direction, counts, onChange }: ProfileKudosDirectionDropdownProps) {
  const t = useTranslations("profile.kudos");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);
  const label = (option: ProfileKudosDirection) => t(option, { count: counts[option] });

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [open]);

  function pick(next: ProfileKudosDirection) {
    setOpen(false);
    triggerRef.current?.focus();
    if (next !== direction) onChange(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      // Unmount the list first, so the browser's Tab continues from the button to the next control.
      flushSync(() => setOpen(false));
      triggerRef.current?.focus();
      if (event.shiftKey) event.preventDefault();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const current = options.indexOf(document.activeElement as HTMLElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + step + options.length) % options.length;
    options[next]?.focus();
  }

  return (
    <div ref={containerRef} className="relative self-start md:self-auto">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`${filterButton} px-6`}
      >
        {label(direction)}
        <KudoFeedIcon name="chevron-down" />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={t("filterList")}
          onKeyDown={handleKeyDown}
          className="absolute top-full left-0 z-40 mt-2 flex min-w-full flex-col rounded-lg border border-border bg-container-2 p-1.5 md:right-0 md:left-auto"
        >
          {ORDER.map((option) => {
            const selected = option === direction;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => pick(option)}
                className={`${filterOption} ${selected ? "bg-secondary [text-shadow:var(--shadow-gold)]" : ""}`}
              >
                {label(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
