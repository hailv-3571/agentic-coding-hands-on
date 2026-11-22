import type { Page } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";

/** Shared helpers of the F007 Admin › Review content specs (`/admin/review`). */
export const REVIEW = "/admin/review";

export const shortId = (id: string) => id.slice(0, 8);
export const reviewRow = (page: Page, id: string) => page.getByRole("row").filter({ hasText: shortId(id) });
export const bodyRows = (page: Page) => page.locator("table tbody tr");
export const searchParam = (page: Page, name: string) => new URL(page.url()).searchParams.get(name);

/**
 * Opens the page and waits until React has hydrated the filter bar (fiber keys on its node): on
 * `next dev` a fill or click that lands earlier is lost, not replayed.
 */
export async function openReview(page: Page, query = ""): Promise<void> {
  await page.goto(`${REVIEW}${query}`);
  await page.waitForFunction(() => {
    const filters = document.querySelector('[role="search"]');
    return filters !== null && Object.keys(filters).some((key) => key.startsWith("__reactFiber"));
  });
}

export async function storedStatus(id: string): Promise<string> {
  const { data, error } = await serviceClient.from("kudos").select("status").eq("id", id).single();
  if (error) throw error;
  return (data as { status: string }).status;
}
