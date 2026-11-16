import type { Locator, Page } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { expect, feedWindow, test, type KudoPair } from "../kudos-authoring/kudo-e2e-fixtures";

/**
 * F004 Live board e2e helpers on the local Supabase stack. Kudos are inserted with the service
 * role (like the composer fixtures) and removed by the `kudoUsers` teardown, which deletes every
 * kudo sent or received by the pair. Seeded kudos use far-future `created_at` windows
 * (`feedWindow`) so they sort above real data and above kudos other workers create meanwhile.
 */
export { expect, feedWindow, test, type KudoPair };

export type FeedKudoSeed = {
  body: string;
  createdAt: string;
  title?: string | null;
  /** Hashtag slugs from the seed list (default: the first one, `high-performing`). */
  hashtags?: string[];
  anonymousNickname?: string;
  status?: "public" | "spam";
};

function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/** Inserts one kudo for `pair` and returns its id. */
export async function seedFeedKudo(pair: KudoPair, seed: FeedKudoSeed): Promise<string> {
  const slugs = seed.hashtags ?? ["high-performing"];
  const tags = check(await serviceClient.from("hashtags").select("id").in("slug", slugs)) as { id: string }[];
  if (tags.length !== slugs.length) throw new Error(`unknown hashtag slug in ${slugs.join(", ")}`);
  const kudo = check(
    await serviceClient
      .from("kudos")
      .insert({
        sender_id: pair.sender.id,
        recipient_id: pair.recipient.id,
        title: seed.title ?? null,
        body: seed.body,
        created_at: seed.createdAt,
        is_anonymous: Boolean(seed.anonymousNickname),
        anonymous_nickname: seed.anonymousNickname ?? null,
        status: seed.status ?? "public",
      })
      .select("id")
      .single(),
  ) as { id: string };
  check(await serviceClient.from("kudo_hashtags").insert(tags.map((tag) => ({ kudo_id: kudo.id, hashtag_id: tag.id }))));
  return kudo.id;
}

/** Renames a Sunner's profile (the `kudoUsers` teardown deletes the user afterwards). */
export async function setFullName(userId: string, fullName: string): Promise<void> {
  check(await serviceClient.from("profiles").update({ full_name: fullName }).eq("id", userId));
}

/** The All Kudos feed column (region named by its "ALL KUDOS" heading). */
export const allKudosFeed = (page: Page): Locator => page.getByRole("region", { name: "ALL KUDOS" });

/** The Highlight carousel region (pager included). */
export const highlightCarousel = (page: Page): Locator => page.getByRole("region", { name: "Highlight Kudos" });

/** A Kudo card inside `scope` (a kudo can sit in the Highlight and in the feed at once). */
export const kudoCard = (scope: Locator, id: string): Locator => scope.locator(`article[data-kudo-id="${id}"]`);

/**
 * The detail panel of `/kudos/{id}`. After a client navigation Next keeps the previous route
 * mounted but hidden (React Activity), so the Live board's copies of the card stay in the DOM.
 */
export const kudoDetailPanel = (page: Page, id: string): Locator =>
  page.locator(`article[data-kudo-id="${id}"]`).filter({ visible: true });
