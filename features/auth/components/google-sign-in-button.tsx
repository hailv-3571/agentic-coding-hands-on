"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

/** Google "G" mark, verbatim from Figma Login 662:14387 (asset vector-7). */
function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 17.6445 18.0006" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M17.6445 9.20731C17.6445 8.59552 17.5949 7.98042 17.4891 7.37854H9V10.8443H13.8613C13.6596 11.962 13.0114 12.9508 12.0623 13.5792V15.8279H14.9625C16.6656 14.2604 17.6445 11.9455 17.6445 9.20731Z" />
      <path fill="#34A853" d="M9 18.0006C11.4273 18.0006 13.4744 17.2036 14.9658 15.8279L12.0656 13.5792C11.2587 14.1281 10.217 14.439 9.0033 14.439C6.65533 14.439 4.66452 12.8549 3.95021 10.7252H0.957372V13.0434C2.48521 16.0826 5.59709 18.0006 9 18.0006Z" />
      <path fill="#FBBC04" d="M3.94691 10.7252C3.56991 9.60745 3.56991 8.39709 3.94691 7.27932V4.96112H0.957381C-0.319121 7.5042 -0.31913 10.5003 0.957372 13.0434L3.94691 10.7252Z" />
      <path fill="#EA4335" d="M9 3.56225C10.2831 3.5424 11.5232 4.02523 12.4525 4.9115L15.022 2.34196C13.395 0.814129 11.2355 -0.0258495 9 0.0006065C5.59709 0.0006065 2.48521 1.91868 0.957381 4.96112L3.94691 7.27932C4.65791 5.14631 6.65203 3.56225 9 3.56225Z" />
    </svg>
  );
}

/**
 * Submit button of the Google sign-in form. Disabled with a spinner while the action runs,
 * so a double click cannot start two OAuth flows (FR-204).
 */
export function GoogleSignInButton() {
  const t = useTranslations("auth.login");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-10 w-full max-w-[245px] items-center justify-center gap-2 rounded-lg bg-primary px-6 text-label-large font-medium text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-80 md:h-15 md:w-auto md:max-w-none md:text-title-large md:font-bold"
    >
      <span>{t("googleButton")}</span>
      {pending ? (
        <span
          role="status"
          aria-label={t("googleButtonPending")}
          className="size-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary md:size-6"
        />
      ) : (
        <GoogleGIcon className="size-5 md:size-6" />
      )}
    </button>
  );
}
