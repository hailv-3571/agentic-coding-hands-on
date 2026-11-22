import "server-only";
import { z } from "zod";
import { adminDateRangeSchema } from "@/shared/admin/date-range-filter";
import { kudoStatus } from "@/shared/db/schema/kudos";
import { ADMIN_KUDO_PARAMS, type AdminKudoFilterValues } from "./admin-kudo-row";

/**
 * Admin › Review content URL params → `AdminKudoFilterValues` (BR-002: the page, GET /api/admin/kudos
 * and the CSV export parse the same names). Server-only: the reversed-range rule is the phase 01
 * `adminDateRangeSchema` (ADMIN_TIMEZONE from env). Empty values mean "absent"; a repeated key, a bad
 * uuid / date / status / sort, a page < 1 or a q over 200 characters is `invalid_params`.
 */
export const ADMIN_KUDO_QUERY_MAX_LENGTH = 200;

export const DEFAULT_ADMIN_KUDO_FILTER: AdminKudoFilterValues = {
  page: 1,
  sort: "newest",
  status: null,
  senderId: null,
  receiverId: null,
  from: null,
  to: null,
  query: "",
};

export type AdminKudoFilterError = "invalid_date_range" | "invalid_params";
export type AdminKudoFilterParseResult = { ok: true; value: AdminKudoFilterValues } | { ok: false; error: AdminKudoFilterError };

/** `searchParams` of a page (record) or `request.nextUrl.searchParams` of a route handler. */
export type AdminKudoRawParams = URLSearchParams | Record<string, string | string[] | undefined>;

const REPEATED = Symbol("repeated");

function readParam(params: AdminKudoRawParams, name: string): string | undefined | typeof REPEATED {
  const values = params instanceof URLSearchParams ? params.getAll(name) : [params[name] ?? []].flat();
  if (values.length > 1) return REPEATED;
  return values[0] === "" ? undefined : values[0];
}

const optional = <T extends z.ZodType>(schema: T) => schema.optional().transform((value) => value ?? null);

const AdminKudoParamsSchema = z.object({
  page: z
    .string()
    .regex(/^\d{1,15}$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .transform((value) => value ?? DEFAULT_ADMIN_KUDO_FILTER.page),
  sort: z.enum(["newest", "hearts_desc", "hearts_asc"]).default(DEFAULT_ADMIN_KUDO_FILTER.sort),
  status: optional(z.enum(kudoStatus.enumValues)),
  senderId: optional(z.uuid()),
  receiverId: optional(z.uuid()),
  from: optional(z.iso.date()),
  to: optional(z.iso.date()),
  query: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => [...value].length <= ADMIN_KUDO_QUERY_MAX_LENGTH),
});

const FIELD_PARAM = {
  page: ADMIN_KUDO_PARAMS.page,
  sort: ADMIN_KUDO_PARAMS.sort,
  status: ADMIN_KUDO_PARAMS.status,
  senderId: ADMIN_KUDO_PARAMS.sender,
  receiverId: ADMIN_KUDO_PARAMS.receiver,
  from: ADMIN_KUDO_PARAMS.from,
  to: ADMIN_KUDO_PARAMS.to,
  query: ADMIN_KUDO_PARAMS.query,
} as const;

export function parseAdminKudoFilter(params: AdminKudoRawParams): AdminKudoFilterParseResult {
  const raw: Record<string, string | undefined> = {};
  for (const [field, name] of Object.entries(FIELD_PARAM)) {
    const value = readParam(params, name);
    if (value === REPEATED) return { ok: false, error: "invalid_params" };
    raw[field] = value;
  }
  const parsed = AdminKudoParamsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_params" };
  const { from, to } = parsed.data;
  if (!adminDateRangeSchema.safeParse({ from: from ?? undefined, to: to ?? undefined }).success) {
    return { ok: false, error: "invalid_date_range" };
  }
  return { ok: true, value: parsed.data };
}
