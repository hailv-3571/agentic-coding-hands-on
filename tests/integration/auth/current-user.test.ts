import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionUser, requireSunner } from "@/shared/auth/current-user";
import { signOut } from "@/shared/auth/sign-out-action";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import {
  closeAppDb,
  createAuthUser,
  deleteAuthUsers,
  departmentIdByCode,
  redirectLocationOf,
  revokeSessionOf,
  signInToJar,
  uniqueEmail,
} from "./auth-test-users";
import { requestCookies } from "./next-request-stub";

vi.mock("next/headers", async () => (await import("./next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("./next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** Session helpers on a real local-Supabase session (cookies from a password sign-in). */
const sunner = { id: "", email: uniqueEmail("current") };

beforeAll(async () => {
  sunner.id = (await createAuthUser(sunner.email, { full_name: "Current User" })).id;
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await deleteAuthUsers([sunner.id]);
  await closeAppDb();
});

const catchThrown = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

describe("getSessionUser", () => {
  it("returns null without session cookies", async () => {
    expect(await getSessionUser()).toBeNull();
  });

  it("returns the verified user id and email for a real session", async () => {
    await signInToJar(requestCookies, sunner.email);
    expect(await getSessionUser()).toEqual({ userId: sunner.id, email: sunner.email });
  });

  it("treats a forged session cookie as signed out", async () => {
    await signInToJar(requestCookies, sunner.email);
    for (const { name } of requestCookies.getAll()) requestCookies.set(name, "base64-eyJmb3JnZWQiOnRydWV9");
    expect(await getSessionUser()).toBeNull();
  });

  it("rejects a session revoked on the Auth server while its cookies are still present", async () => {
    await signInToJar(requestCookies, sunner.email);
    await revokeSessionOf(requestCookies);
    expect(requestCookies.getAll().length).toBeGreaterThan(0);
    expect(await getSessionUser()).toBeNull();
  });
});

describe("requireSunner", () => {
  it("redirects a guest to /login", async () => {
    expect(redirectLocationOf(await catchThrown(requireSunner()))).toBe("/login");
  });

  it("redirects a Sunner without a department to the picker before any (app) page", async () => {
    await testDb.update(profiles).set({ departmentId: null }).where(eq(profiles.id, sunner.id));
    await signInToJar(requestCookies, sunner.email);
    expect(redirectLocationOf(await catchThrown(requireSunner()))).toBe("/onboarding/department");
  });

  it("returns the profile of an onboarded Sunner", async () => {
    const departmentId = await departmentIdByCode("CEVC1");
    await testDb.update(profiles).set({ departmentId }).where(eq(profiles.id, sunner.id));
    await signInToJar(requestCookies, sunner.email);
    expect(await requireSunner()).toEqual({
      userId: sunner.id,
      profile: {
        id: sunner.id,
        email: sunner.email,
        fullName: "Current User",
        avatarUrl: null,
        departmentId,
        role: "user",
      },
    });
  });
});

describe("signOut (FR-403)", () => {
  it("ends the session and redirects to /login", async () => {
    await signInToJar(requestCookies, sunner.email);
    expect(redirectLocationOf(await catchThrown(signOut()))).toBe("/login");
    expect(requestCookies.getAll()).toEqual([]);
    expect(await getSessionUser()).toBeNull();
  });

  it("still redirects to /login when there is no session any more", async () => {
    expect(redirectLocationOf(await catchThrown(signOut()))).toBe("/login");
  });
});
