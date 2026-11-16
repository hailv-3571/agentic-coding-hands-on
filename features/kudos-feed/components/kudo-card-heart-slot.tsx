import { useFormatter, useTranslations } from "next-intl";
import { KudoFeedIcon } from "./kudo-feed-icon";

export type KudoCardHeartSlotProps = {
  kudoId: string;
  heartCount: number;
  heartedByMe: boolean;
  /** Card: gap 4 (Figma 3127:21871); detail panel: gap 8 (520:18779). */
  variant: "card" | "detail";
};

/**
 * SEAM — rewritten by phase 06 (hearts): the heart toggle button and optimistic count.
 * Phase 05 default: a read-only count (Bold 24/32, locale thousands separator, "1.000" in vi)
 * followed by the red heart. `kudoId` / `heartedByMe` are unused until phase 06.
 */
export function KudoCardHeartSlot({ heartCount, variant }: KudoCardHeartSlotProps) {
  const t = useTranslations("kudosFeed.card");
  const format = useFormatter();
  return (
    <p className={`flex items-center text-headline-small font-bold text-on-primary ${variant === "card" ? "gap-1" : "gap-2"}`}>
      <span>{format.number(heartCount)}</span>
      <KudoFeedIcon name="heart" />
      <span className="sr-only">{t("heartsLabel")}</span>
    </p>
  );
}
