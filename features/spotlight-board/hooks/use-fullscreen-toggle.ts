"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Browser Fullscreen API on the board (D005, A5). `active` follows `fullscreenchange`, so Esc or the
 * browser's own exit stay in sync. `onReject` runs when entering is unsupported or refused; a failed
 * exit is ignored (the browser already left or will on Esc).
 */
export function useFullscreenToggle(target: RefObject<HTMLElement | null>, onReject: () => void) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(document.fullscreenElement !== null && document.fullscreenElement === target.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [target]);

  const toggle = useCallback(async () => {
    const element = target.current;
    if (!element) return;
    if (document.fullscreenElement === element) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (!document.fullscreenEnabled || typeof element.requestFullscreen !== "function") {
      onReject();
      return;
    }
    try {
      await element.requestFullscreen();
    } catch {
      onReject();
    }
  }, [target, onReject]);

  return { active, toggle };
}
