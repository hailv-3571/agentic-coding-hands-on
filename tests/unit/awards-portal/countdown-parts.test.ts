import { describe, expect, it } from "vitest";
import { msUntilNextMinuteChange, remainingParts } from "@/features/awards-portal/countdown-parts";

/**
 * FR-202/FR-401, BR-001: the countdown shows whole DAYS / HOURS / MINUTES left (floored), never
 * negative, and reports `done` from the target instant on (the Countdown page then leaves).
 */
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.parse("2026-11-17T08:00:00+07:00");

describe("remainingParts", () => {
  it.each([
    ["1 ms left", 1, { days: 0, hours: 0, minutes: 0, done: false }],
    ["59 s left → 0 min (floor, not round)", 59 * SECOND, { days: 0, hours: 0, minutes: 0, done: false }],
    ["exactly 1 min", MINUTE, { days: 0, hours: 0, minutes: 1, done: false }],
    ["59 min 59.999 s", HOUR - 1, { days: 0, hours: 0, minutes: 59, done: false }],
    ["exactly 1 h", HOUR, { days: 0, hours: 1, minutes: 0, done: false }],
    ["23 h 59 min 59.999 s", DAY - 1, { days: 0, hours: 23, minutes: 59, done: false }],
    ["exactly 1 day", DAY, { days: 1, hours: 0, minutes: 0, done: false }],
    ["5 d 3 h 7 min 30 s", 5 * DAY + 3 * HOUR + 7 * MINUTE + 30 * SECOND, { days: 5, hours: 3, minutes: 7, done: false }],
    ["multi-day beyond 99 days keeps every day", 123 * DAY + 4 * HOUR + 5 * MINUTE, { days: 123, hours: 4, minutes: 5, done: false }],
  ])("%s", (_label, left, expected) => {
    expect(remainingParts(NOW + left, NOW)).toEqual(expected);
  });

  it.each([
    ["target equals now", 0],
    ["1 ms past the target", -1],
    ["3 days past the target", -3 * DAY],
  ])("%s → zeros and done (never negative)", (_label, offset) => {
    expect(remainingParts(NOW + offset, NOW)).toEqual({ days: 0, hours: 0, minutes: 0, done: true });
  });

  it("does not depend on the local time zone or DST: only the millisecond difference counts", () => {
    const target = Date.parse("2027-03-28T03:30:00+02:00");
    const now = Date.parse("2027-03-27T01:00:00Z");
    // 01:00Z → 01:30Z next day = 24 h 30 min, although Central Europe loses an hour that night.
    expect(remainingParts(target, now)).toEqual({ days: 1, hours: 0, minutes: 30, done: false });
  });
});

describe("msUntilNextMinuteChange", () => {
  it.each([
    ["target on a whole minute, 30 s into it", 5 * MINUTE + 30 * SECOND, 30 * SECOND],
    ["target off the wall-clock minute", 2 * HOUR + 17 * SECOND + 250, 17 * SECOND + 250],
    ["exactly on a minute change → a full minute, never 0", 3 * MINUTE, MINUTE],
    ["59 s left → when the clock reaches the target", 59 * SECOND, 59 * SECOND],
    ["target passed → a full minute (no busy loop)", -5 * SECOND, MINUTE],
  ])("%s", (_label, left, expected) => {
    expect(msUntilNextMinuteChange(NOW + left, NOW)).toBe(expected);
  });
});
