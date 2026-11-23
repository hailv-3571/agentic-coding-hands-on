import { actionsCell, bodyCell, headerCell } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings of Admin › User (values in research/figma-admin-users-overview-spec.md). The header,
 * cells, buttons, toast and dialog reuse phase 06 (`campaign-settings-styles.ts`), the white fields,
 * pager and popover phase 08 (`review-content-styles.ts`); only what those pages lack lives here.
 */

/**
 * The phase 06 header / body / actions cells with their 8 px side padding kept at every width
 * (they widen to 12 px from md): 12 columns share the 1152 px admin frame, which Figma draws 1280.
 * Derived from the phase 06 strings so colours, rules and type stay theirs.
 */
const dense = (classes: string) => classes.replace(" md:px-3", "");
export const denseHeaderCell = dense(headerCell);
export const denseBodyCell = dense(bodyCell);
export const denseActionsCell = dense(actionsCell);

/**
 * Unit / Level / Role list (Figma 1002:15708 / 15711 / 15714): #00070C, 1 px gold border, rounded 8,
 * p6, under the field's left edge and at least as wide; a long unit list scrolls.
 */
export const filterListPanel =
  "absolute top-full left-0 z-30 mt-2 flex max-h-72 w-max min-w-full flex-col gap-0.5 overflow-y-auto rounded-lg border border-border bg-container-2 p-1.5";

/** List option: centred Regular 14/20 white; 20 % gold tint when chosen, hovered or focused. */
export const filterListOption =
  "rounded px-4 py-1 text-center text-body-medium whitespace-nowrap text-text outline-none hover:bg-primary/20 focus-visible:bg-primary/20 aria-selected:bg-primary/20";

/** Count, level, badge, date and role cells sit centred under their header (Figma 773:26403). */
export const centredCell = "text-center tabular-nums";

/** "Admin · env" (planner decision, not drawn): small outlined gold chip next to nothing else. */
export const envAdminBadge =
  "inline-flex items-center rounded border border-primary px-1.5 py-0.5 text-[12px] leading-4 font-medium whitespace-nowrap text-primary";

/** The 40 px "⋯" trigger of phase 06 (`campaign-row-menu.tsx`), dimmed while locked. */
export const rowMenuTrigger = `flex size-10 items-center justify-center rounded transition-colors hover:bg-secondary aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent ${focusRing}`;

/**
 * Menu item, compact (py8) so the one-item popover fits inside a two-line row of the scrolling
 * table; otherwise the phase 06 item: Medium 16/24 white, gold glow when hovered or focused.
 */
export const roleMenuItem =
  "flex items-center rounded px-4 py-2 text-left text-title-medium whitespace-nowrap text-text outline-none hover:bg-secondary hover:[text-shadow:var(--shadow-gold)] focus:bg-secondary focus:[text-shadow:var(--shadow-gold)]";

/** The same item when it cannot be chosen (env admin): muted, no glow, still focusable for its tooltip. */
export const roleMenuItemDisabled =
  "flex cursor-not-allowed items-center rounded px-4 py-2 text-left text-title-medium whitespace-nowrap text-text-muted outline-none focus:bg-secondary";

/** Hint shown to the left of a locked control on hover or focus (inside a `group relative` wrapper). */
export const hintTooltip =
  "pointer-events-none invisible absolute top-1/2 right-full z-40 mr-2 w-56 -translate-y-1/2 rounded border border-border bg-container-2 px-3 py-2 text-left text-[12px] leading-4 font-normal whitespace-normal text-text group-focus-within:visible group-hover:visible";
