import { z } from "zod";
import { HERO_TIERS } from "@/features/hero-badges/schemas/hero-tier";
import {
  ADMIN_USER_PARAMS,
  ADMIN_USER_SORTS,
  type AdminUserFilterValues,
  type AdminUsersScreenProps,
} from "./admin-user-views";

/**
 * Admin › User URL params → `AdminUserFilterValues` (BR-004: the page and GET /api/admin/users/export
 * parse the same names, so the file always matches the table). Every value is whitelisted — sort and
 * filters never reach SQL unchecked. Empty values mean "absent"; `q` is trimmed (whitespace only = no
 * search) and capped at USER_SEARCH_MAX_LENGTH characters → `query_too_long`; a repeated key, a bad
 * page / unit / level / role / sort / dir → `invalid_params`. `sort` absent = the fixed default order
 * (name A–Z, then id); `dir` defaults to `desc` (the UI always writes it next to `sort`).
 */
export const USER_SEARCH_MAX_LENGTH = 100;

export const DEFAULT_ADMIN_USER_FILTER: AdminUserFilterValues = {
  page: 1,
  unit: null,
  level: null,
  role: null,
  query: "",
  sort: null,
  dir: "desc",
};

export type UserListParamsError = NonNullable<AdminUsersScreenProps["filterError"]>;
export type UserListParamsResult = { ok: true; value: AdminUserFilterValues } | { ok: false; error: UserListParamsError };

/** `searchParams` of a page (record) or `request.nextUrl.searchParams` of a route handler. */
export type UserListRawParams = URLSearchParams | Record<string, string | string[] | undefined>;

const REPEATED = Symbol("repeated");

function readParam(params: UserListRawParams, name: string): string | undefined | typeof REPEATED {
  const values = params instanceof URLSearchParams ? params.getAll(name) : [params[name] ?? []].flat();
  if (values.length > 1) return REPEATED;
  return values[0] === "" ? undefined : values[0];
}

const nullable = <T extends z.ZodType>(schema: T) => schema.optional().transform((value) => value ?? null);

const UserListParamsSchema = z.object({
  page: z
    .string()
    .regex(/^\d{1,9}$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .transform((value) => value ?? DEFAULT_ADMIN_USER_FILTER.page),
  unit: nullable(z.union([z.literal("none"), z.uuid()])),
  level: nullable(z.enum([...HERO_TIERS, "none"])),
  role: nullable(z.enum(["admin", "user"])),
  sort: nullable(z.enum(ADMIN_USER_SORTS)),
  dir: z.enum(["asc", "desc"]).default(DEFAULT_ADMIN_USER_FILTER.dir),
});

export function parseUserListParams(params: UserListRawParams): UserListParamsResult {
  const raw: Record<string, string | undefined> = {};
  for (const [field, name] of Object.entries(ADMIN_USER_PARAMS)) {
    const value = readParam(params, name);
    if (value === REPEATED) return { ok: false, error: "invalid_params" };
    raw[field] = value;
  }
  const query = raw.query?.trim() ?? "";
  if ([...query].length > USER_SEARCH_MAX_LENGTH) return { ok: false, error: "query_too_long" };
  const parsed = UserListParamsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_params" };
  return { ok: true, value: { ...parsed.data, query } };
}
