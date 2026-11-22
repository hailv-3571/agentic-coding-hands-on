import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings of Admin › Review content (values in research/figma-admin-moderation-spec.md). The
 * table, menu, buttons and toast reuse phase 06 (`campaign-settings-styles.ts`); only what that
 * page has no equivalent for lives here. Tokens wherever one exists; #3174C6 (Public badge) has none.
 */

/** Filter label above a field: Medium 16/24 (.15), white on the dark admin frame (Figma draws it dark on its grey canvas). */
export const filterLabel = "text-title-medium text-text";

/** White field (selects, search, date range): h48, 1 px #2E3940, rounded 8, Medium 14/20 #00101A, #999 placeholder; gold border when focused. */
export const whiteField = `h-12 w-full rounded-lg border border-divider bg-white text-title-small text-on-primary placeholder:text-text-muted focus-within:border-primary ${focusRing}`;

/** Text input inside a white field (Sender / Receiver / search): pl16, room for the trailing 24 px icon. */
export const whiteFieldInput = `${whiteField} pr-11 pl-4 outline-none focus-visible:outline-2`;

/** Status badge (Figma 662:14866): 72 wide, 1 px border, rounded 4, px16 py8, Regular 14/20 (.25). Public blue, Spam gold. */
export const statusBadge = {
  public: "border-[#3174C6] text-[#3174C6]",
  spam: "border-primary text-primary",
  base: "inline-flex w-18 items-center justify-center rounded border px-4 py-2 text-body-medium",
} as const;

/**
 * Row action "Mark Spam" / "Un Spam" (Figma mms_D.2.8): 10 % gold fill, white label with the gold
 * glow. Figma draws a 0.49× instance (7.8 px text); it is set at 12/16 here so it stays legible.
 */
export const rowActionButton = `inline-flex items-center justify-center gap-1 rounded-sm bg-secondary px-2 py-1.5 text-[12px] leading-4 font-medium whitespace-nowrap text-text [text-shadow:var(--shadow-gold)] transition-colors hover:bg-secondary-hover aria-disabled:cursor-wait aria-disabled:opacity-60 ${focusRing}`;

/**
 * Confirm popover (Figma 773:26295 / 773:26373): #00070C, 1 px #998C5F, rounded 8, p6. Placed to the
 * left of the row button, vertically centred, so the table's horizontal scroll box never clips it.
 */
export const popoverPanel = "absolute top-1/2 right-full z-30 mr-2 flex -translate-y-1/2 flex-col rounded-lg border border-border bg-container-2 p-1.5";

/** Status filter list (Figma 1002:15559): #00070C, rounded 8, p6, gap 10, right-aligned under the select. */
export const statusListPanel = "absolute top-full right-0 z-30 mt-2 flex w-32 flex-col items-center gap-2.5 rounded-lg border border-border bg-container-2 p-1.5";

/** Status option chip: outlined white, rounded 4, px16 py8, Regular 14/20; gold tint when chosen or focused. */
export const statusChip =
  "min-w-20 rounded border border-white px-4 py-2 text-center text-body-medium text-text outline-none hover:bg-primary/20 focus-visible:bg-primary/20 aria-selected:bg-primary/20";

/**
 * Pagination square (Figma R4): white with a light border; the current page is #00101A with white
 * text, outlined in gold so it still reads on the dark admin frame (Figma draws it on a grey canvas).
 */
const pageButtonBase = `flex size-8 items-center justify-center rounded border text-title-small transition-colors ${focusRing}`;
export const pageButton = `${pageButtonBase} border-[#D9D9D9] bg-white text-on-primary hover:border-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:border-[#D9D9D9]`;
export const currentPageButton = `${pageButtonBase} border-primary bg-background text-text`;

/** Small busy ring (exporting, saving a row): spins in the current text colour. */
export const spinner = "inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none";

/** "Ẩn danh" chip next to the real sender of an anonymous Kudo (D001; not drawn): small outlined chip. */
export const anonymousChip = "inline-flex w-fit items-center rounded border border-text-muted px-1.5 text-[12px] leading-4 font-medium text-text-muted";
