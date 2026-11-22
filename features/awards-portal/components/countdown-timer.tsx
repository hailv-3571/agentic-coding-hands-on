"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { remainingParts } from "../countdown-parts";
import { COUNTDOWN_SIZES, CountdownDigitTile, type CountdownSize } from "./countdown-digit-tile";
import { useServerClockNow } from "./use-server-clock-now";

type CountdownTimerProps = {
  /** Target instant (ISO); the server reads it from env and never ships the env itself. */
  targetIso: string;
  /** The server's "now" when the page rendered (ISO), the only clock this timer trusts. */
  serverNowIso: string;
  size: CountdownSize;
  /** Line above the tiles while counting, hidden at 0 (Homepage "Sắp diễn ra", D005/D006). */
  pendingLabel?: string;
  /** Countdown page: `router.replace` here once the server-offset clock reaches the target. */
  redirectOnZero?: string;
};

const UNITS = ["days", "hours", "minutes"] as const;

/**
 * DAYS / HOURS / MINUTES until `targetIso` (FR-202/203/401, BR-001), at least two tiles per unit.
 * Never negative: from the target on it shows 00 00 00. Screen readers get "5 ngày 3 giờ 7 phút"
 * from a polite live region whose text changes only when the minute does. No animation, so
 * nothing to tone down for `prefers-reduced-motion`.
 */
export function CountdownTimer({ targetIso, serverNowIso, size, pendingLabel, redirectOnZero }: CountdownTimerProps) {
  const t = useTranslations("awardsPortal.countdownTimer");
  const router = useRouter();
  const targetMs = Date.parse(targetIso);
  const nowMs = useServerClockNow(targetMs, Date.parse(serverNowIso));
  const parts = remainingParts(targetMs, nowMs);
  const style = COUNTDOWN_SIZES[size];

  // Only the server-offset clock decides, so the client never leaves before the proxy agrees
  // (no /countdown ↔ / loop); the proxy stays the authority on where `/` leads.
  useEffect(() => {
    if (redirectOnZero && parts.done) router.replace(redirectOnZero);
  }, [redirectOnZero, parts.done, router]);

  return (
    <div className="flex flex-col gap-4">
      {pendingLabel && !parts.done && <p className="text-headline-small font-bold text-text">{pendingLabel}</p>}
      <div aria-live="polite" aria-atomic="true" className={`flex items-start ${style.units}`}>
        {UNITS.map((unit) => (
          <div key={unit} data-countdown-unit={unit} className={`flex flex-col ${style.unit}`}>
            <span className="sr-only">{t(`unitLabels.${unit}`, { count: parts[unit] })}</span>
            <span aria-hidden className={`flex ${style.tiles}`}>
              {Array.from(String(parts[unit]).padStart(2, "0"), (digit, index) => (
                <CountdownDigitTile key={index} digit={digit} size={size} />
              ))}
            </span>
            <span aria-hidden className={`font-bold text-text ${style.label}`}>
              {t(`units.${unit}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
