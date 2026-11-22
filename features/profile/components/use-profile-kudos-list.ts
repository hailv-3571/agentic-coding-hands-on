"use client";

import { useEffect, useRef, useState } from "react";
import type { KudoCardView } from "@/features/kudos-feed/schemas/kudo-card-view";
import { failureOf, type KudoLoadFailure } from "@/features/kudos-feed/components/kudo-feed-status-message";
import type { ProfileKudoCounts, ProfileKudosDirection, ProfileKudosPage } from "../schemas/profile-views";

type ProfileKudosListInput = {
  profileUserId: string;
  initialDirection: ProfileKudosDirection;
  /** First page rendered by the server (null when that read failed: the section shows its error). */
  initial: ProfileKudosPage | null;
};

/**
 * State of a profile's KUDOS list (FR-401, FR-402): pages from GET /api/profile/{id}/kudos, newest
 * first. Switching direction starts over from the first page; a newer request aborts the older one,
 * so after rapid switches only the last choice is shown (edge case "đổi dropdown nhanh"). "Tải thêm"
 * appends the next page (ignored while one is loading). A rejected cursor (400) drops back to the
 * first page on retry; any 401 asks to sign in again. Counts follow every answer.
 */
export function useProfileKudosList({ profileUserId, initialDirection, initial }: ProfileKudosListInput) {
  const [direction, setDirection] = useState(initialDirection);
  const [items, setItems] = useState<KudoCardView[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState(initial?.nextCursor);
  const [counts, setCounts] = useState<ProfileKudoCounts | null>(initial?.counts ?? null);
  /** The first page of the current direction is on screen. */
  const [loaded, setLoaded] = useState(initial !== null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<KudoLoadFailure | null>(initial ? null : "error");
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => () => inFlight.current?.abort(), []);

  async function fetchPage(target: ProfileKudosDirection, after?: string): Promise<ProfileKudosPage | null> {
    inFlight.current?.abort();
    const request = new AbortController();
    inFlight.current = request;
    setPending(true);
    setFailure(null);
    try {
      const query = new URLSearchParams({ direction: target });
      if (after) query.set("cursor", after);
      const response = await fetch(`/api/profile/${encodeURIComponent(profileUserId)}/kudos?${query}`, {
        signal: request.signal,
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        if (response.status === 400 && after) {
          setItems([]);
          setCursor(undefined);
          setLoaded(false);
        }
        setFailure(failureOf(response));
        return null;
      }
      const page = (await response.json()) as ProfileKudosPage;
      setItems((previous) => (after ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setCounts(page.counts);
      setLoaded(true);
      return page;
    } catch (error) {
      if (request.signal.aborted) return null;
      console.error("[profile] loading profile kudos failed", error);
      setFailure("error");
      return null;
    } finally {
      if (inFlight.current === request) {
        inFlight.current = null;
        setPending(false);
      }
    }
  }

  function selectDirection(next: ProfileKudosDirection) {
    setDirection(next);
    setItems([]);
    setCursor(undefined);
    setLoaded(false);
    void fetchPage(next);
  }

  /** The appended page (for focus and the announcement), or null when nothing was appended. */
  async function loadMore(): Promise<ProfileKudosPage | null> {
    if (inFlight.current || !cursor) return null;
    return fetchPage(direction, cursor);
  }

  function retry() {
    void fetchPage(direction, loaded ? cursor : undefined);
  }

  return { direction, items, cursor, counts, loaded, pending, failure, selectDirection, loadMore, retry };
}
