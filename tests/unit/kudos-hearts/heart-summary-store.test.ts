import { describe, expect, it, vi } from "vitest";
import {
  publishHeartSummary,
  readHeartSummaryEntry,
  resolveHeartSummary,
  subscribeHeartSummaries,
} from "@/features/kudos-hearts/components/heart-summary-store";

/**
 * The shared confirmed heart state behind every copy of a Kudo card (Highlight + All Kudos): a copy
 * follows the last server answer only while its own server props equal what that answer was based
 * on; fresher server props (reload, refetch, navigation) always win over a stale entry.
 */
const notHearted = { heartCount: 4, heartedByMe: false };
const hearted = { heartCount: 5, heartedByMe: true };

describe("heart summary store", () => {
  it("shows the server props when nothing was published for the Kudo", () => {
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-none"), notHearted)).toEqual(notHearted);
  });

  it("gives every copy rendered from the same server props the published answer, per Kudo", () => {
    publishHeartSummary("kudo-a", notHearted, hearted);
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-a"), { ...notHearted })).toEqual(hearted);
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-b"), notHearted)).toEqual(notHearted);
  });

  it("lets fresh server props beat a stale entry", () => {
    publishHeartSummary("kudo-c", notHearted, hearted);
    // Another Sunner hearted meanwhile and the page refetched: the server now says 6, hearted.
    const fresh = { heartCount: 6, heartedByMe: true };
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-c"), fresh)).toEqual(fresh);
    // Same count but a different heartedByMe is also fresher data, not the entry's base.
    const refetched = { heartCount: 4, heartedByMe: true };
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-c"), refetched)).toEqual(refetched);
  });

  it("keeps the latest answer and notifies subscribers until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHeartSummaries(listener);
    publishHeartSummary("kudo-d", notHearted, hearted);
    publishHeartSummary("kudo-d", notHearted, notHearted);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(resolveHeartSummary(readHeartSummaryEntry("kudo-d"), notHearted)).toEqual(notHearted);

    unsubscribe();
    publishHeartSummary("kudo-d", notHearted, hearted);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
