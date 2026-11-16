"use client";

import { useId, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CampaignActionResult, CampaignListItem } from "../schemas/campaign-admin-result";
import { removeCampaign } from "../server/campaign-admin-actions";
import { CampaignDialogFrame } from "./campaign-dialog-frame";
import { dangerButton, fieldError, secondaryButton } from "./campaign-settings-styles";
import type { CampaignDialogOutcome } from "./use-campaign-form";

type CampaignDeleteDialogProps = {
  campaign: CampaignListItem;
  onClose(): void;
  onDone(outcome: CampaignDialogOutcome): void;
};

/** A thrown action or a network failure counts as a failed delete (403/redirect pass through). */
async function removeSafely(id: number): Promise<CampaignActionResult> {
  try {
    return await removeCampaign(id);
  } catch (error) {
    unstable_rethrow(error);
    console.warn("[admin-campaigns] deleting the campaign failed", error);
    return { ok: false, code: "UNEXPECTED" };
  }
}

/**
 * "Delete Campaign" confirm (E10–E12, Figma 1760:8926): panel ~480, px32 py40, gap 40; the question
 * (Medium 14/20) over the campaign name (Regular 22/28 gold), then Delete (red) and Cancel (gold
 * outline), each flex-1 and h52. An alertdialog whose safe choice, Cancel, has focus. While deleting,
 * both buttons are locked (`aria-disabled` + guards, so focus stays in the dialog). Success, or a row already gone or ended, closes it with a page toast;
 * any other failure keeps it open with "Không xoá được, vui lòng thử lại".
 */
export function CampaignDeleteDialog({ campaign, onClose, onDone }: CampaignDeleteDialogProps) {
  const t = useTranslations("adminCampaigns.delete");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const descriptionId = useId();

  function confirm() {
    if (pending) return;
    setFailed(false);
    startTransition(async () => {
      const result = await removeSafely(campaign.id);
      startTransition(() => {
        if (result.ok) onDone({ kind: "deleted" });
        else if (result.code === "NOT_FOUND" || result.code === "ENDED") onDone({ kind: "gone", code: result.code });
        else setFailed(true);
      });
    });
  }

  return (
    <CampaignDialogFrame
      role="alertdialog"
      title={t("title")}
      describedBy={descriptionId}
      busy={pending}
      onClose={onClose}
      panelClassName="max-w-120 gap-10 px-6 py-8 md:px-8 md:py-10"
    >
      <div id={descriptionId} className="flex flex-col gap-4">
        <p className="text-title-small text-text">{t("question")}</p>
        <p className="text-title-large wrap-anywhere text-primary">{campaign.name}</p>
      </div>
      {failed && (
        <p role="alert" className={fieldError}>
          {t("failed")}
        </p>
      )}
      <div className="flex gap-4 sm:gap-6">
        <button type="button" onClick={confirm} aria-disabled={pending || undefined} aria-busy={pending || undefined} className={`${dangerButton} flex-1`}>
          {pending ? t("deleting") : t("confirm")}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={() => !pending && onClose()}
          aria-disabled={pending || undefined}
          className={`${secondaryButton} flex-1`}
        >
          {t("cancel")}
        </button>
      </div>
    </CampaignDialogFrame>
  );
}
