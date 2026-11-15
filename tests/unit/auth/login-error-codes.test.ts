import { describe, expect, it } from "vitest";
import { loginErrorFromOAuth, parseLoginErrorCode } from "@/features/auth/login-error-codes";

describe("loginErrorFromOAuth (callback error mapping, FR-202/FR-203)", () => {
  it("maps the before_user_created hook rejection to domain_not_allowed", () => {
    // Observed on local GoTrue: error=access_denied&error_description=domain_not_allowed
    expect(loginErrorFromOAuth("domain_not_allowed")).toBe("domain_not_allowed");
  });

  it.each([
    ["generic trigger failure", "Database error saving new user"],
    ["user cancelled at Google", "The user denied the request"],
    ["no description at all", null],
    ["description that merely contains the code", "x domain_not_allowed x"],
  ])("maps %s to auth_failed", (_label, description) => {
    expect(loginErrorFromOAuth(description)).toBe("auth_failed");
  });
});

describe("parseLoginErrorCode (login page ?error=)", () => {
  it.each(["domain_not_allowed", "auth_failed"] as const)("accepts %s", (code) => {
    expect(parseLoginErrorCode(code)).toBe(code);
  });

  it.each([undefined, "", "boom", ["auth_failed"]])("ignores %j", (raw) => {
    expect(parseLoginErrorCode(raw)).toBeNull();
  });
});
