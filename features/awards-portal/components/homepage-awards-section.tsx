import { getTranslations } from "next-intl/server";
import { AWARDS } from "../data/awards-data";
import { AwardCard } from "./award-card";
import { PortalSectionHeader } from "./portal-section-header";

/**
 * "Hệ thống giải thưởng" (Figma 2167:9068, gap 80): section header, then the 6 cards from the
 * awards module (BR-003) — 3 columns of 336 spread across the column on desktop (row gap 80),
 * 2 on tablets, 1 on phones.
 */
export async function HomepageAwardsSection() {
  const t = await getTranslations("awardsPortal.home");
  return (
    <section aria-labelledby="homepage-awards-heading" className="flex flex-col gap-12 md:gap-20">
      <PortalSectionHeader caption={t("awardsCaption")} title={t("awardsTitle")} headingId="homepage-awards-heading" />
      <ul className="grid grid-cols-1 justify-items-center gap-x-8 gap-y-12 sm:grid-cols-2 md:gap-y-20 lg:grid-cols-3 xl:grid-cols-[repeat(3,336px)] xl:justify-between">
        {AWARDS.map((award) => (
          <li key={award.slug} className="flex w-full justify-center sm:justify-start">
            <AwardCard award={award} />
          </li>
        ))}
      </ul>
    </section>
  );
}
