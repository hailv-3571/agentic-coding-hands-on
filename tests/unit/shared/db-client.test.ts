import type { Sql } from "postgres";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({
  env: { DATABASE_URL: "postgresql://127.0.0.1:54322/postgres" },
}));

type GlobalWithDb = typeof globalThis & { __saaDb?: unknown };

async function loadDb() {
  vi.resetModules();
  return (await import("@/shared/db/client")).db;
}

describe("shared db client pool", () => {
  beforeEach(() => {
    delete (globalThis as GlobalWithDb).__saaDb;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as GlobalWithDb).__saaDb;
  });

  it.each(["development", "production"])(
    "reuses one pool across module instances when NODE_ENV=%s",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      const first = await loadDb();
      const second = await loadDb();
      expect(second).toBe(first);
    },
  );

  it("bounds the pool size and connection timeouts (no lazy connection is opened)", async () => {
    // drizzle() attaches the postgres-js handle as `$client`; the `Db` alias does not expose it.
    const { options } = (await loadDb() as unknown as { $client: Sql }).$client;
    expect(options.max).toBe(10);
    expect(options.idle_timeout).toBe(20);
    expect(options.connect_timeout).toBe(10);
    expect(options.prepare).toBe(false);
  });
});
