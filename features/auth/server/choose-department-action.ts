"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/auth/current-user";
import { LOGIN_PATH } from "@/shared/auth/public-paths";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { db } from "@/shared/db/client";
import { departments, profiles } from "@/shared/db/schema";
import { chooseDepartmentSchema } from "../schemas/choose-department-schema";

export type ChooseDepartmentError = "invalid_department" | "unexpected";
export type ChooseDepartmentState = { error: ChooseDepartmentError | null };

type AssignOutcome = "assigned" | "already_set" | "department_not_found" | "profile_missing";

/** Sets the department only while it is still empty: later changes are out of scope. */
async function assignFirstDepartment(userId: string, departmentId: string): Promise<AssignOutcome> {
  const [department] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);
  if (!department) return "department_not_found";

  const updated = await db
    .update(profiles)
    .set({ departmentId })
    .where(and(eq(profiles.id, userId), isNull(profiles.departmentId)))
    .returning({ id: profiles.id });
  if (updated.length > 0) return "assigned";

  // Nothing updated: a repeat submit (department already set) or no profile row at all.
  const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  return profile ? "already_set" : "profile_missing";
}

/**
 * Onboarding form action (useActionState). Success — and a repeated submit after the
 * department is already set — redirects to the safe `next`; validation and DB failures
 * come back as an error code for the form to show.
 */
export async function chooseDepartment(
  _previous: ChooseDepartmentState,
  formData: FormData,
): Promise<ChooseDepartmentState> {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);

  const parsed = chooseDepartmentSchema.safeParse({
    departmentId: formData.get("departmentId"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "invalid_department" };

  let outcome: AssignOutcome;
  try {
    outcome = await assignFirstDepartment(user.userId, parsed.data.departmentId);
  } catch (error) {
    console.error("[auth] saving the first department failed", error);
    return { error: "unexpected" };
  }
  if (outcome === "department_not_found") return { error: "invalid_department" };
  if (outcome === "profile_missing") {
    console.error("[auth] department chosen by a session without a profile row", { userId: user.userId });
    return { error: "unexpected" };
  }

  redirect(safeNextPath(parsed.data.next));
}
