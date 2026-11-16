import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings for the Write Kudo composer (Figma 828:13433 / 1949:13746, values in
 * research/figma-kudo-composer-spec.md). Tokens from app/globals.css wherever one exists; the
 * three raw values below have no token yet (globals.css is owned by the shell phase).
 */
export { focusRing };

/** Required-field asterisk, Figma #CF1322 (no token). */
export const requiredMarkColor = "text-[#CF1322]";
/** "Tiêu chuẩn cộng đồng" link, Figma #E46060 (no token). */
export const communityLinkColor = "text-[#E46060]";
/** "Tối đa 5" caption: Montserrat Bold 11/16, tracking 0.5 (no type token at 11px). */
export const captionText = "text-[11px] leading-4 tracking-[0.5px] font-bold text-text-muted";

/** Field label: Bold 22/28 #00101A. */
export const fieldLabel = "text-title-large font-bold text-on-primary";

/** White input with the gold border: px 24, py 16, Bold 16/24 (tracking 0.15). */
export const textInput = `w-full rounded-lg border border-border bg-white px-6 py-4 text-title-medium font-bold text-on-primary placeholder:text-text-muted ${focusRing}`;

/** White bordered button used by "+ Hashtag" / "+ Image" (h48, px8 py4). */
export const addButton = `flex h-12 items-center gap-2 rounded-lg border border-border bg-white px-2 py-1 text-left text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

/** Hashtag chip: h48, white, gold border, rounded 8, pl16 pr8 py8. */
export const chip = "flex h-12 items-center gap-2 rounded-lg border border-border bg-white py-2 pr-2 pl-4 text-title-medium font-bold text-on-primary";

/** "Hủy": secondary fill, gold border, rounded 4, px40 py16, Bold 16/24. */
export const secondaryButton = `flex items-center justify-center gap-2 rounded border border-border bg-secondary px-10 py-4 text-title-medium font-bold text-on-primary transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

/** "Gửi" / "Lưu": primary fill, rounded 8, p16, Bold 22/28, grows to fill the row. */
export const primaryButton = `flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary p-4 text-title-large font-bold text-on-primary transition-shadow hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none ${focusRing}`;

/** Error text: Bold 16, Details/Error #D4271D. */
export const errorText = "text-title-medium font-bold text-error";

/** Cream dialog panel (Figma: primary-hover #FFF8E1, rounded 24, padding 40, width 752). */
export const panelSurface = "bg-primary-hover text-on-primary";
