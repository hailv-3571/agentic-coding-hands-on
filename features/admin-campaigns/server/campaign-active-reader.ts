import "server-only";
import { desc, gt, lte, and } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { campaigns } from "@/shared/db/schema";
import type { ActiveCampaign, ActiveCampaignReader } from "@/features/kudos-hearts/server/active-campaign-reader";

/**
 * CampaignActiveReader (F011 A5, ALG-001): the campaign whose window [starts_at, ends_at) holds
 * `at`. The EXCLUDE constraint allows at most one; rows inserted around it (manual SQL) are
 * tolerated — the latest start wins and a warning is logged. No admin guard: in-process only,
 * called by HeartMultiplierResolver (F005) and the x2 tooltip (F010). DB errors propagate.
 * Plain column comparisons on a table of a handful of rows: a sequential scan. The 0012 GiST index
 * covers the `tstzrange(…)` expression only, so it does not serve this filter (its comment overstates).
 */
async function findActive(at: Date): Promise<ActiveCampaign | null> {
  const rows = await db
    .select({ id: campaigns.id, name: campaigns.name, startsAt: campaigns.startsAt, endsAt: campaigns.endsAt })
    .from(campaigns)
    .where(and(lte(campaigns.startsAt, at), gt(campaigns.endsAt, at)))
    .orderBy(desc(campaigns.startsAt))
    .limit(2);
  if (rows.length > 1) console.warn("[campaigns] overlapping active campaigns", rows.map((row) => row.id));
  return rows[0] ?? null;
}

export const campaignActiveReader: ActiveCampaignReader = { findActive };
