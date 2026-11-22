import Link from "next/link";
import { useTranslations } from "next-intl";
import { KudoSpamTag } from "@/features/admin-moderation/components/kudo-spam-tag";
import { SpamAlertOverlay } from "@/features/admin-moderation/components/spam-alert-overlay";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { KudoBodyMarkdown } from "./kudo-body-markdown";
import { KudoCardHeartSlot } from "./kudo-card-heart-slot";
import { KudoCardImages } from "./kudo-card-images";
import { KudoCardHashtags, KudoCardTime, KudoCardTitleRow } from "./kudo-card-parts";
import { KudoCardPeople } from "./kudo-card-sender";
import { KudoCopyLinkButton } from "./kudo-copy-link-button";
import { cardActionButton, cardBodyBox, cardDivider } from "./kudo-feed-styles";

/**
 * View Kudo panel (Figma 520:18779): w680, rounded 24, cream, pt40 px40 pb24, gap 16. Full body
 * (Bold 24/32, no clamp), every image (each opens the full file in a new tab), every hashtag,
 * hearts (gap 8), Copy Link and "Đóng" back to the Live board. The author's own spam Kudo (C-17,
 * D006) has no hearts or Copy Link and carries the orange Spam tag and the blurred, non-closable
 * Alert Overlay (phase 08, decision-log 2026-11-22); only "Đóng" stays above it, so the page never
 * traps the reader. The text stays in the DOM for screen readers, and nothing under the overlay
 * takes keyboard focus (review W1): the profile and body links leave the Tab order and the images
 * are not links. Not `inert`, which would hide the text from assistive technology too.
 * `writingOpen` (`isKudoWritingOpen()`) disables the heart from EVENT_END_AT (F005).
 */
export function KudoDetailView({ kudo, writingOpen }: { kudo: KudoCardView; writingOpen: boolean }) {
  const t = useTranslations("kudosFeed");
  const tabbable = !kudo.isSpam;
  return (
    <article
      data-kudo-id={kudo.id}
      className="relative flex w-full max-w-170 flex-col gap-4 rounded-3xl bg-primary-hover px-4 pt-6 pb-6 text-on-primary md:px-10 md:pt-10"
    >
      {kudo.isSpam && <SpamAlertOverlay />}
      {kudo.isSpam && <KudoSpamTag />}
      <div className={cardDivider} />
      <KudoCardPeople sender={kudo.sender} recipient={kudo.recipient} tabbable={tabbable} />
      <KudoCardTime createdAt={kudo.createdAt} />
      <KudoCardTitleRow title={kudo.title} heading="h2" />
      <div className={cardBodyBox}>
        <KudoBodyMarkdown body={kudo.body} className="text-headline-small font-bold wrap-anywhere" tabbable={tabbable} />
      </div>
      <KudoCardImages images={kudo.images} openable={tabbable} />
      <KudoCardHashtags hashtags={kudo.hashtags} lines="all" />
      <div className={cardDivider} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {kudo.isSpam ? (
          <span />
        ) : (
          <KudoCardHeartSlot
            kudoId={kudo.id}
            heartCount={kudo.heartCount}
            heartedByMe={kudo.heartedByMe}
            isOwner={kudo.isOwner}
            writingOpen={writingOpen}
            variant="detail"
          />
        )}
        <div className="ml-auto flex items-center">
          {!kudo.isSpam && <KudoCopyLinkButton kudoId={kudo.id} />}
          <Link href={APP_ROUTES.kudos} className={`${cardActionButton} ${kudo.isSpam ? "relative z-20 bg-primary-hover" : ""}`}>
            {t("detail.close")}
          </Link>
        </div>
      </div>
    </article>
  );
}
