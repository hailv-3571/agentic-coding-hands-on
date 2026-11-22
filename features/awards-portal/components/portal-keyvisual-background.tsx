import Image from "next/image";
import { keyvisualCover } from "./portal-styles";

type PortalKeyvisualBackgroundProps = {
  src: string;
  /** Size of the art box (it is pinned to the top of the positioned page `<main>`). */
  frameClassName: string;
  imageClassName?: string;
  /** Extra fade into the page colour at the bottom edge of the box. */
  fadeBottom?: boolean;
};

/**
 * Keyvisual art behind a portal page (same layering as the Live board keyvisual): decorative
 * image, the Figma "Cover" gradient, then an optional fade into #00101A at the bottom.
 */
export function PortalKeyvisualBackground({
  src,
  frameClassName,
  imageClassName = "object-cover object-top",
  fadeBottom = true,
}: PortalKeyvisualBackgroundProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden ${frameClassName}`}>
      <Image src={src} alt="" fill preload sizes="100vw" className={imageClassName} />
      <div className={`absolute inset-0 ${keyvisualCover}`} />
      {fadeBottom && <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background" />}
    </div>
  );
}
