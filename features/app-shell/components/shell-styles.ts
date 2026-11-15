/** Class strings shared by the shell's interactive parts (tokens only, no raw colours). */

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Sunner and public header band (Figma mms_A1_Header 2167:9091): fill Details/Container, which
 * is already #101417 at 80% (no extra alpha), no blur, no bottom rule. Page artwork that should
 * show through runs under it (see the login page's `-mt-20`).
 */
export const headerBar = "sticky top-0 z-40 bg-container";

/** Gold glow on text for hover/active states (Figma "Gold/Shaddow" tone). */
export const textGlow = "[text-shadow:0_0_6px_var(--color-primary)]";

/** Dropdown panel: dark surface, thin gold border, rounded. */
export const dropdownPanel =
  "absolute top-full z-50 mt-2 flex min-w-40 flex-col gap-1 rounded-lg border border-border bg-container-2 p-1.5";

/**
 * A row inside a dropdown panel: icon right after the label (Figma 721:5223), highlighted on
 * hover. No `justify-*` here, so a caller can add one (the language list centres) without a tie.
 */
export const dropdownItem = `flex w-full items-center gap-3 rounded px-4 py-3 text-left text-title-medium font-bold text-text transition-colors hover:bg-secondary hover:text-primary hover:[text-shadow:0_0_6px_var(--color-primary)] ${focusRing}`;

/** Trigger button for the language switcher. */
export const headerTrigger = `flex items-center gap-2 rounded text-title-medium font-bold text-text transition-colors hover:text-primary ${focusRing}`;
