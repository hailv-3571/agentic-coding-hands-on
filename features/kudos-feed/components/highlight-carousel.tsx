"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { KudoCard } from "./kudo-card";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { roundIconButton } from "./kudo-feed-styles";

type HighlightCarouselProps = {
  items: KudoCardView[];
  active: number;
  onActiveChange(index: number): void;
  busy: boolean;
  writingOpen: boolean;
};

/*
 * Geometry (Figma 2940:13431 on 1440): 528-wide cards, gap 24, the active card centred; 400-wide
 * side fades (#00101A from 50 % to transparent) over the neighbours; 80×80 arrows at x 80. On
 * narrow screens the card takes the width minus the 16 px gutters, fades and side arrows go away
 * and the pager arrows remain. The fades and arrows shrink so they never cover the active card.
 */
const viewport =
  "relative mx-auto w-full max-w-360 overflow-hidden [--card-gap:16px] [--card-w:min(528px,calc(100vw_-_32px))] md:[--card-gap:24px]";
const fade =
  "pointer-events-none absolute inset-y-0 w-[min(400px,max(0px,calc((100%_-_var(--card-w))_/_2_-_var(--card-gap))))] from-background from-50% to-transparent";
const arrowInset = "max(0px, calc(50% - var(--card-w) / 2 - var(--card-gap) - 352px))";

/**
 * Highlight carousel (E04–E07): only the centre card is interactive and exposed (neighbours are
 * `inert` + `aria-hidden`), ←/→ move while focus is inside. Prev/next and the pager are
 * `aria-disabled` at the ends (clicks clamp to a no-op) rather than `disabled`, so the button
 * that reached the end keeps focus. Works with 1 or 2 cards (the active one stays centred).
 */
export function HighlightCarousel({ items, active, onActiveChange, busy, writingOpen }: HighlightCarouselProps) {
  const t = useTranslations("kudosFeed.highlight");
  const total = items.length;
  const atStart = active === 0;
  const atEnd = active >= total - 1;
  const go = (index: number) => onActiveChange(Math.min(Math.max(index, 0), total - 1));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    // Keys typed in a portalled overlay (the edit modal) bubble here through React, not the DOM.
    if (!event.currentTarget.contains(event.target as Node)) return;
    event.preventDefault();
    go(active + (event.key === "ArrowRight" ? 1 : -1));
  }

  const arrow = (direction: "previous" | "next") => {
    const previous = direction === "previous";
    return (
      <button
        type="button"
        aria-label={t(direction)}
        aria-disabled={previous ? atStart : atEnd}
        onClick={() => go(active + (previous ? -1 : 1))}
        style={previous ? { left: arrowInset } : { right: arrowInset }}
        className={`${roundIconButton} absolute top-1/2 z-10 hidden size-20 -translate-y-1/2 md:flex`}
      >
        <KudoFeedIcon name={previous ? "carousel-left" : "carousel-right"} />
      </button>
    );
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} aria-busy={busy} onKeyDown={handleKeyDown} className="flex flex-col gap-10">
      <div className={viewport}>
        <div
          className={`flex items-stretch gap-(--card-gap) transition-[transform,opacity] duration-500 motion-reduce:transition-none ${busy ? "opacity-60" : ""}`}
          style={{
            paddingLeft: "calc(50% - var(--card-w) / 2)",
            transform: `translateX(calc(${-active} * (var(--card-w) + var(--card-gap))))`,
          }}
        >
          {items.map((kudo, index) => {
            const current = index === active;
            return (
              <div
                key={kudo.id}
                role="group"
                aria-roledescription="slide"
                aria-label={t("slideLabel", { index: index + 1, total })}
                aria-hidden={current ? undefined : true}
                inert={!current}
                className="w-(--card-w) shrink-0"
              >
                <KudoCard kudo={kudo} variant="highlight" writingOpen={writingOpen} />
              </div>
            );
          })}
        </div>
        <div aria-hidden className={`${fade} left-0 hidden bg-linear-to-r md:block`} />
        <div aria-hidden className={`${fade} right-0 hidden bg-linear-to-l md:block`} />
        {arrow("previous")}
        {arrow("next")}
      </div>
      <div className="flex h-13 items-center justify-center gap-8">
        <button type="button" aria-label={t("pagerPrevious")} aria-disabled={atStart} onClick={() => go(active - 1)} className={`${roundIconButton} size-12`}>
          <KudoFeedIcon name="pager-left" />
        </button>
        <p role="status" className="flex items-baseline font-bold">
          <span className="text-display-medium font-bold text-primary">{active + 1}</span>
          <span className="text-[28px] leading-9 font-bold text-text-muted">/{total}</span>
        </p>
        <button type="button" aria-label={t("pagerNext")} aria-disabled={atEnd} onClick={() => go(active + 1)} className={`${roundIconButton} size-12`}>
          <KudoFeedIcon name="pager-right" />
        </button>
      </div>
    </div>
  );
}
