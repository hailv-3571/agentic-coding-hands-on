"use client";

import { useEffect } from "react";

/** One confirmation; a new object per save, so a second save restarts the timer. */
export type KudoComposerNotice = { message: string };

type KudoComposerToastProps = {
  notice: KudoComposerNotice | null;
  onDone(): void;
  /** How long the confirmation stays on screen. */
  durationMs?: number;
};

/**
 * Success confirmation after a send/save (FR-210), rendered once by `KudoComposerToastHost`: a
 * polite live region at the bottom of the screen that clears itself. The region stays mounted so
 * screen readers announce the message when it appears.
 */
export function KudoComposerToast({ notice, onDone, durationMs = 4000 }: KudoComposerToastProps) {
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [notice, onDone, durationMs]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
      {notice && (
        <p className="pointer-events-auto rounded-lg border border-border bg-container-2 px-6 py-3 text-title-medium font-bold text-primary shadow-gold">
          {notice.message}
        </p>
      )}
    </div>
  );
}
