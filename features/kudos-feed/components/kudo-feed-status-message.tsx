"use client";

import { useTranslations } from "next-intl";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { filterButton, statusText } from "./kudo-feed-styles";

export type KudoLoadFailure = "error" | "unauthorized";

type KudoFeedStatusMessageProps = {
  state: "empty" | "loading" | KudoLoadFailure;
  onRetry?: () => void;
  /** Where sign-in returns after a 401 (default the Live board; the profile passes its own path). */
  returnTo?: string;
};

/**
 * Inline status of one Kudo list region (spec § 5; Live board, profile KUDOS): empty, loading, or
 * an error that names only its region and offers "Thử lại"; an expired session (any 401) asks to
 * sign in again and links to the login page, which returns to `returnTo`. A full navigation (plain
 * link), so the session proxy decides with fresh cookies. Errors are alerts and the other states polite.
 */
export function KudoFeedStatusMessage({ state, onRetry, returnTo = APP_ROUTES.kudos }: KudoFeedStatusMessageProps) {
  const t = useTranslations("kudosFeed.status");
  const signInHref = `${APP_ROUTES.login}?next=${encodeURIComponent(returnTo)}`;
  if (state === "empty" || state === "loading") {
    return (
      <p aria-live="polite" className={`${statusText} py-6 text-center`}>
        {t(state)}
      </p>
    );
  }
  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-4 py-6">
      <p className={statusText}>{state === "unauthorized" ? t("sessionExpired") : t("loadFailed")}</p>
      {state === "unauthorized" && (
        <a href={signInHref} className={filterButton}>
          {t("signIn")}
        </a>
      )}
      {state === "error" && onRetry && (
        <button type="button" onClick={onRetry} className={filterButton}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}

/** Maps a failed response to the inline state (any 401 = the session expired). */
export function failureOf(response: Response): KudoLoadFailure {
  return response.status === 401 ? "unauthorized" : "error";
}
