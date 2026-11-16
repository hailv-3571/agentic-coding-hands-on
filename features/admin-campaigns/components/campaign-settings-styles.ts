import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings for Admin › Settings (values in research/figma-admin-campaigns-and-heart-spec.md).
 * Tokens from app/globals.css wherever one exists: #FFEA9E = primary, #00101A = background /
 * on-primary, #00070C = container-2, rgba(255,234,158,.1) = secondary, #998C5F = border,
 * #2E3940 = divider, #D4271D = error, #999 = text-muted. #CF1322 has no token.
 */
/** "Setting": Regular 45/52 (Figma), gold like the other admin page titles on the dark frame. */
export const settingsTitle = "text-display-small text-primary md:text-display-medium";

/** Locked buttons use `aria-disabled` (they stay focusable, so a dialog never loses focus to <body>). */
const buttonBase = `flex h-13 items-center justify-center rounded p-4 text-title-medium transition aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${focusRing}`;

/** "Add Campaign" and the modal's submit: #FFEA9E, rounded 4, p16, Medium 16/24 (.15) #00101A. */
export const primaryButton = `${buttonBase} bg-primary text-on-primary hover:shadow-gold aria-disabled:hover:shadow-none`;

/** "Cancel": 10 % gold fill, 1 px #998C5F border, rounded 4, white. */
export const secondaryButton = `${buttonBase} border border-border bg-secondary text-text hover:bg-secondary-hover`;

/** "Delete" in the confirm dialog: #D4271D, rounded 4, white. */
export const dangerButton = `${buttonBase} bg-error text-text hover:brightness-110`;

/** Header cell: #00101A, 1 px #2E3940 bottom rule, pt12 pb13 px12, Medium 14/20 (.1) white. */
export const headerCell = "border-b border-divider bg-background px-2 pt-3 pb-[13px] text-left text-title-small text-text md:px-3";

/** The 22 px #2E3940 rule at the left edge of every header cell but the first. */
export const headerDivider =
  "relative before:absolute before:top-1/2 before:left-0 before:h-5.5 before:w-px before:-translate-y-1/2 before:bg-divider";

const bodyCellBase = "border-b border-divider bg-container-2 px-2 align-middle text-body-medium text-text md:px-3";

/** Body cell: #00070C, 1 px #2E3940 bottom rule, pt12 pb13 px12, Regular 14/20 (.25) white. */
export const bodyCell = `${bodyCellBase} pt-3 pb-[13px]`;

/** Actions cell: the 40 px "⋯" button with 2 px above and below keeps the row height of a text row. */
export const actionsCell = `${bodyCellBase} py-0.5 text-center`;

/** Row menu item: p16, rounded 4, icon 24 + Medium 16/24 white, gap 4; gold glow when hovered or focused. */
export const menuItem =
  "flex w-[151px] items-center gap-1 rounded p-4 text-left text-title-medium text-text outline-none hover:bg-secondary hover:[text-shadow:var(--shadow-gold)] focus:bg-secondary focus:[text-shadow:var(--shadow-gold)]";

/** Field label: Medium 16/24 (.15) white; the red `*` is Bold 16/20 #CF1322. */
export const fieldLabel = "flex items-start gap-0.5 text-title-medium text-text";
export const requiredMark = "text-[16px] leading-5 font-bold text-[#CF1322]";

/** White input: 1 px #2E3940 border, rounded 8, h48, pl16 pr8 py8, Medium 14/20 (.1) #00101A, placeholder #999. */
export const textInput = `h-12 w-full rounded-lg border border-divider bg-white py-2 pr-2 pl-4 text-title-small text-on-primary placeholder:text-text-muted read-only:cursor-not-allowed read-only:bg-[#E6E6E6] ${focusRing}`;

/**
 * Native datetime-local (user decision 2026-11-16): the browser's picker indicator stays clickable
 * but transparent, over the Figma calendar icon drawn at the trailing edge.
 */
export const dateTimeInput =
  "pr-2 [&::-webkit-calendar-picker-indicator]:size-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

/** Field error under its input: Medium 14/20 #D4271D. Hint (locked start): same size, muted. */
export const fieldError = "text-title-small text-error";
export const fieldHint = "text-title-small text-text-muted";

/** Bottom toast, like the composer and Copy Link toasts. */
export const toastBox = "pointer-events-auto max-w-full rounded-lg border bg-container-2 px-6 py-3 text-title-medium font-bold shadow-gold";
