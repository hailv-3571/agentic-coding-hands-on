"use client";

import Link from "next/link";
import { useLayoutEffect, type PointerEventHandler, type RefObject } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { HeroBadge } from "@/features/hero-badges/components/hero-badge";
import { placeHeroTooltip } from "@/features/hero-badges/components/place-hero-tooltip";
import { KudoFeedIcon } from "@/features/kudos-feed/components/kudo-feed-icon";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { SunnerCardView } from "../schemas/profile-views";

type SunnerCardContentProps = {
  /** Referenced by the name link's `aria-controls` while the card is shown. */
  id: string;
  card: SunnerCardView;
  /** The person block the card belongs to: the card sits 8 px under it (above when no room). */
  anchor: RefObject<HTMLElement | null>;
  ref: RefObject<HTMLDivElement | null>;
  onPointerEnter: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
  onSendKudo(): void;
};

function CountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-text">{label}</dt> <dd className="text-primary">{value}</dd>
    </div>
  );
}

/**
 * The open hover card (Figma 2268:35101): #00070C, rounded 16, p16, gap 16, ≈344 wide — name (link
 * to the profile, Bold 22/28 gold), "Tên đơn vị: …" (Bold 14/20 #999, up to 3 lines), the Hero badge
 * (none → nothing), a #2E3940 divider, the two counts (Bold 16/24 white + gold), and "Gửi KUDO"
 * (gold, full width) unless it is the viewer's own card or writing has closed. A non-modal dialog in
 * a body portal with `position: fixed` (the Highlight track is transformed and clips), placed before
 * paint by the Hero tooltip's placement rule and re-placed on scroll/resize.
 */
export function SunnerCardContent({ id, card, anchor, ref: panelRef, onPointerEnter, onPointerLeave, onSendKudo }: SunnerCardContentProps) {
  const t = useTranslations("profile.card");
  const format = useFormatter();

  useLayoutEffect(() => {
    function place() {
      const block = anchor.current;
      const panel = panelRef.current;
      if (!block || !panel) return;
      const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const { left, top } = placeHeroTooltip(block.getBoundingClientRect(), panel.getBoundingClientRect(), viewport);
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
      role="dialog"
      aria-label={t("label", { name: card.fullName })}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="invisible fixed top-0 left-0 z-50 flex w-86 max-w-[calc(100vw-32px)] flex-col gap-4 rounded-2xl bg-container-2 p-4 text-left font-bold"
    >
      <div className="flex flex-col items-start gap-2">
        <Link
          href={`${APP_ROUTES.profile}/${card.id}`}
          className={`max-w-full rounded text-title-large font-bold wrap-anywhere text-primary hover:underline ${focusRing}`}
        >
          {card.fullName}
        </Link>
        {card.departmentName && (
          <p className="line-clamp-3 text-title-small font-bold text-text-muted">{t("department", { name: card.departmentName })}</p>
        )}
        <HeroBadge tier={card.heroTier} size="hoverCard" />
      </div>
      <div className="h-px w-full bg-divider" />
      <dl className="flex flex-col gap-4 text-body-large font-bold">
        <CountRow label={t("kudosReceived")} value={format.number(card.kudosReceived)} />
        <CountRow label={t("kudosSent")} value={format.number(card.kudosSent)} />
      </dl>
      {card.canSendKudo && (
        <button
          type="button"
          onClick={onSendKudo}
          className={`flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-title-medium font-bold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`}
        >
          <KudoFeedIcon name="pen-dark" className="size-6" />
          {t("sendKudo")}
        </button>
      )}
    </div>
  );
}
