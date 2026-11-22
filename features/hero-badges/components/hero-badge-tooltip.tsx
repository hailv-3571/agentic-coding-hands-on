"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import type { HeroTier } from "../schemas/hero-tier";
import { closeHeroTooltip, openHeroTooltip, readActiveHeroTooltip, subscribeActiveHeroTooltip } from "./active-hero-tooltip-store";
import { HeroBadge } from "./hero-badge";
import { HeroBadgeTooltipPanel } from "./hero-badge-tooltip-panel";

/** Grace period after the mouse leaves the badge, so it can move onto the tooltip (WCAG 1.4.13). */
const MOUSE_LEAVE_DELAY_MS = 120;

/**
 * The Hero badge as a tooltip trigger (F009 A3, DEC-003): a button whose name is the tier image's
 * alt. Opens on mouse hover, keyboard focus and tap; closes on mouse leave, blur, Esc, a second
 * tap or a press anywhere else (a press inside the panel keeps it open). Focus opened by a pointer press does not open it by itself — the
 * click decides (a mouse click keeps it open, a tap toggles), so a tap never opens and closes in
 * one go. One tooltip open on the page at a time (shared store); the panel is never focusable, so
 * focus is never trapped. `aria-describedby` points at the panel while it is open. No tier →
 * nothing (DEC-001). `tabbable={false}` keeps it out of the Tab order (card under the spam overlay).
 */
export function HeroBadgeTooltip({ tier, tabbable = true }: { tier: HeroTier | null; tabbable?: boolean }) {
  const id = useId();
  const tooltipId = `${id}-hero-tooltip`;
  const open = useSyncExternalStore(subscribeActiveHeroTooltip, () => readActiveHeroTooltip() === id, () => false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Pointer type of a press on the badge that has not reached its click yet. */
  const pressedWith = useRef<string | null>(null);
  /** The last press landed inside the panel: the blur it causes (the panel is not focusable) keeps it open. */
  const pressedInPanel = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(leaveTimer.current);
      closeHeroTooltip(id);
    },
    [id],
  );

  useEffect(() => {
    if (!open) return;
    // Capture phase, so the Esc that closes the tooltip is spent on it and never reaches a host
    // dialog/drawer listening further down (WCAG 1.4.13: dismiss the tooltip first).
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || readActiveHeroTooltip() !== id) return;
      event.stopPropagation();
      closeHeroTooltip(id);
    };
    const closeOnPressElsewhere = (event: PointerEvent) => {
      const target = event.target as Node;
      pressedInPanel.current = Boolean(panelRef.current?.contains(target));
      if (!pressedInPanel.current && !triggerRef.current?.contains(target)) closeHeroTooltip(id);
    };
    document.addEventListener("keydown", closeOnEscape, true);
    document.addEventListener("pointerdown", closeOnPressElsewhere);
    return () => {
      document.removeEventListener("keydown", closeOnEscape, true);
      document.removeEventListener("pointerdown", closeOnPressElsewhere);
    };
  }, [open, id]);

  if (!tier) return null;

  const show = () => {
    clearTimeout(leaveTimer.current);
    openHeroTooltip(id);
  };
  const hide = () => {
    clearTimeout(leaveTimer.current);
    closeHeroTooltip(id);
  };
  const hideAfterMouseLeave = (event: { pointerType: string }) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => closeHeroTooltip(id), MOUSE_LEAVE_DELAY_MS);
  };
  const showOnMouseEnter = (event: { pointerType: string }) => {
    if (event.pointerType === "mouse") show();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        tabIndex={tabbable ? undefined : -1}
        className={`flex shrink-0 rounded ${focusRing}`}
        onPointerEnter={showOnMouseEnter}
        onPointerLeave={hideAfterMouseLeave}
        onPointerDown={(event) => {
          pressedWith.current = event.pointerType;
        }}
        onFocus={() => {
          pressedInPanel.current = false;
          if (!pressedWith.current) show();
        }}
        onBlur={() => {
          pressedWith.current = null;
          if (pressedInPanel.current) pressedInPanel.current = false;
          else hide();
        }}
        onClick={() => {
          const pointer = pressedWith.current;
          pressedWith.current = null;
          if (pointer === "mouse" || !open) show();
          else hide();
        }}
      >
        <HeroBadge tier={tier} size="card" />
      </button>
      {open &&
        createPortal(
          <HeroBadgeTooltipPanel ref={panelRef} id={tooltipId} tier={tier} anchor={triggerRef} onPointerEnter={showOnMouseEnter} onPointerLeave={hideAfterMouseLeave} />,
          document.body,
        )}
    </>
  );
}
