"use client";

import { useEffect } from "react";

type SpotlightBoardToastProps = {
  message: string | null;
  onDone(): void;
  durationMs?: number;
};

/**
 * Short notice inside the board ("Không thể phóng to bảng."), bottom centre, gone after a few
 * seconds. Inside the frame so it also shows in fullscreen; the alert region mounts empty first so
 * the message is announced. Styled like the other toasts of the app.
 */
export function SpotlightBoardToast({ message, onDone, durationMs = 4000 }: SpotlightBoardToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDone, durationMs]);

  return (
    <div role="alert" className="pointer-events-none absolute inset-x-4 bottom-24 z-30 flex justify-center md:bottom-6">
      {message && (
        <p className="max-w-full rounded-lg border border-error bg-container-2 px-6 py-3 text-title-small font-bold text-text shadow-gold md:text-title-medium md:font-bold">
          {message}
        </p>
      )}
    </div>
  );
}
