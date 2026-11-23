import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import {
  cookieHeader,
  createLocalSunner,
  deleteLocalSunner,
  signInToCookieJar,
  type TestSunner,
} from "../setup/local-sunner-accounts";

/**
 * Production status check for the proxy admin gate (auth-flow W1 / tester F1). `next dev`
 * answered a non-admin's /admin/* with 403 while `next start` answered 200, and Playwright's
 * webServer runs `next dev`, so this script runs `next start` from the existing production
 * build on a free port and asserts the raw HTTP statuses (no browser).
 *
 *   npm run build && npm run test:prod     (local Supabase running; exit code 0 = all passed)
 */
type Check = {
  name: string;
  path: string;
  cookie?: string;
  init?: RequestInit;
  status: number;
  body?: RegExp;
  /** Must NOT appear in the body. */
  notBody?: RegExp;
  location?: string;
  /** Expected `content-type` prefix (e.g. `text/csv`). */
  contentType?: string;
};

const SERVER_READY_TIMEOUT_MS = 60_000;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

function startProductionServer(port: number): { server: ChildProcess; output: string[] } {
  const output: string[] = [];
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production" },
  });
  server.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  server.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  return { server, output };
}

function stopServer(server: ChildProcess): void {
  if (server.exitCode !== null || !server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill("SIGTERM");
}

async function waitUntilReady(baseUrl: string, server: ChildProcess): Promise<void> {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`next start exited with code ${server.exitCode}`);
    try {
      await fetch(`${baseUrl}/login`, { redirect: "manual" });
      return;
    } catch {
      // Not listening yet: retry until the deadline below.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`next start did not answer within ${SERVER_READY_TIMEOUT_MS} ms`);
}

async function runCheck(baseUrl: string, check: Check): Promise<string[]> {
  const headers = new Headers(check.init?.headers);
  if (check.cookie) headers.set("cookie", check.cookie);
  const response = await fetch(`${baseUrl}${check.path}`, { redirect: "manual", ...check.init, headers });
  const body = await response.text();
  const problems: string[] = [];
  if (response.status !== check.status) problems.push(`status ${response.status}, expected ${check.status}`);
  if (check.body && !check.body.test(body)) problems.push(`body does not match ${check.body}`);
  if (check.notBody?.test(body)) problems.push(`body matches ${check.notBody}`);
  const location = response.headers.get("location");
  if (check.location && location !== check.location) problems.push(`location ${location}, expected ${check.location}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (check.contentType && !contentType.startsWith(check.contentType)) problems.push(`content-type ${contentType}, expected ${check.contentType}`);
  return problems;
}

function checksFor(member: string, admin: string): Check[] {
  // The 403 body is the real ErrorPanel page, with no admin markup (SC-004).
  const forbiddenPage = /^(?![\s\S]*>ADMIN<)[\s\S]*Không có quyền truy cập/;
  // The admin frame as HTML (">ADMIN<") or as an RSC flight row ("children":"ADMIN").
  const adminFrame = /(>ADMIN<|"children":"ADMIN")/;
  const rscNavigation = { headers: { RSC: "1" } };
  const rscPrefetch = { headers: { RSC: "1", "Next-Router-Prefetch": "1" } };
  return [
    { name: "guest /admin/overview → login", path: "/admin/overview", status: 307, location: "/login?next=%2Fadmin%2Foverview" },
    { name: "member /admin/overview → 403 page", path: "/admin/overview", cookie: member, status: 403, body: forbiddenPage },
    { name: "member /admin → 403 page", path: "/admin", cookie: member, status: 403, body: forbiddenPage },
    {
      name: "member /admin/overview (English) → 403 page",
      path: "/admin/overview",
      cookie: `${member}; NEXT_LOCALE=en`,
      status: 403,
      body: /Access Denied/,
    },
    {
      name: "member action POST /admin/overview → 403 JSON",
      path: "/admin/overview",
      cookie: member,
      init: { method: "POST", headers: { "next-action": "0000", "content-type": "text/plain" }, body: "[]" },
      status: 403,
      body: /"code":"forbidden"/,
    },
    { name: "member / → 200", path: "/", cookie: member, status: 200 },
    { name: "admin /admin/overview → 200 admin frame", path: "/admin/overview", cookie: admin, status: 200, body: />ADMIN</ },
    // Phase 08 Admin › Review content sits behind the same gate.
    { name: "guest /admin/review → login", path: "/admin/review", status: 307, location: "/login?next=%2Fadmin%2Freview" },
    { name: "member /admin/review → 403 page", path: "/admin/review", cookie: member, status: 403, body: forbiddenPage },
    { name: "admin /admin/review → 200 review screen", path: "/admin/review", cookie: admin, status: 200, body: /^(?=[\s\S]*>ADMIN<)[\s\S]*>Review content</ },
    // S-N1 / S-N3: path variants and RSC requests never hand a member the admin frame.
    { name: "member //admin/overview → 308", path: "//admin/overview", cookie: member, status: 308, location: "/admin/overview", notBody: adminFrame },
    { name: "member /admin/ → 308", path: "/admin/", cookie: member, status: 308, location: "/admin", notBody: adminFrame },
    { name: "member /admin%2Foverview → 404", path: "/admin%2Foverview", cookie: member, status: 404, notBody: adminFrame },
    { name: "member RSC GET /admin/overview → 403 page", path: "/admin/overview", cookie: member, init: rscNavigation, status: 403, body: forbiddenPage, notBody: adminFrame },
    { name: "member RSC prefetch /admin/overview → 403 page", path: "/admin/overview", cookie: member, init: rscPrefetch, status: 403, body: forbiddenPage, notBody: adminFrame },
    // Control: the same RSC request from an admin does carry the frame, so `adminFrame` can match a
    // flight body. It follows Next's 307 that adds the `_rsc` cache-busting param, as the router does.
    {
      name: "admin RSC GET /admin/overview → 200 admin flight",
      path: "/admin/overview",
      cookie: admin,
      init: { ...rscNavigation, redirect: "follow" },
      status: 200,
      body: adminFrame,
    },
    // Phase 14 Admin › User sits behind the same gate, RSC requests included.
    { name: "member RSC GET /admin/users → 403 page", path: "/admin/users", cookie: member, init: rscNavigation, status: 403, body: forbiddenPage, notBody: adminFrame },
    { name: "member RSC prefetch /admin/users → 403 page", path: "/admin/users", cookie: member, init: rscPrefetch, status: 403, body: forbiddenPage, notBody: adminFrame },
    { name: "admin /admin/users → 200 user screen", path: "/admin/users", cookie: admin, status: 200, body: /^(?=[\s\S]*>ADMIN<)[\s\S]*aria-label="Bộ lọc người dùng"/ },
    // The CSV exports live under /api (outside the proxy's /admin gate): the route's own admin API guard answers.
    ...["/api/admin/users/export", "/api/admin/overview/export", "/api/admin/kudos/export"].flatMap((path): Check[] => [
      { name: `member GET ${path} → 403 JSON`, path, cookie: member, status: 403, body: /"code":"forbidden"/ },
      { name: `admin GET ${path} → 200 CSV`, path, cookie: admin, status: 200, contentType: "text/csv" },
    ]),
  ];
}

async function main(): Promise<number> {
  if (!existsSync(".next/BUILD_ID")) throw new Error("No production build: run `npm run build` first.");
  const port = await freePort();
  const baseUrl = `http://localhost:${port}`;
  const { server, output } = startProductionServer(port);
  const sunners: TestSunner[] = [];
  try {
    await waitUntilReady(baseUrl, server);
    const [member, admin] = [await createLocalSunner(), await createLocalSunner({ admin: true })];
    sunners.push(member, admin);
    const [memberCookie, adminCookie] = [
      cookieHeader(await signInToCookieJar(member)),
      cookieHeader(await signInToCookieJar(admin)),
    ];
    let failures = 0;
    for (const check of checksFor(memberCookie, adminCookie)) {
      const problems = await runCheck(baseUrl, check);
      failures += problems.length ? 1 : 0;
      console.log(`${problems.length ? "FAIL" : "PASS"}  ${check.name}${problems.length ? ` (${problems.join("; ")})` : ""}`);
    }
    console.log(`\n${failures === 0 ? "All production status checks passed" : `${failures} check(s) failed`} on ${baseUrl}`);
    if (failures) console.log(`--- next start output ---\n${output.join("")}`);
    return failures === 0 ? 0 : 1;
  } finally {
    for (const sunner of sunners) await deleteLocalSunner(sunner.id);
    stopServer(server);
  }
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error("[test:prod]", error);
    process.exit(1);
  },
);
