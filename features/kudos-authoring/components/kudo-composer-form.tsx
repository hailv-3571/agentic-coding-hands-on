"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { KudoImagePrefill } from "../schemas/kudo-edit-prefill";
import type { KudoField } from "../schemas/kudo-write-result";
import { AnonymousSenderField } from "./anonymous-sender-field";
import { ComposerFieldRow } from "./composer-field-row";
import { ComposerIcon } from "./composer-icon";
import { errorText, primaryButton, secondaryButton } from "./composer-styles";
import { HashtagPicker } from "./hashtag-picker";
import { KudoImagePicker } from "./kudo-image-picker";
import { KudoMessageEditor } from "./kudo-message-editor";
import { KudoTitleField } from "./kudo-title-field";
import { RecipientPicker } from "./recipient-picker";
import { toCreateInput, toUpdateInput, useKudoComposerFormState, type ComposerValues } from "./use-kudo-composer-form-state";
import { useKudoComposerSubmit } from "./use-kudo-composer-submit";

export type ComposerTarget = { mode: "create" } | { mode: "edit"; kudoId: string };

type KudoComposerFormProps = {
  target: ComposerTarget;
  initial: ComposerValues;
  initialImages: KudoImagePrefill[];
  lockRecipient: boolean;
  /** Spam-locked edit: the notice is shown and every field is read-only (C-17). */
  lockedNotice?: string | null;
  onCancel(): void;
  onSaved(id: string): void;
  onDirtyChange(dirty: boolean): void;
  /** True while the send/save is in flight (the dialog then refuses to close). */
  onBusyChange(busy: boolean): void;
  onNestedDialogChange(open: boolean): void;
};

/** Composer body in Figma order: recipient, title, message, hashtags, images, anonymity, error, buttons. */
export function KudoComposerForm(props: KudoComposerFormProps) {
  const { target, lockRecipient, lockedNotice, onCancel, onSaved, onDirtyChange, onBusyChange } = props;
  const t = useTranslations("kudosComposer");
  const { values, setValue, uploads, imagePaths, dirty } = useKudoComposerFormState(props.initial, props.initialImages);
  const { submit, pending, failure, clearFailure } = useKudoComposerSubmit(onSaved);
  const [blocked, setBlocked] = useState<string | null>(null);
  const recipientId = useId();
  const hashtagLabelId = useId();
  const bannerId = useId();

  useEffect(() => onDirtyChange(dirty && !lockedNotice), [dirty, lockedNotice, onDirtyChange]);
  useEffect(() => onBusyChange(pending), [pending, onBusyChange]);

  function change<K extends keyof ComposerValues>(key: K, value: ComposerValues[K]) {
    setValue(key, value);
    clearFailure();
    setBlocked(null);
  }

  const fieldKeys = (field: KudoField) => failure?.fieldErrors?.[field] ?? [];
  const invalid = (field: KudoField) => fieldKeys(field).length > 0;
  // "required" is covered by the DEC-001 banner; every other key gets its own message.
  const messages = (field: KudoField) =>
    fieldKeys(field).filter((key) => key !== "required").map((key) => t(`errors.fields.${key}`));

  function handleSubmit() {
    if (uploads.images.some((image) => image.status === "uploading")) return setBlocked(t("image.waitForUploads"));
    if (uploads.images.some((image) => image.status === "error")) return setBlocked(t("image.removeFailed"));
    setBlocked(null);
    if (target.mode === "create") submit({ mode: "create", input: toCreateInput(values, imagePaths) });
    else submit({ mode: "edit", kudoId: target.kudoId, input: toUpdateInput(values, imagePaths) });
  }

  const banner = blocked ?? (failure ? t(`errors.${failure.code}`) : null);
  const editing = target.mode === "edit";
  return (
    <>
      {lockedNotice && (
        <p role="alert" className={`rounded-lg border border-error bg-white px-6 py-4 ${errorText}`}>
          {lockedNotice}
        </p>
      )}
      <fieldset disabled={Boolean(lockedNotice)} className="flex min-w-0 flex-col gap-8">
        <ComposerFieldRow
          label={t("recipient.label")}
          htmlFor={recipientId}
          required
          errors={messages("recipientId")}
          errorId={`${recipientId}-error`}
        >
          <RecipientPicker
            id={recipientId}
            value={values.recipient}
            onChange={(recipient) => change("recipient", recipient)}
            locked={lockRecipient}
            invalid={invalid("recipientId")}
            describedBy={messages("recipientId").length ? `${recipientId}-error` : undefined}
          />
        </ComposerFieldRow>
        <KudoTitleField
          value={values.title}
          onChange={(title) => change("title", title)}
          errors={messages("title")}
          autoFocus={editing && !lockedNotice}
        />
        <KudoMessageEditor
          value={values.body}
          onChange={(body) => change("body", body)}
          errors={messages("body")}
          invalid={invalid("body")}
          onNestedDialogChange={props.onNestedDialogChange}
        />
        <ComposerFieldRow label={t("hashtag.label")} labelId={hashtagLabelId} required align="start" errors={messages("hashtagIds")} errorId={`${hashtagLabelId}-error`}>
          <HashtagPicker
            value={values.hashtags}
            onChange={(hashtags) => change("hashtags", hashtags)}
            labelId={hashtagLabelId}
          />
        </ComposerFieldRow>
        <KudoImagePicker uploads={uploads} errors={messages("imagePaths")} />
        <AnonymousSenderField
          isAnonymous={values.isAnonymous}
          nickname={values.nickname}
          onAnonymousChange={(value) => change("isAnonymous", value)}
          onNicknameChange={(value) => change("nickname", value)}
          nicknameErrors={messages("anonymousNickname")}
        />
      </fieldset>
      {banner && (
        <p id={bannerId} role="alert" className={errorText}>
          {banner}
        </p>
      )}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-6">
        <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>
          {t("actions.cancel")}
          <ComposerIcon name="close" />
        </button>
        {!lockedNotice && (
          <button type="button" onClick={handleSubmit} disabled={pending} aria-describedby={banner ? bannerId : undefined} className={primaryButton}>
            {pending ? t(editing ? "actions.saving" : "actions.sending") : t(editing ? "actions.save" : "actions.send")}
            <ComposerIcon name={editing ? "save" : "send"} />
          </button>
        )}
      </div>
    </>
  );
}
