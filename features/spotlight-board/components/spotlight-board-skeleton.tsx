import { useTranslations } from "next-intl";
import { LiveBoardSectionHeader } from "@/features/kudos-feed/components/live-board-section-header";
import { SpotlightBoardFrame } from "./spotlight-board-frame";
import { spotlightRegionLayout } from "./spotlight-region-styles";

const block = "animate-pulse rounded-full bg-secondary motion-reduce:animate-none";

/**
 * Loading state of the Spotlight region (SCR-spotlight-board-region § 5 "skeleton") while the server
 * snapshot streams in: the real section header and the same board frame as the loaded region, so
 * nothing moves when the board replaces it. Inside, pulsing stand-ins for the search pill, the
 * "{n} KUDOS" counter and the ticker lines. `aria-busy` until the board arrives.
 */
export function SpotlightBoardSkeleton() {
  const t = useTranslations("spotlight");
  return (
    <section aria-labelledby="spotlight-heading" aria-busy="true" className={spotlightRegionLayout}>
      <LiveBoardSectionHeader title={t("title")} headingId="spotlight-heading" />
      <SpotlightBoardFrame>
        <p className="sr-only">{t("loading")}</p>
        <div aria-hidden>
          <div className={`${block} absolute top-3 left-3 h-9 w-[45%] max-w-[219px] md:top-6 md:left-6 md:h-[39px] md:w-[219px]`} />
          <div className={`${block} absolute top-3.5 right-3 h-8 w-32 md:top-4 md:right-auto md:left-1/2 md:h-11 md:w-56 md:-translate-x-1/2`} />
          <div className="absolute bottom-4 left-4 flex w-[60%] flex-col gap-2 md:bottom-11 md:left-12 md:w-[min(580px,45%)]">
            {["w-3/5", "w-4/5", "w-2/3"].map((width) => (
              <div key={width} className={`${block} h-3 md:h-4 ${width}`} />
            ))}
          </div>
        </div>
      </SpotlightBoardFrame>
    </section>
  );
}
