/**
 * `ActiveCampaignReader` — declared by F005, implemented by F011
 * (`features/admin-campaigns/server/campaign-active-reader.ts`). Types only.
 * `findActive(at)` returns the campaign whose half-open window [startsAt, endsAt) contains `at`,
 * or null. It may throw on a DB error; `HeartMultiplierResolver` catches and falls back to 1.
 * Phase 10 reads `name`, `startsAt` and `endsAt` for the x2 tooltip (F011 FR-403).
 */
export type ActiveCampaign = { id: number; name: string; startsAt: Date; endsAt: Date };

export interface ActiveCampaignReader {
  findActive(at: Date): Promise<ActiveCampaign | null>;
}
