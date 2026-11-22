"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { fieldError } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { whiteField } from "./review-content-styles";

export type ReviewDateRange = { from: string | null; to: string | null };

type DateFieldProps = { label: string; value: string; min?: string; max?: string; invalid: boolean; describedBy?: string; onChange(value: string): void };

/**
 * One native date input (`yyyy-MM-dd`, the same whole-day value the server reads in ADMIN_TIMEZONE).
 * While empty and unfocused its own "dd/mm/yyyy" is hidden behind the Figma placeholder text;
 * a click anywhere opens the browser's picker (the native indicator is hidden).
 */
function DateField({ label, value, min, max, invalid, describedBy, onChange }: DateFieldProps) {
  return (
    <span className="relative flex min-w-0 flex-1">
      <input
        type="date"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          try {
            event.currentTarget.showPicker();
          } catch {
            // Not supported or not allowed here: the field still takes typed dates.
          }
        }}
        className={`peer w-full min-w-0 cursor-pointer bg-transparent text-title-small outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:hidden ${
          value ? "text-on-primary" : "text-transparent focus:text-on-primary"
        }`}
      />
      {!value && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-title-small text-text-muted peer-focus:hidden">
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * Sent-date range (E02/E03, Figma mms_B.2: white, rounded 8, "Start date → End date" + calendar).
 * Each complete change filters the table (page 1); a reversed range is refused inline with the
 * spec message and the table stays as it is (spec § 6). Keeps its own values; key it with
 * `useExternalResetKey` so an outside change remounts it.
 */
export function ReviewDateRangeFilter({ from, to, onChange }: ReviewDateRange & { onChange(range: ReviewDateRange): void }) {
  const t = useTranslations("adminModeration.dateRange");
  const errorId = useId();
  const [start, setStart] = useState(from ?? "");
  const [end, setEnd] = useState(to ?? "");
  const reversed = start !== "" && end !== "" && start > end;

  function update(nextStart: string, nextEnd: string) {
    setStart(nextStart);
    setEnd(nextEnd);
    if (nextStart && nextEnd && nextStart > nextEnd) return;
    onChange({ from: nextStart || null, to: nextEnd || null });
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-74">
      <div role="group" aria-label={t("group")} className={`${whiteField} flex h-13 items-center px-3 ${reversed ? "border-error" : ""}`}>
        <DateField
          label={t("start")}
          value={start}
          max={end || undefined}
          invalid={reversed}
          describedBy={reversed ? errorId : undefined}
          onChange={(value) => update(value, end)}
        />
        <AdminModerationIcon name="swap-right" className="mx-2" />
        <DateField
          label={t("end")}
          value={end}
          min={start || undefined}
          invalid={reversed}
          describedBy={reversed ? errorId : undefined}
          onChange={(value) => update(start, value)}
        />
        <AdminModerationIcon name="calendar" className="ml-1" />
      </div>
      {reversed && (
        <p id={errorId} role="alert" className={fieldError}>
          {t("reversed")}
        </p>
      )}
    </div>
  );
}
