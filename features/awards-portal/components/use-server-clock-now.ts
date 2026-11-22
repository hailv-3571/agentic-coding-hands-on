"use client";

import { useEffect, useState } from "react";
import { msUntilNextMinuteChange } from "../countdown-parts";

/** Wake a little after the boundary so the floored minute has surely changed. */
const BOUNDARY_SLACK_MS = 50;

/**
 * "Now" on the SERVER's clock (BR-001): the first render uses the server's instant as is; on
 * mount the client stores `serverNow − Date.now()` once and from then on adds it to its own
 * clock, so a skewed device clock never changes the countdown. Re-renders only when the
 * displayed minute changes (a timer aligned to the next whole minute LEFT until `targetMs`),
 * and right away when the tab becomes visible again (background tabs throttle timers).
 * Stops at the target.
 */
export function useServerClockNow(targetMs: number, serverNowMs: number): number {
  const [nowMs, setNowMs] = useState(serverNowMs);

  useEffect(() => {
    const offset = serverNowMs - Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (now: number) => {
      clearTimeout(timer);
      if (now < targetMs) timer = setTimeout(tick, msUntilNextMinuteChange(targetMs, now) + BOUNDARY_SLACK_MS);
    };
    function tick() {
      const now = Date.now() + offset;
      setNowMs(now);
      schedule(now);
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    schedule(serverNowMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [targetMs, serverNowMs]);

  return nowMs;
}
