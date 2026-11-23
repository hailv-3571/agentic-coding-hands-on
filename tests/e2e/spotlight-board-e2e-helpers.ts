import type { Browser, BrowserContext, Locator, Page } from "@playwright/test";
import { SPOTLIGHT_TOPIC } from "../../features/spotlight-board/spotlight-config";
import { serviceClient, signInToCookieJar, type TestSunner } from "../setup/local-sunner-accounts";
import { expect } from "./kudos-feed/live-board-fixtures";

/**
 * Phase 11 Spotlight Board e2e helpers (local Supabase stack, real Realtime). The region is found by
 * its "SPOTLIGHT BOARD" heading; names by their link label "{name}, {n} Kudos"; the ticker by its
 * log label. The board's total is checked against the database rather than a remembered number, so
 * Kudos written by other specs meanwhile cannot make it flaky.
 */
export const spotlightRegion = (page: Page): Locator => page.getByRole("region", { name: "SPOTLIGHT BOARD" });
export const spotlightTotal = (page: Page): Locator => spotlightRegion(page).getByText(/^[\d.,]+ KUDOS$/);
export const spotlightTicker = (page: Page): Locator => spotlightRegion(page).getByRole("log", { name: "Kudos mới nhất" });
export const spotlightSearch = (page: Page): Locator => spotlightRegion(page).getByRole("searchbox", { name: "Tìm tên trong Spotlight Board" });

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A name in the cloud, whatever its count. */
export const cloudName = (page: Page, name: string): Locator =>
  spotlightRegion(page).getByRole("link", { name: new RegExp(`^${escapeRegExp(name)}, \\d+ Kudos$`) });

/**
 * A `created_at` window above every `feedWindow("top")` (years 5000–7899), so a spotlight test's
 * Kudos are the newest ones and land in the snapshot's 5-line ticker preload.
 */
export function spotlightWindow(): (offsetMinutes?: number) => string {
  const base = Date.UTC(7900 + Math.floor(Math.random() * 99), 0, 1) + Math.floor(Math.random() * 360) * 86_400_000;
  return (offsetMinutes = 0) => new Date(base + offsetMinutes * 60_000).toISOString();
}

export async function publicKudoCount(): Promise<number> {
  const { count, error } = await serviceClient.from("kudos").select("id", { count: "exact", head: true }).eq("status", "public");
  if (error) throw error;
  return count ?? 0;
}

async function shownTotal(page: Page): Promise<number> {
  return Number((await spotlightTotal(page).textContent())?.replace(/\D/g, ""));
}

/** The counter converges on the number of public Kudos in the database (no double count, no drift). */
export async function expectTotalMatchesDatabase(page: Page): Promise<void> {
  await expect.poll(async () => (await shownTotal(page)) - (await publicKudoCount()), { timeout: 10_000 }).toBe(0);
}

/** True once a GET /api/spotlight answered 200: the region refetches right after its channel joined. */
export function nextResync(page: Page): Promise<unknown> {
  return page.waitForResponse((response) => new URL(response.url()).pathname === "/api/spotlight" && response.ok(), { timeout: 20_000 });
}

/**
 * Uses the board's own "tab visible again → refetch and replace" path, then waits until the counter
 * equals the database. Run before a step so it starts from a settled board; whatever the step
 * changes can then only arrive through the Realtime event. (Teardowns set public Kudos to spam
 * before deleting them, see `kudo-e2e-fixtures.ts`, so other workers' cleanup reaches the board as
 * `removed` events instead of leaving it above the database.)
 */
export async function resyncNow(page: Page): Promise<void> {
  const resynced = nextResync(page);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await resynced;
  await expectTotalMatchesDatabase(page);
}

const SPOTLIGHT_CHANNEL = `realtime:${SPOTLIGHT_TOPIC}`;

/** The topic of a Realtime server frame that is a broadcast, else null. */
function broadcastTopic(message: string | Buffer): string | null {
  if (typeof message !== "string") {
    // realtime-js binary user broadcast: [kind 4][topic size][event size][meta size][encoding][topic]…
    return message[0] === 4 ? message.subarray(5, 5 + message[1]).toString("utf8") : null;
  }
  let frame: unknown;
  try {
    frame = JSON.parse(message); // protocol 2.0.0: [join_ref, ref, topic, event, payload]
  } catch {
    return null; // not a JSON frame: forward it untouched rather than stall the proxied socket
  }
  return Array.isArray(frame) && frame[3] === "broadcast" ? String(frame[2]) : null;
}

/**
 * Keeps the page's Realtime socket real (join, heartbeats, reconnect) but drops the Spotlight
 * broadcasts on it, so Kudos that other workers write meanwhile never reach this board. Only for
 * tests about a fixed snapshot, not the live path. Call before the page opens.
 */
export async function muteSpotlightBroadcasts(page: Page): Promise<void> {
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, (ws) => {
    const server = ws.connectToServer();
    server.onMessage((message) => {
      if (broadcastTopic(message) !== SPOTLIGHT_CHANNEL) ws.send(message);
    });
  });
}

/** Opens the Live board and waits for the first resync, i.e. until the private channel is joined. */
export async function openLiveBoard(page: Page): Promise<void> {
  const resynced = nextResync(page);
  await page.goto("/kudos");
  await resynced;
  await expect(spotlightRegion(page)).toBeVisible();
}

/** A second, independent browser signed in as `sunner` (closed by the caller). */
export async function signedInContext(browser: Browser, baseURL: string, sunner: TestSunner): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL, locale: "vi-VN" });
  const jar = await signInToCookieJar(sunner);
  await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: baseURL, sameSite: "Lax" as const })));
  return context;
}

/** Marks the document so a later check can prove no reload/navigation happened. */
export async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => Object.assign(window, { spotlightSameDocument: true }));
}

export async function sameDocument(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { spotlightSameDocument?: boolean }).spotlightSameDocument === true);
}
