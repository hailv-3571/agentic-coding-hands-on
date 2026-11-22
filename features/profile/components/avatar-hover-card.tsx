"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/features/app-shell/components/user-avatar";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { LockedRecipientComposer } from "./locked-recipient-composer";
import { SunnerCardContent } from "./sunner-card-content";
import { HOVER_CARD_NAME_ATTRIBUTE, useHoverCardKeyboard } from "./use-hover-card-keyboard";
import { useSunnerCard } from "./use-sunner-card";

export { HOVER_CARD_NAME_ATTRIBUTE };

/** F012 § 4.6 `HOVER_CARD_OPEN_DELAY_MS` (YAGNI pick, phase 12 plan). */
export const HOVER_CARD_OPEN_DELAY_MS = 300;
/** Grace after the pointer leaves, so it can travel onto the card (WCAG 1.4.13 hoverable). */
const POINTER_LEAVE_DELAY_MS = 150;

/** One card open on the page at a time: opening one closes the previous one. */
let openCard: { id: string; close(): void } | null = null;

type AvatarHoverCardProps = {
  person: { id: string; name: string; avatarUrl: string | null };
  /** The person block (avatar + name + department row); the card is placed under it. */
  className: string;
  /** The avatar circle; its border turns gold (#FFEA9E) on hover and while the card is open. */
  avatarClassName: string;
  /** False → the plain avatar link only (the owner's spam card under its overlay). */
  enabled?: boolean;
  children: ReactNode;
};

const isTouch = (event: PointerEvent) => event.pointerType === "touch";

/**
 * Avatar hover card (F012 A5; Figma 721:5827 + 2268:35101) around a NAMED person on a Kudo card —
 * hosts never wrap an anonymous sender (DEC-003, BR-007). A mouse on the avatar (or keyboard focus on
 * the name link, marked with HOVER_CARD_NAME_ATTRIBUTE) opens it after HOVER_CARD_OPEN_DELAY_MS; the
 * data is cached per page (SUNNER_CARD_TTL_MS). Leaving the block and the card (unless focus is in
 * the card), Esc, a press elsewhere, or focus leaving both the name and the card closes it; one card
 * on the page at a time. Keyboard reach and focus return live in useHoverCardKeyboard. Touch never
 * opens it: a tap on the avatar is just the profile link (D007). No card until the data is there,
 * none at all after a failed load. The avatar keeps its phase 05 role: a pointer-only link
 * (aria-hidden, out of the Tab order) next to the name.
 */
export function AvatarHoverCard({ person, className, avatarClassName, enabled = true, children }: AvatarHoverCardProps) {
  const id = useId();
  const panelId = `${id}-card`;
  const blockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false);
  const [composer, setComposer] = useState<{ id: string; fullName: string } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const card = useSunnerCard(open ? person.id : null);
  const href = `${APP_ROUTES.profile}/${person.id}`;

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
    if (openCard?.id === id) openCard = null;
  }, [id]);

  useEffect(() => close, [close]);
  const keyboard = useHoverCardKeyboard({ blockRef, panelRef, panelId, shown: open && card !== null, close, composerOpen });
  const { returnFocus, dismissIfFocused } = keyboard;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const focusWasInCard = panelRef.current?.contains(document.activeElement);
      close();
      if (focusWasInCard) returnFocus();
      else dismissIfFocused();
    };
    const closeOnPressElsewhere = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (!blockRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnPressElsewhere);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnPressElsewhere);
    };
  }, [open, close, returnFocus, dismissIfFocused]);

  const openSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (openCard && openCard.id !== id) openCard.close();
      openCard = { id, close };
      setOpen(true);
    }, HOVER_CARD_OPEN_DELAY_MS);
  };
  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(close, POINTER_LEAVE_DELAY_MS);
  };
  const keepOpen = () => {
    if (open) clearTimeout(timer.current);
  };
  const leave = (event: PointerEvent) => {
    if (open && !isTouch(event) && !panelRef.current?.contains(document.activeElement)) closeSoon();
  };
  const focusName = (event: FocusEvent<HTMLElement>) => {
    if (!event.target.hasAttribute(HOVER_CARD_NAME_ATTRIBUTE) || keyboard.isDismissed()) return;
    if (event.target.matches(":focus-visible")) openSoon();
  };
  const sendKudo = () => {
    if (!card) return;
    // Focus waits on the name, so the composer hands it back there when it closes.
    returnFocus();
    close();
    setComposer({ id: card.id, fullName: card.fullName });
    setComposerOpen(true);
  };

  const avatar = (
    <Link
      href={href}
      tabIndex={-1}
      aria-hidden
      data-open={enabled && open ? "" : undefined}
      onPointerEnter={enabled ? (event) => !isTouch(event) && openSoon() : undefined}
      onPointerLeave={enabled ? (event) => !isTouch(event) && !open && clearTimeout(timer.current) : undefined}
      className={enabled ? `${avatarClassName} transition-colors hover:border-primary data-open:border-primary` : avatarClassName}
    >
      <UserAvatar name={person.name} avatarUrl={person.avatarUrl} />
    </Link>
  );
  if (!enabled) {
    return (
      <div className={className}>
        {avatar}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={blockRef}
      className={className}
      onPointerEnter={keepOpen}
      onPointerLeave={leave}
      onFocus={focusName}
      onBlur={keyboard.onBlur}
      onKeyDown={keyboard.onKeyDown}
    >
      {avatar}
      {children}
      {open &&
        card &&
        createPortal(
          <SunnerCardContent
            id={panelId}
            card={card}
            anchor={blockRef}
            ref={panelRef}
            onPointerEnter={keepOpen}
            onPointerLeave={leave}
            onSendKudo={sendKudo}
          />,
          document.body,
        )}
      {composer && <LockedRecipientComposer recipient={composer} open={composerOpen} onOpenChange={setComposerOpen} />}
    </div>
  );
}
