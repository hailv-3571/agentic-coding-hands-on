import Image from "next/image";
import { useTranslations } from "next-intl";
import type { HeroTier } from "../schemas/hero-tier";

/** Tier tags exported from Figma at 2x by phase 07 (intrinsic size of each file). */
const TAG_IMAGE: Record<HeroTier, { width: number; height: number }> = {
  new: { width: 255, height: 47 },
  rising: { width: 255, height: 47 },
  super: { width: 253, height: 44 },
  legend: { width: 255, height: 47 },
};

/**
 * Drawn width per place (height follows the image): Kudo card 109×19, tooltip 218×38, Thể lệ ≈126×22,
 * profile hover card ≈164×28 (phase 12, Figma 2268:35101).
 */
const SIZE_CLASS = { card: "h-auto w-[109px]", tooltip: "h-auto w-[218px]", rules: "h-auto w-[126px]", hoverCard: "h-auto w-[164px]" } as const;

export type HeroBadgeSize = keyof typeof SIZE_CLASS;

/**
 * THE Hero badge (F009 A2, FR-202): every host draws it through this component, never its own.
 * Server/client neutral (markup + next-intl only). No tier → nothing at all, no empty pill
 * (DEC-001). `alt` is the localized tier name (`hero.<tier>.label`); `decorative` drops it where
 * the name is already announced (inside the tooltip, which describes the badge button).
 */
export function HeroBadge({ tier, size, decorative = false }: { tier: HeroTier | null; size: HeroBadgeSize; decorative?: boolean }) {
  const t = useTranslations("hero");
  if (!tier) return null;
  return (
    <Image
      src={`/images/awards-portal/hero-tag-${tier}.webp`}
      alt={decorative ? "" : t(`${tier}.label`)}
      width={TAG_IMAGE[tier].width}
      height={TAG_IMAGE[tier].height}
      className={SIZE_CLASS[size]}
    />
  );
}
