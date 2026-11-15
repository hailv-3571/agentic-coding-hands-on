import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin, resolveAdminAccess } from "@/shared/auth/admin-guard";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import {
  closeAppDb,
  authInterruptStatusOf,
  createAuthUser,
  deleteAuthUsers,
  redirectLocationOf,
  signInToJar,
  uniqueEmail,
} from "./auth-test-users";
import { requestCookies } from "./next-request-stub";

vi.mock("next/headers", async () => (await import("./next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("./next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** AdminGuard#requireAdmin (A7, SC-005): role read from the DB on every call (BR-003). */
const member = { id: "", email: uniqueEmail("guard-user") };
const admin = { id: "", email: uniqueEmail("guard-admin") };

beforeAll(async () => {
  member.id = (await createAuthUser(member.email)).id;
  admin.id = (await createAuthUser(admin.email, { full_name: "Guard Admin" })).id;
});
beforeEach(async () => {
  requestCookies.clear();
  await testDb.update(profiles).set({ role: "admin" }).where(eq(profiles.id, admin.id));
});
afterAll(async () => {
  await deleteAuthUsers([member.id, admin.id]);
  await closeAppDb();
});

const catchThrown = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

describe("requireAdmin", () => {
  it("redirects a guest to /login", async () => {
    expect(redirectLocationOf(await catchThrown(requireAdmin()))).toBe("/login");
  });

  it("answers 403 to a signed-in user", async () => {
    await signInToJar(requestCookies, member.email);
    expect(authInterruptStatusOf(await catchThrown(requireAdmin()))).toBe(403);
  });

  it("lets an admin through with their profile", async () => {
    await signInToJar(requestCookies, admin.email);
    const context = await requireAdmin();
    expect(context.userId).toBe(admin.id);
    expect(context.profile).toMatchObject({ id: admin.id, role: "admin", fullName: "Guard Admin" });
  });

  it("answers 403 on the very next call after a mid-session demotion (same cookies)", async () => {
    await signInToJar(requestCookies, admin.email);
    await requireAdmin();
    await testDb.update(profiles).set({ role: "user" }).where(eq(profiles.id, admin.id));
    expect(authInterruptStatusOf(await catchThrown(requireAdmin()))).toBe(403);
  });
});

describe("resolveAdminAccess (for JSON route handlers)", () => {
  it("reports unauthenticated, forbidden and granted without throwing", async () => {
    expect(await resolveAdminAccess()).toEqual({ status: "unauthenticated" });

    await signInToJar(requestCookies, member.email);
    expect(await resolveAdminAccess()).toEqual({ status: "forbidden" });

    requestCookies.clear();
    await signInToJar(requestCookies, admin.email);
    expect(await resolveAdminAccess()).toMatchObject({ status: "granted", userId: admin.id });
  });
});
