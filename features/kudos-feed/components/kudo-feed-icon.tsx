import Image from "next/image";

/** Figma icon exports copied verbatim to public/images/kudos-feed (root width/height kept). */
const ICONS = {
  send: [32, 32],
  heart: [32, 32],
  link: [24, 24],
  "arrow-up-right": [24, 24],
  "pen-dark": [32, 32],
  "pen-light": [24, 24],
  search: [24, 24],
  "chevron-down": [24, 24],
  "carousel-left": [60, 60],
  "carousel-right": [60, 60],
  "pager-left": [28, 28],
  "pager-right": [28, 28],
} as const;

export type KudoFeedIconName = keyof typeof ICONS;

/** Decorative icon (the control around it carries the accessible name). SVGs are served unoptimized. */
export function KudoFeedIcon({ name, className = "" }: { name: KudoFeedIconName; className?: string }) {
  const [width, height] = ICONS[name];
  return (
    <Image
      src={`/images/kudos-feed/ic-${name}.svg`}
      width={width}
      height={height}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 ${className}`}
    />
  );
}
