"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { KUDO_IMAGE_CONTENT_TYPES, KUDO_LIMITS } from "../kudo-authoring-limits";
import { ComposerFieldRow } from "./composer-field-row";
import { ComposerIcon } from "./composer-icon";
import { addButton, captionText } from "./composer-styles";
import type { ImageUploadErrorCode } from "./kudo-image-upload-client";
import { KudoImageThumbnail } from "./kudo-image-thumbnail";
import type { useKudoImageUploads } from "./use-kudo-image-uploads";

type KudoImagePickerProps = {
  uploads: ReturnType<typeof useKudoImageUploads>;
  /** Server/field errors for imagePaths (already translated). */
  errors: string[];
};

/**
 * "Image" row (FR-206): thumbnails in display order and the "+ Image / Tối đa 5" button, disabled
 * at 5. Upload problems are listed under the row (one line per kind) and marked on each tile.
 */
export function KudoImagePicker({ uploads, errors }: KudoImagePickerProps) {
  const t = useTranslations("kudosComposer");
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const { images, overLimit, addFiles, retry, remove } = uploads;
  const full = images.length >= KUDO_LIMITS.IMAGES_MAX;

  const uploadMessage = (code: ImageUploadErrorCode) =>
    code === "UNEXPECTED" ? t("image.uploadFailed") : t(`errors.${code}`);
  const failures = [...new Set(images.flatMap((image) => (image.error ? [image.error] : [])))].map(uploadMessage);
  const messages = [...errors, ...failures, ...(overLimit ? [t("errors.fields.imagesTooMany")] : [])];

  return (
    <ComposerFieldRow label={t("image.label")} labelId={labelId} errors={messages} errorId={`${labelId}-error`}>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-4 pt-2">
        {images.length > 0 && (
          <ul className="flex flex-wrap gap-4">
            {images.map((image, index) => (
              <KudoImageThumbnail
                key={image.key}
                image={image}
                index={index + 1}
                onRetry={() => retry(image.key)}
                onRemove={() => remove(image.key)}
              />
            ))}
          </ul>
        )}
        <button type="button" disabled={full} onClick={() => inputRef.current?.click()} className={addButton}>
          <ComposerIcon name="plus" />
          <span className="flex flex-col">
            <span className="text-title-medium font-bold">{t("image.add")}</span>
            <span className={captionText}>{t("image.max", { max: KUDO_LIMITS.IMAGES_MAX })}</span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={KUDO_IMAGE_CONTENT_TYPES.join(",")}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
    </ComposerFieldRow>
  );
}
