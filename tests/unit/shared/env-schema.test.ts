import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/shared/config/env-schema";
import { parsePublicEnv } from "@/shared/config/public-env-schema";

const SECRET = "service-role-secret-value";

function validSource(overrides: Record<string, string | undefined> = {}) {
  return {
    DATABASE_URL: "postgresql://127.0.0.1:54322/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: SECRET,
    LAUNCH_AT: "2026-11-01T00:00:00+07:00",
    EVENT_AT: "2026-12-26T18:00:00+07:00",
    EVENT_END_AT: "2026-12-31T23:59:59+07:00",
    NATIONAL_KUDOS_FINALIZE_AT: "2027-01-01T00:00:00+07:00",
    ADMIN_EMAILS: " Admin@Sun-Asterisk.com, second@sun-asterisk.com ,",
    ...overrides,
  };
}

function parseError(source: Record<string, string | undefined>): string {
  try {
    parseServerEnv(source);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected parseServerEnv to throw");
}

describe("parseServerEnv", () => {
  it("parses dates, lowercases admin emails and applies defaults", () => {
    const env = parseServerEnv(validSource());

    expect(env.LAUNCH_AT).toBe(Date.parse("2026-10-31T17:00:00.000Z"));
    // Milestones are epoch-ms numbers so the shared, frozen env cannot be mutated like a Date.
    expect(typeof env.EVENT_END_AT).toBe("number");
    expect(env.ADMIN_EMAILS).toEqual([
      "admin@sun-asterisk.com",
      "second@sun-asterisk.com",
    ]);
    expect(env.ALLOWED_EMAIL_DOMAIN).toBe("sun-asterisk.com");
    expect(env.HEART_CAMPAIGN_MULTIPLIER).toBe(2);
    expect(env.SECRET_BOX_HEARTS_PER_BOX).toBe(5);
    expect(env.ADMIN_TIMEZONE).toBe("Asia/Ho_Chi_Minh");
    expect(env.EXPORT_MAX_ROWS).toBe(10000);
  });

  it("treats empty strings as unset so defaults still apply", () => {
    const env = parseServerEnv(
      validSource({ HEART_CAMPAIGN_MULTIPLIER: "", ADMIN_TIMEZONE: "" }),
    );
    expect(env.HEART_CAMPAIGN_MULTIPLIER).toBe(2);
    expect(env.ADMIN_TIMEZONE).toBe("Asia/Ho_Chi_Minh");
  });

  it("coerces numeric overrides", () => {
    const env = parseServerEnv(
      validSource({ HEART_CAMPAIGN_MULTIPLIER: "3", EXPORT_MAX_ROWS: "500" }),
    );
    expect(env.HEART_CAMPAIGN_MULTIPLIER).toBe(3);
    expect(env.EXPORT_MAX_ROWS).toBe(500);
  });

  it("names the missing variable in a readable error", () => {
    expect(parseError(validSource({ DATABASE_URL: undefined }))).toMatch(
      /Invalid environment configuration[\s\S]*DATABASE_URL/,
    );
  });

  it("never echoes the rejected value of a variable", () => {
    const message = parseError(validSource({ DATABASE_URL: SECRET }));
    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain(SECRET);
  });

  it.each([
    ["date without offset", { LAUNCH_AT: "2026-11-01T00:00:00" }, "LAUNCH_AT"],
    ["multiplier below 2", { HEART_CAMPAIGN_MULTIPLIER: "1" }, "HEART_CAMPAIGN_MULTIPLIER"],
    ["non-integer hearts per box", { SECRET_BOX_HEARTS_PER_BOX: "2.5" }, "SECRET_BOX_HEARTS_PER_BOX"],
    ["unknown time zone", { ADMIN_TIMEZONE: "Mars/Olympus" }, "ADMIN_TIMEZONE"],
    ["malformed admin email", { ADMIN_EMAILS: "admin@sun, ok@sun-asterisk.com" }, "ADMIN_EMAILS"],
    ["no admin email", { ADMIN_EMAILS: " , " }, "ADMIN_EMAILS"],
    ["non-postgres database url", { DATABASE_URL: "https://example.com/db" }, "DATABASE_URL"],
  ])("rejects %s", (_label, overrides, variable) => {
    expect(parseError(validSource(overrides))).toContain(variable);
  });

  it("skips the ordering check when a milestone is itself invalid", () => {
    const message = parseError(validSource({ LAUNCH_AT: "2026-11-01" }));
    expect(message).toContain("LAUNCH_AT");
    expect(message).not.toContain("must be after");
  });

  it("requires LAUNCH_AT < EVENT_END_AT", () => {
    const message = parseError(
      validSource({ LAUNCH_AT: "2026-12-31T23:59:59+07:00" }),
    );
    expect(message).toContain("EVENT_END_AT");
  });

  it("requires EVENT_END_AT <= NATIONAL_KUDOS_FINALIZE_AT", () => {
    const message = parseError(
      validSource({ NATIONAL_KUDOS_FINALIZE_AT: "2026-12-31T16:59:58Z" }),
    );
    expect(message).toContain("NATIONAL_KUDOS_FINALIZE_AT");
  });

  it("accepts EVENT_END_AT equal to NATIONAL_KUDOS_FINALIZE_AT", () => {
    const env = parseServerEnv(
      validSource({ NATIONAL_KUDOS_FINALIZE_AT: "2026-12-31T16:59:59Z" }),
    );
    expect(env.NATIONAL_KUDOS_FINALIZE_AT).toBe(env.EVENT_END_AT);
  });
});

describe("parsePublicEnv", () => {
  it("returns only NEXT_PUBLIC_* values", () => {
    const env = parsePublicEnv(validSource());
    expect(Object.keys(env).sort()).toEqual([
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("rejects a missing anon key", () => {
    expect(() =>
      parsePublicEnv(validSource({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "" })),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
