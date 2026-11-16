"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { DocumentBodyPortal } from "@/features/kudos-feed/components/document-body-portal";
import type { HeartErrorCode } from "../schemas/kudo-heart-result";

type KudoHeartErrorToastProps = {
  code: HeartErrorCode | null;
  onDone(): void;
  /** How long the message stays on screen. */
  durationMs?: number;
};

const noSubscription = () => () => {};

/** False during SSR and hydration, true after: the body portal needs `document`. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * Why a heart toggle was undone or is not allowed (FR-401, FR-405): `kudosHearts.errors.<CODE>` at
 * the bottom of the screen, styled like the Copy Link toast. Mounted at the end of <body> (a card
 * can sit in a transformed carousel track). The alert region itself mounts, empty, as soon as the
 * page is hydrated, so screen readers already track it when a message is put inside.
 */
export function KudoHeartErrorToast({ code, onDone, durationMs = 5000 }: KudoHeartErrorToastProps) {
  const t = useTranslations("kudosHearts.errors");
  const hydrated = useHydrated();

  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [code, onDone, durationMs]);

  if (!hydrated) return null;
  return (
    <DocumentBodyPortal>
      <div role="alert" className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center px-4">
        {code && (
          <p className="pointer-events-auto max-w-full rounded-lg border border-error bg-container-2 px-6 py-3 text-title-medium font-bold text-text shadow-gold">
            {t(code)}
          </p>
        )}
      </div>
    </DocumentBodyPortal>
  );
}
