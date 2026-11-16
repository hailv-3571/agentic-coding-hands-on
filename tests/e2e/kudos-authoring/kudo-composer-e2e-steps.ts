import type { Locator, Page } from "@playwright/test";
import { expect, type KudoPair } from "./kudo-e2e-fixtures";

/** Shared composer steps for the create-mode specs (role-based, Vietnamese default locale). */
export const LAUNCHER = "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?";
export const DEC_001 = "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!";

/** Opens the create modal from the launcher pill on the Live board (moved there in phase 05). */
export async function openComposer(page: Page): Promise<Locator> {
  await page.goto("/kudos");
  await page.getByRole("button", { name: LAUNCHER }).click();
  const dialog = page.getByRole("dialog", { name: "Gửi lời cám ơn và ghi nhận đến đồng đội" });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function pickRecipient(dialog: Locator, pair: KudoPair) {
  const input = dialog.getByRole("combobox", { name: "Người nhận" });
  await expect(input).not.toHaveAttribute("aria-controls"); // no dangling id while the list is closed
  await input.fill(pair.recipient.fullName);
  const list = dialog.getByRole("listbox", { name: "Kết quả tìm Sunner" });
  await expect(input).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
  await list.getByRole("option", { name: new RegExp(pair.recipient.fullName) }).click();
  await expect(input).toHaveValue(pair.recipient.fullName);
  await expect(input).toHaveAttribute("aria-expanded", "false");
}

export async function pickHashtags(dialog: Locator, labels: string[]) {
  await dialog.getByRole("button", { name: /^Hashtag/ }).click();
  const list = dialog.getByRole("listbox", { name: "Chọn hashtag" });
  for (const label of labels) await list.getByRole("option", { name: label }).click();
  await list.press("Escape"); // closes only the dropdown, never the composer
  await expect(list).toHaveCount(0);
  for (const label of labels) await expect(dialog.getByRole("button", { name: `Bỏ ${label}` })).toBeVisible();
}

export async function fillRequired(dialog: Locator, pair: KudoPair) {
  await pickRecipient(dialog, pair);
  await dialog.getByRole("textbox", { name: "Lời nhắn" }).fill("Cảm ơn bạn đã hỗ trợ cả đội!");
  await pickHashtags(dialog, ["#BE A TEAM"]);
}

/** True for a Server Action call (Next posts it to the page URL with a `Next-Action` header). */
export const isServerAction = (request: { method(): string; headers(): Record<string, string> }) =>
  request.method() === "POST" && Boolean(request.headers()["next-action"]);

/**
 * Resolves on the router.refresh() RSC response that follows a successful send. Next dispatches
 * Server Actions one at a time and the refresh queues behind them, so by then a second (queued)
 * send would already be on the wire; it also keeps teardown from racing an in-flight refresh.
 */
export const waitForRouterRefresh = (page: Page) =>
  page.waitForResponse((response) => {
    const request = response.request();
    const headers = request.headers();
    return request.method() === "GET" && headers.rsc === "1" && !headers["next-router-prefetch"];
  });
