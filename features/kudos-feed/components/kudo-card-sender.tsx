import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/features/app-shell/components/user-avatar";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { KudoAnonymousSenderView, KudoPersonView, KudoSenderView } from "../schemas/kudo-card-view";
import { KudoCardHeroBadgeSlot } from "./kudo-card-hero-badge-slot";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { focusRing } from "./kudo-feed-styles";

/** One side of the info row: flex-col, centred, gap 13; text block up to 235 wide, gap 2. */
const column = "flex min-w-0 flex-1 basis-0 flex-col items-center gap-[13px]";
const textBlock = "flex w-full max-w-[235px] flex-col items-center gap-0.5 text-center";
/** 64 px circular avatar with a white ring; a missing photo falls back to the initial. */
const avatarFrame = "flex size-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-text-muted/30 text-on-primary";

function NamedPerson({ person }: { person: KudoPersonView }) {
  const href = `${APP_ROUTES.profile}/${person.id}`;
  return (
    <div className={column}>
      {/* The avatar repeats the name link for pointer users only (one tab stop per person). */}
      <Link href={href} tabIndex={-1} aria-hidden className={avatarFrame}>
        <UserAvatar name={person.name} avatarUrl={person.avatarUrl} />
      </Link>
      <div className={textBlock}>
        <Link href={href} className={`max-w-full rounded text-title-medium font-bold wrap-anywhere text-on-primary hover:underline ${focusRing}`}>
          {person.name}
        </Link>
        {person.department && (
          <p className="flex items-center justify-center gap-2.5 text-title-small font-bold text-text-muted">
            {person.department.code}
            <KudoCardHeroBadgeSlot tier={person.tier} />
          </p>
        )}
      </div>
    </div>
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

/** Info row of a card / the detail panel: sender | send arrow (py16, 32 px) | recipient. */
export function KudoCardPeople({ sender, recipient }: { sender: KudoSenderView; recipient: KudoPersonView }) {
  const t = useTranslations("kudosFeed.card");
  return (
    <div className="flex items-start justify-between">
      {sender.anonymous ? <AnonymousSender sender={sender} /> : <NamedPerson person={sender} />}
      <span className="flex py-4">
        <KudoFeedIcon name="send" />
        <span className="sr-only">{t("sentTo")}</span>
      </span>
      <NamedPerson person={recipient} />
    </div>
  );
}
