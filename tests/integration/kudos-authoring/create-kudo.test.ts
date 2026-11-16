import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createKudo } from "@/features/kudos-authoring/server/create-kudo-action";
import type { KudoCreateInput } from "@/features/kudos-authoring/schemas/kudo-input-schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { closeWriting, openWriting } from "./event-end-override";
import { activeHashtagIds, cleanupSunners, createSunner, kudoCountBySender, type Sunner } from "./kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("./event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** createKudo (US001/US003, FR-601/603, C-01): session sender, in-tx outbox, nothing on rejection. */
let sender: Sunner;
let recipient: Sunner;
let tags: string[];
let inactiveTag: string;
const SIX_TAGS = 6;
const UNKNOWN_ID = "9b2f7c1e-4d3a-4b5c-8d6e-7f8091a2b3c4";

beforeAll(async () => {
  sender = await createSunner("create-sender", "Create Sender");
  recipient = await createSunner("create-recipient", "Create Recipient");
  tags = await activeHashtagIds(SIX_TAGS);
  [{ id: inactiveTag }] = await testSql<{ id: string }[]>`
    insert into public.hashtags (slug, label_vi, label_en, sort_order, is_active)
    values (${`test-inactive-${Date.now()}`}, '#CŨ', '#OLD', 999, false) returning id`;
});
beforeEach(async () => {
  requestCookies.clear();
  openWriting();
  await signInToJar(requestCookies, sender.email);
});
afterAll(async () => {
  await cleanupSunners([sender, recipient]);
  await testSql`delete from public.hashtags where id = ${inactiveTag}`;
  await closeAppDb();
});

const valid = (): KudoCreateInput => ({ recipientId: recipient.id, body: "Cảm ơn bạn!", hashtagIds: [tags[0]] });
const outboxCount = async () => (await testSql<{ n: number }[]>`select count(*)::int as n from public.domain_event_outbox`)[0].n;
const outboxRowsFor = (kudoId: string) =>
  testSql<{ event_type: string; payload: unknown }[]>`
    select event_type, payload from public.domain_event_outbox where payload ->> 'kudoId' = ${kudoId}`;

/** Runs `create` and asserts that it wrote no kudo and no outbox row. */
async function expectNothingWritten(input: unknown) {
  const [kudosBefore, outboxBefore] = [await kudoCountBySender(sender.id), await outboxCount()];
  const result = await createKudo(input as KudoCreateInput);
  expect([await kudoCountBySender(sender.id), await outboxCount()]).toEqual([kudosBefore, outboxBefore]);
  return result;
}

describe("createKudo", () => {
  it("creates a public kudo for the session sender with hashtags and exactly one KudoCreated row", async () => {
    const forged = { ...valid(), title: " Người truyền lửa ", hashtagIds: tags.slice(0, 2), senderId: recipient.id, status: "spam" };
    const result = await createKudo(forged as KudoCreateInput);
    expect(result).toEqual({ ok: true, id: expect.any(String) });
    const id = (result as { id: string }).id;
    const [row] = await testSql`
      select sender_id, recipient_id, title, body, status, is_anonymous, anonymous_nickname from public.kudos where id = ${id}`;
    expect(row).toEqual({
      sender_id: sender.id,
      recipient_id: recipient.id,
      title: "Người truyền lửa",
      body: "Cảm ơn bạn!",
      status: "public",
      is_anonymous: false,
      anonymous_nickname: null,
    });
    const linked = await testSql<{ hashtag_id: string }[]>`select hashtag_id from public.kudo_hashtags where kudo_id = ${id}`;
    expect(linked.map((r) => r.hashtag_id).sort()).toEqual(tags.slice(0, 2).sort());
    expect(await outboxRowsFor(id)).toEqual([{ event_type: "KudoCreated", payload: { kudoId: id } }]);
  });

  it("allows repeat kudos to the same recipient", async () => {
    const before = await kudoCountBySender(sender.id);
    expect((await createKudo(valid())).ok).toBe(true);
    expect((await createKudo(valid())).ok).toBe(true);
    expect(await kudoCountBySender(sender.id)).toBe(before + 2);
  });

  it("stores an anonymous kudo with its trimmed nickname", async () => {
    const result = await createKudo({ ...valid(), isAnonymous: true, anonymousNickname: "  Mèo Mun " });
    const [row] = await testSql`select is_anonymous, anonymous_nickname from public.kudos where id = ${(result as { id: string }).id}`;
    expect(row).toEqual({ is_anonymous: true, anonymous_nickname: "Mèo Mun" });
  });

  it("rejects self-send", async () => {
    expect(await expectNothingWritten({ ...valid(), recipientId: sender.id })).toEqual({
      ok: false,
      code: "SELF_SEND",
      fieldErrors: { recipientId: ["selfSend"] },
    });
  });

  it("answers DEC-001 when recipient, body or hashtags are missing", async () => {
    expect(await expectNothingWritten({ recipientId: "", body: " ", hashtagIds: [] })).toMatchObject({
      ok: false,
      code: "MISSING_REQUIRED",
      fieldErrors: { recipientId: ["required"], body: ["required"], hashtagIds: ["required"] },
    });
  });

  it.each<[string, () => Record<string, unknown>, string, object]>([
    ["a 1,001-character body", () => ({ body: "a".repeat(1001) }), "VALIDATION", { body: ["bodyTooLong"] }],
    ["6 hashtags", () => ({ hashtagIds: tags }), "VALIDATION", { hashtagIds: ["hashtagsTooMany"] }],
    ["a javascript: link", () => ({ body: "[x](javascript:alert(1))" }), "VALIDATION", { body: ["linkScheme"] }],
    ["anonymous without a nickname", () => ({ isAnonymous: true }), "VALIDATION", { anonymousNickname: ["nicknameRequired"] }],
    ["a nickname without anonymous", () => ({ anonymousNickname: "Mèo" }), "VALIDATION", { anonymousNickname: ["nicknameWithoutAnonymous"] }],
    ["an inactive hashtag", () => ({ hashtagIds: [tags[0], inactiveTag] }), "HASHTAG_INVALID", { hashtagIds: ["hashtagInactive"] }],
    ["an unknown hashtag", () => ({ hashtagIds: [UNKNOWN_ID] }), "HASHTAG_INVALID", { hashtagIds: ["hashtagInactive"] }],
    ["an unknown recipient", () => ({ recipientId: UNKNOWN_ID }), "RECIPIENT_INVALID", { recipientId: ["recipientInvalid"] }],
  ])("rejects %s and writes nothing", async (_label, patch, code, fieldErrors) => {
    expect(await expectNothingWritten({ ...valid(), ...patch() })).toEqual({ ok: false, code, fieldErrors });
  });

  it("rolls back the kudo and its outbox row together when the transaction fails after both inserts", async () => {
    const realAdd = DomainEventOutbox.add;
    const seen: { kudoId?: string; outboxId?: string } = {};
    vi.spyOn(DomainEventOutbox, "add").mockImplementationOnce(async (tx, type, payload) => {
      seen.kudoId = (payload as { kudoId: string }).kudoId;
      seen.outboxId = (await realAdd(tx, type, payload)).id;
      throw new Error("forced failure after the outbox insert");
    });
    const result = await expectNothingWritten(valid());
    expect(result).toEqual({ ok: false, code: "UNEXPECTED" });
    expect(seen.outboxId).toEqual(expect.any(String));
    expect(await testSql`select 1 from public.kudos where id = ${seen.kudoId!}`).toHaveLength(0);
    expect(await testSql`select 1 from public.domain_event_outbox where id = ${seen.outboxId!}`).toHaveLength(0);
  });

  it("returns WRITING_CLOSED from EVENT_END_AT and writes nothing", async () => {
    closeWriting();
    expect(await expectNothingWritten(valid())).toEqual({ ok: false, code: "WRITING_CLOSED" });
  });

  it("redirects a guest to /login (FR-601)", async () => {
    requestCookies.clear();
    const thrown = await createKudo(valid()).then(() => null, (error: unknown) => error);
    expect(redirectLocationOf(thrown)).toBe("/login");
  });
});
