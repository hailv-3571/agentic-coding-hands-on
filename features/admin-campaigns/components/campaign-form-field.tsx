"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { AdminCampaignIcon } from "./admin-campaign-icon";
import { dateTimeInput, fieldError, fieldHint, fieldLabel, requiredMark, textInput } from "./campaign-settings-styles";

/** What a field hands its input: the id the label points at, plus the error/hint wiring. */
export type CampaignFieldInputProps = {
  id: string;
  required: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type CampaignFormFieldProps = {
  label: string;
  /** Shown under the input in red and announced with it (aria-describedby + aria-invalid). */
  error?: string;
  /** Neutral note under the input when there is no error (the locked start date). */
  hint?: string;
  className?: string;
  children(input: CampaignFieldInputProps): ReactNode;
};

/**
 * One required field of the campaign form (Figma 820:11445): label Medium 16/24 white with the red
 * `*` (hidden from screen readers; the input itself is `required`), the input 2 px below, then the
 * error (Medium 14/20 #D4271D) or the hint.
 */
export function CampaignFormField({ label, error, hint, className = "", children }: CampaignFormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <label htmlFor={id} className={fieldLabel}>
        {label}
        <span aria-hidden="true" className={requiredMark}>
          *
        </span>
      </label>
      {children({ id, required: true, "aria-invalid": error ? true : undefined, "aria-describedby": message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={`mt-1 ${error ? fieldError : fieldHint}`}>
          {message}
        </p>
      )}
    </div>
  );
}

/** White text input of the form. */
export function CampaignTextInput(props: ComponentProps<"input">) {
  return <input type="text" {...props} className={textInput} />;
}

/**
 * Native `datetime-local` (user decision 2026-11-16) styled as the white input, with the Figma
 * calendar icon at the trailing edge over the browser's transparent picker indicator. Its value is
 * `yyyy-MM-ddTHH:mm`, read on the server as ADMIN_TIMEZONE wall clock (never converted here).
 */
export function CampaignDateTimeInput(props: ComponentProps<"input">) {
  return (
    <div className="relative">
      <input type="datetime-local" {...props} className={`${textInput} ${dateTimeInput}`} />
      <AdminCampaignIcon name="calendar" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2" />
    </div>
  );
}
