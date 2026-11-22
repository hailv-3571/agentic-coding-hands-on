import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings of the Secret Box UI (values in research/figma-secret-box-spec.md). Tokens from
 * app/globals.css: #00070C = container-2, #00101A = background, #998C5F = border, #2E3940 = divider,
 * #FFEA9E = primary, #999 = text-muted. Odd px values come from the scaled Figma modal frame.
 */
export { focusRing };

/** Live board right-column panel (Figma 2940:13489 / 2940:13510): #00070C, 1 px #998C5F, rounded 17. */
export const rewardsPanel = "rounded-[17px] border border-border bg-container-2";

/** Stats row label: Bold 22/28 white (16/24 on phones so labels stay on one or two lines). */
export const statLabel = "text-title-medium font-bold text-text sm:text-title-large sm:font-bold";

/** Stats row value: Bold 32/40 gold, right-aligned (24/32 on phones). */
export const statValue = "shrink-0 text-right text-headline-small font-bold text-primary sm:text-headline-large sm:font-bold";

/** "Mở Secret Box": full width, gold, rounded 8, p16, gap 8, Bold 22/28 dark; dimmed when no box (DEC-001). */
export const openBoxButton = `flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-4 text-title-large font-bold text-on-primary transition-colors hover:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-primary ${focusRing}`;

/** Tooltip panel, same look as the Hero tooltip (#00070C, rounded 16, p16, Bold 14/20) plus a gold rule. */
export const tooltipPanel = "rounded-2xl border border-border bg-container-2 p-4 text-title-small font-bold whitespace-nowrap text-text";

/**
 * Winners list scroll: a 2 px #999 rounded thumb on a transparent track (Figma custom scrollbar).
 * WebKit/Blink pseudo-elements only: setting the standard `scrollbar-*` properties would make
 * Chromium ignore them and draw its wider thin bar; Firefox keeps its default thin bar.
 */
export const thinScrollbar =
  "[&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-text-muted [&::-webkit-scrollbar-track]:bg-transparent";

/** Small modal text (hint, counter label): Bold 12.7/19.1 white, tracking .4. */
export const modalSmallText = "text-[12.7px]/[19.1px] font-bold tracking-[0.4px] text-text";

/** Big gold modal text (counter value, prize name): Bold 28.6/35. */
export const modalBigText = "text-[28.6px]/[35px] font-bold text-primary";
