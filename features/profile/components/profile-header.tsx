import { UserAvatar } from "@/features/app-shell/components/user-avatar";
import type { HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import { KudoCardHeroBadgeSlot } from "@/features/kudos-feed/components/kudo-card-hero-badge-slot";
import { IconCollection } from "@/features/secret-box-rewards/components/icon-collection";
import type { IconCollectionSlot } from "@/features/secret-box-rewards/schemas/secret-box-views";
import type { ProfileView } from "../schemas/profile-views";

type ProfileHeaderProps = {
  profile: ProfileView;
  tier: HeroTier | null;
  /** Null when the collection could not be read: the row is left out rather than shown empty. */
  icons: IconCollectionSlot[] | null;
  /** "Bộ sưu tập icon của tôi" (own) / "Bộ sưu tập icon" (other); also the list's accessible name. */
  iconCaption: string;
};

/**
 * Info block of both profile pages (Figma 362:5052, centred, gap 32): 200 px avatar with the white
 * ring (initial fallback), the name (h1, Bold 36/44 gold), "department code · Hero badge" (Bold 22/28
 * white; the phase 09 badge with its tooltip and the dot only when both show — BR-005: no tier, no
 * badge), then the phase 10 icon collection (6 circles) and its caption. Read-only (D001).
 * Server/client neutral.
 */
export function ProfileHeader({ profile, tier, icons, iconCaption }: ProfileHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-8 text-center">
      <span className="flex size-50 shrink-0 overflow-hidden rounded-full border-2 border-white bg-text-muted/30 text-on-primary [&>span]:text-display-large">
        <UserAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} />
      </span>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-headline-large font-bold wrap-anywhere text-primary md:text-display-small md:font-bold">{profile.fullName}</h1>
        {(profile.department || tier) && (
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-title-large font-bold text-text">
            {profile.department?.code}
            <KudoCardHeroBadgeSlot tier={tier} afterDepartment={Boolean(profile.department)} />
          </p>
        )}
      </div>
      {icons && (
        <div className="flex flex-col items-center gap-4 *:justify-center">
          <IconCollection slots={icons} label={iconCaption} />
          {/* The list already carries the caption as its name: no second announcement. */}
          <p aria-hidden className="text-title-large font-bold text-text">
            {iconCaption}
          </p>
        </div>
      )}
    </header>
  );
}
