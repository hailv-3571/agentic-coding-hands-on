/**
 * Test-controlled Secret Box env over the real server env (frozen at import). Test files wire it with:
 *   vi.mock("@/shared/config/env", async (original) =>
 *     (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));
 * `resetSecretBoxEnv()` restores the defaults: the event still open (EVENT_END_AT = now + 1 day),
 * Kudos Quốc Dân not due, 5 hearts per box, no internal job secret. Results never depend on .env.local.
 */
const DAY = 86_400_000;
export const secretBoxEnv = {
  eventEndAt: 0,
  finalizeAt: 0,
  heartsPerBox: 5,
  jobSecret: undefined as string | undefined,
};

export function resetSecretBoxEnv(): void {
  secretBoxEnv.eventEndAt = Date.now() + DAY;
  secretBoxEnv.finalizeAt = Date.now() + 2 * DAY;
  secretBoxEnv.heartsPerBox = 5;
  secretBoxEnv.jobSecret = undefined;
}
resetSecretBoxEnv();

export function withSecretBoxEnv<T extends { env: object }>(module: T): T {
  const env = {
    ...module.env,
    get LAUNCH_AT() {
      return secretBoxEnv.eventEndAt - 30 * DAY;
    },
    get EVENT_END_AT() {
      return secretBoxEnv.eventEndAt;
    },
    get NATIONAL_KUDOS_FINALIZE_AT() {
      return secretBoxEnv.finalizeAt;
    },
    get SECRET_BOX_HEARTS_PER_BOX() {
      return secretBoxEnv.heartsPerBox;
    },
    get INTERNAL_JOB_SECRET() {
      return secretBoxEnv.jobSecret;
    },
  };
  return { ...module, env };
}
