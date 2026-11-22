/**
 * The future-LAUNCH_AT server of playwright.prelaunch.config.ts (`npm run test:e2e:prelaunch`).
 * prelaunch-gate.spec.ts keys off the project name to pick its group.
 */
export const PRELAUNCH_PROJECT = "prelaunch";

const DAY_MS = 86_400_000;

/**
 * Milestone env overrides: LAUNCH_AT 30 days ahead and the later milestones after it, so the
 * env schema's ordering rules hold whatever the local .env file says. Process env beats .env*
 * files in Next, so the server sees these values.
 */
export function prelaunchMilestonesEnv(nowMs: number): Record<string, string> {
  const inDays = (days: number) => new Date(nowMs + days * DAY_MS).toISOString();
  return {
    LAUNCH_AT: inDays(30),
    EVENT_AT: inDays(31),
    EVENT_END_AT: inDays(32),
    NATIONAL_KUDOS_FINALIZE_AT: inDays(33),
  };
}
