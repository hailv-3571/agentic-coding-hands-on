"use client";

import { useTranslations } from "next-intl";
import { CampaignDialogFrame } from "./campaign-dialog-frame";
import { CampaignDateTimeInput, CampaignFormField, CampaignTextInput } from "./campaign-form-field";
import { fieldError, primaryButton, secondaryButton } from "./campaign-settings-styles";
import { useCampaignForm, type CampaignDialogOutcome, type CampaignFormTarget } from "./use-campaign-form";

type CampaignFormModalProps = {
  target: CampaignFormTarget;
  onClose(): void;
  onDone(outcome: CampaignDialogOutcome): void;
};

/**
 * "Add Campaign" / "Edit Campaign" dialog (SCR-campaign-form-modal; Figma 820:11445, 832:12113,
 * 832:12299): panel w560, p40, gap 24; Campaign Name full width, Start Date | End Date side by side
 * (stacked on phones), then Cancel and the wide submit ("Add Campaign" / "Save Campaign"). Edit
 * opens prefilled; an active campaign's Start Date is read-only with the reason (DEC-002). While
 * saving, the inputs are read-only and both buttons locked (`aria-disabled` + guards, so focus
 * stays put); Esc and Cancel close without saving.
 */
export function CampaignFormModal({ target, onClose, onDone }: CampaignFormModalProps) {
  const t = useTranslations("adminCampaigns");
  const form = useCampaignForm(target, onDone);
  const editing = target.mode === "edit";

  return (
    <CampaignDialogFrame
      title={t(editing ? "form.editTitle" : "form.addTitle")}
      busy={form.pending}
      onClose={onClose}
      panelClassName="max-w-140 gap-6 p-6 md:p-10"
    >
      <form noValidate onSubmit={form.submit} aria-busy={form.pending || undefined} className="flex flex-col gap-6">
        <CampaignFormField label={t("form.name")} error={form.errors.name}>
          {(field) => (
            <CampaignTextInput
              {...field}
              ref={form.inputs.name}
              data-autofocus
              autoComplete="off"
              placeholder={t("form.name")}
              value={form.values.name}
              readOnly={form.pending}
              onChange={(event) => form.setField("name", event.target.value)}
            />
          )}
        </CampaignFormField>
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
          <CampaignFormField
            className="flex-1"
            label={t("form.startsAt")}
            error={form.errors.startsAt}
            hint={form.startLocked ? t("errors.fields.startLocked") : undefined}
          >
            {(field) => (
              <CampaignDateTimeInput
                {...field}
                ref={form.inputs.startsAt}
                value={form.values.startsAt}
                readOnly={form.startLocked || form.pending}
                onChange={(event) => form.setField("startsAt", event.target.value)}
              />
            )}
          </CampaignFormField>
          <CampaignFormField className="flex-1" label={t("form.endsAt")} error={form.errors.endsAt}>
            {(field) => (
              <CampaignDateTimeInput
                {...field}
                ref={form.inputs.endsAt}
                value={form.values.endsAt}
                readOnly={form.pending}
                onChange={(event) => form.setField("endsAt", event.target.value)}
              />
            )}
          </CampaignFormField>
        </div>
        {form.formError && (
          <p role="alert" className={fieldError}>
            {form.formError}
          </p>
        )}
        <div className="flex gap-4 sm:gap-6">
          <button type="button" onClick={() => !form.pending && onClose()} aria-disabled={form.pending || undefined} className={secondaryButton}>
            {t("form.cancel")}
          </button>
          <button type="submit" aria-disabled={form.pending || undefined} className={`${primaryButton} flex-1`}>
            {form.pending ? t("form.saving") : t(editing ? "form.submitEdit" : "form.submitAdd")}
          </button>
        </div>
      </form>
    </CampaignDialogFrame>
  );
}
