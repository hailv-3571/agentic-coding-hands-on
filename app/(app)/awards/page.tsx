import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AwardDetailBlock } from "@/features/awards-portal/components/award-detail-block";
import { AwardsAnchorMenu } from "@/features/awards-portal/components/awards-anchor-menu";
import { KudosBanner } from "@/features/awards-portal/components/kudos-banner";
import { PortalKeyvisualBackground } from "@/features/awards-portal/components/portal-keyvisual-background";
import { PortalSectionHeader } from "@/features/awards-portal/components/portal-section-header";
import { portalColumn } from "@/features/awards-portal/components/portal-styles";
import { AWARDS } from "@/features/awards-portal/data/awards-data";
import { requireSunner } from "@/shared/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPortal.awardsPage");
  return { title: t("metaTitle") };
}

/** Session check per request: a blocking route, like the other Sunner pages. */
export const instant = false;

/**
 * Hệ thống giải (SCR-awards-system, Figma 313:8436): keyvisual under the header, centred
 * title, then the anchor menu (178) beside the 6 award blocks (853) from the awards module
 * (BR-003), and the Sun* Kudos banner. `/awards#<slug>` lands on that block; an unknown hash
 * matches no id, so the page simply stays at the top.
 */
export default async function AwardsPage() {
  await requireSunner();
  const t = await getTranslations("awardsPortal");

  return (
    <main className="relative isolate flex flex-col gap-16 overflow-x-clip pt-4 pb-24 md:gap-30">
      <PortalKeyvisualBackground
        src="/images/awards-portal/awards-keyvisual.webp"
        frameClassName="h-100 md:h-auto md:aspect-[1440/547]"
      />
      <div className={`${portalColumn} flex flex-col gap-16 md:gap-30`}>
        <Image
          src="/images/awards-portal/root-further-logo.webp"
          alt={t("awardsPage.logoAlt")}
          width={338}
          height={150}
          preload
          sizes="(min-width: 768px) 338px, 225px"
          className="h-auto w-56 md:w-[338px]"
        />
        <PortalSectionHeader as="h1" centered caption={t("awardsPage.caption")} title={t("awardsPage.title")} />
      </div>
      <div className={`${portalColumn} flex flex-col gap-8 md:grid md:grid-cols-[178px_minmax(0,1fr)] md:gap-10 xl:grid-cols-[178px_853px] xl:justify-between`}>
        <AwardsAnchorMenu
          label={t("awardsPage.menuLabel")}
          items={AWARDS.map((award) => ({ slug: award.slug, label: t(`awards.${award.slug}.menu`) }))}
        />
        <div className="flex flex-col gap-12 md:gap-20">
          {AWARDS.map((award, index) => (
            <AwardDetailBlock
              key={award.slug}
              award={award}
              imageSide={index % 2 === 0 ? "left" : "right"}
              last={index === AWARDS.length - 1}
            />
          ))}
        </div>
      </div>
      <div className={portalColumn}>
        <KudosBanner />
      </div>
    </main>
  );
}
