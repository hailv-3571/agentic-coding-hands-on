import { randomUUID } from "node:crypto";
import { testSql } from "../../setup/integration-db";
import { createAuthUser, uniqueEmail } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Fixtures for the phase 14 (F014/F015) integration tests on the local Supabase stack. Sunners come
 * from phase 04's `createSunner` / `cleanupSunners`; this file adds role probes, an admin-row lock the
 * concurrency tests hold while role changes queue behind it, and throw-away departments so per-unit
 * numbers are isolated from whatever else the shared database holds.
 */
export type RoleSnapshot = { role: string; role_updated_by: string | null; role_updated_at: string | null };

export async function roleOf(userId: string): Promise<RoleSnapshot> {
  const [row] = await testSql<RoleSnapshot[]>`
    select role::text as role, role_updated_by, to_json(role_updated_at) #>> '{}' as role_updated_at
    from public.profiles where id = ${userId}`;
  return row;
}

export async function setRoles(userIds: string[], role: "admin" | "user"): Promise<void> {
  await testSql`
    update public.profiles set role = ${role}, role_updated_by = null, role_updated_at = null
    where id = any(${userIds}::uuid[])`;
}

/** A Sunner with no department (profile trigger default) and a name containing `token`. */
export async function createUnassignedSunner(prefix: string, fullName: string): Promise<Sunner> {
  const email = uniqueEmail(prefix);
  const { id } = await createAuthUser(email, { full_name: fullName });
  return { id, email, fullName };
}

/** Backends of the app pool waiting on a row lock (the role service queued behind `lockAdminRows`). */
async function lockWaiters(): Promise<number> {
  const [row] = await testSql<{ count: number }[]>`
    select count(*)::int as count from pg_stat_activity
    where wait_event_type = 'Lock' and query ilike '%from "profiles"%for update%'`;
  return row.count;
}

export async function waitForLockWaiters(count: number, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while ((await lockWaiters()) < count) {
    if (Date.now() > deadline) throw new Error(`expected ${count} role changes waiting on the admin-row lock`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Holds `FOR UPDATE` on every admin row (same statement shape as the role service) while `whileLocked`
 * starts role changes and waits for them to queue; `beforeRelease` runs inside the lock-holding
 * transaction (e.g. a mid-flight demotion), then the commit lets the queued changes race.
 */
export async function withAdminRowsLocked(
  whileLocked: () => Promise<void>,
  beforeRelease: (sql: typeof testSql) => Promise<unknown> = async () => {},
): Promise<void> {
  await testSql.begin(async (lockTx) => {
    await lockTx`select id from public.profiles where role = 'admin' order by id for update`;
    await whileLocked();
    await beforeRelease(lockTx as unknown as typeof testSql);
  });
}

/** A department only this test file uses; `name` is shown verbatim (vi and en). */
export async function createTestDepartment(name: string): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`
    insert into public.departments (code, name_vi, name_en, sort_order)
    values (${`P14-${randomUUID().slice(0, 8)}`}, ${name}, ${name}, 900) returning id`;
  return row.id;
}

export async function moveToTestDepartment(sunners: Sunner[], departmentId: string | null): Promise<void> {
  await testSql`update public.profiles set department_id = ${departmentId} where id = any(${sunners.map((s) => s.id)}::uuid[])`;
}

/** Run after `cleanupSunners` (profiles reference departments). */
export async function deleteTestDepartments(ids: string[]): Promise<void> {
  if (ids.length > 0) await testSql`delete from public.departments where id = any(${ids}::uuid[])`;
}

export async function insertIcon(userId: string, iconCode: string): Promise<void> {
  await testSql`insert into public.user_icons (user_id, icon_code) values (${userId}, ${iconCode})`;
}

export async function insertMysteryGift(userId: string, completedAt: string): Promise<void> {
  await testSql`insert into public.mystery_gift_awards (user_id, gift_name, completed_at) values (${userId}, 'Quà bí ẩn', ${completedAt})`;
}

export async function insertSecretBox(userId: string, seq: number, grantedAt: string): Promise<void> {
  await testSql`insert into public.secret_boxes (user_id, seq, granted_at) values (${userId}, ${seq}, ${grantedAt})`;
}

export async function setLastLogin(userId: string, at: string | null): Promise<void> {
  await testSql`update public.profiles set last_login_at = ${at} where id = ${userId}`;
}

/** A token no seeded or leftover profile name contains, so `q` isolates this file's Sunners. */
export const uniqueToken = (prefix: string) => `${prefix}${randomUUID().replace(/\D/g, "").slice(0, 6)}`;
