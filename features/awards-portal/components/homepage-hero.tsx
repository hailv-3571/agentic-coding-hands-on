import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { CountdownTimer } from "./countdown-timer";
import { HomepageEventInfo } from "./homepage-event-info";
import { PortalIcon } from "./portal-icon";
import { primaryCta, secondaryCta } from "./portal-styles";

type HomepageHeroProps = {
  /** EVENT_AT and the request time, epoch ms (server only; the timer gets ISO strings). */
  eventAtMs: number;
  nowMs: number;
};

/**
 * Homepage hero (Figma 2167:9031, gap 40): ROOT FURTHER logo (the page `<h1>`), "Sắp diễn ra"
 * + countdown to EVENT_AT + event info (gap 16), then ABOUT AWARDS / ABOUT KUDOS (gap 40).
 */
export async function HomepageHero({ eventAtMs, nowMs }: HomepageHeroProps) {
  const t = await getTranslations("awardsPortal.home");
  return (
    <section className="flex flex-col gap-10">
      <h1>
        <Image
          src="/images/awards-portal/root-further-logo.webp"
          alt={t("logoAlt")}
          width={451}
          height={200}
          preload
          sizes="(min-width: 640px) 451px, 280px"
          className="h-auto w-70 sm:w-[451px]"
        />
      </h1>
      <div className="flex flex-col gap-4">
        <CountdownTimer
          targetIso={new Date(eventAtMs).toISOString()}
          serverNowIso={new Date(nowMs).toISOString()}
          size="hero"
          pendingLabel={t("comingSoon")}
        />
        <HomepageEventInfo eventAtMs={eventAtMs} />
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-10">
        <Link href={APP_ROUTES.awards} className={primaryCta}>
          {t("aboutAwards")}
          <PortalIcon name="arrow-up-right-dark" />
        </Link>
        <Link href={APP_ROUTES.kudos} className={secondaryCta}>
          {t("aboutKudos")}
          <PortalIcon name="arrow-up-right-light" />
        </Link>
      </div>
    </section>
  );
}
