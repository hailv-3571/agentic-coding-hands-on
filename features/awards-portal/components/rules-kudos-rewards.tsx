import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroBadge } from "@/features/hero-badges/components/hero-badge";
import { HERO_TIERS } from "@/features/hero-badges/schemas/hero-tier";
import { bodyBold, smallBold } from "./portal-styles";

/** Secret Box icons, 80 wide with the name baked into the image (2x files). */
const SECRET_BOX_BADGES = [
  { key: "revival", height: 88 },
  { key: "touch-of-light", height: 104 },
  { key: "stay-gold", height: 88 },
  { key: "flow-to-horizon", height: 104 },
  { key: "beyond-the-boundary", height: 120 },
  { key: "root-further", height: 104 },
] as const;

/**
 * The 4 Hero tiers (pl 20; tag + "Có 1–4 người gửi Kudos cho bạn" Bold 16/24, then the
 * description Bold 14/20 justified). Display only. Tag and copy are the phase 09 Hero badge's own:
 * `HeroBadge` (Figma tag images, decision-log 2026-11-17, alt = tier name) and the shared `hero.*`
 * messages its tooltip reads, so the rules and the tooltip can never drift (decision-log 2026-11-22).
 */
export async function RulesHeroTierList() {
  const t = await getTranslations("hero");
  return (
    <ul className="flex flex-col gap-4">
      {HERO_TIERS.map((tier) => (
        <li key={tier} className="flex flex-col gap-1 pl-5">
          <p className="flex flex-wrap items-center gap-2">
            <HeroBadge tier={tier} size="rules" />
            <span className={bodyBold}>{t(`${tier}.tooltipTitle`)}</span>
          </p>
          <p className={`${smallBold} text-justify`}>{t(`${tier}.tooltipBody`)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Secret Box icon grid: 2 rows × 3, spread across (px 48), row gap 16; alt = icon name. */
export async function RulesSecretBoxBadges() {
  const t = await getTranslations("awardsPortal.rules");
  return (
    <ul aria-label={t("badgesLabel")} className="grid grid-cols-[repeat(3,80px)] justify-between gap-y-4 sm:px-12">
      {SECRET_BOX_BADGES.map((badge) => (
        <li key={badge.key}>
          <Image
            src={`/images/awards-portal/badge-${badge.key}.webp`}
            alt={t(`badges.${badge.key}`)}
            width={80}
            height={badge.height}
          />
        </li>
      ))}
    </ul>
  );
}
