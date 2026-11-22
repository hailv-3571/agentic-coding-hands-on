import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";
import { PRELAUNCH_PROJECT, prelaunchMilestonesEnv } from "./tests/e2e/awards-portal/prelaunch-server";

/**
 * Phase 07 prelaunch gate e2e (`npm run test:e2e:prelaunch`, local Supabase running): runs ONLY
 * prelaunch-gate.spec.ts against its own server whose LAUNCH_AT is 30 days ahead. The gate
 * follows the server's LAUNCH_AT, so the normal dev server (LAUNCH_AT in the past) cannot show it.
 *
 * Why `next build` + `next start` rather than a second `next dev`: one folder allows one dev
 * server (`.next/dev/lock`), and a custom distDir makes Next rewrite tsconfig.json. Builds go
 * to `.next` while dev uses `.next/dev`, so this coexists with a running `npm run dev`.
 */
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  ...baseConfig,
  // This server is deliberately before LAUNCH_AT: drop the base suite's "launched" check.
  globalSetup: undefined,
  testMatch: "awards-portal/prelaunch-gate.spec.ts",
  use: { ...baseConfig.use, baseURL },
  projects: [{ name: PRELAUNCH_PROJECT, use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Build every run so the server never serves a stale build.
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `${baseURL}/login`,
    // Never reuse: a server already on this port may carry another LAUNCH_AT or an old build.
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: "pipe",
    // PORT also targets the proxy's self-fetch of /access-denied (access-denied-response.ts).
    env: { PORT: String(PORT), ...prelaunchMilestonesEnv(Date.now()) },
  },
});
