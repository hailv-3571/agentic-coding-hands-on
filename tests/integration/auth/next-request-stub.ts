import { TestCookieJar } from "./auth-test-users";

/**
 * Request-scoped Next.js APIs for integration tests that call server code directly (there is
 * no Next request scope in Vitest). Test files wire it with:
 *   vi.mock("next/headers", async () => (await import("./next-request-stub")).nextHeadersMock);
 *   vi.mock("next/server", async (original) =>
 *     (await import("./next-request-stub")).withRequestScopedConnection(await original()));
 * `requestCookies` holds real @supabase/ssr session cookies (see `signInToJar`).
 */
export const requestCookies = new TestCookieJar();
export const requestHeaders = new Headers({ origin: "http://localhost:3000" });

export const nextHeadersMock = {
  cookies: async () => requestCookies,
  headers: async () => requestHeaders,
};

/** Real `next/server`, except `connection()`, which resolves at once as it does during a request. */
export function withRequestScopedConnection<T extends object>(nextServer: T): T {
  return { ...nextServer, connection: async () => undefined };
}

// next.config.ts sets experimental.authInterrupts, which Next's compiler turns into this
// variable; plain Node needs it set by hand for forbidden()/unauthorized() to throw their
// HTTP interrupts instead of the "experimental" guard error.
process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = "true";
