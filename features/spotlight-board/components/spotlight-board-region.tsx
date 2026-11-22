"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LiveBoardSectionHeader } from "@/features/kudos-feed/components/live-board-section-header";
import type { SpotlightBoardRegionProps, SpotlightSnapshot } from "../schemas/spotlight-views";
import { SpotlightBoard } from "./spotlight-board";
import { SpotlightLoadError } from "./spotlight-load-error";
import { spotlightRegionLayout } from "./spotlight-region-styles";

/**
 * Spotlight Board region (SCR-spotlight-board-region, R4 of the Live board): the shared section
 * header ("Sun* Annual Awards 2025" / "SPOTLIGHT BOARD") above the board. A failed first snapshot
 * (`null`) shows the error only inside this region, with a retry that loads it client-side.
 */
export function SpotlightBoardRegion({ snapshot }: SpotlightBoardRegionProps) {
  const t = useTranslations("spotlight");
  const [loaded, setLoaded] = useState<SpotlightSnapshot | null>(snapshot);

  return (
    <section aria-labelledby="spotlight-heading" className={spotlightRegionLayout}>
      <LiveBoardSectionHeader title={t("title")} headingId="spotlight-heading" />
      {loaded ? <SpotlightBoard initial={loaded} /> : <SpotlightLoadError onLoaded={setLoaded} />}
    </section>
  );
}
