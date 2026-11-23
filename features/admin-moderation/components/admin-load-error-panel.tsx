"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { secondaryButton } from "@/features/admin-campaigns/components/campaign-settings-styles";

/**
 * Error state of an admin table (spec § 5 "error"): the message and a retry that re-reads the page
 * on the server (`router.refresh()` in a transition, locked until it answers). The filters above
 * stay usable. Shared by Review content, Admin › User and Admin › Overview.
 */
export function AdminLoadErrorPanel({ message, retryLabel }: { message: string; retryLabel: string }) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded border border-divider bg-container-2 px-4 py-10 text-center">
      <p className="text-title-medium text-text-muted">{message}</p>
      <button
        type="button"
        aria-disabled={retrying || undefined}
        onClick={() => !retrying && startRetry(() => router.refresh())}
        className={secondaryButton}
      >
        {retryLabel}
      </button>
    </div>
  );
}
