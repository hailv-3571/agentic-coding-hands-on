import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { PortalIcon } from "./portal-icon";
import { bodyBold, sectionCaption, sectionTitle, smallPrimaryButton } from "./portal-styles";

/**
 * Sun* Kudos banner (Figma 3390:10349), shared by the Homepage and the bottom of /awards:
 * 1120×500, rounded 16, content at left 64 vertically centred (gap 32), KUDOS logo on the
 * right half from `xl` up. Smaller screens stack the text, button and logo.
 */
export async function KudosBanner() {
  const t = await getTranslations("awardsPortal.kudosBanner");
  return (
    <section
      aria-labelledby="kudos-banner-title"
      className="relative isolate mx-auto flex w-full max-w-280 flex-col gap-8 overflow-hidden rounded-2xl bg-container-2 px-6 py-10 md:px-16 xl:h-125 xl:justify-center xl:py-0"
    >
      <Image
        src="/images/awards-portal/kudos-banner-bg.webp"
        alt=""
        fill
        sizes="(min-width: 1152px) 1120px, 100vw"
        className="-z-10 object-cover object-right"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-container-2/70 xl:hidden" />
      <div className="flex max-w-[457px] flex-col gap-4">
        <p className={sectionCaption}>{t("caption")}</p>
        <h2 id="kudos-banner-title" className={sectionTitle}>
          {t("title")}
        </h2>
        <p className={`${bodyBold} text-justify`}>
          <span className="block">{t("eyebrow")}</span>
          {t("body")}
        </p>
      </div>
      <Link href={APP_ROUTES.kudos} className={`${smallPrimaryButton} w-fit`}>
        {t("cta")}{" "}
        <span className="sr-only">{t("ctaFor")}</span>
        <PortalIcon name="arrow-up-right-dark" />
      </Link>
      <Image
        src="/images/kudos-feed/kudos-logo.png"
        alt={t("logoAlt")}
        width={593}
        height={104}
        className="h-auto w-60 xl:absolute xl:top-[215px] xl:right-21 xl:w-91"
      />
    </section>
  );
}
