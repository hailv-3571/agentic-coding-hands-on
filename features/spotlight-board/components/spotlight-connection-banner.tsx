"use client";

import { useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import type { SpotlightChannelStatus } from "../lib/spotlight-channel-state";

type SpotlightConnectionBannerProps = {
  status: SpotlightChannelStatus;
  onRetry(): void;
};

const pill = "flex items-center gap-2 rounded-full border border-border bg-container-2/90 px-3 py-1.5 text-[11px] leading-4 font-bold text-text md:text-label-large md:font-bold";

/**
 * E09 connection label (SM-001, FR-403): hidden while connecting or live; "Đang kết nối lại…"
 * while Supabase rejoins (the last numbers stay on screen); after 5 failed attempts a "Thử lại"
 * that starts a fresh connection. The status region stays mounted so changes are announced.
 */
export function SpotlightConnectionBanner({ status, onRetry }: SpotlightConnectionBannerProps) {
  const t = useTranslations("spotlight");
  return (
    <div className="absolute top-16 right-3 z-20 flex flex-col items-end gap-2 md:top-6 md:right-6">
      <div role="status" aria-live="polite">
        {status === "reconnecting" && <p className={pill}>{t("reconnecting")}</p>}
      </div>
      {status === "failed" && (
        <div role="alert" className={pill}>
          <span>{t("liveFailed")}</span>
          <button type="button" onClick={onRetry} className={`rounded-full px-2 text-primary underline-offset-2 hover:underline ${focusRing}`}>
            {t("retry")}
          </button>
        </div>
      )}
    </div>
  );
}
