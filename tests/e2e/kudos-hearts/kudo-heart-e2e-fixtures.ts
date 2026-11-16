import type { Locator, Page, Request, Response } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";

/**
 * F005 heart e2e helpers on the local Supabase stack (service role). Hearts and spam flips are
 * written straight to the tables; the `kudoUsers` teardown deletes the kudos, and `kudo_hearts`
 * rows go with them (ON DELETE CASCADE on kudo_id and user_id).
 */
function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/** A heart from `userId` (a helper Sunner) on `kudoId`, as the service would store it. */
export async function seedHeart(kudoId: string, userId: string): Promise<void> {
  check(await serviceClient.from("kudo_hearts").insert({ kudo_id: kudoId, user_id: userId }));
}

/** An admin marks the kudo spam while the viewer still has the page open (F007 → BR-003). */
export async function markKudoSpam(kudoId: string): Promise<void> {
  check(await serviceClient.from("kudos").update({ status: "spam" }).eq("id", kudoId));
}

/** Stored heart rows of one kudo (the raw count the card shows). */
export async function storedHeartCount(kudoId: string): Promise<number> {
  const { count, error } = await serviceClient.from("kudo_hearts").select("id", { count: "exact", head: true }).eq("kudo_id", kudoId);
  if (error) throw error;
  return count ?? 0;
}

/** The heart toggle of one card or detail panel; its name is "{count} lượt thả tim". */
export const heartButton = (scope: Locator): Locator => scope.getByRole("button", { name: /lượt thả tim$/ });

/**
 * Seed hashtags that no other e2e spec seeds or filters by (the others use high-performing,
 * be-professional, be-a-team and wasshoi). Each Highlight test filters by its own one, so Kudos from
 * parallel specs can never push its seeded Kudos out of the Highlight's top 5. Keep them reserved.
 */
export const HIGHLIGHT_ONLY_HASHTAGS = {
  ranking: { slug: "think-outside-the-box", label: "#THINK OUTSIDE THE BOX" },
  sync: { slug: "get-risky", label: "#GET RISKY" },
} as const;

/** Picks one hashtag in the Highlight filter and waits for the filtered Highlight to arrive. */
export async function filterHighlightByHashtag(page: Page, label: string): Promise<void> {
  const loaded = page.waitForResponse((response) => response.url().includes("/api/kudos/highlight?hashtag=") && response.ok());
  await page.getByRole("button", { name: /^Hashtag/ }).click();
  await page.getByRole("listbox", { name: "Lọc theo hashtag" }).getByRole("option", { name: label }).click();
  await loaded;
}

const isServerAction = (request: Request) => request.method() === "POST" && request.headers()["next-action"] !== undefined;

/** Resolves with the next Server Action response (heart toggles post to the current page URL). */
export function nextServerAction(page: Page): Promise<Response> {
  return page.waitForResponse((response) => isServerAction(response.request()));
}

/** Counts Server Action posts from now on (a disabled heart must send none). */
export function countServerActions(page: Page): () => number {
  let count = 0;
  page.on("request", (request) => {
    if (isServerAction(request)) count += 1;
  });
  return () => count;
}

/** Makes every Server Action fail at the network level (offline while toggling). */
export async function failServerActions(page: Page): Promise<void> {
  await page.route("**/*", (route) => (isServerAction(route.request()) ? route.abort("internetdisconnected") : route.fallback()));
}
