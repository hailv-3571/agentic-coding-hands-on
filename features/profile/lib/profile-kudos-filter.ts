import type { ProfileKudosDirection } from "../schemas/profile-views";

/**
 * The KudoPublicQuery filter of a profile list (DEC-002) — the privacy core of F012. "Đã nhận" =
 * the profile's public received kudos. "Đã gửi" exists only on the viewer's own profile: its sender
 * id is ALWAYS the session viewer (BR-002 — a sender filter on someone else would reveal who sent
 * anonymous kudos by set difference), and it adds the viewer's own spam, flagged (BR-002, C-17).
 * Phase 05 serves that public + spam set with ONE `(created_at, id)` keyset, so ALG-001's merge
 * happens in SQL and the cursor can never skip or repeat a row. Pure; no request value reaches it
 * except the direction and the path's user id.
 */
export type ProfileKudosFilter = { recipientId: string } | { senderId: string; includeOwnSpam: true };

type ProfileListInput = { direction: ProfileKudosDirection; profileUserId: string; viewerId: string };

const receivedFilter = (profileUserId: string): ProfileKudosFilter => ({ recipientId: profileUserId });

/** The viewer's own sent list, or "forbidden" for anyone else's (never filtered by their id). */
function sentFilter(profileUserId: string, viewerId: string): ProfileKudosFilter | "forbidden" {
  return profileUserId === viewerId ? { senderId: viewerId, includeOwnSpam: true } : "forbidden";
}

export function profileKudosFilter({ direction, profileUserId, viewerId }: ProfileListInput): ProfileKudosFilter | "forbidden" {
  return direction === "received" ? receivedFilter(profileUserId) : sentFilter(profileUserId, viewerId);
}

/**
 * Filters of the profile's counts (BR-006): exactly the lists' own filters, so each number equals
 * the list it labels. Another Sunner's profile only counts "Đã nhận".
 */
export function profileCountFilters({ profileUserId, viewerId }: Omit<ProfileListInput, "direction">): {
  received: ProfileKudosFilter;
  sent?: ProfileKudosFilter;
} {
  const received = receivedFilter(profileUserId);
  const sent = sentFilter(profileUserId, viewerId);
  return sent === "forbidden" ? { received } : { received, sent };
}
