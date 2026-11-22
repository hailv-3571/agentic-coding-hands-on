import { getRedirectUrl } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prelaunchGateStep } from "@/features/awards-portal/server/prelaunch-gate-step";

// LAUNCH_AT is read from env on every call; the tests move it around the real clock (hoisted mock).
const launch = vi.hoisted(() => ({ atMs: 0 }));
vi.mock("@/shared/config/env", () => ({
  env: {
    get LAUNCH_AT() {
      return launch.atMs;
    },
  },
}));

/**
 * Session proxy step (5) adapter: server clock vs env LAUNCH_AT, request → gate input, gate
 * decision → proxy answer (null = let through). The decision table lives in prelaunch-gate.test.ts.
 */
const ORIGIN = "http://localhost:3000";
const HOUR_MS = 3_600_000;

function request(path: string, init: { method?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(new URL(path, ORIGIN), { method: init.method ?? "GET", headers: init.headers });
}

const role = (value: "admin" | "user" | null) => vi.fn(async () => value);

describe("prelaunchGateStep", () => {
  describe("before LAUNCH_AT", () => {
    beforeEach(() => {
      launch.atMs = Date.now() + HOUR_MS;
    });

    it("redirects a signed-in user's page load to /countdown", async () => {
      const response = await prelaunchGateStep(request("/kudos"), { isSignedIn: true, getRole: role("user") });
      expect(response?.status).toBe(307);
      expect(getRedirectUrl(response!)).toBe(`${ORIGIN}/countdown`);
    });

    it("answers a user's Server Action with JSON 403 { code: 'prelaunch' }", async () => {
      const response = await prelaunchGateStep(request("/kudos", { method: "POST", headers: { "next-action": "abc" } }), {
        isSignedIn: true,
        getRole: role("user"),
      });
      expect(response?.status).toBe(403);
      expect(await response!.json()).toEqual({ code: "prelaunch" });
    });

    it("lets an admin through (null = continue)", async () => {
      const getRole = role("admin");
      expect(await prelaunchGateStep(request("/admin/overview"), { isSignedIn: true, getRole })).toBeNull();
      expect(getRole).toHaveBeenCalledOnce();
    });
  });

  describe("after LAUNCH_AT", () => {
    beforeEach(() => {
      launch.atMs = Date.now() - HOUR_MS;
    });

    it("lets requests through without reading the role", async () => {
      const getRole = role("user");
      expect(await prelaunchGateStep(request("/kudos"), { isSignedIn: true, getRole })).toBeNull();
      expect(getRole).not.toHaveBeenCalled();
    });

    it("sends /countdown to the home page, guests included, without reading the role", async () => {
      for (const isSignedIn of [true, false]) {
        const getRole = role("user");
        const response = await prelaunchGateStep(request("/countdown"), { isSignedIn, getRole });
        expect(getRedirectUrl(response!)).toBe(`${ORIGIN}/`);
        expect(getRole).not.toHaveBeenCalled();
      }
    });
  });
});
