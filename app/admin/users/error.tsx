"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { secondaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";

/**
 * Error boundary of Admin › User (FR-407): an unexpected render failure shows the table's load-error
 * copy and a retry that re-fetches and re-renders the segment (Next 16 `retry`). Expected read failures
 * never get here — the page passes `loadError` to the screen instead.
 */
export default function AdminUsersError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("adminUsers");
  useEffect(() => console.error("[admin-users] page render failed", error), [error]);
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded border border-divider bg-container-2 px-4 py-10 text-center">
      <p className="text-title-medium text-text-muted">{t("table.loadFailed")}</p>
      <button type="button" onClick={() => retry()} className={secondaryButton}>
        {t("table.retry")}
      </button>
    </div>
  );
}
