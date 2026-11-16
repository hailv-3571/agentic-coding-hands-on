"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/features/kudos-authoring/components/use-focus-trap";

type CampaignDialogFrameProps = {
  title: string;
  /** `alertdialog` for the delete confirm. */
  role?: "dialog" | "alertdialog";
  /** Id of the element that describes the dialog (the confirm question). */
  describedBy?: string;
  /** A save/delete is in flight: Esc does nothing (the write cannot be taken back). */
  busy: boolean;
  onClose(): void;
  /** Width, padding and gap of the panel. */
  panelClassName: string;
  children: ReactNode;
};

/**
 * Modal frame of the Add/Edit campaign and Delete campaign dialogs (Figma 820:11445, 1760:8926):
 * full-screen mask rgba(0,16,26,.8), dark panel #00070C rounded 16, centred; taller content scrolls
 * the mask. The title (Regular 24/32, white, centred) labels the dialog. Focus is trapped, starts
 * on the `[data-autofocus]` element and returns to the opener; Esc closes unless busy; the page
 * behind does not scroll. A mask click does not close (no silent loss of a half-typed form).
 * Esc is heard on the document, so it still works if focus ever leaves the panel; the dialogs'
 * buttons lock with `aria-disabled` (not `disabled`) so a save never drops focus to <body>.
 */
export function CampaignDialogFrame({ title, role = "dialog", describedBy, busy, onClose, panelClassName, children }: CampaignDialogFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, true);

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
      if (!busy) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          tabIndex={-1}
          className={`flex w-full flex-col rounded-2xl bg-container-2 text-text outline-none ${panelClassName}`}
        >
          <h2 id={titleId} className="text-center text-headline-small text-text">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
