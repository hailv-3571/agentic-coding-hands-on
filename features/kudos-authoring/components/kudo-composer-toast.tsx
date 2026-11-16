"use client";

import { useEffect } from "react";

type KudoComposerToastProps = {
  message: string | null;
  onDone(): void;
  /** How long the confirmation stays on screen. */
  durationMs?: number;
};

/**
 * Success confirmation after a send/save (FR-210). The shell has no toast system yet, so the
 * composer owns this one: a polite live region at the bottom of the screen that clears itself.
 * The region stays mounted so screen readers announce the message when it appears.
 */
export function KudoComposerToast({ message, onDone, durationMs = 4000 }: KudoComposerToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDone, durationMs]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
      {message && (
        <p className="pointer-events-auto rounded-lg border border-border bg-container-2 px-6 py-3 text-title-medium font-bold text-primary shadow-gold">
          {message}
        </p>
      )}
    </div>
  );
}
