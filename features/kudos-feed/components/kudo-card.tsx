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
import { kudoCardCanEdit } from "./kudo-card-can-edit";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { cardActionButton, cardBodyBox, cardDivider } from "./kudo-feed-styles";
import { KudoOwnerEditButton } from "./kudo-owner-edit-button";

export type KudoCardVariant = "post" | "highlight";

/**
 * Feed post card (Figma 3127:21871, w680, rounded 24, pt40 px40 pb16) and Highlight card
 * (2940:13465, w528, rounded 16, 4 px gold border, pt24 px24 pb16, no images, one hashtag line).
 * Body: fixed height with line clamp (post 160 / highlight 120), Bold 20/32. The width comes from
 * the parent. `isSpam` (the viewer's own spam Kudo) hides hearts, Copy Link and the pen
 * (F007 FR-303/D006) and lays the orange Spam tag and the blurred, non-closable Alert Overlay
 * over the card (phase 08, decision-log 2026-11-22; the text stays in the DOM; the profile and body
 * links and "Xem chi tiết" leave the Tab order, review W1). Only the Profile "Đã gửi" tab (phase 12)
 * renders a spam card: the Live board never lists spam. The pen shows
 * only for `isOwner && !isSpam` while writing is open (`writingOpen` from `isKudoWritingOpen()`:
 * false from EVENT_END_AT, like the launcher; the server still answers WRITING_CLOSED on save).
 * The same `writingOpen` disables the heart (F005).
 */
export function KudoCard({ kudo, variant, writingOpen }: { kudo: KudoCardView; variant: KudoCardVariant; writingOpen: boolean }) {
  const t = useTranslations("kudosFeed.card");
  const post = variant === "post";
  const canEdit = kudoCardCanEdit({ isOwner: kudo.isOwner, isSpam: kudo.isSpam, writingOpen });
  const tabbable = !kudo.isSpam;

  return (
    <article
      data-kudo-id={kudo.id}
      tabIndex={-1}
      className={`relative flex h-full w-full flex-col gap-4 bg-primary-hover text-on-primary outline-none ${
        post ? "rounded-3xl px-4 pt-6 pb-4 md:px-10 md:pt-10" : "rounded-2xl border-4 border-primary px-4 pt-6 pb-4 md:px-6"
      }`}
    >
      {kudo.isSpam && <SpamAlertOverlay />}
      {kudo.isSpam && <KudoSpamTag />}
      <KudoCardPeople sender={kudo.sender} recipient={kudo.recipient} tabbable={tabbable} />
      <div className={cardDivider} />
      <div className="flex flex-1 flex-col gap-4">
        <KudoCardTime createdAt={kudo.createdAt} />
        <KudoCardTitleRow title={kudo.title} action={canEdit ? <KudoOwnerEditButton kudoId={kudo.id} /> : undefined} />
        <div className={`${cardBodyBox} ${post ? "h-40" : "h-30"} overflow-hidden`}>
          <KudoBodyMarkdown body={kudo.body} className={`text-kudos font-bold wrap-anywhere ${post ? "line-clamp-4" : "line-clamp-2"}`} tabbable={tabbable} />
        </div>
        {post && <KudoCardImages images={kudo.images} />}
        <KudoCardHashtags hashtags={kudo.hashtags} lines={post ? 2 : 1} />
      </div>
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
            variant="card"
          />
        )}
        <div className="ml-auto flex items-center">
          {!kudo.isSpam && <KudoCopyLinkButton kudoId={kudo.id} />}
          <Link href={`${APP_ROUTES.kudos}/${kudo.id}`} tabIndex={tabbable ? undefined : -1} className={cardActionButton}>
            {t("viewDetail")}
            <KudoFeedIcon name="arrow-up-right" />
          </Link>
        </div>
      </div>
    </article>
  );
}
