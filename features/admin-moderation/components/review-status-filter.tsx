"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import type { AdminKudoStatus } from "../schemas/admin-kudo-row";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { filterLabel, statusChip, statusListPanel, whiteField } from "./review-content-styles";

const OPTIONS: (AdminKudoStatus | null)[] = [null, "public", "spam"];

/**
 * Status filter (E07, Figma mms_C.3 + list 1002:15559): a labelled 259 px white select showing
 * "Chọn trạng thái" or the chosen value; its list (right-aligned, #00070C) holds outlined chips
 * "Tất cả" (clears, spec default) / "Public" / "Spam". Keyboard like the Highlight filters: focus
 * moves to the chosen chip on open, ↑/↓/Home/End move (roving tabindex), Enter/Space pick, Tab
 * closes and moves on, Shift+Tab closes back onto the button, Esc or an outside click close.
 */
export function ReviewStatusFilter({ value, onChange }: { value: AdminKudoStatus | null; onChange(value: AdminKudoStatus | null): void }) {
  const t = useTranslations("adminModeration");
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

  const labelOf = (option: AdminKudoStatus | null) => (option ? t(`status.${option}`) : t("filters.all"));

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [open]);

  function toggle() {
    setActiveIndex(OPTIONS.indexOf(value));
    setOpen((current) => !current);
  }

  function pick(option: AdminKudoStatus | null) {
    setOpen(false);
    triggerRef.current?.focus();
    if (option !== value) onChange(option);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      // Unmount the list first, so Tab continues from the button to the next control.
      flushSync(() => setOpen(false));
      triggerRef.current?.focus();
      if (event.shiftKey) event.preventDefault();
      return;
    }
    const count = OPTIONS.length;
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
    <div className="flex w-full flex-col gap-0.5 sm:w-[259px]">
      <span id={labelId} className={filterLabel}>
        {t("filters.status")}
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
          className={`${whiteField} flex items-center justify-between pr-2 pl-4 text-left ${open ? "border-primary" : ""}`}
        >
          <span id={valueId} className={value ? "" : "text-text-muted"}>
            {value ? labelOf(value) : t("filters.statusPlaceholder")}
          </span>
          <AdminModerationIcon name="caret-select" />
        </button>
        {open && (
          <div ref={listRef} id={listId} role="listbox" aria-label={t("filters.statusList")} onKeyDown={handleKeyDown} className={statusListPanel}>
            {OPTIONS.map((option, index) => (
              <button
                key={option ?? "all"}
                type="button"
                role="option"
                aria-selected={option === value}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => pick(option)}
                className={statusChip}
              >
                {labelOf(option)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
