"use client";

import { useTranslations } from "next-intl";
import { SunnerSearchCombobox } from "@/features/sunner-search/components/sunner-search-combobox";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import { ComposerIcon } from "./composer-icon";
import { textInput } from "./composer-styles";

type RecipientPickerProps = {
  id: string;
  value: SunnerOption | null;
  onChange(value: SunnerOption | null): void;
  /** Edit mode and C-07 `lockRecipient`: the recipient is shown but cannot change. */
  locked: boolean;
  invalid: boolean;
  describedBy?: string;
};

/**
 * "Người nhận" control (FR-201): the shared Sunner combobox with excludeSelf=true (no self-send),
 * or a read-only field when the recipient is fixed (edit mode, profile "Gửi Kudo").
 */
export function RecipientPicker({ id, value, onChange, locked, invalid, describedBy }: RecipientPickerProps) {
  const t = useTranslations("kudosComposer.recipient");

  if (locked && value) {
    const hintId = `${id}-locked`;
    return (
      <>
        <input
          id={id}
          type="text"
          readOnly
          value={value.fullName}
          aria-describedby={[hintId, describedBy].filter(Boolean).join(" ")}
          className={`${textInput} cursor-default`}
        />
        <span id={hintId} className="sr-only">
          {t("lockedHint")}
        </span>
      </>
    );
  }

  return (
    <SunnerSearchCombobox
      id={id}
      value={value}
      onChange={onChange}
      excludeSelf
      required
      invalid={invalid}
      describedBy={describedBy}
      placeholder={t("placeholder")}
      inputClassName={`${textInput} pr-14`}
      trailingIcon={<ComposerIcon name="dropdown-caret" />}
    />
  );
}
