"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { useCloudLayout } from "../hooks/use-cloud-layout";
import { useElementSize } from "../hooks/use-element-size";
import { nameMatcher } from "../lib/normalize-search-text";
import { cloudInputFor } from "../lib/spotlight-cloud-input";
import type { SpotlightName } from "../schemas/spotlight-views";

type SpotlightNameCloudProps = {
  names: SpotlightName[];
  /** Debounced search text (DEC-002). */
  query: string;
  /** Recipient of the newest live event, shown in #F17676 for a few seconds. */
  spotlitId: string | null;
};

/**
 * Name cloud (FR-202, ALG-001): recipients sized by tier, positions stable per person; each name
 * opens `/profile/{id}` (D004, phase 12 route). Search keeps matches as they are and dims the rest
 * to 25 %; no match dims everything and says so. Laid out only once the board has a measured size.
 */
export function SpotlightNameCloud({ names, query, spotlitId }: SpotlightNameCloudProps) {
  const t = useTranslations("spotlight");
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const input = useMemo(() => (size ? cloudInputFor(names, size.width, size.height) : null), [names, size]);
  const layout = useCloudLayout(input);
  const matches = useMemo(() => nameMatcher(query), [query]);
  const placements = layout?.placements ?? [];
  const noMatch = matches !== null && names.length > 0 && !placements.some((placement) => matches(placement.name));
  const message = names.length === 0 ? t("empty") : noMatch ? t("noMatch") : "";

  return (
    <div ref={ref} className="absolute inset-0">
      {placements.map((placement) => {
        const dimmed = matches !== null && !matches(placement.name);
        const spotlit = placement.recipientId === spotlitId;
        return (
          <Link
            key={placement.recipientId}
            href={`${APP_ROUTES.profile}/${placement.recipientId}`}
            prefetch={false}
            aria-label={t("nameLabel", { name: placement.name, count: placement.count })}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-sm leading-[1.3] font-bold tracking-[0.208px] whitespace-nowrap motion-safe:transition-[opacity,color] motion-safe:duration-500 hover:text-primary ${focusRing} ${
              spotlit ? "text-[#F17676]" : "text-text"
            } ${dimmed ? "opacity-25" : ""}`}
            style={{ left: `${placement.x * 100}%`, top: `${placement.y * 100}%`, fontSize: placement.fontSize }}
          >
            {placement.name}
          </Link>
        );
      })}
      <p
        aria-live="polite"
        className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-title-medium font-bold text-text md:text-title-large"
      >
        {message}
      </p>
    </div>
  );
}
