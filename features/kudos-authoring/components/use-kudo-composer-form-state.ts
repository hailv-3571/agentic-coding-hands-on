"use client";

import { useState } from "react";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import type { HashtagOption, KudoEditPrefill, KudoImagePrefill } from "../schemas/kudo-edit-prefill";
import type { KudoCreateInput, KudoUpdateInput } from "../schemas/kudo-input-schema";
import { useKudoImageUploads, type ComposerImage } from "./use-kudo-image-uploads";

/** Everything the composer edits except images (those live in useKudoImageUploads). */
export type ComposerValues = {
  recipient: SunnerOption | null;
  title: string;
  body: string;
  hashtags: HashtagOption[];
  isAnonymous: boolean;
  nickname: string;
};

export function emptyComposerValues(recipient?: SunnerOption): ComposerValues {
  return { recipient: recipient ?? null, title: "", body: "", hashtags: [], isAnonymous: false, nickname: "" };
}

export function composerValuesFromPrefill(prefill: KudoEditPrefill): ComposerValues {
  return {
    recipient: prefill.recipient,
    title: prefill.title ?? "",
    body: prefill.body,
    hashtags: prefill.hashtags,
    isAnonymous: prefill.isAnonymous,
    nickname: prefill.anonymousNickname ?? "",
  };
}

const ids = (items: { id: string }[]) => items.map((item) => item.id).join(",");

function sameValues(a: ComposerValues, b: ComposerValues): boolean {
  return (
    a.recipient?.id === b.recipient?.id &&
    a.title === b.title &&
    a.body === b.body &&
    ids(a.hashtags) === ids(b.hashtags) &&
    a.isAnonymous === b.isAnonymous &&
    a.nickname === b.nickname
  );
}

function sameImages(images: ComposerImage[], initial: KudoImagePrefill[]): boolean {
  return images.length === initial.length && images.every((image, index) => image.path === initial[index]?.path);
}

/** Editable fields shared by create and update; the nickname is sent only when anonymous. */
function editableInput(values: ComposerValues, imagePaths: string[]): KudoUpdateInput {
  return {
    title: values.title,
    body: values.body,
    hashtagIds: values.hashtags.map((tag) => tag.id),
    imagePaths,
    isAnonymous: values.isAnonymous,
    anonymousNickname: values.isAnonymous ? values.nickname : null,
  };
}

export function toCreateInput(values: ComposerValues, imagePaths: string[]): KudoCreateInput {
  return { recipientId: values.recipient?.id ?? "", ...editableInput(values, imagePaths) };
}

export function toUpdateInput(values: ComposerValues, imagePaths: string[]): KudoUpdateInput {
  return editableInput(values, imagePaths);
}

/**
 * Composer form state: field values, image uploads, the uploaded paths in display order and
 * whether anything differs from what the dialog opened with (drives the discard confirmation).
 */
export function useKudoComposerFormState(initial: ComposerValues, initialImages: KudoImagePrefill[]) {
  const [values, setValues] = useState(initial);
  const uploads = useKudoImageUploads(initialImages);
  const sortedInitialImages = [...initialImages].sort((a, b) => a.position - b.position);

  function setValue<K extends keyof ComposerValues>(key: K, value: ComposerValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const imagePaths = uploads.images.flatMap((image) => (image.status === "done" && image.path ? [image.path] : []));
  const dirty = !sameValues(values, initial) || !sameImages(uploads.images, sortedInitialImages);
  return { values, setValue, uploads, imagePaths, dirty };
}
