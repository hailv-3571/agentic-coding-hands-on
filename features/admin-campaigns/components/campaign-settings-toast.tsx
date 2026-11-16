"use client";

import { useEffect } from "react";
import { toastBox } from "./campaign-settings-styles";

export type CampaignNotice = { tone: "success" | "error"; message: string };

type CampaignSettingsToastProps = {
  notice: CampaignNotice | null;
  onDone(): void;
  /** How long a notice stays on screen. */
  durationMs?: number;
};

/**
 * Page feedback after a dialog (FR-305, spec § 5): "Đã thêm / Đã lưu / Đã xoá chiến dịch" in a polite
 * status, or why nothing changed (the campaign is gone or has ended) in an alert. Styled like the
 * composer and Copy Link toasts; the status region stays mounted so screen readers announce it.
 */
export function CampaignSettingsToast({ notice, onDone, durationMs = 5000 }: CampaignSettingsToastProps) {
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [notice, onDone, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
      <div role="status" aria-live="polite">
        {notice?.tone === "success" && <p className={`${toastBox} border-border text-primary`}>{notice.message}</p>}
      </div>
      {notice?.tone === "error" && (
        <p role="alert" className={`${toastBox} border-error text-text`}>
          {notice.message}
        </p>
      )}
    </div>
  );
}
