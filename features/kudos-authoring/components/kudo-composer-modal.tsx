"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import { KudoComposerDialog } from "./kudo-composer-dialog";
import { KudoComposerEditLoader } from "./kudo-composer-edit-loader";
import { KudoComposerForm } from "./kudo-composer-form";
import { useShowComposerToast } from "./kudo-composer-toast-host";
import { emptyComposerValues } from "./use-kudo-composer-form-state";

/**
 * C-07 — consumed by phase 05 (Live board launcher, card edit) and phase 12 (profile "Gửi Kudo").
 * `lockRecipient` needs `recipient`; in edit mode the recipient is always locked.
 */
export type KudoComposerModalProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSaved?(id: string): void;
} & ({ mode: "create"; recipient?: SunnerOption; lockRecipient?: boolean } | { mode: "edit"; kudoId: string });

/**
 * Write / edit Kudo modal (F003). The form mounts fresh on every open, so a closed modal never
 * keeps a stale draft. On success it closes, shows the confirmation in the Sunner area's toast
 * host (`KudoComposerToastHost`, outside any card or keyed feed), calls `onSaved(id)`; the submit
 * hook refreshes the route.
 */
export function KudoComposerModal(props: KudoComposerModalProps) {
  const { open, onOpenChange, onSaved } = props;
  const t = useTranslations("kudosComposer");
  const showToast = useShowComposerToast();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const editing = props.mode === "edit";

  function handleSaved(id: string) {
    showToast(t(editing ? "toast.updated" : "toast.created"));
    onOpenChange(false);
    onSaved?.(id);
  }

  if (!open) return null;
  return (
    <KudoComposerDialog title={t(editing ? "editTitle" : "createTitle")} onClose={close}>
      {(controls) =>
        props.mode === "edit" ? (
          <KudoComposerEditLoader kudoId={props.kudoId} controls={controls} onSaved={handleSaved} />
        ) : (
          <KudoComposerForm
            target={{ mode: "create" }}
            initial={emptyComposerValues(props.recipient)}
            initialImages={[]}
            lockRecipient={Boolean(props.lockRecipient && props.recipient)}
            onCancel={controls.requestClose}
            onSaved={handleSaved}
            onDirtyChange={controls.setDirty}
            onBusyChange={controls.setBusy}
            onNestedDialogChange={controls.setNestedOpen}
          />
        )
      }
    </KudoComposerDialog>
  );
}
