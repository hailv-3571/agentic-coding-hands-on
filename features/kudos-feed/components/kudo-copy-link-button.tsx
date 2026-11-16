"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { DocumentBodyPortal } from "./document-body-portal";
import { KudoCopyLinkToast, type CopyLinkNotice } from "./kudo-copy-link-toast";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { cardActionButton } from "./kudo-feed-styles";

const noSubscription = () => () => {};

/** False during SSR and hydration, true after: the body portal needs `document`. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * "Copy Link" (E20/E10): writes the absolute detail URL `${origin}/kudos/{id}` (fixed URL, D004)
 * with the Clipboard API. Success → "Đã sao chép liên kết"; a missing or blocked clipboard →
 * the error toast carrying the link for manual copy. The toast host (with its empty polite live
 * region) mounts as soon as the page is hydrated, so screen readers already track the region
 * when the first confirmation arrives.
 */
export function KudoCopyLinkButton({ kudoId }: { kudoId: string }) {
  const t = useTranslations("kudosFeed.copyLink");
  const hydrated = useHydrated();
  const [notice, setNotice] = useState<CopyLinkNotice | null>(null);
  const clear = useCallback(() => setNotice(null), []);

  async function copy() {
    setNotice(null);
    const url = `${window.location.origin}${APP_ROUTES.kudos}/${kudoId}`;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setNotice({ tone: "success" });
    } catch (error) {
      console.warn("[kudos-feed] copying the link failed", error);
      setNotice({ tone: "error", url });
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={cardActionButton}>
        {t("label")}
        <KudoFeedIcon name="link" />
      </button>
      {hydrated && (
        <DocumentBodyPortal>
          <KudoCopyLinkToast notice={notice} onDone={clear} />
        </DocumentBodyPortal>
      )}
    </>
  );
}
