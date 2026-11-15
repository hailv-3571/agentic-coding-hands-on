"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { LoginErrorCode } from "../login-error-codes";
import { signInWithGoogle, type SignInWithGoogleState } from "../server/sign-in-with-google-action";
import { GoogleSignInButton } from "./google-sign-in-button";
import { LoginErrorBanner } from "./login-error-banner";

type GoogleSignInFormProps = {
  /** Already sanitized return path, forwarded to the OAuth callback. */
  next: string;
  /** Error from the callback redirect (`/login?error=`), shown until the next attempt. */
  initialError: LoginErrorCode | null;
  /** Allowed account domain for the "company accounts only" message, e.g. "@sun-asterisk.com". */
  domain: string;
};

const idle: SignInWithGoogleState = { error: null };

/** SCR001 R2 form: error banner (E03/E04) above the single Google button (E02). */
export function GoogleSignInForm({ next, initialError, domain }: GoogleSignInFormProps) {
  const t = useTranslations("auth.login.errors");
  const [state, formAction, pending] = useActionState(signInWithGoogle, idle);
  // A new attempt hides the previous message; a failed attempt shows its own.
  const error = pending ? null : (state.error ?? (state === idle ? initialError : null));

  return (
    <form action={formAction} className="flex w-full flex-col items-center gap-4 md:items-start md:gap-6">
      {error ? <LoginErrorBanner message={t(error, { domain })} /> : null}
      <input type="hidden" name="next" value={next} />
      <GoogleSignInButton />
    </form>
  );
}
