import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportRoute from "@/app/api/admin/kudos/export/route";
import * as listRoute from "@/app/api/admin/kudos/route";
import { markKudoSpam, unSpamKudo } from "@/features/admin-moderation/server/kudo-moderation-actions";
import { testSql } from "../../setup/integration-db";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { makeAdmin, moderationOf, spamOutboxRows } from "./admin-moderation-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * Access matrix (FR-601/602, SC-007, C-13/C-20): no session, user, demoted admin and admin against
 * GET /api/admin/kudos, GET /api/admin/kudos/export, markKudoSpam and unSpamKudo. Route handlers answer
 * JSON 401/403 BEFORE parsing params; the actions answer like every admin action (guest → /login,
 * non-admin → 403 interrupt). A refused call changes nothing, and no refusal carries Kudo data.
 */
let admin: Sunner, member: Sunner, demoted: Sunner, anonSender: Sunner, recipient: Sunner;
let kudoId: string;

beforeAll(async () => {
  [admin, member, demoted, anonSender, recipient] = await Promise.all([
    createSunner("acc-admin", "Access Admin"),
    createSunner("acc-member", "Access Member"),
    createSunner("acc-demoted", "Access Demoted"),
    createSunner("acc-anon", "Người Gửi Bí Mật"),
    createSunner("acc-recipient", "Access Recipient"),
  ]);
  await makeAdmin(admin);
  kudoId = await insertKudo({ sender: anonSender, recipient, nickname: "Bóng Đêm", body: "Lời cảm ơn ẩn danh" });
});
beforeEach(() => {
  requestCookies.clear();
  vi.mocked(revalidatePath).mockClear();
});
afterAll(async () => {
  await cleanupSunners([admin, member, demoted, anonSender, recipient]);
  await closeAppDb();
});

const signedInAs = (sunner: Sunner) => signInToJar(requestCookies, sunner.email);
/** Signs in while still an admin, then loses the role in the DB (as an admin demotion would). */
async function asDemotedAdmin() {
  await makeAdmin(demoted);
  await signedInAs(demoted);
  await testSql`update public.profiles set role = 'user' where id = ${demoted.id}`;
}
const get = async (handler: (request: NextRequest) => Promise<Response>, path: string) => {
  const response = await handler(new NextRequest(`http://localhost:3000${path}`));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), text: await response.text() };
};
const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);
const leaksSender = (text: string) => [anonSender.id, anonSender.email, anonSender.fullName].some((secret) => text.includes(secret));

const routes = [
  ["list", listRoute.GET, "/api/admin/kudos"],
  ["export", exportRoute.GET, "/api/admin/kudos/export"],
] as const;

describe("admin kudos routes — guard before parsing", () => {
  it.each(routes)("%s answers 401 JSON without a session, even for invalid params", async (_label, handler, path) => {
    const answer = await get(handler, `${path}?sender=not-a-uuid`);
    expect(answer).toEqual({ status: 401, cacheControl: "private, no-store", text: JSON.stringify({ code: "unauthorized" }) });
  });

  it.each(routes)("%s answers 403 JSON to a signed-in user", async (_label, handler, path) => {
    await signedInAs(member);
    const answer = await get(handler, `${path}?sender=not-a-uuid`);
    expect(answer).toEqual({ status: 403, cacheControl: "private, no-store", text: JSON.stringify({ code: "forbidden" }) });
  });

  it.each(routes)("%s answers 403 to an admin demoted after signing in (role read from the DB)", async (_label, handler, path) => {
    await asDemotedAdmin();
    const answer = await get(handler, `${path}?receiver=${recipient.id}`);
    expect(answer.status).toBe(403);
    expect(leaksSender(answer.text)).toBe(false);
  });

  it.each(routes)("%s answers 400 to an admin for invalid params and a reversed range", async (_label, handler, path) => {
    await signedInAs(admin);
    expect(await get(handler, `${path}?status=deleted`)).toMatchObject({ status: 400, text: JSON.stringify({ code: "invalid_params" }) });
    expect(await get(handler, `${path}?from=2025-12-06&to=2025-12-05`)).toMatchObject({
      status: 400,
      cacheControl: "private, no-store",
      text: JSON.stringify({ code: "invalid_date_range" }),
    });
  });
});

describe("admin kudos routes — admin", () => {
  it("lists the page with the real sender of an anonymous kudo, never cacheable", async () => {
    await signedInAs(admin);
    const answer = await get(listRoute.GET, `/api/admin/kudos?receiver=${recipient.id}`);
    expect(answer).toMatchObject({ status: 200, cacheControl: "private, no-store" });
    const page = JSON.parse(answer.text);
    expect(page).toMatchObject({ total: 1, page: 1, pageCount: 1 });
    expect(page.rows[0]).toMatchObject({
      id: kudoId,
      isAnonymous: true,
      anonymousNickname: "Bóng Đêm",
      sender: { id: anonSender.id, name: anonSender.fullName, email: anonSender.email },
    });
  });
});

describe("moderation actions — access", () => {
  it("redirects a guest to /login and changes nothing", async () => {
    const thrown = await Promise.all([thrownBy(markKudoSpam(kudoId)), thrownBy(unSpamKudo(kudoId))]);
    expect(thrown.map(redirectLocationOf)).toEqual(["/login", "/login"]);
    expect(await moderationOf(kudoId)).toEqual({ status: "public", moderated_by: null, moderated_at: null });
  });

  it("answers 403 to a user and to a demoted admin, and changes nothing", async () => {
    await signedInAs(member);
    const asMember = await Promise.all([thrownBy(markKudoSpam(kudoId)), thrownBy(unSpamKudo(kudoId))]);
    await asDemotedAdmin();
    const asDemoted = await Promise.all([thrownBy(markKudoSpam(kudoId)), thrownBy(unSpamKudo(kudoId))]);
    expect([...asMember, ...asDemoted].map(authInterruptStatusOf)).toEqual([403, 403, 403, 403]);
    expect(await moderationOf(kudoId)).toEqual({ status: "public", moderated_by: null, moderated_at: null });
    expect(await spamOutboxRows(kudoId)).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("moderation actions — admin", () => {
  it("marks spam, answers changed:false on a repeat, un-spams, and refreshes /admin/review each time", async () => {
    await signedInAs(admin);
    expect(await markKudoSpam(kudoId)).toEqual({ ok: true, status: "spam", changed: true });
    expect(await moderationOf(kudoId)).toMatchObject({ status: "spam", moderated_by: admin.id });
    expect(await markKudoSpam(kudoId)).toEqual({ ok: true, status: "spam", changed: false });
    expect(await unSpamKudo(kudoId)).toEqual({ ok: true, status: "public", changed: true });
    expect(await unSpamKudo(kudoId)).toEqual({ ok: true, status: "public", changed: false });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(Array(4).fill(["/admin/review"]));
    expect(await spamOutboxRows(kudoId)).toHaveLength(1);
  });

  it("answers invalid for a malformed id and not_found for an unknown one", async () => {
    await signedInAs(admin);
    expect(await markKudoSpam("not-a-uuid")).toEqual({ ok: false, code: "invalid" });
    expect(await unSpamKudo(42 as unknown as string)).toEqual({ ok: false, code: "invalid" });
    expect(await markKudoSpam("00000000-0000-4000-8000-000000000000")).toEqual({ ok: false, code: "not_found" });
  });
});
