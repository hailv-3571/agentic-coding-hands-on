"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { darkListPanel, darkListRow, darkListRowActive, darkListStatus } from "@/features/sunner-search/components/dark-list-styles";
import { KUDO_LIMITS } from "../kudo-authoring-limits";
import type { HashtagOption } from "../schemas/kudo-edit-prefill";
import { ComposerIcon } from "./composer-icon";
import { addButton, captionText, chip, focusRing } from "./composer-styles";
import { useHashtagOptions } from "./use-hashtag-options";

type HashtagPickerProps = {
  value: HashtagOption[];
  onChange(value: HashtagOption[]): void;
  labelId: string;
  describedBy?: string;
};

/**
 * Hashtag field (FR-002/204, decision-log: 1–5 from the seeded list): removable chips plus the
 * "+ Hashtag / Tối đa 5" button opening the multi-select list of Figma 1002:13013 (selected rows
 * highlighted with a check). At 5, unselected rows are disabled. ↑/↓ move, Esc closes the list
 * only and returns focus to the button. On open and after each pick the panel is scrolled into
 * view (the composer overlay scrolls), so the list never hangs below the viewport.
 */
export function HashtagPicker({ value, onChange, labelId, describedBy }: HashtagPickerProps) {
  const t = useTranslations("kudosComposer.hashtag");
  const { status, options, retry } = useHashtagOptions();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  const selectedIds = new Set(value.map((tag) => tag.id));
  const full = value.length >= KUDO_LIMITS.HASHTAGS_MAX;

  useEffect(() => {
    if (open && status === "ready") listRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus({ preventScroll: true });
  }, [open, status]);

  // Again after each pick: a new chip can wrap the row and push the panel down (mobile).
  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, status, value.length]);

  function toggle(option: HashtagOption) {
    if (selectedIds.has(option.id)) onChange(value.filter((tag) => tag.id !== option.id));
    else if (!full) onChange([...value, option]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next = current + (event.key === "ArrowDown" ? 1 : -1);
      items[(next + items.length) % items.length]?.focus();
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className="relative flex flex-wrap items-center gap-2">
      {value.map((tag) => (
        <span key={tag.id} className={chip}>
          {tag.label}
          <button
            type="button"
            aria-label={t("remove", { label: tag.label })}
            onClick={() => onChange(value.filter((item) => item.id !== tag.id))}
            className={`rounded ${focusRing}`}
          >
            <ComposerIcon name="close" />
          </button>
        </span>
      ))}
      <div ref={containerRef} className="sm:relative" onKeyDown={handleKeyDown}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((current) => !current)}
          className={addButton}
        >
          <ComposerIcon name="plus" />
          <span className="flex flex-col">
            <span className="text-title-medium font-bold">{t("add")}</span>
            <span className={captionText}>{t("max", { max: KUDO_LIMITS.HASHTAGS_MAX })}</span>
          </span>
        </button>
        {open && (
          <div ref={panelRef} className={`${darkListPanel} inset-x-0 sm:right-auto sm:left-0 sm:w-80`}>
            {status === "ready" && (
              <div ref={listRef} id={listId} role="listbox" aria-multiselectable aria-label={t("listLabel")} className="flex flex-col gap-1">
                {options.map((option) => {
                  const selected = selectedIds.has(option.id);
                  const disabled = !selected && full;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      aria-disabled={disabled || undefined}
                      onClick={() => toggle(option)}
                      className={`${darkListRow} justify-between ${selected ? darkListRowActive : "hover:bg-primary/20 focus-visible:bg-primary/20"} ${disabled ? "cursor-not-allowed opacity-50" : ""} focus-visible:outline-1 focus-visible:outline-primary`}
                    >
                      {option.label}
                      {selected && <ComposerIcon name="check-circle" />}
                    </button>
                  );
                })}
              </div>
            )}
            {status === "loading" && <p className={darkListStatus}>{t("loading")}</p>}
            {(status === "error" || status === "unauthorized") && (
              <div className="flex items-center justify-between gap-2">
                <p role="alert" className={darkListStatus}>
                  {status === "unauthorized" ? t("sessionExpired") : t("loadFailed")}
                </p>
                {status === "error" && (
                  <button type="button" onClick={retry} className={`${darkListRow} w-auto text-primary`}>
                    {t("retry")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
