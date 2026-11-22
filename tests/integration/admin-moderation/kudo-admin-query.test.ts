import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminKudoFilterValues } from "@/features/admin-moderation/schemas/admin-kudo-row";
import { resolveSelectedPeople } from "@/features/admin-moderation/server/admin-kudo-selected-people";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { createProbeHashtags, deleteProbeHashtags, insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { addHearts, filterOf, setModeration, vietnamTime } from "./admin-moderation-fixtures";

/**
 * KudoAdminQuery.list (A1, FR-201..206, BR-002, D001, D009, D010): real sender of anonymous Kudos,
 * filters AND-ed, whole days in ADMIN_TIMEZONE, diacritic/case-insensitive content search with
 * literal `%` / `_` / `\`. Every filter is scoped to this file's Sunners, so other rows never interfere.
 */
let anon: Sunner, alice: Sunner, bob: Sunner, carol: Sunner, admin: Sunner;
let tags: { id: string; label: string }[];
const k: Record<string, string> = {};

beforeAll(async () => {
  [anon, alice, bob, carol, admin] = await Promise.all([
    createSunner("adq-anon", "Nguyễn Văn Đức"),
    createSunner("adq-alice", "Alice Sender"),
    createSunner("adq-bob", "Bob Receiver"),
    createSunner("adq-carol", "Carol Receiver"),
    createSunner("adq-admin", "Admin Moderator"),
  ]);
  tags = await createProbeHashtags(2);
  k.k1 = await insertKudo({
    sender: anon,
    recipient: bob,
    nickname: "Gió Lạ",
    title: "Người truyền lửa",
    body: "Cảm ơn Nguyễn đã giúp",
    status: "spam",
    hashtagIds: [tags[1].id, tags[0].id],
    createdAt: vietnamTime("2101-12-05T23:59:00"),
  });
  await setModeration(k.k1, "spam", admin.id, vietnamTime("2101-12-06T10:00:00"));
  await addHearts(k.k1, [alice], 2);
  await addHearts(k.k1, [carol, admin]);
  k.k2 = await insertKudo({ sender: alice, recipient: bob, body: "Bạn làm được rồi", createdAt: vietnamTime("2101-12-06T00:00:00") });
  k.k3 = await insertKudo({ sender: alice, recipient: carol, body: "Giảm 50% công sức", createdAt: vietnamTime("2101-12-04T23:59:59") });
  k.k4 = await insertKudo({ sender: alice, recipient: carol, body: "Đạt 500 điểm", createdAt: vietnamTime("2101-12-05T00:00:00") });
  k.k5 = await insertKudo({ sender: anon, recipient: carol, nickname: "Mây", body: "Mã a_b", createdAt: vietnamTime("2101-12-05T12:00:00") });
  k.k6 = await insertKudo({ sender: alice, recipient: carol, body: "Mã axb", status: "spam", createdAt: vietnamTime("2101-12-05T12:00:01") });
  // Backslash probes (review S2): only k7 holds a real "\"; k8 is what "\D" would match as an escape.
  k.k7 = await insertKudo({ sender: bob, recipient: alice, body: "Lưu ở C:\\Data\\kudo", createdAt: vietnamTime("2101-12-07T00:00:00") });
  k.k8 = await insertKudo({ sender: bob, recipient: alice, body: "Lưu ở C:Data", createdAt: vietnamTime("2101-12-07T00:00:01") });
});
afterAll(async () => {
  await cleanupSunners([anon, alice, bob, carol, admin]);
  await deleteProbeHashtags(tags.map((tag) => tag.id));
  await closeAppDb();
});

const idsOf = async (patch: Partial<AdminKudoFilterValues>) => {
  const page = await KudoAdminQuery.list(filterOf(patch), "vi");
  return { ids: page.rows.map((row) => row.id), total: page.total };
};
const named = (...keys: string[]) => ({ ids: keys.map((key) => k[key]), total: keys.length });

describe("KudoAdminQuery.list — row", () => {
  it("shows the real sender of an anonymous spam kudo with its nickname, raw hearts and moderator", async () => {
    const page = await KudoAdminQuery.list(filterOf({ receiverId: bob.id }), "vi");
    expect(page.rows.map((row) => row.id)).toEqual([k.k2, k.k1]);
    expect(page.rows[1]).toEqual({
      id: k.k1,
      shortId: k.k1.slice(0, 8),
      createdAt: "2101-12-05T16:59:00.000Z",
      sender: { id: anon.id, name: "Nguyễn Văn Đức", email: anon.email },
      isAnonymous: true,
      anonymousNickname: "Gió Lạ",
      receiver: { id: bob.id, name: "Bob Receiver", email: bob.email },
      title: "Người truyền lửa",
      message: "Cảm ơn Nguyễn đã giúp",
      hashtags: [tags[0].label, tags[1].label],
      heartCount: 3,
      status: "spam",
      moderatedBy: { id: admin.id, name: "Admin Moderator" },
      moderatedAt: "2101-12-06T03:00:00.000Z",
    });
    expect(page.rows[0]).toMatchObject({ isAnonymous: false, anonymousNickname: null, title: null, hashtags: [], heartCount: 0, moderatedBy: null, moderatedAt: null });
  });

  it("localizes hashtag labels and keeps the '#' prefix", async () => {
    const page = await KudoAdminQuery.list(filterOf({ receiverId: bob.id, status: "spam" }), "en");
    expect(page.rows[0].hashtags).toEqual(["#PROBE0", "#PROBE1"]);
  });
});

describe("KudoAdminQuery.list — filters (AND, BR-002)", () => {
  it("combines sender, receiver and status", async () => {
    expect(await idsOf({ senderId: alice.id, receiverId: carol.id })).toEqual(named("k6", "k4", "k3"));
    expect(await idsOf({ senderId: alice.id, receiverId: carol.id, status: "spam" })).toEqual(named("k6"));
    expect(await idsOf({ receiverId: carol.id, status: "public" })).toEqual(named("k5", "k4", "k3"));
  });

  it("filters anonymous kudos by their real sender (D001)", async () => {
    expect(await idsOf({ senderId: anon.id })).toEqual(named("k1", "k5"));
  });

  it("reads from/to as whole days in ADMIN_TIMEZONE: 23:59 +07 on `to` is in, 00:00 the next day is out", async () => {
    expect(await idsOf({ receiverId: bob.id, to: "2101-12-05" })).toEqual(named("k1"));
    expect(await idsOf({ receiverId: bob.id, from: "2101-12-06" })).toEqual(named("k2"));
    expect(await idsOf({ receiverId: carol.id, from: "2101-12-05" })).toEqual(named("k6", "k5", "k4"));
    expect(await idsOf({ receiverId: carol.id, to: "2101-12-04" })).toEqual(named("k3"));
    expect(await idsOf({ receiverId: carol.id, from: "2101-12-05", to: "2101-12-05", status: "public" })).toEqual(named("k5", "k4"));
  });
});

describe("resolveSelectedPeople (filter select labels)", () => {
  it("names the selected sender and receiver, and answers null for an absent or unknown id", async () => {
    expect(await resolveSelectedPeople(filterOf({ senderId: anon.id, receiverId: bob.id }), "vi")).toEqual({
      selectedSender: { id: anon.id, name: "Nguyễn Văn Đức", email: anon.email },
      selectedReceiver: { id: bob.id, name: "Bob Receiver", email: bob.email },
    });
    expect(await resolveSelectedPeople(filterOf({ receiverId: "00000000-0000-4000-8000-000000000000" }), "vi")).toEqual({
      selectedSender: null,
      selectedReceiver: null,
    });
  });
});

describe("KudoAdminQuery.list — content search (D009)", () => {
  it("ignores diacritics and case in title and message", async () => {
    expect(await idsOf({ receiverId: bob.id, query: "nguyen" })).toEqual(named("k1"));
    expect(await idsOf({ receiverId: bob.id, query: "DUOC" })).toEqual(named("k2"));
    expect(await idsOf({ receiverId: bob.id, query: "NGUOI TRUYEN" })).toEqual(named("k1"));
    expect(await idsOf({ receiverId: carol.id, query: "dat 5" })).toEqual(named("k4"));
  });

  it("treats % and _ as literal characters, never wildcards", async () => {
    expect(await idsOf({ receiverId: carol.id, query: "50%" })).toEqual(named("k3"));
    expect(await idsOf({ receiverId: carol.id, query: "%" })).toEqual(named("k3"));
    expect(await idsOf({ receiverId: carol.id, query: "a_b" })).toEqual(named("k5"));
    expect(await idsOf({ receiverId: carol.id, query: "_" })).toEqual(named("k5"));
    expect(await idsOf({ receiverId: carol.id, query: "\\" })).toEqual({ ids: [], total: 0 });
  });

  it("treats a backslash as a literal character, also at the end of the search", async () => {
    expect(await idsOf({ receiverId: alice.id, query: "C:\\Data" })).toEqual(named("k7"));
    expect(await idsOf({ receiverId: alice.id, query: "\\" })).toEqual(named("k7"));
    expect(await idsOf({ receiverId: alice.id, query: "c:\\" })).toEqual(named("k7"));
    expect(await idsOf({ receiverId: alice.id, query: "\\d" })).toEqual(named("k7"));
    expect(await idsOf({ receiverId: alice.id, query: "\\%" })).toEqual({ ids: [], total: 0 });
    expect(await idsOf({ receiverId: alice.id, query: "\\_" })).toEqual({ ids: [], total: 0 });
  });
});
