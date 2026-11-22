/**
 * Test-controlled `LAUNCH_AT` / `EVENT_END_AT` over the real server env (frozen at import, so it cannot be
 * changed per test). Test files wire it with:
 *   vi.mock("@/shared/config/env", async (original) =>
 *     (await import("./event-end-override")).withEventEndOverride(await original()));
 * Every test sets the window explicitly, so results never depend on the value in .env.local.
 */
const HOUR = 3_600_000;
const eventEnd = { at: Date.now() + HOUR };
const launch = { at: Date.now() - HOUR };

export const openWriting = () => {
  launch.at = Date.now() - HOUR;
  eventEnd.at = Date.now() + HOUR;
};
export const closeWriting = () => {
  eventEnd.at = Date.now() - 1_000;
};

/** Before LAUNCH_AT: the write window is closed too (decision 2026-11-22). */
export const beforeLaunch = () => {
  launch.at = Date.now() + HOUR;
};

export function withEventEndOverride<T extends { env: object }>(module: T): T {
  const env = {
    ...module.env,
    get LAUNCH_AT() {
      return launch.at;
    },
    get EVENT_END_AT() {
      return eventEnd.at;
    },
  };
  return { ...module, env };
}
