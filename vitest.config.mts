import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
      // `server-only` throws outside the React Server bundle; tests run plain Node.
      "server-only": fileURLToPath(
        new URL("./tests/setup/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          // Unlike Next (which skips .env.local when NODE_ENV=test), Vite's loadEnv
          // reads .env.local, where the `supabase start` credentials live.
          env: loadEnv("test", rootDir, ""),
          setupFiles: ["tests/setup/integration-setup.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
    // Opt-in: only read when `--coverage` is passed. Without `include`, V8 reports only
    // files a test loads, so never-imported modules would hide at 0%.
    coverage: {
      include: [
        "app/**/*.{ts,tsx}",
        "features/**/*.{ts,tsx}",
        "shared/**/*.{ts,tsx}",
        "db/**/*.ts",
        "proxy.ts",
      ],
    },
  },
});
