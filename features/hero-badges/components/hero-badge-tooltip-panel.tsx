"use client";

import { useLayoutEffect, type PointerEventHandler, type RefObject } from "react";
import { useTranslations } from "next-intl";
import type { HeroTier } from "../schemas/hero-tier";
import { HeroBadge } from "./hero-badge";
import { placeHeroTooltip } from "./place-hero-tooltip";

type HeroBadgeTooltipPanelProps = {
  id: string;
  tier: HeroTier;
  anchor: RefObject<HTMLElement | null>;
  /** Owned by the trigger, which needs it to tell a press inside the panel from one elsewhere. */
  ref: RefObject<HTMLDivElement | null>;
  onPointerEnter: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
};

/**
 * The open Hero tooltip (Figma 3241:14991/14995/14999/15003): #00070C panel, rounded 16, p16,
 * gap 11, the 218×38 badge, then the tier rule (white) and the description (#999), Montserrat
 * Bold 14/20 — the same `hero.*` messages as the Thể lệ page. Rendered in a body portal with
 * `position: fixed` (the Highlight track is transformed and clips), placed before paint by
 * `placeHeroTooltip` and re-placed on scroll/resize. Nothing in it is focusable, so focus stays on
 * the badge button that `aria-describedby` points here from.
 */
export function HeroBadgeTooltipPanel({ id, tier, anchor, ref: panelRef, onPointerEnter, onPointerLeave }: HeroBadgeTooltipPanelProps) {
  const t = useTranslations("hero");

  useLayoutEffect(() => {
    function place() {
      const trigger = anchor.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const { left, top } = placeHeroTooltip(trigger.getBoundingClientRect(), panel.getBoundingClientRect(), viewport);
      panel.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      panel.style.visibility = "visible";
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, panelRef]);

  return (
    <div
      ref={panelRef}
      id={id}
      role="tooltip"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="invisible fixed top-0 left-0 z-50 flex w-[282px] max-w-[calc(100vw-32px)] flex-col gap-[11px] rounded-2xl bg-container-2 p-4 text-title-small font-bold"
    >
      <HeroBadge tier={tier} size="tooltip" decorative />
      <div>
        <p className="text-text">{t(`${tier}.tooltipTitle`)}</p>
        <p className="text-text-muted">{t(`${tier}.tooltipBody`)}</p>
      </div>
    </div>
  );
}
