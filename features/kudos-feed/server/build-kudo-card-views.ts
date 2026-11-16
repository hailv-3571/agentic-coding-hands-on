import "server-only";
import type { Locale } from "@/shared/i18n/locales";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { loadKudoCardRelations } from "./kudo-card-relations";
import { enrichKudoCards } from "./kudo-card-enrichment";
import type { KudoPublicRow } from "./kudo-public-select";
import { maskKudoRow } from "./kudo-row-mask";

const NO_RELATIONS = { hashtags: [], images: [] };

/**
 * Raw rows → card views, in row order: batch relations (hashtags, signed images) → `maskKudoRow`
 * (the FR-602 boundary) → seams. The only way KudoPublicQuery and the Highlight turn rows into
 * something that may leave the server.
 */
export async function buildKudoCardViews(rows: KudoPublicRow[], viewerId: string, locale: Locale): Promise<KudoCardView[]> {
  if (rows.length === 0) return [];
  const relations = await loadKudoCardRelations(
    rows.map((row) => row.id),
    locale,
  );
  const cards = rows.map((row) => maskKudoRow(row, viewerId, relations.get(row.id) ?? NO_RELATIONS));
  return enrichKudoCards(cards, viewerId);
}
