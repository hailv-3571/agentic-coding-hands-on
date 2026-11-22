import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CountdownTimer } from "@/features/awards-portal/components/countdown-timer";
import { PortalKeyvisualBackground } from "@/features/awards-portal/components/portal-keyvisual-background";
import { readRequestTimeMs } from "@/features/awards-portal/request-time";
import { env } from "@/shared/config/env";
import { APP_ROUTES } from "@/shared/ui/app-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPortal.countdown");
  return { title: t("metaTitle") };
}

/** Reads the request time (blocking route, like the login page); never part of a static shell. */
export const instant = false;

/**
 * SCR-countdown-prelaunch (Figma 2268:35127): public page under the (public) layout, title and
 * DAYS/HOURS/MINUTES to LAUNCH_AT on the faded keyvisual, centred in the viewport. No link to
 * award info (decision-log 2026-11-15). At 0 the timer replaces the URL with `/`; the proxy's
 * prelaunch gate decides what `/` shows (after launch it also sends `/countdown` itself to `/`).
 */
export default async function CountdownPage() {
  const nowMs = await readRequestTimeMs();
  const t = await getTranslations("awardsPortal.countdown");

  // The artwork runs under the translucent 80 px header (`-mt-20`), as on the login page.
  return (
    <main className="relative isolate -mt-20 flex min-h-svh flex-1 flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-10">
      <PortalKeyvisualBackground
        src="/images/awards-portal/countdown-keyvisual.webp"
        frameClassName="bottom-0"
        imageClassName="object-cover object-[70%_center] opacity-50"
        fadeBottom={false}
      />
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-center text-headline-small font-bold text-text md:text-display-small md:leading-12">{t("title")}</h1>
        <CountdownTimer
          targetIso={new Date(env.LAUNCH_AT).toISOString()}
          serverNowIso={new Date(nowMs).toISOString()}
          size="page"
          redirectOnZero={APP_ROUTES.home}
        />
      </div>
    </main>
  );
}
