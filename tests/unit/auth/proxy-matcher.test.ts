import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it, vi } from "vitest";
import { config } from "@/proxy";

// Only the static `config.matcher` is under test (hoisted mock: the proxy body needs env + Supabase).
vi.mock("@/shared/auth/session-proxy", () => ({ runSessionProxy: vi.fn() }));

const proxyRuns = (url: string) => unstable_doesMiddlewareMatch({ config, url });

/**
 * proxy.ts matcher (auth-flow W2): only public asset prefixes skip the session gate. A file
 * extension alone must never exempt a path, so a future `/api/…/export.xml` or `/admin/x.txt`
 * Route Handler still gets the guest 401/redirect.
 */
describe("proxy matcher", () => {
  it.each([
    "/_next/static/chunks/main.js",
    "/_next/image?url=%2Fimages%2Fbrand%2Fsaa-logo.webp&w=96&q=75",
    "/images/brand/saa-logo.webp",
    "/images/shell/error-403-illustration.webp",
    "/fonts/montserrat.woff2",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ])("skips the public asset %s", (url) => {
    expect(proxyRuns(url)).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/kudos",
    "/admin/overview",
    "/admin/report.txt",
    "/admin/export.csv",
    "/api/kudos",
    "/api/admin/export.xml",
    "/api/feed.json",
    "/kudos/photo.png",
    "/images-not-public/x.png",
    "/next.svg",
    "/robots.txt.bak",
  ])("runs the session gate for %s", (url) => {
    expect(proxyRuns(url)).toBe(true);
  });
});
