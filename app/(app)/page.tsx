import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomepageAwardsSection } from "@/features/awards-portal/components/homepage-awards-section";
import { HomepageHero } from "@/features/awards-portal/components/homepage-hero";
import { HomepageThemeArticle } from "@/features/awards-portal/components/homepage-theme-article";
import { KudosBanner } from "@/features/awards-portal/components/kudos-banner";
import { PortalKeyvisualBackground } from "@/features/awards-portal/components/portal-keyvisual-background";
import { portalColumn } from "@/features/awards-portal/components/portal-styles";
import { readRequestTimeMs } from "@/features/awards-portal/request-time";
import { requireSunner } from "@/shared/auth/current-user";
import { env } from "@/shared/config/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPortal.home");
  return { title: t("metaTitle") };
}

/** Session check + request time: a blocking route, like the other Sunner pages. */
export const instant = false;

/**
 * Homepage SAA (SCR-homepage, Figma 2167:9026): hero with the countdown to EVENT_AT, theme
 * article, the 6 award cards and the Sun* Kudos banner. The keyvisual runs under the
 * translucent 80 px header (`-mt-20`). The floating write button is out of scope (2026-11-17).
 */
export default async function HomePage() {
  await requireSunner();
  const nowMs = await readRequestTimeMs();

  return (
    <main className="relative isolate -mt-20 flex flex-col overflow-x-clip pt-36 pb-24 md:pt-46">
      <PortalKeyvisualBackground
        src="/images/awards-portal/homepage-keyvisual.webp"
        frameClassName="h-[880px] md:h-auto md:aspect-[1512/1392]"
        imageClassName="object-cover object-[72%_top]"
      />
      <div className={`${portalColumn} flex flex-col`}>
        <HomepageHero eventAtMs={env.EVENT_AT} nowMs={nowMs} />
        <HomepageThemeArticle />
        <div className="flex flex-col gap-24 md:gap-30">
          <HomepageAwardsSection />
          <KudosBanner />
        </div>
      </div>
    </main>
  );
}
