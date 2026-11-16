import { z } from "zod";

/**
 * Query of GET /api/sunners/search (C-06, one endpoint for phases 04/05/08/12):
 * `q` 1..50 characters after trim, `limit` 1..20 (default 10), `excludeSelf` true|false|1|0
 * (default false — the composer's recipient picker sends true; profile/admin search keep self).
 * Issue messages are error keys: "required" | "invalid".
 */
export const SUNNER_SEARCH_LIMITS = { Q_MAX: 50, LIMIT_MAX: 20, LIMIT_DEFAULT: 10 } as const;

const flag = z.enum(["true", "false", "1", "0"], { error: "invalid" }).transform((value) => value === "true" || value === "1");

export const SunnerSearchParamsSchema = z.object({
  q: z
    .string({ error: "required" })
    .trim()
    .min(1, { error: "required" })
    .max(SUNNER_SEARCH_LIMITS.Q_MAX, { error: "invalid" }),
  limit: z
    .string()
    .regex(/^\d+$/, { error: "invalid" })
    .transform(Number)
    .pipe(z.number().int().min(1, { error: "invalid" }).max(SUNNER_SEARCH_LIMITS.LIMIT_MAX, { error: "invalid" }))
    .default(SUNNER_SEARCH_LIMITS.LIMIT_DEFAULT),
  excludeSelf: flag.default(false),
});

export type SunnerSearchParams = z.output<typeof SunnerSearchParamsSchema>;

export type SunnerSearchParamsResult =
  | { ok: true; data: SunnerSearchParams }
  | { ok: false; fieldErrors: Record<string, ("required" | "invalid")[]> };

/** Absent keys take their defaults; a present-but-empty `limit`/`excludeSelf` is invalid. */
export function parseSunnerSearchParams(params: URLSearchParams): SunnerSearchParamsResult {
  const raw = Object.fromEntries(["q", "limit", "excludeSelf"].flatMap((key) => {
    const value = params.get(key);
    return value === null ? [] : [[key, value]];
  }));
  const parsed = SunnerSearchParamsSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Record<string, ("required" | "invalid")[]> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]);
    const message = issue.message === "required" ? "required" : "invalid";
    if (!fieldErrors[key]?.includes(message)) (fieldErrors[key] ??= []).push(message);
  }
  return { ok: false, fieldErrors };
}
