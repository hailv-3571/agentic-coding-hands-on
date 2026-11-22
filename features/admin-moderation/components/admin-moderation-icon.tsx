import Image from "next/image";

/**
 * Figma icon exports copied verbatim to public/images/admin-moderation (root width/height kept).
 * The two action icons carry their glow filter in a larger box (34×33 / 33×32 around a 24 px glyph),
 * so negative margins give them the same 24 px layout box as the others.
 */
const ICONS = {
  "mark-spam": { width: 34, height: 33, fit: "-mt-[4px] -mr-[5px] -mb-[5px] -ml-[5px]" },
  "un-spam": { width: 33, height: 32, fit: "-mt-[3px] -mr-[4px] -mb-[5px] -ml-[5px]" },
  "caret-select": { width: 24, height: 24, fit: "" },
  search: { width: 24, height: 24, fit: "" },
  calendar: { width: 14, height: 14, fit: "" },
  "swap-right": { width: 16, height: 16, fit: "" },
  "sort-up": { width: 11, height: 11, fit: "" },
  "sort-down": { width: 11, height: 11, fit: "" },
  "pager-next": { width: 12, height: 12, fit: "" },
} as const;

export type AdminModerationIconName = keyof typeof ICONS;

/** Decorative icon (the control around it carries the accessible name). SVGs are served unoptimized. */
export function AdminModerationIcon({ name, className = "" }: { name: AdminModerationIconName; className?: string }) {
  const { width, height, fit } = ICONS[name];
  return (
    <Image
      src={`/images/admin-moderation/ic-${name}.svg`}
      width={width}
      height={height}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 ${fit} ${className}`}
    />
  );
}
