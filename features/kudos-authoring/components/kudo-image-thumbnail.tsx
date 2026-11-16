"use client";

import { useTranslations } from "next-intl";
import { ComposerIcon } from "./composer-icon";
import { captionText, focusRing } from "./composer-styles";
import type { ComposerImage } from "./use-kudo-image-uploads";

type KudoImageThumbnailProps = {
  image: ComposerImage;
  /** 1-based position, used in accessible names. */
  index: number;
  onRetry(): void;
  onRemove(): void;
};

/**
 * 80×80 thumbnail (Figma: image framed by a 1 px #FFEA9E border, rounded 4) with the red remove
 * badge at left 67 / top −9 (20 px circle, measured on 828:13433). Uploading shows a spinner;
 * a failed upload shows its state and, unless the file itself is invalid, a retry button.
 */
export function KudoImageThumbnail({ image, index, onRetry, onRemove }: KudoImageThumbnailProps) {
  const t = useTranslations("kudosComposer.image");
  const failed = image.status === "error";
  return (
    <li data-testid="kudo-image-thumbnail" data-upload-status={image.status} aria-busy={image.status === "uploading"} className="relative size-20">
      <div className={`size-full overflow-hidden rounded border bg-white ${failed ? "border-error" : "border-primary"}`}>
        {image.previewUrl && (
          // Blob previews and short-lived signed Storage URLs: not for the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.previewUrl} alt={t("thumbnailAlt", { index })} className="size-full object-cover" />
        )}
      </div>
      {image.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-on-primary/40">
          <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="sr-only">{t("uploading", { index })}</span>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded bg-white/90 p-1 text-center">
          <span className={`${captionText} text-error`}>{image.error === "IMAGE_INVALID" ? t("invalidShort") : t("failedShort")}</span>
          {image.error !== "IMAGE_INVALID" && (
            <button type="button" onClick={onRetry} className={`rounded px-1 text-title-small font-bold text-on-primary underline ${focusRing}`}>
              {t("retry")}
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        aria-label={t("remove", { index })}
        onClick={onRemove}
        className={`absolute -top-[9px] left-[67px] flex size-5 items-center justify-center rounded-full bg-error ${focusRing}`}
      >
        <ComposerIcon name="image-remove" />
      </button>
    </li>
  );
}
