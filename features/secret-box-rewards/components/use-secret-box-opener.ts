"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { newIdempotencyKey } from "./secret-box-format";
import { createSecretBoxOpener, type OpenerState } from "./secret-box-opener";

/** Shortest "opening" frame with motion on, so a fast answer still reads as the box opening. */
const OPENING_MIN_MS = 900;

/** `prefers-reduced-motion: reduce` right now (false outside the browser). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type SecretBoxOpenerHandle = {
  state: OpenerState;
  /** Click on the box: open the next box, or retry the click whose answer never arrived. */
  open(): Promise<void>;
  /** Re-read the unopened count (the "Thử lại" of the unavailable state). */
  reload(): Promise<void>;
  dismissNotice(): void;
};

/**
 * React binding of the SM-002 opener (`secret-box-opener.ts`): one opener per mounted modal, so a
 * closed modal never keeps a stale result; reads the count on mount. Under reduced motion the
 * opening frame is not held at all.
 */
export function useSecretBoxOpener(): SecretBoxOpenerHandle {
  const [opener] = useState(() =>
    createSecretBoxOpener({
      fetch: (url, init) => fetch(url, init),
      newKey: () => newIdempotencyKey(),
      minOpeningMs: prefersReducedMotion() ? 0 : OPENING_MIN_MS,
    }),
  );
  const state = useSyncExternalStore(opener.subscribe, opener.getState, opener.getState);

  useEffect(() => {
    void opener.load();
  }, [opener]);

  return { state, open: opener.open, reload: opener.load, dismissNotice: opener.dismissNotice };
}
