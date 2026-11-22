"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { primaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";
import type { CampaignNotice } from "@/features/admin-campaigns/components/campaign-settings-toast";
import type { AdminKudoFilterValues } from "../schemas/admin-kudo-row";
import { spinner } from "./review-content-styles";
import { attachmentFilename } from "./review-export-filename";
import { reviewExportHref } from "./review-url-params";

const FALLBACK_FILENAME = "kudos.csv";

/** Hands a downloaded file to the browser under `filename`. */
function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * "Export" (E04, Figma mms_B.3: #FFEA9E, rounded 4, p16, Medium 16/24 #00101A). Downloads the CSV
 * of the current filter and order from GET /api/admin/kudos/export (D007) through fetch, so a 422
 * (more than EXPORT_MAX_ROWS rows) becomes the spec message instead of a broken download. Locked
 * with a spinner while the file is prepared (spec § 5 "exporting").
 */
export function ReviewExportButton({ filter, onNotice }: { filter: AdminKudoFilterValues; onNotice(notice: CampaignNotice): void }) {
  const t = useTranslations("adminModeration.export");
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await fetch(reviewExportHref(filter), { headers: { accept: "text/csv" }, cache: "no-store" });
      if (response.status === 422) return onNotice({ tone: "error", message: t("tooLarge") });
      if (!response.ok) return onNotice({ tone: "error", message: t("failed") });
      saveFile(await response.blob(), attachmentFilename(response.headers.get("content-disposition")) ?? FALLBACK_FILENAME);
    } catch {
      onNotice({ tone: "error", message: t("failed") });
    } finally {
      setExporting(false);
    }
  }

  return (
    <button type="button" onClick={exportCsv} aria-disabled={exporting || undefined} className={`${primaryButton} gap-2`}>
      {exporting && <span aria-hidden className={spinner} />}
      {exporting ? t("exporting") : t("button")}
    </button>
  );
}
