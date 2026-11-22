"use client";

import { useCallback, useEffect, useRef, type FocusEvent, type KeyboardEvent, type RefObject } from "react";

/** Put on the name link inside the block: keyboard focus on it opens the card. */
export const HOVER_CARD_NAME_ATTRIBUTE = "data-hover-card-name";

const TABBABLE = ["a[href]", "button:not([disabled])", "input:not([disabled]):not([type='hidden'])", "select:not([disabled])", "textarea:not([disabled])", "[tabindex]"].join(",");

function tabbablesIn(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest("[inert]"),
  );
}

type HoverCardKeyboardOptions = {
  blockRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  panelId: string;
  /** The card is on screen (open and loaded). */
  shown: boolean;
  close(): void;
  /** The composer opened from the card holds focus: it hands focus back to the name when it closes. */
  composerOpen: boolean;
};

/**
 * Keyboard reach of the hover card (review W1, WCAG 2.1.1). The card sits in a body portal (the
 * Highlight track clips), so the DOM Tab order is bridged by hand: Tab on the name moves into the
 * card, Shift+Tab on its first control returns to the name, Tab on its last control closes it and
 * goes on to the control after the name. Focus leaving both the name and the card closes it. The
 * name exposes the card (`aria-expanded` + `aria-controls`). After Esc or "Gửi KUDO" focus goes back
 * to the name, and the card stays shut until focus has left the name (`dismissed`).
 * React events bubble through portals, so the block's handlers also see the card's (and the
 * composer's) events: each handler acts only on the name and the card.
 */
export function useHoverCardKeyboard({ blockRef, panelRef, panelId, shown, close, composerOpen }: HoverCardKeyboardOptions) {
  const dismissed = useRef(false);
  const trigger = useCallback(() => blockRef.current?.querySelector<HTMLElement>(`[${HOVER_CARD_NAME_ATTRIBUTE}]`) ?? null, [blockRef]);

  useEffect(() => {
    const name = trigger();
    if (!name) return;
    name.setAttribute("aria-expanded", String(shown));
    if (shown) name.setAttribute("aria-controls", panelId);
    else name.removeAttribute("aria-controls");
  }, [trigger, shown, panelId]);

  /** Esc / "Gửi KUDO": focus back on the name, without reopening the card from that focus. */
  const returnFocus = useCallback(() => {
    dismissed.current = true;
    trigger()?.focus();
  }, [trigger]);
  /** Esc while focus is on the name: keep the card shut until focus leaves. */
  const dismissIfFocused = useCallback(() => {
    if (document.activeElement === trigger()) dismissed.current = true;
  }, [trigger]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const name = trigger();
    const panel = panelRef.current;
    if (event.key !== "Tab" || !shown || !name || !panel) return;
    const controls = tabbablesIn(panel);
    const target = event.target as HTMLElement;
    let next: HTMLElement | null = null;
    if (target === name && !event.shiftKey) next = controls[0] ?? null;
    else if (target === controls[0] && event.shiftKey) next = name;
    else if (target === controls.at(-1) && !event.shiftKey) {
      const page = tabbablesIn(document).filter((element) => !panel.contains(element));
      next = page[page.indexOf(name) + 1] ?? null;
      if (next) close();
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const name = trigger();
    const panel = panelRef.current;
    const fromName = event.target === name;
    if (!fromName && !panel?.contains(event.target)) return;
    const to = event.relatedTarget as Node | null;
    if (to && (to === name || panel?.contains(to))) return;
    close();
    if (fromName && !composerOpen) dismissed.current = false;
  };

  return { onKeyDown, onBlur, returnFocus, dismissIfFocused, isDismissed: () => dismissed.current };
}
