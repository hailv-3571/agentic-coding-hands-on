import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings for the awards portal pages (values: research/figma-awards-portal-spec.md).
 * Tokens from app/globals.css only: #FFEA9E = primary, rgba(255,234,158,.1) = secondary,
 * #998C5F = border, #2E3940 = divider, #00070C = container-2, gold shadow = shadow-gold.
 */
export { focusRing };
export { sectionTitle } from "@/features/kudos-feed/components/kudo-feed-styles";

/**
 * Content column aligned with the header's inner box (same max width and gutters as
 * AppHeader): 1152 wide at 1440, 1224 in the 1512-wide Homepage frame (x = 144 in both).
 */
export const portalColumn = "mx-auto w-full max-w-360 px-4 md:px-12 xl:px-36";

/** Figma "Cover" over every keyvisual: page colour at the bottom-left fading out (13.29deg). */
export const keyvisualCover =
  "bg-[linear-gradient(13.29deg,var(--color-background)_15.48%,color-mix(in_srgb,var(--color-background)_46%,transparent)_52.13%,transparent_63.41%)]";

/** "Sun* annual awards 2025" caption above a section title: Bold 24/32 white. */
export const sectionCaption = "text-headline-small font-bold text-text";

/** Body copy Bold 16/24 tracking .5 white. */
export const bodyBold = "text-body-large font-bold text-text";

/** Small Bold 14/20 tracking .1 white (units, value notes, tier descriptions). */
export const smallBold = "text-label-large font-bold text-text";

/** "ABOUT AWARDS": yellow, rounded 8, px24 py16, gap 8, Bold 22/28 dark, ↗ 24. */
export const primaryCta = `inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-title-large font-bold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`;

/** "ABOUT KUDOS": translucent gold, 1 px #998C5F, rounded 8, px24 py16, Bold 22/28 white, ↗ 24. */
export const secondaryCta = `inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 py-4 text-title-large font-bold text-text transition-colors hover:bg-secondary-hover ${focusRing}`;

/** Yellow button on the Kudos banner and the Thể lệ panel: rounded 4, p16, gap 8, Bold 16/24 dark. */
export const smallPrimaryButton = `inline-flex items-center justify-center gap-2 rounded bg-primary p-4 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`;

/** Translucent button ("Đóng"): 1 px #998C5F, rounded 4, p16, gap 8, Bold 16/24 white. */
export const smallSecondaryButton = `inline-flex items-center justify-center gap-2 rounded border border-border bg-secondary p-4 text-body-large font-bold text-text transition-colors hover:bg-secondary-hover ${focusRing}`;

/** 1 px #2E3940 rule. */
export const divider = "h-px w-full shrink-0 bg-divider";

/**
 * Award thumbnail frame (336×336 on desktop): 0.955 px gold border, radius 24, gold shadow,
 * screen blend. Fixed square box, so a broken image never collapses the layout.
 */
export const awardThumbnailFrame =
  "relative aspect-square w-full max-w-84 shrink-0 overflow-hidden rounded-3xl border-[0.955px] border-primary bg-container-2 shadow-gold mix-blend-screen";
