"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { filterButton, statusText } from "@/features/kudos-feed/components/kudo-feed-styles";

type RewardsStatusMessageProps = {
  kind: "empty" | "error";
  message: string;
};

/**
 * Inline state of one rewards panel (spec § 5): the empty line (polite), or an error that names
 * only its panel with "Thử lại" (alert). Retry re-renders the server components of the page
 * (`router.refresh()`), the only source of the column data; the button waits while it runs.
 */
export function RewardsStatusMessage({ kind, message }: RewardsStatusMessageProps) {
  const t = useTranslations("secretBox");
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  if (kind === "empty") {
    return (
      <p aria-live="polite" className={`${statusText} py-6 text-center`}>
        {message}
      </p>
    );
  }
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-4 text-center">
      <p className={statusText}>{message}</p>
      <button
        type="button"
        aria-disabled={retrying || undefined}
        onClick={() => !retrying && startRetry(() => router.refresh())}
        className={`${filterButton} aria-disabled:cursor-wait aria-disabled:opacity-60`}
      >
        {t("retry")}
      </button>
    </div>
  );
}
