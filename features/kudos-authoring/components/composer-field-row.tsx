import type { ReactNode } from "react";
import { errorText, fieldLabel, requiredMarkColor } from "./composer-styles";

type ComposerFieldRowProps = {
  label: string;
  /** Id of the control the label names; omit for a group (then `labelId` names it). */
  htmlFor?: string;
  labelId?: string;
  required?: boolean;
  /** Field error messages shown under the control (linked by `errorId`). */
  errors?: string[];
  errorId?: string;
  /** `center` for single-line controls, `start` when the control is taller than the label. */
  align?: "center" | "start";
  children: ReactNode;
};

/**
 * Label + control row (Figma: row, gap 16; label Bold 22/28 with the red `*` on required fields).
 * Below `sm` the label stacks above the control so the 375 px layout keeps full-width inputs.
 */
export function ComposerFieldRow({
  label,
  htmlFor,
  labelId,
  required = false,
  errors = [],
  errorId,
  align = "center",
  children,
}: ComposerFieldRowProps) {
  const labelContent = (
    <>
      {label}
      {required && (
        <span aria-hidden className={`ml-0.5 align-super text-base font-bold ${requiredMarkColor}`}>
          *
        </span>
      )}
    </>
  );
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:gap-4 ${align === "center" ? "sm:items-center" : "sm:items-start"}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} id={labelId} className={`shrink-0 ${fieldLabel} ${align === "start" ? "sm:pt-3" : ""}`}>
          {labelContent}
        </label>
      ) : (
        <span id={labelId} className={`shrink-0 ${fieldLabel} ${align === "start" ? "sm:pt-2.5" : ""}`}>
          {labelContent}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {children}
        {errors.length > 0 && (
          <p id={errorId} className={errorText}>
            {errors.join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}
