/**
 * Pure countdown maths shared by the server (first render) and the client timer (FR-202/401,
 * BR-001). Inputs are epoch milliseconds, so time zones and DST never enter the result.
 */
export type CountdownParts = { days: number; hours: number; minutes: number; done: boolean };

export const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Whole days / hours / minutes left until `targetMs` (floored, clamped at 0); `done` once now ≥ target. */
export function remainingParts(targetMs: number, nowMs: number): CountdownParts {
  const left = targetMs - nowMs;
  if (!(left > 0)) return { days: 0, hours: 0, minutes: 0, done: true };
  return {
    days: Math.floor(left / DAY_MS),
    hours: Math.floor((left % DAY_MS) / HOUR_MS),
    minutes: Math.floor((left % HOUR_MS) / MINUTE_MS),
    done: false,
  };
}

/**
 * Milliseconds until the displayed minute changes: the next whole minute of the time LEFT (the
 * target need not sit on a wall-clock minute). Never 0, so a timer always moves forward.
 */
export function msUntilNextMinuteChange(targetMs: number, nowMs: number): number {
  const left = targetMs - nowMs;
  if (!(left > 0)) return MINUTE_MS;
  return left % MINUTE_MS || MINUTE_MS;
}
