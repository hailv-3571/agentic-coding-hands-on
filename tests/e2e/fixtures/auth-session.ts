import { test as base, expect, type BrowserContext } from "@playwright/test";
import {
  cookieClient,
  createLocalSunner,
  deleteLocalSunner,
  revokeCookieJarSession,
  signInToCookieJar,
  type CookieJar,
  type TestSunner,
} from "../../setup/local-sunner-accounts";

/**
 * E2E auth fixtures on the local Supabase stack (accounts: tests/setup/local-sunner-accounts.ts,
 * which refuses a hosted project). The @supabase/ssr session cookies of a LOCAL-ONLY password
 * sign-in are injected into the browser context. Real Google consent is a manual check, never
 * automated.
 */
const MAILPIT_URL = "http://127.0.0.1:54324";

export type { TestSunner };

async function addJarToBrowser(context: BrowserContext, jar: CookieJar, baseURL: string): Promise<void> {
  await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: baseURL, sameSite: "Lax" as const })));
}

/** Password sign-in → session cookies in the browser. Returns the jar for later revocation. */
async function signInBrowser(context: BrowserContext, sunner: TestSunner, baseURL: string): Promise<CookieJar> {
  const jar = await signInToCookieJar(sunner);
  await addJarToBrowser(context, jar, baseURL);
  return jar;
}

/**
 * Starts a PKCE magic-link sign-in whose verifier cookie goes into the browser, and returns
 * the emailed link (via Mailpit). Opening it walks the REAL /auth/callback code exchange.
 */
async function magicLinkFor(context: BrowserContext, sunner: TestSunner, baseURL: string, next: string): Promise<string> {
  const jar: CookieJar = new Map();
  const emailRedirectTo = `${baseURL}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await cookieClient(jar).auth.signInWithOtp({
    email: sunner.email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
  if (error) throw error;
  await addJarToBrowser(context, jar, baseURL);

  let link: string | undefined;
  await expect
    .poll(async () => {
      const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${sunner.email}"`)}`);
      const { messages } = (await search.json()) as { messages: { ID: string }[] };
      if (!messages.length) return false;
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
      link = message.Text.match(/https?:\/\/\S+\/auth\/v1\/verify\?[^\s)\]]+/)?.[0];
      return Boolean(link);
    }, { timeout: 15_000 })
    .toBe(true);
  return link!;
}

type AuthFixtures = {
  /** Creates Sunners for this test and deletes them (profiles cascade) afterwards. */
  sunners: { create(options?: { onboarded?: boolean; admin?: boolean }): Promise<TestSunner> };
  auth: {
    signIn(sunner: TestSunner): Promise<CookieJar>;
    revoke(jar: CookieJar): Promise<void>;
    magicLink(sunner: TestSunner, next: string): Promise<string>;
  };
};

// Fixture callbacks name the setup hand-off `provide` (Playwright calls it `use`) so the React
// hooks lint rule does not mistake it for React.use().
export const test = base.extend<AuthFixtures>({
  sunners: async ({}, provide) => {
    const created: string[] = [];
    await provide({
      create: async (options) => {
        const sunner = await createLocalSunner(options);
        created.push(sunner.id);
        return sunner;
      },
    });
    for (const id of created) await deleteLocalSunner(id);
  },
  auth: async ({ context, baseURL }, provide) => {
    await provide({
      signIn: (sunner) => signInBrowser(context, sunner, baseURL!),
      revoke: revokeCookieJarSession,
      magicLink: (sunner, next) => magicLinkFor(context, sunner, baseURL!, next),
    });
  },
});

export { expect };
