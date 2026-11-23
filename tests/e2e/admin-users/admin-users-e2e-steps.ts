import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";

/** Shared helpers of the F014 Admin › User specs (`/admin/users`). */
export const USERS = "/admin/users";

export const tokenName = () => `Ut${randomUUID().slice(0, 6)}`;
export const bodyRows = (page: Page) => page.locator("table tbody tr");
export const userRow = (page: Page, name: string) => page.getByRole("row").filter({ hasText: name });
export const searchParam = (page: Page, name: string) => new URL(page.url()).searchParams.get(name);

/** Opens the page and waits until React has hydrated the filter bar (a click before that is lost on `next dev`). */
export async function openUsers(page: Page, query = ""): Promise<void> {
  await page.goto(`${USERS}${query}`);
  await page.waitForFunction(() => {
    const filters = document.querySelector('[role="search"]');
    return filters !== null && Object.keys(filters).some((key) => key.startsWith("__reactFiber"));
  });
}

export async function storedRole(id: string): Promise<string> {
  const { data, error } = await serviceClient.from("profiles").select("role").eq("id", id).single();
  if (error) throw error;
  return (data as { role: string }).role;
}

export async function pick(page: Page, select: RegExp, option: string): Promise<void> {
  await page.getByRole("button", { name: select }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
