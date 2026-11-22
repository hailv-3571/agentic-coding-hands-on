"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { useFocusTrap } from "@/features/kudos-authoring/components/use-focus-trap";
import { DocumentBodyPortal } from "@/features/kudos-feed/components/document-body-portal";
import { SecretBoxErrorToast } from "./secret-box-error-toast";
import {
  isCongratsResult,
  SecretBoxAnnouncement,
  SecretBoxCounter,
  SecretBoxHintLine,
  SecretBoxPrizeName,
  SecretBoxStage,
} from "./secret-box-modal-states";
import { focusRing } from "./secret-box-styles";
import { useSecretBoxOpener } from "./use-secret-box-opener";

const divider = <div aria-hidden className="h-px w-full shrink-0 bg-divider" />;

/**
 * "KHÁM PHÁ SECRET BOX CỦA BẠN" (SCR-secret-box-open; Figma 1466:7676 idle, 1466:7024 opening,
 * 1466:7614 icon result, 2995:15754 gift, 2995:15708 completed set). App modal mask
 * rgba(0,16,26,.8) (decision-log 2026-11-22), panel ≤ 652 wide, #00101A idle / #00070C while
 * opening and on a result, rounded 12.7, px 12.7 py 23.9, gap 22.3; scales down on phones and the
 * mask scrolls when the viewport is short. Mounted at the end of <body> (the Live board `main`
 * isolates its stacking context under the sticky header). Focus is trapped, starts on the box and
 * returns to the opener; X, Esc and a mask click close — except while a box is opening, so the
 * prize is never missed (the request times out, so this lock is bounded). The page behind does
 * not scroll.
 */
export function SecretBoxModal({ onClose }: { onClose(): void }) {
  const t = useTranslations("secretBox.modal");
  const { state, open, reload, dismissNotice } = useSecretBoxOpener();
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOnMask = useRef(false);
  const titleId = useId();
  const busy = state.phase === "opening";
  useFocusTrap(panelRef, true);

  const requestClose = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      requestClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  const raised = state.phase === "opening" || state.phase === "result";

  return (
    <DocumentBodyPortal>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80">
        <div
          className="flex min-h-full items-center justify-center p-4"
          onPointerDown={(event) => {
            pressedOnMask.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (pressedOnMask.current && event.target === event.currentTarget) requestClose();
            pressedOnMask.current = false;
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-busy={busy || undefined}
            tabIndex={-1}
            className={`flex w-full max-w-163 flex-col items-center gap-[22.3px] rounded-[12.7px] px-[12.7px] py-[23.9px] outline-none ${raised ? "bg-container-2" : "bg-background"}`}
          >
            <div className="relative flex w-full justify-center px-11">
              <h2 id={titleId} className="text-center text-[20px]/[26px] font-bold text-balance text-primary sm:text-[25.5px]/[31.8px]">
                {isCongratsResult(state) ? t("congratsTitle") : t("title")}
              </h2>
              <button
                type="button"
                aria-label={t("close")}
                aria-disabled={busy || undefined}
                onClick={requestClose}
                className={`absolute top-0 right-0 flex size-10 items-center justify-center rounded-full hover:bg-secondary aria-disabled:cursor-not-allowed aria-disabled:opacity-50 sm:-top-1 ${focusRing}`}
              >
                <Image src="/images/secret-box/ic-close.svg" width={19} height={19} alt="" aria-hidden draggable={false} />
              </button>
            </div>
            {divider}
            <SecretBoxHintLine state={state} onReload={() => void reload()} />
            <SecretBoxStage state={state} onOpen={() => void open()} />
            <SecretBoxPrizeName state={state} />
            {divider}
            <SecretBoxCounter state={state} />
            <SecretBoxAnnouncement state={state} />
            {/* Inside the dialog: content outside an aria-modal dialog may not be announced. */}
            <SecretBoxErrorToast message={state.notice ? t(state.notice) : null} onDone={dismissNotice} />
          </div>
        </div>
      </div>
    </DocumentBodyPortal>
  );
}
