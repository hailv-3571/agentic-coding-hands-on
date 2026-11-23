import { describe, expect, it } from "vitest";
import { roleErrorKey, roleMenuState } from "@/features/admin-users/lib/admin-user-role-menu-state";
import type { SetUserRoleResult } from "@/features/admin-users/schemas/admin-user-views";

const ACTOR = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER = "bbbbbbbb-0000-4000-8000-000000000002";

type MenuRow = Parameters<typeof roleMenuState>[0];
const row = (patch: Partial<MenuRow> = {}): MenuRow => ({ id: OTHER, role: "user", envAdmin: false, ...patch });

describe("roleMenuState (the row's ⋯ menu, DEC-001)", () => {
  it("offers Set as Admin on a User row", () => {
    expect(roleMenuState(row(), ACTOR)).toEqual({ kind: "promote", target: "admin" });
  });

  it("offers Set as User on another Admin's row", () => {
    expect(roleMenuState(row({ role: "admin" }), ACTOR)).toEqual({ kind: "demote", target: "user" });
  });

  it("hides Set as User on the actor's own row (403 SELF_DEMOTE)", () => {
    expect(roleMenuState(row({ id: ACTOR, role: "admin" }), ACTOR)).toEqual({ kind: "self" });
  });

  it("locks Set as User on an ADMIN_EMAILS admin (409 ENV_ADMIN)", () => {
    expect(roleMenuState(row({ role: "admin", envAdmin: true }), ACTOR)).toEqual({ kind: "env-locked", target: "user" });
  });

  it("still lets an ADMIN_EMAILS person who is a User for now be promoted", () => {
    expect(roleMenuState(row({ envAdmin: true }), ACTOR)).toEqual({ kind: "promote", target: "admin" });
  });

  it("puts the actor's own row first, even when it is an env admin", () => {
    expect(roleMenuState(row({ id: ACTOR, role: "admin", envAdmin: true }), ACTOR)).toEqual({ kind: "self" });
  });

  it("follows the role shown on screen (patched after a change)", () => {
    expect(roleMenuState(row({ role: "user" }), ACTOR).kind).toBe("promote");
    expect(roleMenuState(row({ role: "admin" }), ACTOR).kind).toBe("demote");
  });
});

describe("roleErrorKey (inline copy per error code, spec § 6)", () => {
  type Failure = Extract<SetUserRoleResult, { ok: false }>["error"];

  it("names its own message for every guard the server can answer", () => {
    const cases: [Failure, string][] = [
      ["SELF_DEMOTE", "selfDemote"],
      ["LAST_ADMIN", "lastAdmin"],
      ["ENV_ADMIN", "envAdmin"],
      ["FORBIDDEN", "forbidden"],
      ["NOT_FOUND", "notFound"],
    ];
    for (const [code, key] of cases) expect(roleErrorKey(code)).toBe(key);
  });

  it("falls back to the retryable save failure for anything else", () => {
    expect(roleErrorKey("UNEXPECTED")).toBe("failed");
    expect(roleErrorKey("INVALID")).toBe("failed");
  });
});
