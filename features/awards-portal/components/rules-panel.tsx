import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { PortalIcon } from "./portal-icon";
import { bodyBold, smallPrimaryButton } from "./portal-styles";
import { RulesCloseButton } from "./rules-close-button";
import { RulesHeroTierList, RulesSecretBoxBadges } from "./rules-kudos-rewards";

const goldHeading = "font-bold text-primary";

/**
 * Thể lệ panel (Figma 3204:6052, decision-log 2026-11-17): 553 wide on the right (full width on
 * phones), #00070C, pt24 px40 pb40. Static copy from messages only (FR-311/312, FR-603): no
 * form, no input, no user data. Buttons at the bottom: "Đóng" (back) and "Viết KUDOS" → /kudos.
 */
export async function RulesPanel() {
  const t = await getTranslations("awardsPortal.rules");
  return (
    <div className="flex w-full flex-col justify-between gap-10 bg-container-2 px-4 pt-6 pb-10 sm:px-10 md:min-h-[calc(100svh-5rem)] md:w-[553px]">
      <div className="flex flex-col gap-6">
        <h1 className={`text-headline-large md:text-display-medium ${goldHeading}`}>{t("title")}</h1>
        <section className="flex flex-col gap-4">
          <h2 className={`text-title-large ${goldHeading}`}>{t("receiversTitle")}</h2>
          <p className={`${bodyBold} text-justify`}>{t("receiversIntro")}</p>
          <RulesHeroTierList />
        </section>
        <section className="flex flex-col gap-6">
          <h2 className={goldHeading}>
            <span className="text-headline-small font-bold">{t("sendersTitleLead")}</span>
            <span className="text-title-large font-bold">{t("sendersTitle")}</span>
          </h2>
          <p className={`${bodyBold} text-justify`}>{t("sendersBody")}</p>
          <RulesSecretBoxBadges />
          <p className={bodyBold}>{t("collectNote")}</p>
        </section>
        <section className="flex flex-col gap-6">
          <h2 className={`text-headline-small ${goldHeading}`}>{t("nationalTitle")}</h2>
          <p className={`${bodyBold} text-justify`}>{t("nationalBody")}</p>
        </section>
      </div>
      <div className="flex gap-4">
        <RulesCloseButton label={t("close")} />
        <Link href={APP_ROUTES.kudos} className={`${smallPrimaryButton} flex-1`}>
          <PortalIcon name="pen-dark" />
          {t("writeKudos")}
        </Link>
      </div>
    </div>
  );
}
