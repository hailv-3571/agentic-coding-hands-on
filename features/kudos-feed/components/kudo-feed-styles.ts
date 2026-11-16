import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings for the Live board and Kudo cards (values in research/figma-kudos-feed-spec.md).
 * Tokens from app/globals.css wherever one exists: #FFF8E1 = primary-hover, #FFEA9E = primary,
 * rgba(255,234,158,.1) = secondary, #998C5F = border, #2E3940 = divider, #D4271D = error.
 */
export { focusRing };

/** Content column: 1152 wide centred (Figma px 144 on 1440, aligned with the header), 16 px gutters on small screens. */
export const pageColumn = "mx-auto w-full max-w-296 px-4";

/** Launcher / search pill: h72, rounded 68, secondary fill, 1 px gold border, Bold 16/24 white. */
export const pillSurface = "h-18 rounded-[68px] border border-border bg-secondary text-title-medium font-bold text-text";

/** "Hashtag" / "Phòng ban" filter button: p16, rounded 4, icon 24 after the label, gap 8. */
export const filterButton = `flex items-center gap-2 rounded border border-border bg-secondary p-4 text-title-medium font-bold text-text transition-colors hover:bg-secondary-hover ${focusRing}`;

/** Filter list item: p16, rounded 4, Bold 16/24 white (tracking .5); glow when selected or active. */
export const filterOption = `w-full rounded p-4 text-left text-body-large font-bold whitespace-nowrap text-text outline-none hover:bg-secondary hover:[text-shadow:var(--shadow-gold)] focus-visible:bg-secondary focus-visible:[text-shadow:var(--shadow-gold)]`;

/** "Copy Link" / "Xem chi tiết" / "Đóng" on the cream card: p16, rounded 4, Bold 16/24 dark, icon 24, gap 4. */
export const cardActionButton = `flex items-center gap-1 rounded p-4 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary/40 ${focusRing}`;

/** Light divider on the card (1 px #FFEA9E). */
export const cardDivider = "h-px w-full shrink-0 bg-primary";

/** Body box on the card: 40 % gold fill, 1 px gold border, rounded 12, px24 py16 (px16 on phones), Bold, justified. */
export const cardBodyBox = "rounded-xl border border-primary bg-primary/40 px-4 py-4 font-bold text-justify text-on-primary md:px-6";

/** Section title ("HIGHLIGHT KUDOS", "ALL KUDOS"): Bold 57/64, tracking −0.25, gold; smaller on phones. */
export const sectionTitle = "text-headline-large font-bold text-primary md:text-display-large";

/** Prev/next circle buttons of the carousel and pager (`aria-disabled` at the ends, so they keep focus). */
export const roundIconButton = `flex items-center justify-center rounded-full transition-opacity hover:bg-secondary aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:bg-transparent ${focusRing}`;

/** Inline status line on the dark page (empty, error), Bold 16/24. */
export const statusText = "text-title-medium font-bold text-text-muted";
