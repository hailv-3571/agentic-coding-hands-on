"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { KudoCardView } from "../schemas/kudo-card-view";
import { KudoCard } from "./kudo-card";
import { filterButton } from "./kudo-feed-styles";
import { failureOf, KudoFeedStatusMessage, type KudoLoadFailure } from "./kudo-feed-status-message";

type KudoFeedPage = { items: KudoCardView[]; nextCursor?: string };

/** Keeps the first card of each id (React keys must stay unique across pages). */
function uniqueById(items: KudoCardView[]): KudoCardView[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * All Kudos column (E11/E23, D003). The first page comes from the RSC (`KudoPublicQuery.list`,
 * null if it failed); "Tải thêm" appends older pages from GET /api/kudos?cursor (10 per page,
 * newest first) and disappears when there is no `nextCursor`. Loading: the button stays focusable
 * but `aria-disabled` and busy, with a spinner. After every append focus moves to the first new
 * card and a polite status line announces the count. Failure: inline retry; a rejected cursor
 * (400) restarts after the first page. Pages append through a functional update and are
 * de-duplicated at render, so a refresh during a fetch never drops cards; unmounting aborts the
 * fetch. The page keys this component by its first page, so a refresh that changes that page
 * starts over, while a refresh after an edit just re-renders the first page's cards.
 */
export function AllKudosFeed({ initialPage, writingOpen }: { initialPage: KudoFeedPage | null; writingOpen: boolean }) {
  const t = useTranslations("kudosFeed.allKudos");
  const [clientFirstPage, setClientFirstPage] = useState<KudoCardView[] | null>(null);
  const [older, setOlder] = useState<KudoCardView[]>([]);
  const [cursor, setCursor] = useState(initialPage?.nextCursor);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<KudoLoadFailure | null>(initialPage ? null : "error");
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const firstPage = initialPage?.items ?? clientFirstPage;
  const shown = uniqueById([...(firstPage ?? []), ...older]);

  useEffect(() => () => inFlight.current?.abort(), []);

  useEffect(() => {
    if (focusRequest) listRef.current?.querySelector<HTMLElement>(`[data-kudo-id="${focusRequest.id}"]`)?.focus();
  }, [focusRequest]);

  async function load() {
    // `aria-disabled` keeps the busy button focusable but does not block clicks.
    if (inFlight.current) return;
    const request = new AbortController();
    inFlight.current = request;
    const fromStart = firstPage === null;
    setPending(true);
    setFailure(null);
    setAnnouncement("");
    try {
      const query = fromStart || !cursor ? "" : `?cursor=${encodeURIComponent(cursor)}`;
      const response = await fetch(`/api/kudos${query}`, { signal: request.signal, headers: { accept: "application/json" } });
      if (!response.ok) {
        if (response.status === 400) {
          setOlder([]);
          setCursor(initialPage?.nextCursor);
          setClientFirstPage(null);
        }
        setFailure(failureOf(response));
        return;
      }
      const page = (await response.json()) as KudoFeedPage;
      if (fromStart) {
        setClientFirstPage(page.items);
      } else {
        setOlder((previous) => [...previous, ...page.items]);
        const known = new Set(shown.map((item) => item.id));
        const fresh = page.items.filter((item) => !known.has(item.id));
        setAnnouncement(t("loaded", { count: fresh.length }));
        // The button may be gone (last page): never leave focus on a removed element.
        const target = fresh[0] ?? shown.at(-1);
        if (target) setFocusRequest({ id: target.id });
      }
      setCursor(page.nextCursor);
    } catch (error) {
      if (request.signal.aborted) return;
      console.error("[kudos-feed] loading kudos failed", error);
      setFailure("error");
    } finally {
      inFlight.current = null;
      setPending(false);
    }
  }

  return (
    <div ref={listRef} className="flex flex-col gap-6">
      {shown.map((kudo) => (
        <KudoCard key={kudo.id} kudo={kudo} variant="post" writingOpen={writingOpen} />
      ))}
      {failure && !pending && <KudoFeedStatusMessage state={failure} onRetry={load} />}
      {pending && !firstPage && <KudoFeedStatusMessage state="loading" />}
      {!failure && firstPage?.length === 0 && <KudoFeedStatusMessage state="empty" />}
      {cursor && firstPage && (!failure || pending) && (
        <button
          type="button"
          onClick={load}
          aria-disabled={pending}
          aria-busy={pending}
          className={`${filterButton} self-center px-10 aria-disabled:cursor-wait aria-disabled:opacity-70`}
        >
          {pending && <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-text border-t-transparent" />}
          {t("loadMore")}
        </button>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
