import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { bodyBold, smallBold } from "./portal-styles";

/** Hero tier tags: 2x Figma exports (file size below), drawn ≈126×22 CSS px. */
const HERO_TIERS = [
  { key: "new", width: 255, height: 47 },
  { key: "rising", width: 255, height: 47 },
  { key: "super", width: 253, height: 44 },
  { key: "legend", width: 255, height: 47 },
] as const;

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
 * The 4 Hero tiers (pl 20; tag + "Có 1-4 người gửi Kudos cho bạn" Bold 16/24, then the
 * description Bold 14/20 justified). Display only: the tags are Figma images (decision-log
 * 2026-11-17), alt = tier name.
 */
export async function RulesHeroTierList() {
  const t = await getTranslations("awardsPortal.rules.tiers");
  return (
    <ul className="flex flex-col gap-4">
      {HERO_TIERS.map((tier) => (
        <li key={tier.key} className="flex flex-col gap-1 pl-5">
          <p className="flex flex-wrap items-center gap-2">
            <Image
              src={`/images/awards-portal/hero-tag-${tier.key}.webp`}
              alt={t(`${tier.key}.name`)}
              width={tier.width}
              height={tier.height}
              className="h-auto w-[126px]"
            />
            <span className={bodyBold}>{t(`${tier.key}.senders`)}</span>
          </p>
          <p className={`${smallBold} text-justify`}>{t(`${tier.key}.description`)}</p>
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
