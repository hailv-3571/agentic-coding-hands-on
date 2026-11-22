import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { Award } from "../data/awards-data";
import { AwardThumbnail } from "./award-thumbnail";
import { PortalIcon } from "./portal-icon";
import { focusRing } from "./portal-styles";

/**
 * Homepage award card (Figma 2167:9068, gap 24): thumbnail, name (Regular 24/32 gold), short
 * description (Regular 16/24 white), "Chi tiết ↗" (Medium 16/24, py16) → `/awards#<slug>`.
 */
export async function AwardCard({ award }: { award: Award }) {
  const t = await getTranslations("awardsPortal");
  const name = t(`awards.${award.slug}.name`);
  return (
    <article className="flex w-full max-w-84 flex-col gap-6">
      <AwardThumbnail src={award.imageSrc} alt={name} />
      <div className="flex flex-col gap-1">
        <h3 className="text-headline-small text-primary">{name}</h3>
        <p className="text-body-large text-text">{t(`awards.${award.slug}.short`)}</p>
        <Link
          href={`${APP_ROUTES.awards}#${award.slug}`}
          className={`flex w-fit items-center gap-1 rounded py-4 text-title-medium text-text transition-colors hover:text-primary ${focusRing}`}
        >
          {t("home.awardDetails")}{" "}
          <span className="sr-only">{t("home.awardDetailsFor", { name })}</span>
          <PortalIcon name="arrow-up-right-light" />
        </Link>
      </div>
    </article>
  );
}
