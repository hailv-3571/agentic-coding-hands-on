"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { filterButton } from "@/features/kudos-feed/components/kudo-feed-styles";
import { fetchSpotlightSnapshot } from "../lib/fetch-spotlight-snapshot";
import type { SpotlightSnapshot } from "../schemas/spotlight-views";
import { SpotlightBoardFrame } from "./spotlight-board-frame";

/**
 * Error state of the region (spec § 5): "Không tải được Spotlight Board. Vui lòng thử lại." inside
 * the empty frame, with "Thử lại" calling `GET /api/spotlight`; the rest of the Live board is not
 * affected. A retry that fails again keeps the message.
 */
export function SpotlightLoadError({ onLoaded }: { onLoaded(snapshot: SpotlightSnapshot): void }) {
  const t = useTranslations("spotlight");
  const [pending, setPending] = useState(false);

  async function retry() {
    setPending(true);
    const snapshot = await fetchSpotlightSnapshot();
    setPending(false);
    if (snapshot) onLoaded(snapshot);
  }

  return (
    <SpotlightBoardFrame>
      <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-title-medium font-bold text-text md:text-title-large">{t("loadFailed")}</p>
        <button type="button" onClick={retry} disabled={pending} aria-busy={pending} className={`${filterButton} disabled:opacity-60`}>
          {pending ? t("loading") : t("retry")}
        </button>
      </div>
    </SpotlightBoardFrame>
  );
}
