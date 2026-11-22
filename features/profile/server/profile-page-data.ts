import "server-only";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import type { HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { isKudoWritingOpen } from "@/features/kudos-authoring/server/kudo-write-window";
import type { IconCollectionSlot } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { IconCollectionQuery } from "@/features/secret-box-rewards/server/icon-collection-query";
import { defaultLocale, isLocale } from "@/shared/i18n/locales";
import type { ProfileKudosPage, ProfileView } from "../schemas/profile-views";
import { listProfileKudos } from "./profile-kudos-list-service";
import { ProfileQuery } from "./profile-query";

export type ProfilePageData = {
  profile: ProfileView;
  tier: HeroTier | null;
  icons: IconCollectionSlot[] | null;
  kudos: ProfileKudosPage | null;
  writingOpen: boolean;
};

/** A failed region read becomes that region's fallback (no badge, no icon row, list error), not a failed page. */
async function settle<T>(read: Promise<T>, region: string): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    console.error(`[profile] loading the ${region} failed`, error);
    return null;
  }
}

/**
 * Everything a profile page renders, read in parallel (non-functional requirement): profile,
 * Hero tier, icon collection, the first KUDOS page (own → "Đã gửi", other → "Đã nhận") with its
 * counts, and the writing window. Null for a malformed or unknown user id (→ `notFound()`); a failed
 * profile read throws (the page cannot render without it). `viewerId` is always the session user.
 */
export async function loadProfilePageData(viewerId: string, profileUserId: string): Promise<ProfilePageData | null> {
  if (!z.uuid().safeParse(profileUserId).success) return null;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : defaultLocale;
  const direction = profileUserId === viewerId ? "sent" : "received";
  const [profile, tiers, icons, kudos, writingOpen] = await Promise.all([
    ProfileQuery.getById(profileUserId, locale),
    settle(HeroTierQuery.getTiersByRecipientIds([profileUserId]), "hero tier"),
    settle(IconCollectionQuery.forUser(profileUserId), "icon collection"),
    settle(listProfileKudos({ viewerId, profileUserId, direction, locale }), "profile kudos"),
    isKudoWritingOpen(),
  ]);
  if (!profile) return null;
  return {
    profile,
    tier: tiers?.[profileUserId] ?? null,
    icons,
    kudos: kudos?.status === "ok" ? kudos.page : null,
    writingOpen,
  };
}

/** Remounts the KUDOS section when a refresh brings a different first page (e.g. after sending a Kudo). */
export function profileKudosKey(kudos: ProfileKudosPage | null): string {
  if (!kudos) return "failed";
  return `${kudos.counts.received}:${kudos.counts.sent ?? "-"}:${kudos.items[0]?.id ?? "empty"}`;
}
