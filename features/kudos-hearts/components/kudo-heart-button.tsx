"use client";

import { useCallback, useEffect, useId, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import type { KudoHeartSummary } from "@/features/kudos-feed/schemas/kudo-card-view";
import type { HeartActionResult, HeartErrorCode } from "../schemas/kudo-heart-result";
import { addHeartAction, removeHeartAction } from "../server/kudo-heart-actions";
import { publishHeartSummary } from "./heart-summary-store";
import { KudoHeartErrorToast } from "./kudo-heart-error-toast";
import { KudoHeartIcon } from "./kudo-heart-icon";
import { useSharedHeartSummary } from "./use-shared-heart-summary";

export type KudoHeartButtonProps = KudoHeartSummary & {
  kudoId: string;
  /** The viewer sent this Kudo (anonymous too): disabled with the reason (DEC-001, FR-405). */
  isOwner: boolean;
  /** `isKudoWritingOpen()` from the page: false from EVENT_END_AT, when hearts are read-only. */
  writingOpen: boolean;
  /** Card: gap 4 (Figma 3127:21871); detail panel: gap 8 (520:18779). */
  variant: "card" | "detail";
};

/** Runs the action; a thrown action or a network failure becomes UNEXPECTED (redirects pass through). */
async function sendToggle(kudoId: string, heart: boolean): Promise<HeartActionResult> {
  try {
    return await (heart ? addHeartAction(kudoId) : removeHeartAction(kudoId));
  } catch (error) {
    unstable_rethrow(error);
    console.warn("[kudos-hearts] the heart toggle failed", error);
    return { ok: false, error: "UNEXPECTED" };
  }
}

const tooltipShown = "group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100";

/**
 * Heart toggle of a Kudo card (F005 FR-201/FR-401/FR-402): count (Bold 24/32, "1.000" in vi, the
 * raw number of Sunners, D003) + the 32 px heart, one button with `aria-pressed`. A click flips the
 * heart and the count at once (useOptimistic), the button stays locked until the server answers
 * (no double toggle, FR-403), the answer becomes the confirmed state; a refusal or a failure
 * reverts and toasts `kudosHearts.errors.<CODE>`. The sender's own Kudo and a closed event keep the
 * count visible but disable the button (`aria-disabled`, so it stays focusable) with the reason as
 * a tooltip (hover/focus, Esc hides it: WCAG 1.4.13) and accessible description; pressing it sends
 * nothing and shows the reason in the toast, which is what a touch user sees (no hover, and iOS does
 * not focus a tapped button).
 */
export function KudoHeartButton({ kudoId, heartCount, heartedByMe, isOwner, writingOpen, variant }: KudoHeartButtonProps) {
  const t = useTranslations("kudosHearts");
  const format = useFormatter();
  const server = useMemo(() => ({ heartCount, heartedByMe }), [heartCount, heartedByMe]);
  const confirmed = useSharedHeartSummary(kudoId, server);
  const [shown, setShown] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();
  const locked = useRef(false);
  const [failure, setFailure] = useState<HeartErrorCode | null>(null);
  const clearFailure = useCallback(() => setFailure(null), []);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const reasonId = useId();
  const blockedBy: HeartErrorCode | null = isOwner ? "SELF_HEART" : writingOpen ? null : "EVENT_ENDED";

  useEffect(() => {
    if (!blockedBy) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTooltipDismissed(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [blockedBy]);

  function toggle() {
    if (blockedBy) {
      setFailure(blockedBy);
      return;
    }
    if (pending || locked.current) return;
    locked.current = true;
    setFailure(null);
    const next = { heartedByMe: !shown.heartedByMe, heartCount: Math.max(0, shown.heartCount + (shown.heartedByMe ? -1 : 1)) };
    startTransition(async () => {
      setShown(next);
      const result = await sendToggle(kudoId, next.heartedByMe);
      startTransition(() => {
        locked.current = false;
        if (result.ok) publishHeartSummary(kudoId, server, { heartCount: result.heartCount, heartedByMe: result.heartedByMe });
        else setFailure(result.error);
      });
    });
  }

  const count = format.number(shown.heartCount);
  return (
    <div className="group relative inline-flex" onPointerEnter={() => setTooltipDismissed(false)} onFocus={() => setTooltipDismissed(false)}>
      <button
        type="button"
        aria-pressed={shown.heartedByMe}
        aria-disabled={blockedBy ? true : undefined}
        aria-describedby={blockedBy ? reasonId : undefined}
        aria-busy={pending || undefined}
        onClick={toggle}
        className={`-m-1 flex items-center rounded p-1 text-headline-small font-bold text-on-primary transition-colors ${
          variant === "card" ? "gap-1" : "gap-2"
        } ${blockedBy ? "cursor-not-allowed opacity-50" : "hover:bg-primary/40"} ${focusRing}`}
      >
        <span aria-hidden="true">{count}</span>
        <KudoHeartIcon filled={shown.heartedByMe} />
        <span className="sr-only">{t("label", { count })}</span>
      </button>
      {blockedBy && (
        <span
          id={reasonId}
          role="tooltip"
          className={`pointer-events-none invisible absolute bottom-full left-0 z-10 mb-2 w-max max-w-64 rounded-lg border border-border bg-container-2 px-3 py-2 text-body-medium text-text opacity-0 shadow-gold transition-opacity ${
            tooltipDismissed ? "" : tooltipShown
          }`}
        >
          {t(`errors.${blockedBy}`)}
        </span>
      )}
      <KudoHeartErrorToast code={failure} onDone={clearFailure} />
    </div>
  );
}
