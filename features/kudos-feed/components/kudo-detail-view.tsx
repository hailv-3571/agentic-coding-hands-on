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
import { cardActionButton, cardBodyBox, cardDivider } from "./kudo-feed-styles";

/**
 * View Kudo panel (Figma 520:18779): w680, rounded 24, cream, pt40 px40 pb24, gap 16. Full body
 * (Bold 24/32, no clamp), every image (each opens the full file in a new tab), every hashtag,
 * hearts (gap 8), Copy Link and "Đóng" back to the Live board. The author's own spam Kudo is a
 * read-only view: spam tag and the edit-locked note instead of hearts and Copy Link (C-17, D006).
 */
export function KudoDetailView({ kudo }: { kudo: KudoCardView }) {
  const t = useTranslations("kudosFeed");
  return (
    <article
      data-kudo-id={kudo.id}
      className="flex w-full max-w-170 flex-col gap-4 rounded-3xl bg-primary-hover px-4 pt-6 pb-6 text-on-primary md:px-10 md:pt-10"
    >
      <div className={cardDivider} />
      <KudoCardPeople sender={kudo.sender} recipient={kudo.recipient} />
      <KudoCardTime createdAt={kudo.createdAt} />
      <KudoCardTitleRow title={kudo.title} heading="h2" />
      <div className={cardBodyBox}>
        <KudoBodyMarkdown body={kudo.body} className="text-headline-small font-bold wrap-anywhere" />
      </div>
      <KudoCardImages images={kudo.images} openable />
      <KudoCardHashtags hashtags={kudo.hashtags} lines="all" />
      {kudo.isSpam && (
        <div className="flex flex-col items-start gap-2">
          <span className="rounded bg-error px-3 py-1 text-title-small font-bold text-text">{t("card.spamTag")}</span>
          <p className="text-title-medium font-bold text-error">{t("card.spamLocked")}</p>
        </div>
      )}
      <div className={cardDivider} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {kudo.isSpam ? (
          <span />
        ) : (
          <KudoCardHeartSlot kudoId={kudo.id} heartCount={kudo.heartCount} heartedByMe={kudo.heartedByMe} variant="detail" />
        )}
        <div className="ml-auto flex items-center">
          {!kudo.isSpam && <KudoCopyLinkButton kudoId={kudo.id} />}
          <Link href={APP_ROUTES.kudos} className={cardActionButton}>
            {t("detail.close")}
          </Link>
        </div>
      </div>
    </article>
  );
}
