import "server-only";
import { and, asc, gt, lt, ne } from "drizzle-orm";
import type { Db, DbTx } from "@/shared/db/client";
import { campaigns } from "@/shared/db/schema";
import type { CampaignConflict } from "../schemas/campaign-admin-result";
import { formatCampaignInstant } from "./campaign-time-format";

/**
 * BR-002: two half-open windows overlap when each starts before the other ends; touching ends
 * ([a,b) then [b,c)) do not. `find` is the friendly pre-check (names the colliding campaign);
 * the EXCLUDE constraint `campaigns_no_overlap` is the race-proof last line (SQLSTATE 23P01).
 */
export type CampaignWindow = { startsAt: Date; endsAt: Date };

async function find(executor: Db | DbTx, window: CampaignWindow, excludeId?: number): Promise<CampaignConflict | null> {
  const [row] = await executor
    .select({ name: campaigns.name, startsAt: campaigns.startsAt, endsAt: campaigns.endsAt })
    .from(campaigns)
    .where(
      and(
        lt(campaigns.startsAt, window.endsAt),
        gt(campaigns.endsAt, window.startsAt),
        excludeId === undefined ? undefined : ne(campaigns.id, excludeId),
      ),
    )
    .orderBy(asc(campaigns.startsAt))
    .limit(1);
  if (!row) return null;
  return { name: row.name, startsAt: formatCampaignInstant(row.startsAt), endsAt: formatCampaignInstant(row.endsAt) };
}

/** True for the EXCLUDE violation; drizzle wraps the driver error and keeps it on `cause`. */
function isOverlapViolation(error: unknown): boolean {
  const codeOf = (value: unknown) => (value as { code?: unknown } | null)?.code;
  return codeOf(error) === "23P01" || codeOf((error as { cause?: unknown } | null)?.cause) === "23P01";
}

export const CampaignOverlapCheck = { find, isOverlapViolation } as const;
