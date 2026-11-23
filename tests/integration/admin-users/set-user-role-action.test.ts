import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setUserRoleAction } from "@/features/admin-users/server/set-user-role-action";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { roleOf, setRoles } from "./admin-users-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * setUserRoleAction (A3 entry point, FR-601/602, SC-007): an untrusted POST, so `requireAdmin()` runs
 * FIRST — guest → /login, user or demoted admin → 403 interrupt, nothing written; the actor comes from
 * the session only. Then Zod (INVALID), then the service; `/admin/users` is refreshed after every
 * service answer so the row re-renders in the same round trip.
 */
let admin: Sunner, otherAdmin: Sunner, member: Sunner, demoted: Sunner;

beforeAll(async () => {
  [admin, otherAdmin, member, demoted] = await Promise.all(
    ["act-admin", "act-admin2", "act-member", "act-demoted"].map((prefix) => createSunner(prefix, `${prefix} name`)),
  );
});
beforeEach(async () => {
  requestCookies.clear();
  vi.mocked(revalidatePath).mockClear();
  await setRoles([admin.id, otherAdmin.id], "admin");
  await setRoles([member.id, demoted.id], "user");
});
afterAll(async () => {
  await cleanupSunners([admin, otherAdmin, member, demoted]);
  await closeAppDb();
});

const signedInAs = (sunner: Sunner) => signInToJar(requestCookies, sunner.email);
const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

describe("setUserRoleAction — access", () => {
  it("redirects a guest to /login and writes nothing", async () => {
    expect(redirectLocationOf(await thrownBy(setUserRoleAction({ userId: member.id, role: "admin" })))).toBe("/login");
    expect(await roleOf(member.id)).toMatchObject({ role: "user", role_updated_by: null });
  });

  it("answers 403 to a user and to an admin demoted after signing in, and writes nothing", async () => {
    await signedInAs(member);
    const asMember = await thrownBy(setUserRoleAction({ userId: member.id, role: "admin" }));
    await setRoles([demoted.id], "admin");
    await signedInAs(demoted);
    await setRoles([demoted.id], "user");
    const asDemoted = await thrownBy(setUserRoleAction({ userId: otherAdmin.id, role: "user" }));
    expect([asMember, asDemoted].map(authInterruptStatusOf)).toEqual([403, 403]);
    expect(await roleOf(member.id)).toMatchObject({ role: "user", role_updated_by: null });
    expect(await roleOf(otherAdmin.id)).toMatchObject({ role: "admin", role_updated_by: null });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("setUserRoleAction — admin", () => {
  it("promotes with the session actor and refreshes /admin/users", async () => {
    await signedInAs(admin);
    expect(await setUserRoleAction({ userId: member.id, role: "admin" })).toEqual({ ok: true, id: member.id, role: "admin" });
    expect(await roleOf(member.id)).toMatchObject({ role: "admin", role_updated_by: admin.id });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/admin/users"]]);
  });

  it("passes guard refusals through in-band (self-demotion → SELF_DEMOTE)", async () => {
    await signedInAs(admin);
    expect(await setUserRoleAction({ userId: admin.id, role: "user" })).toEqual({ ok: false, error: "SELF_DEMOTE" });
    expect(await roleOf(admin.id)).toMatchObject({ role: "admin" });
  });

  it.each([
    ["a malformed id", { userId: "not-a-uuid", role: "admin" }],
    ["an unknown role", { userId: "00000000-0000-4000-8000-000000000000", role: "owner" }],
    ["no input", undefined],
  ])("answers INVALID for %s without touching the database", async (_label, input) => {
    await signedInAs(admin);
    expect(await setUserRoleAction(input as never)).toEqual({ ok: false, error: "INVALID" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
