import "server-only";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { db } from "@/shared/db/client";
import { campaigns } from "@/shared/db/schema";
import type { CampaignListItem } from "../schemas/campaign-admin-result";
import { campaignPhase } from "./campaign-phase";
import { formatCampaignInstant, toCampaignLocalValue } from "./campaign-time-format";

/**
 * CampaignAdminQuery#list (F011 A1): every campaign for Admin › Settings, newest start first
 * (`starts_at DESC, id DESC`, FR-202, no pagination — a handful per event). Calls `requireAdmin()`
 * itself (a layout guard does not protect data). The phase is computed from the server clock at
 * read time (DEC-001 menu); the server re-checks it on every write.
 */
async function list(): Promise<CampaignListItem[]> {
  await requireAdmin();
  const rows = await db
    .select({ id: campaigns.id, name: campaigns.name, startsAt: campaigns.startsAt, endsAt: campaigns.endsAt })
    .from(campaigns)
    .orderBy(desc(campaigns.startsAt), desc(campaigns.id));
  const now = new Date();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    phase: campaignPhase(row, now),
    startsAtLocal: toCampaignLocalValue(row.startsAt),
    endsAtLocal: toCampaignLocalValue(row.endsAt),
    startsAtDisplay: formatCampaignInstant(row.startsAt),
    endsAtDisplay: formatCampaignInstant(row.endsAt),
  }));
}

export const CampaignAdminQuery = { list } as const;
