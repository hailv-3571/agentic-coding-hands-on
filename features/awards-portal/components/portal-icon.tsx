import Image from "next/image";

/** Figma icon exports in public/images/awards-portal (root width/height kept). */
const ICONS = {
  "arrow-up-right-dark": [24, 24],
  "arrow-up-right-light": [24, 24],
  target: [24, 24],
  "target-active": [32, 34],
  diamond: [24, 24],
  license: [24, 24],
  close: [24, 24],
  "pen-dark": [24, 24],
} as const;

export type PortalIconName = keyof typeof ICONS;

/** Decorative icon (the control or text next to it carries the meaning). SVGs are served unoptimized. */
export function PortalIcon({ name, className = "" }: { name: PortalIconName; className?: string }) {
  const [width, height] = ICONS[name];
  return (
    <Image
      src={`/images/awards-portal/ic-${name}.svg`}
      width={width}
      height={height}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 ${className}`}
    />
  );
}
