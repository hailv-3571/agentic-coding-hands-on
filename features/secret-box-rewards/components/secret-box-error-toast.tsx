"use client";

import { useEffect } from "react";

type SecretBoxErrorToastProps = {
  message: string | null;
  onDone(): void;
  /** How long the message stays on screen. */
  durationMs?: number;
};

/**
 * Why the last click did not open a box ("Không thể mở hộp, vui lòng thử lại", expired session),
 * fixed at the bottom of the screen above the modal mask, styled like the heart error toast.
 * Rendered inside the dialog; the alert region mounts empty first so the message is announced.
 */
export function SecretBoxErrorToast({ message, onDone, durationMs = 5000 }: SecretBoxErrorToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDone, durationMs]);

  return (
    <div role="alert" className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
      {message && (
        <p className="pointer-events-auto max-w-full rounded-lg border border-error bg-container-2 px-6 py-3 text-title-medium font-bold text-text shadow-gold">
          {message}
        </p>
      )}
    </div>
  );
}
