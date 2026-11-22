import { randomUUID } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { SECRET_BOX_ICON_CODES } from "../../../features/secret-box-rewards/schemas/secret-box-views";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { seedHeart } from "../kudos-hearts/kudo-heart-e2e-fixtures";
import { expect, feedWindow, seedFeedKudo, test as liveBoardTest, type KudoPair } from "../kudos-feed/live-board-fixtures";

/**
 * F010 Secret Box e2e helpers on the local Supabase stack (service role). Boxes come either the
 * real way — hearts on kudos the user SENT, granted by reconcile-on-read when the Live board loads —
 * or as `secret_boxes` rows inserted directly (reconcile then grants nothing more: a fresh user is
 * entitled to 0 < max seq). Prizes are drawn by the real server from the seeded catalog, so specs
 * accept an icon or a gift. The `boxUsers` teardown removes the pair's Secret Box rows and F010
 * outbox events before the kudo/user teardown runs. Opening real boxes consumes local gift stock.
 */
export { expect, feedWindow, seedFeedKudo, type KudoPair };

function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/** Hearts per box of the running server (`.env.local` is loaded by local-sunner-accounts). */
export const HEARTS_PER_BOX = Number(process.env.SECRET_BOX_HEARTS_PER_BOX ?? 5);

async function deleteSecretBoxDataOf(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  for (const table of ["secret_boxes", "user_icons", "mystery_gift_awards"]) {
    check(await serviceClient.from(table).delete().in("user_id", userIds));
  }
  check(await serviceClient.from("domain_event_outbox").delete().in("payload->>userId", userIds));
}

export const test = liveBoardTest.extend<{ boxUsers: { pair(): Promise<KudoPair> } }>({
  boxUsers: async ({ kudoUsers }, provide) => {
    const userIds: string[] = [];
    await provide({
      pair: async () => {
        const pair = await kudoUsers.pair();
        userIds.push(pair.sender.id, pair.recipient.id);
        return pair;
      },
    });
    await deleteSecretBoxDataOf(userIds);
  },
});

/** `count` unopened boxes for `userId` (seq 1..count). */
export async function seedUnopenedBoxes(userId: string, count: number): Promise<void> {
  const rows = Array.from({ length: count }, (_, index) => ({ user_id: userId, seq: index + 1, status: "unopened" }));
  check(await serviceClient.from("secret_boxes").insert(rows));
}

/** `hearts` public kudos sent by `pair.sender`, each hearted once by the recipient (x1 hearts). */
export async function seedHeartsOnSentKudos(pair: KudoPair, hearts: number): Promise<void> {
  const at = feedWindow("low");
  for (let index = 0; index < hearts; index++) {
    const kudoId = await seedFeedKudo(pair, { body: `Cảm ơn bạn lần ${index + 1}`, createdAt: at(index) });
    await seedHeart(kudoId, pair.recipient.id);
  }
}

/**
 * The user already owns all 6 icons and got the mystery gift: any icon drawn next is a duplicate,
 * and no draw can complete the set again.
 */
export async function seedFullIconCollection(userId: string): Promise<void> {
  check(await serviceClient.from("user_icons").insert(SECRET_BOX_ICON_CODES.map((icon_code) => ({ user_id: userId, icon_code }))));
  check(await serviceClient.from("mystery_gift_awards").insert({ user_id: userId, gift_name: "E2E mystery gift" }));
}

/** Opens the user's lowest unopened box out of band (as another tab would), with a seeded gift or icon. */
export async function openBoxOutOfBand(userId: string, options: { kind: "gift" | "icon"; openedAt?: string }): Promise<{ prizeName: string }> {
  const prize = check(
    await serviceClient.from("secret_box_prizes").select("id, name").eq("kind", options.kind).limit(1).single(),
  ) as { id: string; name: string };
  const box = check(
    await serviceClient.from("secret_boxes").select("id").eq("user_id", userId).eq("status", "unopened").order("seq").limit(1).single(),
  ) as { id: string };
  check(
    await serviceClient
      .from("secret_boxes")
      .update({ status: "opened", prize_id: prize.id, open_request_id: randomUUID(), opened_at: options.openedAt ?? new Date().toISOString() })
      .eq("id", box.id),
  );
  return { prizeName: prize.name };
}

/** Stored boxes of one user by status. */
export async function storedBoxCounts(userId: string): Promise<{ opened: number; unopened: number }> {
  const rows = check(await serviceClient.from("secret_boxes").select("status").eq("user_id", userId)) as { status: string }[];
  return {
    opened: rows.filter((row) => row.status === "opened").length,
    unopened: rows.filter((row) => row.status === "unopened").length,
  };
}

/** The Live board rewards column (complementary landmark). */
export const rewardsColumn = (page: Page): Locator => page.getByRole("complementary", { name: "Phần thưởng Secret Box" });

/** The value next to one stats label ("Số Secret Box chưa mở:" …). */
export const statValue = (column: Locator, label: string): Locator =>
  column.locator("dl > div").filter({ has: column.page().locator("dt", { hasText: label }) }).locator("dd");

/** The column's "Mở Secret Box" button. */
export const openBoxButton = (page: Page): Locator => rewardsColumn(page).getByRole("button", { name: "Mở Secret Box" });

/** The open-box modal and its parts. */
export const secretBoxDialog = (page: Page): Locator => page.getByRole("dialog");
export const boxButton = (dialog: Locator): Locator => dialog.getByRole("button", { name: "Mở Secret Box" });
export const unopenedCounter = (dialog: Locator): Locator => dialog.getByText("Secretbox chưa mở").locator("xpath=following-sibling::span");

/** Running Web Animations API animations in the dialog (the box wobble, the prize reveal); CSS transitions excluded. */
export const scriptedAnimations = (dialog: Locator): Promise<number> =>
  dialog.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => !(animation instanceof CSSTransition) && !(animation instanceof CSSAnimation)).length);
