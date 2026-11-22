import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileKudosSection } from "@/features/profile/components/profile-kudos-section";
import { ProfilePageFrame } from "@/features/profile/components/profile-page-frame";
import { ProfileStatsPanelSlot } from "@/features/profile/components/profile-stats-panel-slot";
import { loadProfilePageData, profileKudosKey } from "@/features/profile/server/profile-page-data";
import { requireSunner } from "@/shared/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("metaTitle") };
}

/** Blocking route (session + per-user reads), like `/kudos/[id]`; the stats panel streams in its own boundary. */
export const instant = false;

/**
 * Own profile `/profile` (F012 A1, Figma 362:5037): info block with "Bộ sưu tập icon của tôi", the
 * phase 10 stats panel (own only, BR-004), then KUDOS with "Đã gửi" first (own spam included, D006).
 * The user is always the session's (FR-603); read-only (D001).
 */
export default async function OwnProfilePage() {
  const { userId } = await requireSunner();
  const [data, t] = await Promise.all([loadProfilePageData(userId, userId), getTranslations("profile")]);
  // F001 creates a profile at first login and requireSunner() checked it: a miss is an internal error.
  if (!data) throw new Error("[profile] the session user has no profile");

  return (
    <ProfilePageFrame>
      <ProfileHeader profile={data.profile} tier={data.tier} icons={data.icons} iconCaption={t("iconCollectionOwn")} />
      <ProfileStatsPanelSlot />
      <ProfileKudosSection key={profileKudosKey(data.kudos)} profileUserId={userId} own initial={data.kudos} writingOpen={data.writingOpen} />
    </ProfilePageFrame>
  );
}
