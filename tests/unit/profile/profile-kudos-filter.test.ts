import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { profileCountFilters, profileKudosFilter } from "@/features/profile/lib/profile-kudos-filter";

/**
 * Phase 12 privacy core (BR-002, DEC-002) and count rules (BR-006, D006): the profile list and its
 * counts are built from ONE filter decision. "Đã nhận" filters by the profile's recipient id; "Đã
 * gửi" exists only for the viewer's own profile and its sender id is always the session's (a
 * request can never set it), with the viewer's own spam merged in. Another Sunner's sent list is
 * refused, never filtered (a sender filter on someone else would reveal anonymous senders by set
 * difference).
 */
const viewer = randomUUID();
const other = randomUUID();

describe("profileKudosFilter", () => {
  it("filters 'received' by the profile's recipient id, for the own and any other profile", () => {
    expect(profileKudosFilter({ direction: "received", profileUserId: viewer, viewerId: viewer })).toEqual({ recipientId: viewer });
    expect(profileKudosFilter({ direction: "received", profileUserId: other, viewerId: viewer })).toEqual({ recipientId: other });
  });

  it("binds 'sent' to the session viewer and adds the viewer's own spam (ALG-001 in one keyset)", () => {
    expect(profileKudosFilter({ direction: "sent", profileUserId: viewer, viewerId: viewer })).toEqual({
      senderId: viewer,
      includeOwnSpam: true,
    });
  });

  it("refuses 'sent' for anyone but the viewer instead of filtering by their id", () => {
    expect(profileKudosFilter({ direction: "sent", profileUserId: other, viewerId: viewer })).toBe("forbidden");
  });
});

describe("profileCountFilters (BR-006: counts use the list's own filters)", () => {
  it("counts both lists on the own profile, with own spam in 'sent' (D006)", () => {
    expect(profileCountFilters({ profileUserId: viewer, viewerId: viewer })).toEqual({
      received: { recipientId: viewer },
      sent: { senderId: viewer, includeOwnSpam: true },
    });
  });

  it("counts only 'received' on another Sunner's profile", () => {
    expect(profileCountFilters({ profileUserId: other, viewerId: viewer })).toEqual({ received: { recipientId: other } });
  });

  it("returns for each direction exactly the filter its list is read with", () => {
    for (const profileUserId of [viewer, other]) {
      const counts = profileCountFilters({ profileUserId, viewerId: viewer });
      expect(counts.received).toEqual(profileKudosFilter({ direction: "received", profileUserId, viewerId: viewer }));
      const sentList = profileKudosFilter({ direction: "sent", profileUserId, viewerId: viewer });
      expect(counts.sent).toEqual(sentList === "forbidden" ? undefined : sentList);
    }
  });
});
