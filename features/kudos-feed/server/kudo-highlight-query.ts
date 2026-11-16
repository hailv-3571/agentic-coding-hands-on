import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { kudos } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { buildKudoCardViews } from "./build-kudo-card-views";
import { rankKudoIdsForHighlight } from "./enrich-heart-summary";
import { publicKudoIdsSubquery, type KudoContentFilters } from "./kudo-public-filters";
import { selectKudoPublicRows } from "./kudo-public-select";

/**
 * Highlight carousel (BR-002, BR-004, D001): filters → public candidates (`publicKudoIdsSubquery`,
 * hashtag AND recipient department) → ranking through the heart seam (phase 05: newest first;
 * phase 06: most hearts, then newest) → the top HIGHLIGHT_COUNT as masked cards, in rank order.
 * `total` is the number of cards returned (the carousel's "n/N"), never more than 5.
 */
export const HIGHLIGHT_COUNT = 5;

export type HighlightOptions = KudoContentFilters & { viewerId: string; locale: Locale };
export type HighlightResult = { items: KudoCardView[]; total: number };

export async function listHighlightKudos({ viewerId, locale, ...filters }: HighlightOptions): Promise<HighlightResult> {
  const rankedIds = (await rankKudoIdsForHighlight(publicKudoIdsSubquery(filters), HIGHLIGHT_COUNT)).slice(0, HIGHLIGHT_COUNT);
  if (rankedIds.length === 0) return { items: [], total: 0 };
  // Re-checks `public`: a Kudo marked spam between the two statements simply drops out.
  const rows = await selectKudoPublicRows(and(eq(kudos.status, "public"), inArray(kudos.id, rankedIds)));
  const views = new Map((await buildKudoCardViews(rows, viewerId, locale)).map((view) => [view.id, view]));
  const items = rankedIds.flatMap((id) => views.get(id) ?? []);
  return { items, total: items.length };
}
