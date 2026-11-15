import { sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { hashtags } from "@/shared/db/schema";

/**
 * Fixed hashtag list (decision-log: max 5 per Kudo), verbatim from the Write Kudo
 * hashtag dropdown (Figma 1002:13013; "High-perorming" typo corrected). The seed file is
 * the source of truth: re-running `npm run db:seed` restores labels/order/active flags.
 */
const labels = [
  ["high-performing", "#High-performing"],
  ["be-professional", "#BE PROFESSIONAL"],
  ["be-optimistic", "#BE OPTIMISTIC"],
  ["be-a-team", "#BE A TEAM"],
  ["think-outside-the-box", "#THINK OUTSIDE THE BOX"],
  ["get-risky", "#GET RISKY"],
  ["go-fast", "#GO FAST"],
  ["wasshoi", "#WASSHOI"],
] as const;

export const hashtagSeeds = labels.map(([slug, label], index) => ({
  slug,
  labelVi: label,
  labelEn: label,
  sortOrder: index + 1,
  isActive: true,
})) satisfies (typeof hashtags.$inferInsert)[];

/** Upserts every seed hashtag; returns the number of rows written. */
export async function seedHashtags(tx: DbTx): Promise<number> {
  const rows = await tx
    .insert(hashtags)
    .values(hashtagSeeds)
    .onConflictDoUpdate({
      target: hashtags.slug,
      set: {
        labelVi: sql`excluded.label_vi`,
        labelEn: sql`excluded.label_en`,
        sortOrder: sql`excluded.sort_order`,
        isActive: sql`excluded.is_active`,
      },
    })
    .returning({ id: hashtags.id });
  return rows.length;
}
