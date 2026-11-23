import { z } from "zod";

/**
 * Input of `setUserRoleAction` (F014 A3): the target profile and the wanted role. The acting admin is
 * NEVER part of the input — the action takes it from the session (`requireAdmin()`).
 */
export const setUserRoleInputSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["admin", "user"]),
});

export type SetUserRoleInput = z.infer<typeof setUserRoleInputSchema>;
