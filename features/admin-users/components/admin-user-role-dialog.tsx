"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { CampaignDialogFrame } from "@/features/admin-campaigns/components/campaign-dialog-frame";
import { fieldError, primaryButton, secondaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { spinner } from "@/features/admin-moderation/components/review-content-styles";
import type { RoleErrorKey } from "../lib/admin-user-role-menu-state";
import type { AdminUserRole } from "../schemas/admin-user-views";

type AdminUserRoleDialogProps = {
  name: string;
  email: string;
  target: AdminUserRole;
  /** The change is being saved: both buttons lock, Esc does nothing. */
  pending: boolean;
  /** Why the last attempt was refused (inline, the dialog stays open for a retry). */
  errorKey: RoleErrorKey | null;
  onConfirm(): void;
  onClose(): void;
};

/**
 * Role change confirmation (E20, D007): the phase 06 dialog frame (mask, #00070C panel, focus trap,
 * focus back to the "⋯" button). Title = the chosen action, the question over the person's name
 * (gold) and email, then Confirm (gold) and Cancel; Cancel, the safe choice, has focus. While saving
 * both lock with a spinner; a refusal shows its copy inline (spec § 6) and keeps the dialog open.
 */
export function AdminUserRoleDialog({ name, email, target, pending, errorKey, onConfirm, onClose }: AdminUserRoleDialogProps) {
  const t = useTranslations("adminUsers");
  const descriptionId = useId();
  return (
    <CampaignDialogFrame
      role="alertdialog"
      title={target === "admin" ? t("roleMenu.setAdmin") : t("roleMenu.setUser")}
      describedBy={descriptionId}
      busy={pending}
      onClose={onClose}
      panelClassName="max-w-120 gap-8 px-6 py-8 md:px-8 md:py-10"
    >
      <div id={descriptionId} className="flex flex-col gap-2">
        <p className="text-title-small text-text">{target === "admin" ? t("roleDialog.toAdmin") : t("roleDialog.toUser")}</p>
        <p className="mt-2 text-title-large wrap-anywhere text-primary">{name}</p>
        <p className="text-body-medium wrap-anywhere text-text-muted">{email}</p>
      </div>
      {errorKey && (
        <p role="alert" className={fieldError}>
          {t(`roleErrors.${errorKey}`)}
        </p>
      )}
      <div className="flex gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => !pending && onConfirm()}
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
          className={`${primaryButton} flex-1 gap-2`}
        >
          {pending && <span aria-hidden className={spinner} />}
          {pending ? t("roleDialog.saving") : t("roleDialog.confirm")}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={() => !pending && onClose()}
          aria-disabled={pending || undefined}
          className={`${secondaryButton} flex-1`}
        >
          {t("roleDialog.cancel")}
        </button>
      </div>
    </CampaignDialogFrame>
  );
}
