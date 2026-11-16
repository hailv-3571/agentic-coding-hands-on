"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { focusRing } from "./kudo-feed-styles";

export type CopyLinkNotice = { tone: "success" } | { tone: "error"; url: string };

type KudoCopyLinkToastProps = {
  notice: CopyLinkNotice | null;
  onDone(): void;
  /** How long the success confirmation stays; the error stays until dismissed. */
  durationMs?: number;
};

const toastBox = "pointer-events-auto flex max-w-full flex-col gap-2 rounded-lg border bg-container-2 px-6 py-3 text-title-medium font-bold shadow-gold";

/**
 * Copy Link feedback (FR-301, spec § 5/§ 6), styled like the composer toast. Success: a polite
 * status that clears itself. Clipboard blocked: an alert with the link in a read-only field for
 * manual copy (selected on focus) and a close button; it stays until closed. The status region
 * stays mounted so screen readers announce the confirmation.
 */
export function KudoCopyLinkToast({ notice, onDone, durationMs = 4000 }: KudoCopyLinkToastProps) {
  const t = useTranslations("kudosFeed.copyLink");

  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [notice, onDone, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
      <div role="status" aria-live="polite">
        {notice?.tone === "success" && <p className={`${toastBox} border-border text-primary`}>{t("copied")}</p>}
      </div>
      {notice?.tone === "error" && (
        <div role="alert" className={`${toastBox} w-120 border-error text-text`}>
          <p>{t("failed")}</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              aria-label={t("manualLabel")}
              value={notice.url}
              onFocus={(event) => event.currentTarget.select()}
              className={`min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-body-medium text-text ${focusRing}`}
            />
            <button type="button" onClick={onDone} className={`rounded px-3 py-2 text-title-small font-bold text-primary hover:bg-secondary ${focusRing}`}>
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
