"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.getClientRects().length > 0 && !element.closest("[inert]"),
  );
}

/**
 * Modal focus management (screen spec § 9). While `active`: Tab / Shift+Tab cycle inside the
 * container and focus that escapes is pulled back. On mount the first `[data-autofocus]` element
 * (else the first focusable one) gets focus; on unmount focus returns to whatever had it before
 * the dialog opened. A nested dialog sets its parent's `active` to false and runs its own trap.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const container = containerRef.current;
    if (container && !container.contains(document.activeElement)) {
      const initial = container.querySelector<HTMLElement>("[data-autofocus]") ?? focusableIn(container)[0];
      (initial ?? container).focus();
    }
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [containerRef]);

  useEffect(() => {
    if (!active) return;
    function handleKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (event.key !== "Tab" || !container) return;
      const items = focusableIn(container);
      if (items.length === 0) return event.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }
    function handleFocusIn(event: FocusEvent) {
      const container = containerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        (focusableIn(container)[0] ?? container).focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [containerRef, active]);
}
