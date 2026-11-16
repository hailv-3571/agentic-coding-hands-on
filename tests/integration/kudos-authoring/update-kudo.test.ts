import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createKudo } from "@/features/kudos-authoring/server/create-kudo-action";
import { updateKudo } from "@/features/kudos-authoring/server/update-kudo-action";
import type { KudoUpdateInput } from "@/features/kudos-authoring/schemas/kudo-input-schema";
import type { KudoWriteResult } from "@/features/kudos-authoring/schemas/kudo-write-result";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { closeWriting, openWriting } from "./event-end-override";
import { activeHashtagIds, cleanupSunners, createSunner, type Sunner } from "./kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("./event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** updateKudo (US004, FR-402/602, C-17): owner only, spam-locked, recipient immutable. */
let owner: Sunner;
let recipient: Sunner;
let stranger: Sunner;
let tags: string[];
let kudoId: string;

beforeAll(async () => {
  owner = await createSunner("update-owner", "Update Owner");
  recipient = await createSunner("update-recipient", "Update Recipient");
  stranger = await createSunner("update-stranger", "Update Stranger");
  tags = await activeHashtagIds(3);
});
beforeEach(async () => {
  requestCookies.clear();
  openWriting();
  await signInToJar(requestCookies, owner.email);
  const created = await createKudo({ recipientId: recipient.id, title: "Cũ", body: "Bản cũ", hashtagIds: tags.slice(0, 2) });
  kudoId = (created as { id: string }).id;
});
afterAll(async () => {
  await cleanupSunners([owner, recipient, stranger]);
  await closeAppDb();
});

const editInput = (): KudoUpdateInput => ({ title: "Mới", body: "Bản mới", hashtagIds: [tags[2]] });

async function snapshot(id: string) {
  const [row] = await testSql`
    select recipient_id, title, body, status, is_anonymous, anonymous_nickname,
           created_at::text as created_at, updated_at::text as updated_at, updated_at > created_at as edited,
           (select array_agg(hashtag_id::text order by hashtag_id) from public.kudo_hashtags where kudo_id = k.id) as tags,
           (select count(*)::int from public.domain_event_outbox where payload ->> 'kudoId' = k.id::text) as events
    from public.kudos k where id = ${id}`;
  return row;
}

/** Runs the update and asserts the stored kudo did not change at all. */
async function expectUnchanged(run: () => Promise<KudoWriteResult>) {
  const before = await snapshot(kudoId);
  const result = await run();
  expect(await snapshot(kudoId)).toEqual(before);
  return result;
}

describe("updateKudo", () => {
  it("lets the owner edit every field but the recipient, keeping created_at and emitting no event", async () => {
    const before = await snapshot(kudoId);
    const result = await updateKudo(kudoId, { ...editInput(), isAnonymous: true, anonymousNickname: " Cáo " });
    expect(result).toEqual({ ok: true, id: kudoId });
    const after = await snapshot(kudoId);
    expect(after).toMatchObject({
      recipient_id: recipient.id,
      title: "Mới",
      body: "Bản mới",
      status: "public",
      is_anonymous: true,
      anonymous_nickname: "Cáo",
      created_at: before.created_at,
      tags: [tags[2]],
      events: 1,
      edited: true,
    });
    expect(before.edited).toBe(false);

    expect(await updateKudo(kudoId, { ...editInput(), title: "" })).toEqual({ ok: true, id: kudoId });
    expect(await snapshot(kudoId)).toMatchObject({ title: null, is_anonymous: false, anonymous_nickname: null });
  });

  it("rejects a recipient change", async () => {
    const forged = { ...editInput(), recipientId: stranger.id } as unknown as KudoUpdateInput;
    expect(await expectUnchanged(() => updateKudo(kudoId, forged))).toEqual({
      ok: false,
      code: "VALIDATION",
      fieldErrors: { recipientId: ["recipientImmutable"] },
    });
  });

  it("answers FORBIDDEN to a non-owner without revealing the kudo", async () => {
    requestCookies.clear();
    await signInToJar(requestCookies, stranger.email);
    expect(await expectUnchanged(() => updateKudo(kudoId, editInput()))).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("answers SPAM_LOCKED to the owner of a spam kudo", async () => {
    await testSql`update public.kudos set status = 'spam' where id = ${kudoId}`;
    expect(await expectUnchanged(() => updateKudo(kudoId, editInput()))).toEqual({ ok: false, code: "SPAM_LOCKED" });
  });

  it("answers NOT_FOUND for an unknown or malformed id", async () => {
    expect(await updateKudo("7d1c5e9a-2b4f-4c6d-8e0f-1a2b3c4d5e6f", editInput())).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(await updateKudo("not-a-uuid", editInput())).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("applies DEC-001 and the inactive-hashtag rule on edit too", async () => {
    expect(await expectUnchanged(() => updateKudo(kudoId, { body: "", hashtagIds: [] }))).toMatchObject({
      code: "MISSING_REQUIRED",
    });
    const [{ id: retired }] = await testSql<{ id: string }[]>`
      insert into public.hashtags (slug, label_vi, label_en, is_active)
      values (${`test-retired-${Date.now()}`}, '#X', '#X', false) returning id`;
    try {
      expect(await expectUnchanged(() => updateKudo(kudoId, { ...editInput(), hashtagIds: [retired] }))).toEqual({
        ok: false,
        code: "HASHTAG_INVALID",
        fieldErrors: { hashtagIds: ["hashtagInactive"] },
      });
    } finally {
      await testSql`delete from public.hashtags where id = ${retired}`;
    }
  });

  it("returns WRITING_CLOSED from EVENT_END_AT", async () => {
    closeWriting();
    expect(await expectUnchanged(() => updateKudo(kudoId, editInput()))).toEqual({ ok: false, code: "WRITING_CLOSED" });
  });

  it("waits for a concurrent Mark Spam that holds the row, then answers SPAM_LOCKED", async () => {
    const bodyBefore = (await snapshot(kudoId)).body;
    let pending: Promise<KudoWriteResult> | undefined;
    await testSql.begin(async (tx) => {
      await tx`update public.kudos set status = 'spam' where id = ${kudoId} and status = 'public'`;
      pending = updateKudo(kudoId, editInput());
      await waitUntilAnUpdateWaitsOnKudosLock();
    });
    expect(await pending).toEqual({ ok: false, code: "SPAM_LOCKED" });
    expect(await snapshot(kudoId)).toMatchObject({ status: "spam", body: bodyBefore });
  });
});

/** Polls pg_stat_activity until the action's conditional UPDATE is blocked on the row lock. */
async function waitUntilAnUpdateWaitsOnKudosLock(timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [row] = await testSql<{ n: number }[]>`
      select count(*)::int as n from pg_stat_activity
      where wait_event_type = 'Lock' and query ilike 'update "kudos"%'`;
    if (row.n > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("the update never waited on the kudos row lock");
}
