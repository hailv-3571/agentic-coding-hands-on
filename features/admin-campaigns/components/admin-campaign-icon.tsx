import Image from "next/image";

/**
 * Figma icon exports copied verbatim to public/images/admin-campaigns (root width/height kept).
 * ic-edit carries its glow filter in a 30×32 box with the pencil offset by 3 px, so negative
 * margins give it the same 24 px layout box as the others.
 */
const ICONS = {
  more: { width: 24, height: 24, fit: "" },
  edit: { width: 30, height: 32, fit: "-mt-[3px] -mr-[3px] -mb-[5px] -ml-[3px]" },
  "delete-x": { width: 24, height: 24, fit: "" },
  calendar: { width: 24, height: 24, fit: "" },
} as const;

export type AdminCampaignIconName = keyof typeof ICONS;

/** Decorative icon (the control around it carries the accessible name). SVGs are served unoptimized. */
export function AdminCampaignIcon({ name, className = "" }: { name: AdminCampaignIconName; className?: string }) {
  const { width, height, fit } = ICONS[name];
  return (
    <Image
      src={`/images/admin-campaigns/ic-${name}.svg`}
      width={width}
      height={height}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 ${fit} ${className}`}
    />
  );
}
