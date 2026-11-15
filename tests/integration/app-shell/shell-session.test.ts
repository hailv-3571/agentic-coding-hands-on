import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getShellUser } from "@/features/app-shell/server/shell-session";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import { closeAppDb, createAuthUser, deleteAuthUsers, signInToJar, uniqueEmail } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** getShellUser: the only user data that reaches the shell's client components (logic W2). */
const sunner = { id: "", email: uniqueEmail("shell.display") };

beforeAll(async () => {
  sunner.id = (await createAuthUser(sunner.email, { full_name: "Shell Display" })).id;
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await deleteAuthUsers([sunner.id]);
  await closeAppDb();
});

const setFullName = (fullName: string) =>
  testDb.update(profiles).set({ fullName }).where(eq(profiles.id, sunner.id));

describe("getShellUser", () => {
  it("returns null for a guest", async () => {
    expect(await getShellUser()).toBeNull();
  });

  it("shows the profile name", async () => {
    await setFullName("Shell Display");
    await signInToJar(requestCookies, sunner.email);
    expect(await getShellUser()).toEqual({ name: "Shell Display", avatarUrl: null, isAdmin: false });
  });

  it.each(["", "   "])("falls back to the email local part, never the address, for the name %j", async (blank) => {
    await setFullName(blank);
    await signInToJar(requestCookies, sunner.email);
    const user = await getShellUser();
    expect(user?.name).toBe(sunner.email.split("@")[0]);
    expect(JSON.stringify(user)).not.toContain("@");
  });
});
