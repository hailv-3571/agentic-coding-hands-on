"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { panelSurface } from "./composer-styles";
import { DiscardChangesConfirm } from "./discard-changes-confirm";
import { useFocusTrap } from "./use-focus-trap";

/** What the dialog body can tell the frame. */
export type ComposerDialogControls = {
  /** Esc / "Hủy": closes, or asks first when the form is dirty; a no-op while busy. */
  requestClose(): void;
  setDirty(dirty: boolean): void;
  /** A send/save is in flight: nothing may close the dialog (the write cannot be taken back). */
  setBusy(busy: boolean): void;
  /** A nested dialog (Add link) owns focus and Esc while open. */
  setNestedOpen(open: boolean): void;
};

type KudoComposerDialogProps = {
  title: string;
  onClose(): void;
  children(controls: ComposerDialogControls): ReactNode;
};

/**
 * Modal frame of the composer (Figma 520:11602): #00101A overlay at ~80 % (measured), cream panel
 * 752 px wide, rounded 24, padding 40, gap 32, centred; taller content scrolls the overlay.
 * Below `md` the panel is a full-width sheet with 16–24 px padding. Focus is trapped and returns
 * to the opener; the page behind does not scroll. Overlay clicks do not close (no silent loss),
 * and while a send is in flight neither Esc nor "Hủy" does (review W1).
 */
export function KudoComposerDialog({ title, onClose, children }: KudoComposerDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useFocusTrap(panelRef, !nestedOpen && !confirming);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  }, [busy, dirty, onClose]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || nestedOpen || confirming) return;
    event.preventDefault();
    requestClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80">
      <div className="flex min-h-full items-start justify-center md:items-center md:p-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`relative flex min-h-dvh w-full flex-col gap-8 px-4 py-8 text-left outline-none sm:px-6 md:min-h-0 md:max-w-188 md:rounded-3xl md:p-10 ${panelSurface}`}
        >
          <h2 id={titleId} className="text-center text-headline-small font-bold md:text-headline-large md:font-bold">
            {title}
          </h2>
          {children({ requestClose, setDirty, setBusy, setNestedOpen })}
          {confirming && <DiscardChangesConfirm onKeepEditing={() => setConfirming(false)} onDiscard={onClose} />}
        </div>
      </div>
    </div>
  );
}
