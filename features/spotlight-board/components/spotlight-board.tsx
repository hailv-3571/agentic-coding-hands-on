"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useFullscreenToggle } from "../hooks/use-fullscreen-toggle";
import { useSpotlightChannel } from "../hooks/use-spotlight-channel";
import { fetchSpotlightSnapshot } from "../lib/fetch-spotlight-snapshot";
import { initSpotlightState, spotlightReducer } from "../lib/spotlight-state-reducer";
import { SPOTLIGHT_HIGHLIGHT_MS } from "../lib/spotlight-ui-config";
import type { SpotlightEvent, SpotlightSnapshot } from "../schemas/spotlight-views";
import { SpotlightBoardFrame } from "./spotlight-board-frame";
import { SpotlightBoardToast } from "./spotlight-board-toast";
import { SpotlightConnectionBanner } from "./spotlight-connection-banner";
import { SpotlightFullscreenButton } from "./spotlight-fullscreen-button";
import { SpotlightNameCloud } from "./spotlight-name-cloud";
import { SpotlightSearchInput } from "./spotlight-search-input";
import { SpotlightTicker } from "./spotlight-ticker";

/**
 * The live board: DEC-001 state seeded from the server snapshot, kept current by the private
 * channel and replaced by a refetch after every (re)subscribe and when the tab shows again.
 * Counter "{n} KUDOS" (FR-203), search, cloud, ticker, fullscreen and the connection label all sit
 * inside the frame, so they keep working in fullscreen.
 */
export function SpotlightBoard({ initial }: { initial: SpotlightSnapshot }) {
  const t = useTranslations("spotlight");
  const [state, dispatch] = useReducer(spotlightReducer, initial, initSpotlightState);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const resyncRef = useRef<AbortController | null>(null);

  const resync = useCallback(async () => {
    resyncRef.current?.abort();
    const controller = new AbortController();
    resyncRef.current = controller;
    const snapshot = await fetchSpotlightSnapshot(controller.signal);
    // A failed refetch keeps the numbers already on screen; the next resync heals them.
    if (snapshot && !controller.signal.aborted) dispatch({ type: "replace", snapshot });
  }, []);
  useEffect(() => () => resyncRef.current?.abort(), []);

  const onEvent = useCallback((event: SpotlightEvent) => dispatch({ type: "event", event }), []);
  const channel = useSpotlightChannel({ onEvent, onResync: resync });

  const rejectFullscreen = useCallback(() => setNotice(t("fullscreenFailed")), [t]);
  const fullscreen = useFullscreenToggle(boardRef, rejectFullscreen);
  const clearNotice = useCallback(() => setNotice(null), []);

  const spotlitKudoId = state.spotlit?.kudoId;
  useEffect(() => {
    if (!spotlitKudoId) return;
    const timer = setTimeout(() => dispatch({ type: "unspotlight", kudoId: spotlitKudoId }), SPOTLIGHT_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [spotlitKudoId]);

  return (
    <SpotlightBoardFrame ref={boardRef}>
      <SpotlightNameCloud names={state.names} query={query} spotlitId={state.spotlit?.recipientId ?? null} />
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-3 md:contents">
        <SpotlightSearchInput onSearch={setQuery} className="z-10 max-w-[219px] min-w-0 flex-1 md:absolute md:top-6 md:left-6 md:w-[219px]" />
        <p
          className="z-10 shrink-0 text-headline-small font-bold whitespace-nowrap text-text md:pointer-events-none md:absolute md:top-3 md:left-1/2 md:-translate-x-1/2 md:text-display-small md:font-bold"
        >
          {t("total", { count: state.total })}
        </p>
      </div>
      <SpotlightConnectionBanner status={channel.status} onRetry={channel.retry} />
      <SpotlightTicker items={state.ticker} />
      <SpotlightFullscreenButton active={fullscreen.active} onToggle={fullscreen.toggle} />
      <SpotlightBoardToast message={notice} onDone={clearNotice} />
    </SpotlightBoardFrame>
  );
}
