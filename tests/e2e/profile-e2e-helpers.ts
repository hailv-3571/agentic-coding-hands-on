import type { Locator, Page } from "@playwright/test";
import type { KudoPair } from "./kudos-feed/live-board-fixtures";

/**
 * Phase 12 Profile e2e helpers (Vietnamese default locale). The KUDOS section is the region named
 * by its "KUDOS" heading; a hover card is the non-modal dialog "Thông tin {name}"; a card avatar is
 * the pointer-only profile link (aria-hidden, out of the Tab order) in front of the name link.
 */
export const profileKudosRegion = (page: Page): Locator => page.getByRole("region", { name: "KUDOS" });

export const hoverCardOf = (page: Page, name: string): Locator => page.getByRole("dialog", { name: `Thông tin ${name}` });

export const avatarOf = (scope: Locator, userId: string): Locator => scope.locator(`a[href="/profile/${userId}"][aria-hidden="true"]`);

/** The pair the other way round: the recipient sends to the sender. */
export const reversed = (pair: KudoPair): KudoPair => ({ sender: pair.recipient, recipient: pair.sender });

/** Records the requests whose path starts with `prefix` (e.g. "/api/sunners/"). */
export function recordRequests(page: Page, prefix: string): string[] {
  const seen: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith(prefix)) seen.push(path);
  });
  return seen;
}

/**
 * Every element Tab reaches from the top of the page, in order, until focus wraps or leaves the
 * page; `inside` says whether it sits in `scope` (a CSS selector).
 */
export async function tabStops(page: Page, scope: string): Promise<{ inside: boolean; name: string }[]> {
  const stops: { inside: boolean; name: string }[] = [];
  for (let press = 0; press < 150; press++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate((selector) => {
      const element = document.activeElement;
      if (!element || element === document.body || element.hasAttribute("data-tab-seen")) return null;
      element.setAttribute("data-tab-seen", "");
      const name = element.getAttribute("aria-label") ?? element.textContent ?? "";
      return { inside: element.closest(selector) !== null, name: name.trim() };
    }, scope);
    if (!stop) break;
    stops.push(stop);
  }
  return stops;
}
