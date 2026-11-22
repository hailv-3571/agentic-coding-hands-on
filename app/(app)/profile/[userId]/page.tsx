import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileKudosSection } from "@/features/profile/components/profile-kudos-section";
import { ProfilePageFrame } from "@/features/profile/components/profile-page-frame";
import { ProfileSendKudoButton } from "@/features/profile/components/profile-send-kudo-button";
import { loadProfilePageData, profileKudosKey } from "@/features/profile/server/profile-page-data";
import { requireSunner } from "@/shared/auth/current-user";
import { APP_ROUTES } from "@/shared/ui/app-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("metaTitle") };
}

/**
 * Blocking route, like `/kudos/[id]`. `redirect()`/`notFound()` run outside any try/catch; once the
 * shell has streamed in production the redirect is client-side and the 404 soft (decision-log
 * 2026-11-16) — the content is identical either way.
 */
export const instant = false;

/**
 * Another Sunner's profile `/profile/{userId}` (F012 A2, Figma 362:5097). DEC-001: your own id →
 * `/profile` (one "own" page); malformed or unknown id → not-found. Info block with that person's
 * icons, the send pill (composer prefilled + locked, D008), and KUDOS with "Đã nhận: n Kudos" only
 * (FR-305). No stats panel (BR-004) and never their "Đã gửi" (FR-603).
 */
export default async function OtherProfilePage({ params }: PageProps<"/profile/[userId]">) {
  const { userId: viewerId } = await requireSunner();
  const { userId } = await params;
  if (userId === viewerId) redirect(APP_ROUTES.profile);
  const [data, t] = await Promise.all([loadProfilePageData(viewerId, userId), getTranslations("profile")]);
  if (!data) notFound();

  return (
    <ProfilePageFrame>
      <ProfileHeader profile={data.profile} tier={data.tier} icons={data.icons} iconCaption={t("iconCollectionOther")} />
      <ProfileSendKudoButton recipient={{ id: data.profile.id, fullName: data.profile.fullName }} writingOpen={data.writingOpen} />
      <ProfileKudosSection key={profileKudosKey(data.kudos)} profileUserId={userId} own={false} initial={data.kudos} writingOpen={data.writingOpen} />
    </ProfilePageFrame>
  );
}
