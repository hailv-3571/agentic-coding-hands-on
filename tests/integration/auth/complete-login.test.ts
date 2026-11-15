import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { completeLogin } from "@/features/auth/server/complete-login";
import { env } from "@/shared/config/env";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import {
  closeAppDb,
  createAuthUser,
  deleteAuthUsers,
  departmentIdByCode,
  recreateAuthUser,
  uniqueEmail,
} from "./auth-test-users";

/** Callback logic (A2): domain re-check, last_login_at, ADMIN_EMAILS promotion, destination. */
const createdUserIds = new Set<string>();
afterAll(async () => {
  await deleteAuthUsers(createdUserIds);
  await closeAppDb();
});

async function newSunner(email = uniqueEmail("login")) {
  const user = await createAuthUser(email, { full_name: "Login Test" });
  createdUserIds.add(user.id);
  return { id: user.id, email };
}

const readProfile = async (id: string) => {
  const [row] = await testDb
    .select({ role: profiles.role, lastLoginAt: profiles.lastLoginAt, departmentId: profiles.departmentId })
    .from(profiles)
    .where(eq(profiles.id, id));
  return row;
};

describe("completeLogin", () => {
  it("sends a first-time Sunner to the department picker with the safe next, stamping last_login_at", async () => {
    const sunner = await newSunner();
    const result = await completeLogin({ userId: sunner.id, email: sunner.email, next: "/kudos?tab=all" });
    expect(result).toEqual({ ok: true, destination: "/onboarding/department?next=%2Fkudos%3Ftab%3Dall" });
    const profile = await readProfile(sunner.id);
    expect(profile.role).toBe("user");
    expect(profile.lastLoginAt).toBeInstanceOf(Date);
  });

  it("sends an onboarded Sunner straight to next and moves last_login_at forward (SC-003)", async () => {
    const sunner = await newSunner();
    await testDb.update(profiles).set({ departmentId: await departmentIdByCode("OPD") }).where(eq(profiles.id, sunner.id));
    await completeLogin({ userId: sunner.id, email: sunner.email, next: "/" });
    const first = (await readProfile(sunner.id)).lastLoginAt!;

    const result = await completeLogin({ userId: sunner.id, email: sunner.email, next: "/kudos" });
    expect(result).toEqual({ ok: true, destination: "/kudos" });
    expect((await readProfile(sunner.id)).lastLoginAt!.getTime()).toBeGreaterThan(first.getTime());
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com"])("drops the unsafe next %s", async (next) => {
    const sunner = await newSunner();
    expect(await completeLogin({ userId: sunner.id, email: sunner.email, next })).toEqual({
      ok: true,
      destination: "/onboarding/department",
    });
  });

  it("promotes an ADMIN_EMAILS account on every login, even after a manual demotion", async () => {
    const adminEmail = env.ADMIN_EMAILS[0];
    const user = await recreateAuthUser(adminEmail.toUpperCase(), { full_name: "Env Admin" });
    createdUserIds.add(user.id);
    expect((await readProfile(user.id)).role).toBe("user"); // trigger never creates admins (BR-002)

    await completeLogin({ userId: user.id, email: user.email, next: "/" });
    expect((await readProfile(user.id)).role).toBe("admin");

    await testDb.update(profiles).set({ role: "user" }).where(eq(profiles.id, user.id));
    await completeLogin({ userId: user.id, email: user.email, next: "/" });
    expect((await readProfile(user.id)).role).toBe("admin");
  });

  it("never promotes an account outside ADMIN_EMAILS", async () => {
    const sunner = await newSunner();
    await completeLogin({ userId: sunner.id, email: sunner.email, next: "/" });
    expect((await readProfile(sunner.id)).role).toBe("user");
  });

  it("rejects a session whose email is outside the allowed domain and leaves the profile untouched", async () => {
    const sunner = await newSunner();
    for (const email of ["someone@gmail.com", "x@evil.sun-asterisk.com", null]) {
      expect(await completeLogin({ userId: sunner.id, email, next: "/" })).toEqual({
        ok: false,
        code: "domain_not_allowed",
      });
    }
    expect((await readProfile(sunner.id)).lastLoginAt).toBeNull();
  });

  it("fails with auth_failed when the account has no profile", async () => {
    expect(await completeLogin({ userId: randomUUID(), email: uniqueEmail("ghost"), next: "/" })).toEqual({
      ok: false,
      code: "auth_failed",
    });
  });
});
