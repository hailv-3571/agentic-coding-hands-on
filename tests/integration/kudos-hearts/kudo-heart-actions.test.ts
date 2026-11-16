import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addHeartAction, removeHeartAction } from "@/features/kudos-hearts/server/kudo-heart-actions";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { closeWriting, openWriting } from "../kudos-authoring/event-end-override";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as hearts from "./kudo-heart-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("../kudos-authoring/event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** addHeartAction / removeHeartAction (US001/US002/US004, SC-002/003, C-01, FR-601/602). */
let sender: Sunner;
let fan: Sunner;
let other: Sunner;
const k: Record<string, string> = {};
const campaignIds: number[] = [];
const UNKNOWN_ID = "9b2f7c1e-4d3a-4b5c-8d6e-7f8091a2b3c4";

beforeAll(async () => {
  [sender, fan, other] = await Promise.all([
    createSunner("heart-sender", "Heart Sender"),
    createSunner("heart-fan", "Heart Fan"),
    createSunner("heart-other", "Heart Other"),
  ]);
  k.public = await insertKudo({ sender, recipient: other });
  k.anonymous = await insertKudo({ sender, recipient: other, nickname: "Mèo Mun" });
  k.spam = await insertKudo({ sender, recipient: other, status: "spam" });
});
beforeEach(async () => {
  requestCookies.clear();
  openWriting();
  await hearts.resetHearts(Object.values(k));
  await testSql`update public.kudos set status = 'spam' where id = ${k.spam}`;
  await signInToJar(requestCookies, fan.email);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await hearts.deleteCampaigns(campaignIds.splice(0));
});
afterAll(async () => {
  await cleanupSunners([sender, fan, other]);
  await closeAppDb();
});

const snapshot = async () => ({
  hearts: (await Promise.all(Object.values(k).map(hearts.heartRowsOf))).flat(),
  events: (await Promise.all(Object.values(k).map(hearts.heartAddedRowsOf))).flat(),
});

describe("addHeartAction", () => {
  it("hearts a public kudo as the session user, multiplier 1, with exactly one HeartAdded row", async () => {
    expect(await addHeartAction(k.public)).toEqual({ ok: true, heartCount: 1, heartedByMe: true });
    expect(await hearts.heartRowsOf(k.public)).toEqual([{ user_id: fan.id, multiplier: 1 }]);
    expect(await hearts.heartAddedRowsOf(k.public)).toEqual([{ payload: { kudoId: k.public, heartUserId: fan.id } }]);
  });

  it("is idempotent: hearting again succeeds and writes nothing more", async () => {
    await addHeartAction(k.public);
    expect(await addHeartAction(k.public)).toEqual({ ok: true, heartCount: 1, heartedByMe: true });
    expect(await snapshot()).toMatchObject({ hearts: [{ user_id: fan.id }], events: [{}] });
  });

  it("returns the raw count of every Sunner's hearts, with heartedByMe for the viewer only", async () => {
    await hearts.insertHeart(k.anonymous, other.id, 2);
    expect(await addHeartAction(k.anonymous)).toEqual({ ok: true, heartCount: 2, heartedByMe: true });
  });

  it.each([
    ["their public kudo", "public"],
    ["their anonymous kudo", "anonymous"],
  ])("rejects the sender hearting %s (SELF_HEART) and writes nothing", async (_label, key) => {
    requestCookies.clear();
    await signInToJar(requestCookies, sender.email);
    expect(await addHeartAction(k[key])).toEqual({ ok: false, error: "SELF_HEART" });
    expect(await snapshot()).toEqual({ hearts: [], events: [] });
  });

  it.each([
    ["a spam kudo", () => k.spam],
    ["an unknown kudo", () => UNKNOWN_ID],
    ["a malformed id", () => "not-a-uuid"],
  ])("rejects %s as KUDO_UNAVAILABLE and writes nothing", async (_label, id) => {
    expect(await addHeartAction(id())).toEqual({ ok: false, error: "KUDO_UNAVAILABLE" });
    expect(await snapshot()).toEqual({ hearts: [], events: [] });
  });

  it("rejects hearting from EVENT_END_AT (EVENT_ENDED) and writes nothing", async () => {
    closeWriting();
    expect(await addHeartAction(k.public)).toEqual({ ok: false, error: "EVENT_ENDED" });
    expect(await snapshot()).toEqual({ hearts: [], events: [] });
  });

  it("rolls the heart back with its outbox row when the transaction fails after both inserts", async () => {
    const realAdd = DomainEventOutbox.add;
    let outboxId = "";
    vi.spyOn(DomainEventOutbox, "add").mockImplementationOnce(async (tx, type, payload) => {
      outboxId = (await realAdd(tx, type, payload)).id;
      throw new Error("forced failure after the outbox insert");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await addHeartAction(k.public)).toEqual({ ok: false, error: "UNEXPECTED" });
    expect(outboxId).toEqual(expect.any(String));
    expect(await testSql`select 1 from public.domain_event_outbox where id = ${outboxId}`).toHaveLength(0);
    expect(await snapshot()).toEqual({ hearts: [], events: [] });
  });

  it("snapshots multiplier 2 inside an active campaign and keeps it after the campaign is deleted", async () => {
    campaignIds.push(await hearts.insertActiveCampaign());
    await addHeartAction(k.public);
    await hearts.deleteCampaigns(campaignIds.splice(0));
    requestCookies.clear();
    await signInToJar(requestCookies, other.email);
    expect(await addHeartAction(k.public)).toEqual({ ok: true, heartCount: 2, heartedByMe: true });
    expect(await hearts.heartRowsOf(k.public)).toEqual([
      { user_id: fan.id, multiplier: 2 },
      { user_id: other.id, multiplier: 1 },
    ]);
  });

  it("redirects a guest to /login and writes nothing (FR-601)", async () => {
    requestCookies.clear();
    const thrown = await addHeartAction(k.public).then(() => null, (error: unknown) => error);
    expect(redirectLocationOf(thrown)).toBe("/login");
    expect(await snapshot()).toEqual({ hearts: [], events: [] });
  });
});

describe("removeHeartAction", () => {
  it("removes the viewer's heart, idempotently, without an outbox row", async () => {
    await hearts.insertHeart(k.public, fan.id);
    await hearts.insertHeart(k.public, other.id);
    expect(await removeHeartAction(k.public)).toEqual({ ok: true, heartCount: 1, heartedByMe: false });
    expect(await removeHeartAction(k.public)).toEqual({ ok: true, heartCount: 1, heartedByMe: false });
    expect(await snapshot()).toEqual({ hearts: [{ user_id: other.id, multiplier: 1 }], events: [] });
  });

  it("lets the viewer take a heart back from a kudo that became spam (spec A2)", async () => {
    await hearts.insertHeart(k.spam, fan.id);
    expect(await removeHeartAction(k.spam)).toEqual({ ok: true, heartCount: 0, heartedByMe: false });
  });

  it("rejects removing from EVENT_END_AT (EVENT_ENDED) and keeps the heart", async () => {
    await hearts.insertHeart(k.public, fan.id);
    closeWriting();
    expect(await removeHeartAction(k.public)).toEqual({ ok: false, error: "EVENT_ENDED" });
    expect(await hearts.heartRowsOf(k.public)).toEqual([{ user_id: fan.id, multiplier: 1 }]);
  });

  it("answers KUDO_UNAVAILABLE for a malformed id", async () => {
    expect(await removeHeartAction("1; drop table kudo_hearts")).toEqual({ ok: false, error: "KUDO_UNAVAILABLE" });
  });
});
