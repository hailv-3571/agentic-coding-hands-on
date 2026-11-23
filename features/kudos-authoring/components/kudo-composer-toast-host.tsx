"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { KudoComposerToast, type KudoComposerNotice } from "./kudo-composer-toast";

const ShowComposerToast = createContext<((message: string) => void) | null>(null);

/**
 * Owns the composer's success toast (FR-210) for the whole Sunner area (`app/(app)/layout.tsx`).
 * A composer opened from a card (edit pen, hover card "Gửi KUDO") sits inside the All Kudos feed,
 * which remounts when the save's `router.refresh()` returns a different first page; a toast kept
 * there vanished about 200 ms after it appeared. Hosted above every page, it survives the modal
 * closing, the refresh and any remount. Each save is a new notice, so the timer restarts.
 */
export function KudoComposerToastHost({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<KudoComposerNotice | null>(null);
  const show = useCallback((message: string) => setNotice({ message }), []);
  const clear = useCallback(() => setNotice(null), []);

  return (
    <ShowComposerToast value={show}>
      {children}
      <KudoComposerToast notice={notice} onDone={clear} />
    </ShowComposerToast>
  );
}

/** Shows the composer's confirmation in the host's toast. */
export function useShowComposerToast(): (message: string) => void {
  const show = useContext(ShowComposerToast);
  if (!show) throw new Error("The Kudo composer must render inside <KudoComposerToastHost> (app/(app)/layout.tsx).");
  return show;
}
