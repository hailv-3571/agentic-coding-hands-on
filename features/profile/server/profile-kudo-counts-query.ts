import "server-only";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { profileCountFilters } from "../lib/profile-kudos-filter";
import type { ProfileKudoCounts } from "../schemas/profile-views";

/**
 * Kudo counts of F012, always through `KudoPublicQuery.count` — the same predicates as the lists
 * (BR-006), so a number can never drift from what paginating shows, and the C-05 sender guard
 * applies to every sender count.
 */

/** Profile dropdown / label: the own profile gets both lists' totals, another profile "Đã nhận" only. */
async function forProfile(viewerId: string, profileUserId: string): Promise<ProfileKudoCounts> {
  const filters = profileCountFilters({ viewerId, profileUserId });
  const [received, sent] = await Promise.all([
    KudoPublicQuery.count({ viewerId, ...filters.received }),
    filters.sent ? KudoPublicQuery.count({ viewerId, ...filters.sent }) : undefined,
  ]);
  return sent === undefined ? { received } : { received, sent };
}

/**
 * Hover card (decision 2026-11-23): received = public received (as "Đã nhận"); sent = public sent
 * WITHOUT the viewer's spam. For someone else the C-05 guard leaves their anonymous kudos out, so
 * the number never moves when they send one anonymously; on the viewer's own card their public
 * anonymous kudos count, like the phase 10 stats panel.
 */
async function forSunnerCard(viewerId: string, userId: string): Promise<{ received: number; sent: number }> {
  const [received, sent] = await Promise.all([
    KudoPublicQuery.count({ viewerId, recipientId: userId }),
    KudoPublicQuery.count({ viewerId, senderId: userId }),
  ]);
  return { received, sent };
}

export const ProfileKudoCountsQuery = { forProfile, forSunnerCard } as const;
