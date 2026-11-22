"use client";

import { useId } from "react";
import { SunnerSearchCombobox } from "@/features/sunner-search/components/sunner-search-combobox";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import type { AdminKudoPerson } from "../schemas/admin-kudo-row";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { filterLabel, whiteFieldInput } from "./review-content-styles";

type ReviewPersonFilterProps = {
  label: string;
  placeholder: string;
  /** The person the filter currently holds (names come from the page, the URL only has the id). */
  person: AdminKudoPerson | null;
  onPick(personId: string | null): void;
};

function toOption(person: AdminKudoPerson): SunnerOption {
  return { id: person.id, fullName: person.name, email: person.email, avatarUrl: null, department: null };
}

/**
 * Sender / Receiver filter (E05/E06, Figma mms_C.1/C.2 + list 1002:15428/1002:15464): a labelled
 * 259 px white select that is the shared Sunner combobox (type to search `/api/sunners/search`,
 * self included; avatar, name and department per row). Picking filters by that person; typing
 * again after a pick clears the filter (the combobox reports `null`).
 */
export function ReviewPersonFilter({ label, placeholder, person, onPick }: ReviewPersonFilterProps) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-0.5 sm:w-[259px]">
      <label htmlFor={id} className={filterLabel}>
        {label}
      </label>
      <SunnerSearchCombobox
        id={id}
        value={person ? toOption(person) : null}
        onChange={(option) => onPick(option?.id ?? null)}
        placeholder={placeholder}
        inputClassName={whiteFieldInput}
        trailingIcon={<AdminModerationIcon name="caret-select" />}
      />
    </div>
  );
}
