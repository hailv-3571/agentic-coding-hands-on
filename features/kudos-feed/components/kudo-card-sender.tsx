import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AvatarHoverCard, HOVER_CARD_NAME_ATTRIBUTE } from "@/features/profile/components/avatar-hover-card";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { KudoAnonymousSenderView, KudoPersonView, KudoSenderView } from "../schemas/kudo-card-view";
import { KudoCardHeroBadgeSlot } from "./kudo-card-hero-badge-slot";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { focusRing } from "./kudo-feed-styles";

/**
 * One side of the info row: flex-col, centred, gap 13; text block up to 235 wide, gap 2. The text
 * block is a size container: the Hero badge slot drops its dot when the block is too narrow for
 * "code · badge" on one line (phones), so the badge wraps alone under the code.
 */
const column = "flex min-w-0 flex-1 basis-0 flex-col items-center gap-[13px]";
const textBlock = "@container flex w-full max-w-[235px] flex-col items-center gap-0.5 text-center";
/** 64 px circular avatar with a white ring; a missing photo falls back to the initial. */
const avatarFrame = "flex size-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-text-muted/30 text-on-primary";

/**
 * A named person (recipient, or a non-anonymous sender). The avatar repeats the name link for
 * pointer users only (one tab stop per person) and carries the phase 12 hover card: mouse on the
 * avatar or keyboard focus on the name. Under the owner's spam overlay (`tabbable={false}`) the card
 * is off. Anonymous senders never get here (AnonymousSender has no link and no card, DEC-003).
 */
function NamedPerson({ person, tabbable }: { person: KudoPersonView; tabbable: boolean }) {
  const href = `${APP_ROUTES.profile}/${person.id}`;
  return (
    <AvatarHoverCard person={person} className={column} avatarClassName={avatarFrame} enabled={tabbable}>
      <div className={textBlock}>
        <Link
          href={href}
          {...{ [HOVER_CARD_NAME_ATTRIBUTE]: "" }}
          tabIndex={tabbable ? undefined : -1}
          className={`max-w-full rounded text-title-medium font-bold wrap-anywhere text-on-primary hover:underline ${focusRing}`}
        >
          {person.name}
        </Link>
        {(person.department || person.tier) && (
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-title-small font-bold text-text-muted">
            {person.department?.code}
            <KudoCardHeroBadgeSlot tier={person.tier} afterDepartment={Boolean(person.department)} tabbable={tabbable} />
          </p>
        )}
      </div>
    </AvatarHoverCard>
  );
}

/** Anonymous sender (Figma 2099:9148): incognito avatar, nickname Bold 22/28, no profile link. */
function AnonymousSender({ sender }: { sender: KudoAnonymousSenderView }) {
  const t = useTranslations("kudosFeed.card");
  return (
    <div className={column}>
      <span className={avatarFrame}>
        <Image src="/images/kudos-feed/avatar-anonymous.png" width={64} height={64} alt="" className="size-full" />
      </span>
      <div className={textBlock}>
        <p className="max-w-full text-title-large font-bold wrap-anywhere text-on-primary">{sender.nickname}</p>
        <p className="text-title-small font-bold text-text-muted">{t("anonymousSubtitle")}</p>
      </div>
    </div>
  );
}

/**
 * Info row of a card / the detail panel: sender | send arrow (py16, 32 px) | recipient.
 * `tabbable={false}` (the owner's spam Kudo under its overlay, phase 08 review W1) takes the profile
 * links out of the Tab order; the names stay links for screen readers.
 */
export function KudoCardPeople({ sender, recipient, tabbable = true }: { sender: KudoSenderView; recipient: KudoPersonView; tabbable?: boolean }) {
  const t = useTranslations("kudosFeed.card");
  return (
    <div className="flex items-start justify-between">
      {sender.anonymous ? <AnonymousSender sender={sender} /> : <NamedPerson person={sender} tabbable={tabbable} />}
      <span className="flex py-4">
        <KudoFeedIcon name="send" />
        <span className="sr-only">{t("sentTo")}</span>
      </span>
      <NamedPerson person={recipient} tabbable={tabbable} />
    </div>
  );
}
