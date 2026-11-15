import { z } from "zod";

/**
 * First-login department choice. Only the department id and the return path are read; any
 * other field (e.g. a forged `userId`) is stripped — the user always comes from the session.
 * `next` is sanitized separately with `safeNextPath`.
 */
export const chooseDepartmentSchema = z.object({
  departmentId: z.uuid(),
  next: z.string().max(2048).optional(),
});

export type ChooseDepartmentInput = z.infer<typeof chooseDepartmentSchema>;
