import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AdminReviewPage from "@/app/admin/review/page";
import * as exportRoute from "@/app/api/admin/kudos/export/route";
import * as listRoute from "@/app/api/admin/kudos/route";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { makeAdmin } from "./admin-moderation-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next-intl/server", () => ({ getLocale: async () => "vi", getTranslations: vi.fn() }));

/**
 * Refusals never name the real sender of an anonymous spam Kudo (F007 C-13, D001; phase 08 tester
 * concern 3). A guest and a signed-in user call GET /api/admin/kudos, GET /api/admin/kudos/export
 * and the `/admin/review` page with a filter that matches the Kudo: the 401/403 bodies and the
 * page's auth interrupts carry none of the sender's id, name or email, and the page reads no row.
 * The same calls by an admin do return the sender, which proves the filter matches the Kudo.
 */
let admin: Sunner, member: Sunner, anonSender: Sunner, recipient: Sunner;

beforeAll(async () => {
  [admin, member, anonSender, recipient] = await Promise.all([
    createSunner("leak-admin", "Leak Admin"),
    createSunner("leak-member", "Leak Member"),
    createSunner("leak-anon", "Người Gửi Thật Sự"),
    createSunner("leak-recipient", "Leak Recipient"),
  ]);
  await makeAdmin(admin);
  await insertKudo({ sender: anonSender, recipient, nickname: "Bóng Mờ", body: "Lời cảm ơn bị ẩn", status: "spam" });
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await cleanupSunners([admin, member, anonSender, recipient]);
  await closeAppDb();
});

const signedInAs = async (sunner: Sunner) => {
  requestCookies.clear();
  await signInToJar(requestCookies, sunner.email);
};
const secretsIn = (text: string) => [anonSender.id, anonSender.email, anonSender.fullName].filter((secret) => text.includes(secret));
const filterParams = () => ({ receiver: recipient.id, status: "spam" });
const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);
const interruptText = (error: unknown) => `${String(error)} ${(error as { digest?: string } | null)?.digest ?? ""}`;

const routes = [
  ["list", listRoute.GET, "/api/admin/kudos"],
  ["export", exportRoute.GET, "/api/admin/kudos/export"],
] as const;

describe("refusals hide the real sender of an anonymous spam kudo", () => {
  it.each(routes)("%s: the guest 401 and user 403 bodies carry none of it, the admin's answer does", async (_label, handler, path) => {
    const call = async () => {
      const response = await handler(new NextRequest(`http://localhost:3000${path}?${new URLSearchParams(filterParams())}`));
      return { status: response.status, text: await response.text() };
    };
    const asGuest = await call();
    await signedInAs(member);
    const asMember = await call();
    await signedInAs(admin);
    const asAdmin = await call();

    expect([asGuest.status, asMember.status, asAdmin.status]).toEqual([401, 403, 200]);
    expect(secretsIn(asGuest.text)).toEqual([]);
    expect(secretsIn(asMember.text)).toEqual([]);
    expect(secretsIn(asAdmin.text)).not.toEqual([]);
  });

  it("/admin/review: a guest is sent to /login and a user gets the 403 interrupt, neither reads a row", async () => {
    const list = vi.spyOn(KudoAdminQuery, "list");
    const render = () => AdminReviewPage({ searchParams: Promise.resolve(filterParams()) });
    const asGuest = await thrownBy(render());
    await signedInAs(member);
    const asMember = await thrownBy(render());

    expect(redirectLocationOf(asGuest)).toBe("/login");
    expect(authInterruptStatusOf(asMember)).toBe(403);
    expect(secretsIn(interruptText(asGuest) + interruptText(asMember))).toEqual([]);
    expect(list).not.toHaveBeenCalled();

    await signedInAs(admin);
    const screen = await render();
    expect(secretsIn(JSON.stringify(screen.props.data))).toEqual([anonSender.id, anonSender.email, anonSender.fullName]);
  });
});
