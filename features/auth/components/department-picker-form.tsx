"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { DepartmentOption } from "../server/department-options-query";
import { chooseDepartment, type ChooseDepartmentState } from "../server/choose-department-action";

type DepartmentPickerFormProps = {
  departments: DepartmentOption[];
  /** Already sanitized return path. */
  next: string;
};

const idle: ChooseDepartmentState = { error: null };

/** First-login department choice: one required radio group, submitted once. */
export function DepartmentPickerForm({ departments, next }: DepartmentPickerFormProps) {
  const t = useTranslations("auth.onboarding");
  const [state, formAction, pending] = useActionState(chooseDepartment, idle);
  const errorId = "department-error";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />
      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={state.error ? errorId : undefined}
        aria-invalid={state.error === "invalid_department" || undefined}
      >
        <legend className="mb-3 text-title-medium text-text">{t("departmentLabel")}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {departments.map((department) => (
            <label
              key={department.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-label-large text-text transition-colors hover:bg-secondary-hover has-checked:border-primary has-checked:bg-secondary-hover has-focus-visible:outline-2 has-focus-visible:outline-primary"
            >
              <input
                type="radio"
                name="departmentId"
                value={department.id}
                required
                className="size-4 accent-primary"
              />
              {department.name}
            </label>
          ))}
        </div>
      </fieldset>
      {state.error ? (
        <p id={errorId} role="alert" className="text-body-medium text-error">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-12 rounded-lg bg-primary px-6 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-80 sm:self-start"
      >
        {pending ? t("submitPending") : t("submit")}
      </button>
    </form>
  );
}
