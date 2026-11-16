"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import type { CampaignListItem } from "../schemas/campaign-admin-result";
import { CampaignDeleteDialog } from "./campaign-delete-dialog";
import { CampaignFormModal } from "./campaign-form-modal";
import { primaryButton, secondaryButton, settingsTitle } from "./campaign-settings-styles";
import { CampaignSettingsToast, type CampaignNotice } from "./campaign-settings-toast";
import { CampaignTable } from "./campaign-table";
import type { CampaignDialogOutcome } from "./use-campaign-form";

type OpenDialog = { kind: "add" } | { kind: "edit"; campaign: CampaignListItem } | { kind: "delete"; campaign: CampaignListItem } | null;

/**
 * Admin › Settings body (SCR-admin-campaign-settings, Figma 820:10492): "Setting" with the yellow
 * "Add Campaign" button, then the campaign table — or the E14 error with a reload link when the
 * list could not be read (`campaigns === null`). Owns which dialog is open and the page toast.
 * The actions revalidate /admin/settings, so new `campaigns` arrive in the same round trip.
 */
export function CampaignSettingsPanel({ campaigns }: { campaigns: CampaignListItem[] | null }) {
  const t = useTranslations("adminCampaigns");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [notice, setNotice] = useState<CampaignNotice | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const hadDialog = useRef(false);

  // A dialog returns focus to its opener; when that opener is gone (the deleted row, a row that
  // has just ended), focus would fall to <body>, so it lands on "Add Campaign" instead.
  useEffect(() => {
    if (dialog) {
      hadDialog.current = true;
      return;
    }
    if (hadDialog.current && document.activeElement === document.body) addButtonRef.current?.focus();
    hadDialog.current = false;
  }, [dialog]);

  function finish(outcome: CampaignDialogOutcome) {
    setDialog(null);
    if (outcome.kind === "gone") return setNotice({ tone: "error", message: t(`errors.${outcome.code}`) });
    const key = outcome.kind === "deleted" ? "toast.deleted" : outcome.mode === "add" ? "toast.created" : "toast.updated";
    setNotice({ tone: "success", message: t(key) });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <button ref={addButtonRef} type="button" onClick={() => setDialog({ kind: "add" })} className={primaryButton}>
          {t("addButton")}
        </button>
      </div>
      {campaigns ? (
        <CampaignTable
          campaigns={campaigns}
          onEdit={(campaign) => setDialog({ kind: "edit", campaign })}
          onDelete={(campaign) => setDialog({ kind: "delete", campaign })}
        />
      ) : (
        <div role="alert" className="flex flex-col items-center gap-4 rounded border border-divider bg-container-2 px-4 py-10 text-center">
          <p className="text-title-medium text-text-muted">{t("table.loadFailed")}</p>
          <a href={ADMIN_ROUTES.settings} className={secondaryButton}>
            {t("table.retry")}
          </a>
        </div>
      )}
      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <CampaignFormModal target={dialog.kind === "add" ? { mode: "add" } : { mode: "edit", campaign: dialog.campaign }} onClose={closeDialog} onDone={finish} />
      )}
      {dialog?.kind === "delete" && <CampaignDeleteDialog campaign={dialog.campaign} onClose={closeDialog} onDone={finish} />}
      <CampaignSettingsToast notice={notice} onDone={clearNotice} />
    </>
  );
}
