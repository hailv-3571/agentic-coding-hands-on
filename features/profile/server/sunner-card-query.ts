import "server-only";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { isKudoWritingOpen } from "@/features/kudos-authoring/server/kudo-write-window";
import type { Locale } from "@/shared/i18n/locales";
import type { SunnerCardView } from "../schemas/profile-views";
import { ProfileKudoCountsQuery } from "./profile-kudo-counts-query";
import { ProfileQuery } from "./profile-query";

/**
 * Data of the avatar hover card (A5, Figma 2268:35101): name, localized department name, Hero tier
 * (none → null, BR-005), the two counts of decision 2026-11-23 and whether "Gửi KUDO" shows. Built
 * field by field: no email, role, avatar, Kudo or sender data (BR-007) — the card is about one
 * person and never about a Kudo, so an anonymous sender cannot be inferred from it. Null for a
 * malformed or unknown id.
 */
export async function getSunnerCard(viewerId: string, userId: string, locale: Locale): Promise<SunnerCardView | null> {
  const profile = await ProfileQuery.getById(userId, locale);
  if (!profile) return null;
  const [tiers, counts, writingOpen] = await Promise.all([
    HeroTierQuery.getTiersByRecipientIds([userId]),
    ProfileKudoCountsQuery.forSunnerCard(viewerId, userId),
    isKudoWritingOpen(),
  ]);
  return {
    id: profile.id,
    fullName: profile.fullName,
    departmentName: profile.department?.name ?? null,
    heroTier: tiers[userId] ?? null,
    kudosReceived: counts.received,
    kudosSent: counts.sent,
    canSendKudo: writingOpen && userId !== viewerId,
  };
}
