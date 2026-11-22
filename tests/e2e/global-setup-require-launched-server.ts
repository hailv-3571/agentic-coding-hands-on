import type { FullConfig } from "@playwright/test";

/**
 * Fail fast when the server under test is still before LAUNCH_AT. Every Sunner spec in the
 * normal suite assumes the launched site; before launch the prelaunch gate sends them all to
 * /countdown and they fail with unrelated-looking errors. After launch a signed-out request
 * for /countdown redirects to / (DEC-001); before launch it renders the countdown (200).
 * The prelaunch group has its own config (`npm run test:e2e:prelaunch`) without this check.
 */
export default async function requireLaunchedServer(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;
  const response = await fetch(new URL("/countdown", baseURL), { redirect: "manual" });
  if (response.status === 200) {
    throw new Error(
      `The server at ${baseURL} is before LAUNCH_AT (/countdown answered 200). ` +
        "The normal e2e suite needs LAUNCH_AT in the past in your local env; prelaunch behaviour is tested by `npm run test:e2e:prelaunch`.",
    );
  }
}
