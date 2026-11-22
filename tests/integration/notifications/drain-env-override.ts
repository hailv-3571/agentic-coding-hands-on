/**
 * Test-controlled OUTBOX_DRAIN_SECRET over the real server env (frozen at import). Wired with:
 *   vi.mock("@/shared/config/env", async (original) =>
 *     (await import("./drain-env-override")).withDrainEnv(await original()));
 * Defaults to unset, so results never depend on .env.local.
 */
export const drainEnv = { secret: undefined as string | undefined };

export function withDrainEnv<T extends { env: object }>(module: T): T {
  const env = {
    ...module.env,
    get OUTBOX_DRAIN_SECRET() {
      return drainEnv.secret;
    },
  };
  return { ...module, env };
}
