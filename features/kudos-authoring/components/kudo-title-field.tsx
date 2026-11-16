"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { KUDO_LIMITS } from "../kudo-authoring-limits";
import { ComposerFieldRow } from "./composer-field-row";
import { textInput } from "./composer-styles";
import { clampToLength } from "./kudo-markdown-format";

type KudoTitleFieldProps = {
  value: string;
  onChange(value: string): void;
  errors: string[];
  /** Edit mode: focus the title once the prefilled form appears (it mounts after the dialog). */
  autoFocus?: boolean;
};

/**
 * "Danh hiệu" (D006): optional, ≤ 50 characters, so no red `*` even though Figma draws one
 * (decision-log 2026-11-15). Helper text from Figma sits under the input.
 */
export function KudoTitleField({ value, onChange, errors, autoFocus }: KudoTitleFieldProps) {
  const t = useTranslations("kudosComposer.title");
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  return (
    <ComposerFieldRow label={t("label")} htmlFor={id} align="start" errors={errors} errorId={errorId}>
      <input
        id={id}
        type="text"
        autoFocus={autoFocus}
        value={value}
        placeholder={t("placeholder")}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={errors.length > 0 ? `${helperId} ${errorId}` : helperId}
        onChange={(event) => onChange(clampToLength(event.target.value, KUDO_LIMITS.TITLE_MAX))}
        className={textInput}
      />
      <p id={helperId} className="text-title-medium font-bold text-text-muted">
        {t("helperExample")}
        <br />
        {t("helperUsage")}
      </p>
    </ComposerFieldRow>
  );
}
