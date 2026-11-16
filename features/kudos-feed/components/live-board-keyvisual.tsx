import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Live board keyvisual (Figma export 1440×512): sits at the top of the page, under the
 * translucent sticky header, and fades into the page background (#00101A). `dimmed` covers the
 * whole page with the View Kudo mask `rgba(0,16,26,.8)` instead (detail page, Figma 520:18779).
 */
export function LiveBoardKeyvisualBackground({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden ${dimmed ? "bottom-0" : "h-128"}`}>
      <div className="relative mx-auto h-128 w-full max-w-[1920px]">
        <Image src="/images/kudos-feed/live-board-keyvisual.png" alt="" fill priority sizes="100vw" className="object-cover object-top" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background" />
      </div>
      {dimmed && <div className="absolute inset-0 bg-background/80" />}
    </div>
  );
}

/** KV block (h160): "Hệ thống ghi nhận và cảm ơn" Bold 36/44 gold, then the KUDOS logo (593×104), gap 10. */
export function LiveBoardHeading() {
  const t = useTranslations("kudosFeed.kv");
  return (
    <h1 className="flex flex-col gap-2.5">
      <span className="text-headline-large font-bold text-primary md:text-display-small">{t("title")}</span>
      <Image src="/images/kudos-feed/kudos-logo.png" alt={t("logoAlt")} width={593} height={106} priority className="h-auto w-full max-w-[593px]" />
    </h1>
  );
}
