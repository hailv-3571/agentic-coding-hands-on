"use client";

import { useTranslations } from "next-intl";
import { darkListPanel, darkListRow, darkListRowActive } from "@/features/sunner-search/components/dark-list-styles";
import { SunnerOptionRow } from "@/features/sunner-search/components/sunner-option-row";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";

type KudoMentionPopoverProps = {
  listId: string;
  options: SunnerOption[];
  activeIndex: number;
  optionId(index: number): string;
  onActiveChange(index: number): void;
  onPick(option: SunnerOption): void;
};

/**
 * "@ + tên" suggestions (FR-203) under the message box. Keyboard handling stays in the textarea
 * (↑/↓ move, Enter/Tab pick, Esc closes); the textarea points at the active row through
 * aria-activedescendant. Mouse down never steals focus from the textarea.
 */
export function KudoMentionPopover({ listId, options, activeIndex, optionId, onActiveChange, onPick }: KudoMentionPopoverProps) {
  const t = useTranslations("kudosComposer.message");
  return (
    <ul id={listId} role="listbox" aria-label={t("mentionListLabel")} className={`${darkListPanel} inset-x-0 top-full`}>
      {options.map((option, index) => (
        <li
          key={option.id}
          id={optionId(index)}
          role="option"
          aria-selected={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => onActiveChange(index)}
          onClick={() => onPick(option)}
          className={`${darkListRow} ${index === activeIndex ? darkListRowActive : ""}`}
        >
          <SunnerOptionRow option={option} />
        </li>
      ))}
    </ul>
  );
}
