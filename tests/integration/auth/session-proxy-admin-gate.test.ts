import { eq } from "drizzle-orm";
import { getRedirectUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_PATH } from "@/shared/auth/public-paths";
import { runSessionProxy } from "@/shared/auth/session-proxy";
import { profiles } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";
import { closeAppDb, createAuthUser, deleteAuthUsers, signInToJar, TestCookieJar, uniqueEmail } from "./auth-test-users";

/**
 * Session proxy step (4b), auth-flow W1 / tester F1: a signed-in non-admin on /admin/* gets an
 * HTTP 403 from the proxy itself (a render cannot change the status under Cache Components).
 * Real Supabase sessions + profiles rows; only the proxy's fetch of the access-denied view is
 * faked here (any URL whose path is /access-denied). The real `next start` wire status is
 * checked by `npm run test:prod`.
 */
const ORIGIN = "http://localhost:3000";
const SPOOFED_HOST = "internal-svc:8080";
const isViewRequest = (request: Request) => new URL(request.url).pathname === ACCESS_DENIED_PATH;
const VIEW_HTML = "<!doctype html><h1>Access Denied</h1>";
const member = { id: "", email: uniqueEmail("proxy-member") };
const admin = { id: "", email: uniqueEmail("proxy-admin") };
const orphan = { id: "", email: uniqueEmail("proxy-orphan") };
const jar = new TestCookieJar();
const realFetch = globalThis.fetch;
const viewRequests: Request[] = [];

beforeAll(async () => {
  member.id = (await createAuthUser(member.email)).id;
  admin.id = (await createAuthUser(admin.email)).id;
  orphan.id = (await createAuthUser(orphan.email)).id;
  await testDb.update(profiles).set({ role: "admin" }).where(eq(profiles.id, admin.id));
  await testDb.delete(profiles).where(eq(profiles.id, orphan.id));
});
beforeEach(() => {
  jar.clear();
  viewRequests.length = 0;
  // Supabase Auth calls go out for real; only the access-denied view is answered here.
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    if (!isViewRequest(request)) return realFetch(input, init);
    viewRequests.push(request);
    return new Response(VIEW_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  });
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await deleteAuthUsers([member.id, admin.id, orphan.id]);
  await closeAppDb();
});

type ProxyRequestInit = { method?: string; headers?: Record<string, string>; origin?: string };

/** `origin` stands in for the Host header: Next builds request.nextUrl from it. */
function proxyRequest(path: string, init: ProxyRequestInit = {}) {
  const cookie = [...jar.getAll().map(({ name, value }) => `${name}=${value}`), "NEXT_LOCALE=en"].join("; ");
  const headers = new Headers(init.headers);
  headers.set("cookie", cookie);
  const url = new URL(path, init.origin ?? ORIGIN);
  return runSessionProxy(new NextRequest(url, { method: init.method ?? "GET", headers }));
}

const passesThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

describe("session proxy admin gate (FR-602, SC-004)", () => {
  it("still sends a guest on /admin/* to /login with next", async () => {
    const response = await proxyRequest("/admin/overview");
    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe(`${ORIGIN}/login?next=%2Fadmin%2Foverview`);
  });

  it.each(["/admin", "/admin/overview", "/admin/users/123"])(
    "answers 403 with the access-denied page to a signed-in non-admin on %s",
    async (path) => {
      await signInToJar(jar, member.email);
      const response = await proxyRequest(path);
      expect(response.status).toBe(403);
      expect(isRewrite(response)).toBe(false);
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(await response.text()).toBe(VIEW_HTML);
    },
  );

  it("renders the view with the locale only, never forwarding the session cookies", async () => {
    await signInToJar(jar, member.email);
    await proxyRequest("/admin/overview", { headers: { "accept-language": "en-US" } });
    expect(viewRequests).toHaveLength(1);
    expect(viewRequests[0].headers.get("cookie")).toBe("NEXT_LOCALE=en");
    expect(viewRequests[0].headers.get("accept-language")).toBe("en-US");
  });

  it("fetches the view from trusted config: a spoofed Host never changes the target (W-N1)", async () => {
    await signInToJar(jar, member.email);
    await proxyRequest("/admin/overview");
    const spoofed = { host: SPOOFED_HOST, "x-forwarded-host": SPOOFED_HOST };
    await proxyRequest("/admin/overview", { origin: `http://${SPOOFED_HOST}`, headers: spoofed });
    expect(viewRequests).toHaveLength(2);
    const [normalTarget, spoofedTarget] = viewRequests.map((request) => request.url);
    expect(spoofedTarget).toBe(normalTarget);
    expect(new URL(spoofedTarget).host).not.toBe(SPOOFED_HOST);
  });

  it("still answers 403 (plain text) when the view cannot be rendered", async () => {
    await signInToJar(jar, member.email);
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) =>
      isViewRequest(new Request(input, init)) ? Promise.reject(new Error("view down")) : realFetch(input, init),
    );
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await proxyRequest("/admin/overview");
    expect(response.status).toBe(403);
    expect(await response.text()).toBe("403 Forbidden");
    expect(logged).toHaveBeenCalled();
  });

  it("answers a non-admin Server Action POST with a JSON 403, not a page", async () => {
    await signInToJar(jar, member.email);
    const response = await proxyRequest("/admin/overview", { method: "POST", headers: { "next-action": "abc123" } });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: "forbidden" });
    expect(viewRequests).toHaveLength(0);
  });

  it("treats a session without a profile row as forbidden", async () => {
    await signInToJar(jar, orphan.email);
    expect((await proxyRequest("/admin/overview")).status).toBe(403);
  });

  it("lets an admin through to the admin area", async () => {
    await signInToJar(jar, admin.email);
    const response = await proxyRequest("/admin/overview");
    expect(response.status).toBe(200);
    expect(passesThrough(response)).toBe(true);
  });

  it("does not gate other paths, including the public access-denied view itself", async () => {
    await signInToJar(jar, member.email);
    for (const path of ["/", "/kudos", "/administrator", ACCESS_DENIED_PATH]) {
      expect(passesThrough(await proxyRequest(path))).toBe(true);
    }
    jar.clear();
    expect(passesThrough(await proxyRequest(ACCESS_DENIED_PATH))).toBe(true);
  });
});
