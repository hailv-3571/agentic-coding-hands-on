"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { KudoCard } from "@/features/kudos-feed/components/kudo-card";
import { KudoFeedStatusMessage } from "@/features/kudos-feed/components/kudo-feed-status-message";
import { filterButton, statusText } from "@/features/kudos-feed/components/kudo-feed-styles";
import { LiveBoardSectionHeader } from "@/features/kudos-feed/components/live-board-section-header";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { ProfileKudosPage } from "../schemas/profile-views";
import { ProfileKudosDirectionDropdown } from "./profile-kudos-direction-dropdown";
import { useProfileKudosList } from "./use-profile-kudos-list";

type ProfileKudosSectionProps = {
  profileUserId: string;
  /** The viewer's own profile: "Đã gửi"/"Đã nhận" filter, "Đã gửi" first (FR-204). */
  own: boolean;
  initial: ProfileKudosPage | null;
  writingOpen: boolean;
};

/**
 * KUDOS section of both profile pages (CAP-03): the Live board section header ("Sun* Annual Awards
 * 2025", divider, gold "KUDOS") with the direction filter on the own profile or "Đã nhận: n Kudos"
 * on someone else's (FR-305: received only), then phase 05 `KudoCard`s 680 wide, gap 24. The
 * owner's spam renders through `KudoCard` itself (blurred overlay + orange "Spam" tag, nothing under
 * it tabbable). "Tải thêm" appends the next page, moves focus to its first card and announces the
 * count; empty → "Chưa có Kudo nào." without the button; a failed read → inline error with retry.
 */
export function ProfileKudosSection({ profileUserId, own, initial, writingOpen }: ProfileKudosSectionProps) {
  const t = useTranslations("profile.kudos");
  const feed = useTranslations("kudosFeed.allKudos");
  const headingId = useId();
  const list = useProfileKudosList({ profileUserId, initialDirection: own ? "sent" : "received", initial });
  const listRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const returnTo = own ? APP_ROUTES.profile : `${APP_ROUTES.profile}/${profileUserId}`;
  const counts = list.counts;

  useEffect(() => {
    if (focusId) listRef.current?.querySelector<HTMLElement>(`[data-kudo-id="${focusId}"]`)?.focus();
  }, [focusId]);

  async function loadMore() {
    setAnnouncement("");
    const page = await list.loadMore();
    if (!page) return;
    setAnnouncement(feed("loaded", { count: page.items.length }));
    if (page.items[0]) setFocusId(page.items[0].id);
  }

  return (
    <section aria-labelledby={headingId} className="flex w-full flex-col gap-10">
      <LiveBoardSectionHeader title={t("title")} headingId={headingId}>
        {counts && own && counts.sent !== undefined && (
          <ProfileKudosDirectionDropdown direction={list.direction} counts={{ sent: counts.sent, received: counts.received }} onChange={list.selectDirection} />
        )}
        {counts && !own && <p className="text-headline-small font-bold text-text">{t("receivedTotal", { count: counts.received })}</p>}
      </LiveBoardSectionHeader>
      <div ref={listRef} className="flex flex-col gap-6">
        {list.items.map((kudo) => (
          <KudoCard key={kudo.id} kudo={kudo} variant="post" writingOpen={writingOpen} />
        ))}
        {list.failure && !list.pending && <KudoFeedStatusMessage state={list.failure} onRetry={list.retry} returnTo={returnTo} />}
        {list.pending && !list.loaded && <KudoFeedStatusMessage state="loading" />}
        {!list.failure && list.loaded && list.items.length === 0 && <p className={`${statusText} py-6 text-center`}>{t("empty")}</p>}
        {list.cursor && list.loaded && (!list.failure || list.pending) && (
          <button
            type="button"
            onClick={loadMore}
            aria-disabled={list.pending}
            aria-busy={list.pending}
            className={`${filterButton} self-center px-10 aria-disabled:cursor-wait aria-disabled:opacity-70`}
          >
            {list.pending && <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-text border-t-transparent" />}
            {feed("loadMore")}
          </button>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </section>
  );
}
