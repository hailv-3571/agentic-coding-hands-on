import Image from "next/image";

/** Figma icon exports copied verbatim to public/images/kudos-composer (root width/height kept). */
const ICONS = {
  bold: [24, 24],
  italic: [24, 24],
  strikethrough: [24, 24],
  "numbered-list": [24, 24],
  link: [24, 24],
  quote: [24, 24],
  close: [24, 24],
  plus: [24, 24],
  send: [24, 24],
  "dropdown-caret": [24, 24],
  "image-remove": [17.1429, 17.1429],
  save: [18, 18],
  "check-circle": [15, 15],
  pencil: [18, 18],
} as const;

export type ComposerIconName = keyof typeof ICONS;

type ComposerIconProps = { name: ComposerIconName; className?: string };

/** Decorative icon (the control around it carries the accessible name). SVGs are served unoptimized. */
export function ComposerIcon({ name, className = "" }: ComposerIconProps) {
  const [width, height] = ICONS[name];
  return (
    <Image
      src={`/images/kudos-composer/ic-${name}.svg`}
      width={width}
      height={height}
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 ${className}`}
    />
  );
}
