import "server-only";
import { campaignActiveReader } from "@/features/admin-campaigns/server/campaign-active-reader";
import { env } from "@/shared/config/env";

/**
 * HeartMultiplierResolver (F005 A5, ALG-001, DEC-002, BR-005): HEART_CAMPAIGN_MULTIPLIER (2)
 * while a campaign is active at `at`, else 1. Never throws and never returns < 1, so hearting
 * never depends on F011: a reader failure is logged and counts as "no campaign".
 * F011's CampaignActiveReader is the only reader (no null default, YAGNI).
 */
export const DEFAULT_HEART_MULTIPLIER = 1;

async function resolve(at: Date): Promise<number> {
  try {
    const campaign = await campaignActiveReader.findActive(at);
    return campaign ? env.HEART_CAMPAIGN_MULTIPLIER : DEFAULT_HEART_MULTIPLIER;
  } catch (error) {
    console.warn("[hearts] active campaign lookup failed; using multiplier 1", error);
    return DEFAULT_HEART_MULTIPLIER;
  }
}

export const HeartMultiplierResolver = { resolve } as const;
