import "server-only";
import { FEED_PAGE_SIZE, KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import type { Locale } from "@/shared/i18n/locales";
import { profileKudosFilter } from "../lib/profile-kudos-filter";
import type { ProfileKudosDirection, ProfileKudosPage } from "../schemas/profile-views";
import { ProfileKudoCountsQuery } from "./profile-kudo-counts-query";
import { ProfileQuery } from "./profile-query";

/** `PROFILE_KUDOS_PAGE_SIZE` = the Live board page size (phase 05), F012 § 4.6. */
export const PROFILE_KUDOS_PAGE_SIZE = FEED_PAGE_SIZE;

export type ProfileKudosRequest = {
  /** The session user — the only identity the sender filter is ever bound to (BR-002). */
  viewerId: string;
  profileUserId: string;
  direction: ProfileKudosDirection;
  cursor?: string;
  locale: Locale;
};

export type ProfileKudosResult = { status: "ok"; page: ProfileKudosPage } | { status: "forbidden" } | { status: "not_found" };

/**
 * One page of a profile's KUDOS section (A3, DEC-002) + its counts, for the route and the pages'
 * first render. Another Sunner's "Đã gửi" is refused before any read (no existence probe through
 * it); an unknown profile is `not_found`. Masking stays in KudoPublicQuery (BR-003). Throws
 * `InvalidKudoFeedCursorError` for a cursor it did not issue (the route validates first).
 */
export async function listProfileKudos({ viewerId, profileUserId, direction, cursor, locale }: ProfileKudosRequest): Promise<ProfileKudosResult> {
  const filter = profileKudosFilter({ direction, profileUserId, viewerId });
  if (filter === "forbidden") return { status: "forbidden" };
  const [profile, page, counts] = await Promise.all([
    profileUserId === viewerId ? true : ProfileQuery.getById(profileUserId, locale),
    KudoPublicQuery.list({ viewerId, locale, cursor, limit: PROFILE_KUDOS_PAGE_SIZE, ...filter }),
    ProfileKudoCountsQuery.forProfile(viewerId, profileUserId),
  ]);
  if (!profile) return { status: "not_found" };
  return { status: "ok", page: { ...page, counts } };
}
