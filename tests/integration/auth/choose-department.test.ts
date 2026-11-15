import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseDepartment } from "@/features/auth/server/choose-department-action";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import {
  closeAppDb,
  createAuthUser,
  deleteAuthUsers,
  departmentIdByCode,
  redirectLocationOf,
  signInToJar,
  uniqueEmail,
} from "./auth-test-users";
import { requestCookies } from "./next-request-stub";

vi.mock("next/headers", async () => (await import("./next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("./next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** First-login department self-select (decision-log): once only, own profile only. */
const sunner = { id: "", email: uniqueEmail("onboard") };
const bystander = { id: "", email: uniqueEmail("bystander") };
const idle = { error: null };

beforeAll(async () => {
  sunner.id = (await createAuthUser(sunner.email)).id;
  bystander.id = (await createAuthUser(bystander.email)).id;
});
beforeEach(async () => {
  requestCookies.clear();
  await testDb.update(profiles).set({ departmentId: null }).where(inArray(profiles.id, [sunner.id, bystander.id]));
});
afterAll(async () => {
  await deleteAuthUsers([sunner.id, bystander.id]);
  await closeAppDb();
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const departmentOf = async (id: string) =>
  (await testDb.select({ departmentId: profiles.departmentId }).from(profiles).where(eq(profiles.id, id)))[0]
    .departmentId;
const catchThrown = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

describe("chooseDepartment", () => {
  it("saves the department on the caller's own profile and continues to the safe next", async () => {
    const cevc2 = await departmentIdByCode("CEVC2");
    await signInToJar(requestCookies, sunner.email);
    // A client-supplied id must be ignored: userId always comes from the session.
    const thrown = await catchThrown(
      chooseDepartment(idle, form({ departmentId: cevc2, next: "/kudos", userId: bystander.id, id: bystander.id })),
    );
    expect(redirectLocationOf(thrown)).toBe("/kudos");
    expect(await departmentOf(sunner.id)).toBe(cevc2);
    expect(await departmentOf(bystander.id)).toBeNull();
  });

  it("is a no-op the second time: the first choice stays", async () => {
    const [infra, opd] = [await departmentIdByCode("Infra"), await departmentIdByCode("OPD")];
    await signInToJar(requestCookies, sunner.email);
    await catchThrown(chooseDepartment(idle, form({ departmentId: infra })));
    const thrown = await catchThrown(chooseDepartment(idle, form({ departmentId: opd, next: "/" })));
    expect(redirectLocationOf(thrown)).toBe("/");
    expect(await departmentOf(sunner.id)).toBe(infra);
  });

  it("drops an unsafe next", async () => {
    await signInToJar(requestCookies, sunner.email);
    const thrown = await catchThrown(
      chooseDepartment(idle, form({ departmentId: await departmentIdByCode("CEVC3"), next: "//evil.com" })),
    );
    expect(redirectLocationOf(thrown)).toBe("/");
  });

  it.each([
    ["missing", {}],
    ["not a uuid", { departmentId: "CEVC1" }],
    ["unknown uuid", { departmentId: randomUUID() }],
  ])("returns invalid_department for a %s department and saves nothing", async (_label, fields) => {
    await signInToJar(requestCookies, sunner.email);
    expect(await chooseDepartment(idle, form(fields))).toEqual({ error: "invalid_department" });
    expect(await departmentOf(sunner.id)).toBeNull();
  });

  it("reports unexpected, not success, when the caller's profile row is missing (auth-flow S2)", async () => {
    const orphanEmail = uniqueEmail("onboard-orphan");
    const orphan = await createAuthUser(orphanEmail);
    try {
      await testDb.delete(profiles).where(eq(profiles.id, orphan.id));
      await signInToJar(requestCookies, orphanEmail);
      expect(await chooseDepartment(idle, form({ departmentId: await departmentIdByCode("OPD") }))).toEqual({
        error: "unexpected",
      });
    } finally {
      await deleteAuthUsers([orphan.id]);
    }
  });

  it("redirects a caller without a session to /login", async () => {
    const thrown = await catchThrown(chooseDepartment(idle, form({ departmentId: await departmentIdByCode("CEVC4") })));
    expect(redirectLocationOf(thrown)).toBe("/login");
  });
});
