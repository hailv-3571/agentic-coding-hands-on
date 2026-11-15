import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "@/features/auth/server/sign-in-with-google-action";
import { env } from "@/shared/config/env";
import { closeAppDb, redirectLocationOf } from "./auth-test-users";
import { requestCookies } from "./next-request-stub";

vi.mock("next/headers", async () => (await import("./next-request-stub")).nextHeadersMock);

/** A1 signInWithGoogle: builds the Supabase authorize URL (PKCE) with the hd hint. */
beforeEach(() => requestCookies.clear());
afterAll(() => closeAppDb());

async function authorizeUrlFor(next: string | null): Promise<URL> {
  const data = new FormData();
  if (next !== null) data.set("next", next);
  const thrown = await signInWithGoogle({ error: null }, data).then(
    () => null,
    (error: unknown) => error,
  );
  const location = redirectLocationOf(thrown);
  if (!location) throw new Error(`expected a redirect, got ${String(thrown)}`);
  return new URL(location);
}

describe("signInWithGoogle", () => {
  it("redirects to Supabase's Google authorize endpoint with hd and the callback + next", async () => {
    const url = await authorizeUrlFor("/kudos");
    expect(`${url.origin}${url.pathname}`).toBe(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize`);
    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("hd")).toBe(env.ALLOWED_EMAIL_DOMAIN);
    expect(url.searchParams.get("redirect_to")).toBe("http://localhost:3000/auth/callback?next=%2Fkudos");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    // PKCE verifier kept server-side in a cookie for exchangeCodeForSession in the callback.
    expect(requestCookies.getAll().some(({ name }) => name.endsWith("-code-verifier"))).toBe(true);
  });

  it.each([null, "/", "//evil.com", "https://evil.com"])("omits next for %j", async (next) => {
    const url = await authorizeUrlFor(next);
    expect(url.searchParams.get("redirect_to")).toBe("http://localhost:3000/auth/callback");
  });
});
