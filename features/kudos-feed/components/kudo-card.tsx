import Link from "next/link";
import { useTranslations } from "next-intl";
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
 * (F007 FR-303/D006). The pen shows only for `isOwner && !isSpam` while writing is open
 * (`writingOpen` from `isKudoWritingOpen()`: false from EVENT_END_AT, like the launcher; the
 * server still answers WRITING_CLOSED on save). The same `writingOpen` disables the heart (F005).
 */
export function KudoCard({ kudo, variant, writingOpen }: { kudo: KudoCardView; variant: KudoCardVariant; writingOpen: boolean }) {
  const t = useTranslations("kudosFeed.card");
  const post = variant === "post";
  const canEdit = kudoCardCanEdit({ isOwner: kudo.isOwner, isSpam: kudo.isSpam, writingOpen });

  return (
    <article
      data-kudo-id={kudo.id}
      tabIndex={-1}
      className={`flex h-full w-full flex-col gap-4 bg-primary-hover text-on-primary outline-none ${
        post ? "rounded-3xl px-4 pt-6 pb-4 md:px-10 md:pt-10" : "rounded-2xl border-4 border-primary px-4 pt-6 pb-4 md:px-6"
      }`}
    >
      <KudoCardPeople sender={kudo.sender} recipient={kudo.recipient} />
      <div className={cardDivider} />
      <div className="flex flex-1 flex-col gap-4">
        <KudoCardTime createdAt={kudo.createdAt} />
        <KudoCardTitleRow title={kudo.title} action={canEdit ? <KudoOwnerEditButton kudoId={kudo.id} /> : undefined} />
        <div className={`${cardBodyBox} ${post ? "h-40" : "h-30"} overflow-hidden`}>
          <KudoBodyMarkdown body={kudo.body} className={`text-kudos font-bold wrap-anywhere ${post ? "line-clamp-4" : "line-clamp-2"}`} />
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
          <Link href={`${APP_ROUTES.kudos}/${kudo.id}`} className={cardActionButton}>
            {t("viewDetail")}
            <KudoFeedIcon name="arrow-up-right" />
          </Link>
        </div>
      </div>
    </article>
  );
}
