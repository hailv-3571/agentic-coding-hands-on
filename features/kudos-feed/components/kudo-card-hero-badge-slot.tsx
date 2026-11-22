import { HeroBadgeTooltip } from "@/features/hero-badges/components/hero-badge-tooltip";
import type { KudoHeroTier } from "../schemas/kudo-card-view";

/**
 * SEAM — created by phase 05, owned by phase 09 (F009). The 109×19 Hero badge with its tooltip,
 * after the department code and a 4 px dot (#999 at 40 %, Figma 3127:21871, gap 10 from the row).
 * No tier → neither dot nor badge. The dot only separates the badge from a department code
 * (`afterDepartment`) on one line: below 12rem of the card's name block (`@container` in
 * kudo-card-sender.tsx — a phone) the row wraps and the badge sits alone under the code, dotless.
 * An anonymous sender never reaches here with a tier (FR-603: `enrich-hero-tier.ts` gives it none).
 */
export function KudoCardHeroBadgeSlot({
  tier,
  afterDepartment,
  tabbable = true,
}: {
  tier: KudoHeroTier | null;
  afterDepartment: boolean;
  tabbable?: boolean;
}) {
  if (!tier) return null;
  return (
    <span className="flex items-center gap-2.5">
      {afterDepartment && <span aria-hidden className="size-1 shrink-0 rounded-full bg-text-muted/40 @max-[12rem]:hidden" />}
      <HeroBadgeTooltip tier={tier} tabbable={tabbable} />
    </span>
  );
}
