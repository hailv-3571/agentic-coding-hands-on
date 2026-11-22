import localFont from "next/font/local";

/** DSEG7 Classic (SIL OFL 1.1, see ../fonts/DSEG-LICENSE.txt): loaded only where the countdown renders. */
const dseg7 = localFont({
  src: "../fonts/DSEG7Classic-Regular.woff2",
  weight: "400",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export type CountdownSize = "page" | "hero";

/**
 * Figma component 186:2619 at its two sizes. Homepage ("hero"): tile 51.2×81.92, radius 8,
 * border .5, blur 16.64, digit 49.152, gaps 14 / 40, label Bold 24/32. Countdown page: tile
 * 76.8×122.88, radius 12, border .75, blur 24.96, digit 73.728, gaps 21 / 60, label Bold 36/48.
 * Phones get a smaller tile so the three units stay on one row at 375 px.
 */
export const COUNTDOWN_SIZES = {
  hero: {
    units: "gap-4 sm:gap-10",
    unit: "gap-2 sm:gap-3.5",
    tiles: "gap-2 sm:gap-3.5",
    tile: "h-16 w-10 rounded-md sm:h-[81.92px] sm:w-[51.2px] sm:rounded-lg",
    tileFace: "border-[0.5px] backdrop-blur-[16.64px]",
    digit: "text-[38px] sm:text-[49.152px]",
    label: "text-title-medium sm:text-headline-small",
  },
  page: {
    units: "gap-4 sm:gap-10 md:gap-15",
    unit: "gap-2 sm:gap-3.5 md:gap-[21px]",
    tiles: "gap-2 sm:gap-3.5 md:gap-[21px]",
    tile: "h-16 w-10 rounded-md sm:h-[81.92px] sm:w-[51.2px] sm:rounded-lg md:h-[122.88px] md:w-[76.8px] md:rounded-xl",
    tileFace: "border-[0.75px] backdrop-blur-[24.96px]",
    digit: "text-[38px] sm:text-[49.152px] md:text-[73.728px]",
    label: "text-title-medium sm:text-headline-small md:text-display-small md:leading-12",
  },
} as const;

/**
 * One digit: the tile face (gold border, white→10 % gradient, backdrop blur) is drawn at 50 %
 * opacity behind the digit, which stays fully opaque, white, in DSEG7.
 */
export function CountdownDigitTile({ digit, size }: { digit: string; size: CountdownSize }) {
  const style = COUNTDOWN_SIZES[size];
  return (
    <span className={`relative flex shrink-0 items-center justify-center ${style.tile}`}>
      <span
        className={`absolute inset-0 rounded-[inherit] border-primary bg-linear-to-b from-white to-white/10 opacity-50 ${style.tileFace}`}
      />
      <span className={`${dseg7.className} relative leading-none text-text ${style.digit}`}>{digit}</span>
    </span>
  );
}
