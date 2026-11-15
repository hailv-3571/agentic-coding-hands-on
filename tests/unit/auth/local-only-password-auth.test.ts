import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";

/**
 * db W1: the email+password provider exists for local test fixtures only (supabase/config.toml).
 * The fixtures refuse a hosted project, and app code never calls the password APIs, so a pushed
 * config could not open a password sign-up path through the app.
 */
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const APP_CODE_ROOTS = ["app", "features", "shared", "proxy.ts"];
const PASSWORD_AUTH_CALL = /\b(signUp|signInWithPassword)\b/;

function sourceFiles(path: string): string[] {
  if (statSync(path).isFile()) return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => sourceFiles(join(path, name)));
}

describe("password auth stays test-only", () => {
  it("is never called from app code (app/, features/, shared/, proxy.ts)", () => {
    const offenders = APP_CODE_ROOTS.flatMap((root) => sourceFiles(join(repoRoot, root)))
      .filter((file) => PASSWORD_AUTH_CALL.test(readFileSync(file, "utf8")))
      .map((file) => relative(repoRoot, file));
    expect(offenders).toEqual([]);
  });

  it.each(["http://127.0.0.1:54321", "http://localhost:54321", "http://localhost:54321/"])(
    "lets the test fixtures use the local stack at %s",
    (url) => {
      expect(assertLocalSupabaseUrl(url)).toBe(url);
    },
  );

  it.each([
    ["a hosted project", "https://abcdefgh.supabase.co"],
    ["a look-alike host", "http://localhost.evil.io:54321"],
    ["a userinfo trick", "http://127.0.0.1@evil.io:54321"],
    ["a private network host", "http://192.168.1.10:54321"],
    ["a missing URL", undefined],
    ["an invalid URL", "not a url"],
  ])("makes the test fixtures refuse %s", (_label, url) => {
    expect(() => assertLocalSupabaseUrl(url)).toThrow(/local Supabase/);
  });
});
