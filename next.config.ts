import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { parseServerEnv } from "./shared/config/env-schema";

// Fail fast: `next dev`, `next build` and `next start` all load this file after reading
// .env*, so a missing/invalid variable stops boot with a readable list of problems.
// SKIP_ENV_VALIDATION=1 is an explicit opt-out for secret-less steps (`npm run typecheck`,
// CI typecheck jobs); never set it for dev/build/start. env.ts still validates on import.
if (process.env.SKIP_ENV_VALIDATION !== "1") {
  parseServerEnv(process.env);
}

const withNextIntl = createNextIntlPlugin("./shared/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Required by forbidden()/unauthorized() (AdminGuard → app/forbidden.tsx), Next 16 docs:
    // 03-api-reference/04-functions/forbidden.md. Decision-log 2026-11-15.
    authInterrupts: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
