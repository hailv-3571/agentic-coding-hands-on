import Image from "next/image";
import { awardThumbnailFrame } from "./portal-styles";

/**
 * Award picture (336×336 export with the award name composited in). The alt text is the
 * localized award name; the fixed square frame keeps the layout if the file fails to load.
 */
export function AwardThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={awardThumbnailFrame}>
      <Image src={src} alt={alt} width={336} height={336} className="size-full object-cover" />
    </div>
  );
}
