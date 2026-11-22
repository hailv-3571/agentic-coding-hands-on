import Image from "next/image";
import type { SecretBoxIconCode } from "../schemas/secret-box-views";
import { secretBoxIconImage } from "./secret-box-format";

type SecretBoxIconImageProps = {
  code: SecretBoxIconCode;
  /** Icon name, or "" when the name is announced elsewhere. */
  alt: string;
  /** Size (and any glow) of the circle. */
  className: string;
};

/**
 * One Secret Box icon as a circle: the phase 07 badge export (opaque dark tile, a 128 px circle
 * at the top centre of the 160 px width, the name underneath) cropped to that circle — the image
 * is drawn at 125 % width shifted left by 12.5 %, so only the circle with its baked-in name shows.
 * Server/client neutral.
 */
export function SecretBoxIconImage({ code, alt, className }: SecretBoxIconImageProps) {
  const image = secretBoxIconImage(code);
  return (
    <span className={`block aspect-square shrink-0 overflow-hidden rounded-full ${className}`}>
      <Image src={image.src} width={image.width} height={image.height} alt={alt} draggable={false} className="-ml-[12.5%] h-auto w-[125%] max-w-none" />
    </span>
  );
}
