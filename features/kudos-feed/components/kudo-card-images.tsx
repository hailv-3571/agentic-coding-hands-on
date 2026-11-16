import { useTranslations } from "next-intl";
import type { KudoCardImage } from "../schemas/kudo-card-view";
import { focusRing } from "./kudo-feed-styles";

type KudoCardImagesProps = {
  images: KudoCardImage[];
  /** Detail page: each thumbnail opens the full image in a new tab. */
  openable?: boolean;
};

/** 88×88 frame: white, 1 px #998C5F border, rounded 18; the image inside has a 1 px gold border, rounded 4. */
const frame = "flex size-22 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-border bg-white";

/**
 * Attached images (up to 5, position order). Signed Storage URLs are short-lived and not in
 * `images.remotePatterns`, so a plain <img> (precedent: kudo-image-thumbnail.tsx). A null URL
 * (signing failed) renders an empty frame with an accessible note instead of a broken image.
 */
export function KudoCardImages({ images, openable = false }: KudoCardImagesProps) {
  const t = useTranslations("kudosFeed.card");
  if (images.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-4">
      {images.map((image, index) => {
        const label = t("imageAlt", { index: index + 1 });
        if (!image.url) {
          return (
            <li key={image.position} className={frame}>
              <span className="sr-only">{t("imageUnavailable", { index: index + 1 })}</span>
            </li>
          );
        }
        // eslint-disable-next-line @next/next/no-img-element
        const img = <img src={image.url} alt={openable ? "" : label} className="size-full rounded border border-primary object-cover" />;
        return (
          <li key={image.position} className={frame}>
            {openable ? (
              <a href={image.url} target="_blank" rel="noopener noreferrer" aria-label={t("openImage", { index: index + 1 })} className={`size-full rounded-[18px] ${focusRing}`}>
                {img}
              </a>
            ) : (
              img
            )}
          </li>
        );
      })}
    </ul>
  );
}
