"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KUDO_LIMITS } from "../kudo-authoring-limits";
import type { KudoImagePrefill } from "../schemas/kudo-edit-prefill";
import {
  hasPreviewableType,
  isAcceptedKudoImage,
  uploadKudoImage,
  type ImageUploadErrorCode,
} from "./kudo-image-upload-client";

/** One thumbnail: an attached image (edit prefill) or a local file being / already uploaded. */
export type ComposerImage = {
  key: string;
  path: string | null;
  previewUrl: string | null;
  status: "uploading" | "done" | "error";
  error: ImageUploadErrorCode | null;
  file: File | null;
  /** previewUrl is a blob: URL this hook created and must revoke. */
  ownsPreview: boolean;
};

function fromPrefill(images: KudoImagePrefill[]): ComposerImage[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map((image): ComposerImage => ({ key: image.path, path: image.path, previewUrl: image.previewUrl, status: "done", error: null, file: null, ownsPreview: false }));
}

/**
 * Per-file image state (FR-206): validate type/size locally, sign, upload; a failed upload can be
 * retried, any image removed. At most 5; extra files are dropped and `overLimit` is raised.
 * Display order = position 0..4. Removed uploads stay as Storage orphans (accepted RISK-01).
 */
export function useKudoImageUploads(initial: KudoImagePrefill[]) {
  const [images, setImages] = useState<ComposerImage[]>(() => fromPrefill(initial));
  const [overLimit, setOverLimit] = useState(false);
  /** The list including picks not rendered yet: room and lookups never read a stale render. */
  const latest = useRef(images);

  useEffect(() => {
    latest.current = images;
  }, [images]);

  // Revoke every blob: preview when the composer goes away.
  useEffect(
    () => () => latest.current.forEach((image) => image.ownsPreview && image.previewUrl && URL.revokeObjectURL(image.previewUrl)),
    [],
  );

  const patch = useCallback((key: string, changes: Partial<ComposerImage>) => {
    setImages((list) => list.map((image) => (image.key === key ? { ...image, ...changes } : image)));
  }, []);

  const upload = useCallback(
    async (key: string, file: File) => {
      patch(key, { status: "uploading", error: null });
      const result = await uploadKudoImage(file);
      patch(key, result.ok ? { status: "done", path: result.path } : { status: "error", error: result.code });
    },
    [patch],
  );

  function addFiles(files: File[]) {
    const room = KUDO_LIMITS.IMAGES_MAX - latest.current.length;
    setOverLimit(files.length > room);
    const added = files.slice(0, Math.max(room, 0)).map((file): ComposerImage => {
      const valid = isAcceptedKudoImage(file);
      const previewUrl = hasPreviewableType(file) ? URL.createObjectURL(file) : null;
      return { key: crypto.randomUUID(), path: null, previewUrl, status: valid ? "uploading" : "error", error: valid ? null : "IMAGE_INVALID", file, ownsPreview: previewUrl !== null };
    });
    latest.current = [...latest.current, ...added];
    setImages((list) => [...list, ...added]);
    for (const image of added) if (image.status === "uploading" && image.file) void upload(image.key, image.file);
  }

  function retry(key: string) {
    const image = latest.current.find((item) => item.key === key);
    if (image?.file && image.error !== "IMAGE_INVALID") void upload(key, image.file);
  }

  function remove(key: string) {
    const image = latest.current.find((item) => item.key === key);
    latest.current = latest.current.filter((item) => item.key !== key);
    if (image?.ownsPreview && image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImages((list) => list.filter((item) => item.key !== key));
    setOverLimit(false);
  }

  return { images, overLimit, addFiles, retry, remove };
}
