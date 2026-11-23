import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { profiles } from "@/shared/db/schema";
import type { AdminUserRole, SetUserRoleResult } from "../schemas/admin-user-views";
import { isEnvAdminEmail } from "./env-admin-email";

/**
 * UserRoleService (F014 A3, SM-001): the ONE writer of `profiles.role` from the admin UI, plus its
 * audit columns (FR-002). One transaction per change:
 * 1. `SELECT id … WHERE role = 'admin' ORDER BY id FOR UPDATE` — every role change locks the admin
 *    rows in the same (id) order, so concurrent changes queue instead of deadlocking. A change that
 *    waited re-reads the rows (READ COMMITTED): an admin demoted meanwhile drops out of the set.
 * 2. Unknown target → NOT_FOUND. Target already has the role → current state, no write (BR-001).
 * 3. Demotion guards, in this order: self → SELF_DEMOTE (BR-002, even with other admins); an
 *    ADMIN_EMAILS account → ENV_ADMIN (login would re-promote it); the locked set has ≤ 1 admin →
 *    LAST_ADMIN (BR-003). So of two admins demoting each other, the second sees one admin and gets
 *    LAST_ADMIN (spec § 3.4), never a zero-admin system.
 * 4. Actor not in the locked set → FORBIDDEN: closes the gap between the caller's `requireAdmin()`
 *    and this transaction (an actor demoted meanwhile never writes).
 * 5. Conditional UPDATE (`role <> target role`) so even an unexpected interleaving cannot overwrite.
 * Callers pass the actor from the session only (`requireAdmin()`), never from the client.
 */
export type UserRoleChange = { actorId: string; userId: string; role: AdminUserRole };
export type UserRoleRefusal = "NOT_FOUND" | "SELF_DEMOTE" | "LAST_ADMIN" | "ENV_ADMIN" | "FORBIDDEN";
export type UserRoleChangeResult = Extract<SetUserRoleResult, { ok: true }> | { ok: false; error: UserRoleRefusal };

const refuse = (error: UserRoleRefusal): UserRoleChangeResult => ({ ok: false, error });

async function setRole({ actorId, userId, role }: UserRoleChange): Promise<UserRoleChangeResult> {
  return db.transaction(async (tx) => {
    const admins = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.role, "admin"))
      .orderBy(asc(profiles.id))
      .for("update");
    const [target] = await tx.select({ role: profiles.role, email: profiles.email }).from(profiles).where(eq(profiles.id, userId));
    if (!target) return refuse("NOT_FOUND");
    if (target.role === role) return { ok: true, id: userId, role };

    if (role === "user") {
      if (userId === actorId) return refuse("SELF_DEMOTE");
      if (isEnvAdminEmail(target.email)) return refuse("ENV_ADMIN");
      if (admins.length <= 1) return refuse("LAST_ADMIN");
    }
    if (!admins.some((admin) => admin.id === actorId)) return refuse("FORBIDDEN");

    await tx
      .update(profiles)
      .set({ role, roleUpdatedBy: actorId, roleUpdatedAt: sql`now()` })
      .where(and(eq(profiles.id, userId), ne(profiles.role, role)));
    return { ok: true, id: userId, role };
  });
}

export const UserRoleService = { setRole } as const;
