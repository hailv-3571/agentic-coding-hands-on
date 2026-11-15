/**
 * Login error message (SCR001 E03/E04). `role="alert"` makes screen readers announce it as
 * soon as it appears; only one message is shown at a time.
 */
export function LoginErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="max-w-[420px] rounded-lg border border-error bg-error/15 px-4 py-3 text-body-medium text-text"
    >
      {message}
    </p>
  );
}
