"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards (browser-only output such as local time). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
