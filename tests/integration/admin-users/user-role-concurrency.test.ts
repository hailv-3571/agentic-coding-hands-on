import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { UserRoleService } from "@/features/admin-users/server/user-role-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { roleOf, setRoles, waitForLockWaiters, withAdminRowsLocked } from "./admin-users-fixtures";

/**
 * BR-003 / FR-405 / FR-406 — "always at least one admin", under real concurrency. These cases need the
 * WHOLE database to hold exactly the admins they set up, so every other admin is demoted for the
 * duration of the file and restored afterwards (integration files run serially, never next to
 * Playwright). Both demotions are queued behind a held admin-row lock, then released together, so each
 * of the 20 iterations is a genuine race: exactly one succeeds, the other is refused 409 LAST_ADMIN,
 * one admin remains, and nothing deadlocks (a deadlock would reject a call with 40P01).
 */
const ITERATIONS = 20;
let alice: Sunner, bob: Sunner;
let otherAdmins: string[] = [];

beforeAll(async () => {
  [alice, bob] = await Promise.all([createSunner("race-alice", "Race Alice"), createSunner("race-bob", "Race Bob")]);
  const demoted = await testSql<{ id: string }[]>`
    update public.profiles set role = 'user' where role = 'admin' and id <> all(${[alice.id, bob.id]}::uuid[]) returning id`;
  otherAdmins = demoted.map((row) => row.id);
});
beforeEach(async () => setRoles([alice.id, bob.id], "admin"));
afterAll(async () => {
  try {
    if (otherAdmins.length > 0) await testSql`update public.profiles set role = 'admin' where id = any(${otherAdmins}::uuid[])`;
  } finally {
    await cleanupSunners([alice, bob]);
    await closeAppDb();
  }
});

const adminCount = async () => {
  const [row] = await testSql<{ count: number }[]>`select count(*)::int as count from public.profiles where role = 'admin'`;
  return row.count;
};

describe("two admins demoting each other at the same time", () => {
  it(`never leaves zero admins: one wins, the other gets LAST_ADMIN (${ITERATIONS} races)`, async () => {
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      await setRoles([alice.id, bob.id], "admin");
      let calls: Promise<unknown>[] = [];
      await withAdminRowsLocked(async () => {
        calls = [
          UserRoleService.setRole({ actorId: alice.id, userId: bob.id, role: "user" }),
          UserRoleService.setRole({ actorId: bob.id, userId: alice.id, role: "user" }),
        ];
        await waitForLockWaiters(2);
      });
      const results = await Promise.all(calls);
      const wins = results.filter((result) => (result as { ok: boolean }).ok);
      const refusals = results.filter((result) => !(result as { ok: boolean }).ok);
      expect(wins).toHaveLength(1);
      expect(refusals).toEqual([{ ok: false, error: "LAST_ADMIN" }]);
      expect(await adminCount()).toBe(1);
      const winner = (wins[0] as { id: string }).id === bob.id ? alice : bob;
      const loser = winner === alice ? bob : alice;
      expect(await roleOf(winner.id)).toMatchObject({ role: "admin", role_updated_by: null });
      expect(await roleOf(loser.id)).toMatchObject({ role: "user", role_updated_by: winner.id });
    }
  });
});

describe("the last admin", () => {
  it("cannot be demoted by a caller who already lost the role (stale page), and stays admin", async () => {
    await setRoles([bob.id], "user");
    expect(await UserRoleService.setRole({ actorId: bob.id, userId: alice.id, role: "user" })).toEqual({ ok: false, error: "LAST_ADMIN" });
    expect(await roleOf(alice.id)).toEqual({ role: "admin", role_updated_by: null, role_updated_at: null });
    expect(await adminCount()).toBe(1);
  });

  it("cannot demote themself either (SELF_DEMOTE wins over LAST_ADMIN)", async () => {
    await setRoles([bob.id], "user");
    expect(await UserRoleService.setRole({ actorId: alice.id, userId: alice.id, role: "user" })).toEqual({ ok: false, error: "SELF_DEMOTE" });
    expect(await adminCount()).toBe(1);
  });
});
