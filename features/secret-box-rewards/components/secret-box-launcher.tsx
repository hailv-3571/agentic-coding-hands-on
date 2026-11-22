"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OpenSecretBoxButton } from "./open-secret-box-button";
import { SecretBoxModal } from "./secret-box-modal";

/** Deep link of the open-box modal (phase 13 `box_granted` notification): `/kudos?secretBox=open`. */
export const SECRET_BOX_DEEP_LINK_PARAM = "secretBox";
const DEEP_LINK_VALUE = "open";

const noSubscription = () => () => {};

/** False during SSR and hydration, true after: the modal lives in a body portal. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/** Same URL without the deep-link param (hash and other params kept). */
function urlWithoutDeepLink(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete(SECRET_BOX_DEEP_LINK_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Opens the Secret Box modal from the "Mở Secret Box" button or from the deep link (also when the
 * stats failed: `unopened = null` renders no button but the link still works). Closing refreshes
 * the route, so the stats panel shows the new opened/unopened counts (spec § 4), and strips the
 * param through `history.replaceState` (synced with `useSearchParams`, no navigation). A deep link
 * dismissed here stays dismissed until the param goes away, so the modal never lingers while the
 * URL update settles. Focus goes back to the button, also after a deep-link open.
 */
export function SecretBoxLauncher({ unopened }: { unopened: number | null }) {
  const router = useRouter();
  const deepLinked = useSearchParams().get(SECRET_BOX_DEEP_LINK_PARAM) === DEEP_LINK_VALUE;
  const hydrated = useHydrated();
  const [clicked, setClicked] = useState(false);
  const [deepLinkDismissed, setDeepLinkDismissed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // A new deep link (param gone, then back) may open the modal again.
  if (!deepLinked && deepLinkDismissed) setDeepLinkDismissed(false);
  const open = hydrated && (clicked || (deepLinked && !deepLinkDismissed));

  const close = useCallback(() => {
    setClicked(false);
    if (deepLinked) {
      setDeepLinkDismissed(true);
      window.history.replaceState(null, "", urlWithoutDeepLink());
    }
    router.refresh();
  }, [deepLinked, router]);

  useEffect(() => {
    if (wasOpen.current && !open && (document.activeElement === document.body || !document.activeElement)) {
      buttonRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      {unopened !== null && <OpenSecretBoxButton ref={buttonRef} unopened={unopened} onOpen={() => setClicked(true)} />}
      {open && <SecretBoxModal onClose={close} />}
    </>
  );
}
