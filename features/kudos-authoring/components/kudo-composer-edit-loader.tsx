"use client";

import { useTranslations } from "next-intl";
import { errorText, secondaryButton } from "./composer-styles";
import type { ComposerDialogControls } from "./kudo-composer-dialog";
import { KudoComposerForm } from "./kudo-composer-form";
import { composerValuesFromPrefill } from "./use-kudo-composer-form-state";
import { useKudoEditPrefill } from "./use-kudo-edit-prefill";

type KudoComposerEditLoaderProps = {
  kudoId: string;
  controls: ComposerDialogControls;
  onSaved(id: string): void;
};

/**
 * Edit mode (US004, FR-401): loads the owner's prefill, then shows the form with the recipient
 * locked. FORBIDDEN / NOT_FOUND show only their message (no Kudo content); a spam Kudo opens
 * read-only with the SPAM_LOCKED notice.
 */
export function KudoComposerEditLoader({ kudoId, controls, onSaved }: KudoComposerEditLoaderProps) {
  const t = useTranslations("kudosComposer");
  const state = useKudoEditPrefill(kudoId);

  if (state.status === "loading") {
    return (
      <p aria-busy="true" className="text-center text-title-medium font-bold text-text-muted">
        {t("edit.loading")}
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <p role="alert" className={errorText}>
          {t(`errors.${state.code}`)}
        </p>
        <button type="button" onClick={controls.requestClose} className={`${secondaryButton} self-start`}>
          {t("actions.close")}
        </button>
      </>
    );
  }

  const { prefill } = state;
  return (
    <KudoComposerForm
      target={{ mode: "edit", kudoId }}
      initial={composerValuesFromPrefill(prefill)}
      initialImages={prefill.images}
      lockRecipient
      lockedNotice={prefill.locked ? t("errors.SPAM_LOCKED") : null}
      onCancel={controls.requestClose}
      onSaved={onSaved}
      onDirtyChange={controls.setDirty}
      onBusyChange={controls.setBusy}
      onNestedDialogChange={controls.setNestedOpen}
    />
  );
}
