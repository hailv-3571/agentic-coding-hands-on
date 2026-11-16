import { randomUUID } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { test as base, expect } from "../fixtures/auth-session";

/**
 * F011 Admin › Settings e2e fixtures on the local Supabase stack. Campaigns are global and may
 * never overlap (EXCLUDE constraint), so every test names its rows `E2E-{token} …` and works in
 * its own random far-future window — except the one window that must hold "now" (`seedActive`);
 * the teardown deletes every row carrying the token (seeded or created through the UI), even when
 * a test fails half way.
 */
export { expect };

export type CampaignSeed = { label: string; startsAt: Date; endsAt: Date };

/** Wall-clock window in ADMIN_TIMEZONE, as the datetime-local inputs take it. */
export type LocalWindow = {
  /** `yyyy-MM-ddTHH:mm` on day `day` of the window's month at `hour`. */
  at(day: number, hour: number): string;
  /** `dd/MM/yyyy` of that day (the Time column's date part). */
  displayDate(day: number): string;
  year: number;
  month: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** A random month in years 3000–8999: far from real data and from other tests' windows. */
export function farFutureWindow(): LocalWindow {
  const year = 3000 + Math.floor(Math.random() * 6000);
  const month = 1 + Math.floor(Math.random() * 12);
  return {
    year,
    month,
    at: (day, hour) => `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:00`,
    displayDate: (day) => `${pad(day)}/${pad(month)}/${year}`,
  };
}

function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}

/** SQLSTATE of the EXCLUDE no-overlap constraint (PostgREST passes it through as `code`). */
const EXCLUSION_VIOLATION = "23P01";
/** No e2e test lives this long: an older `E2E-…` row is the leftover of a killed run. */
const STALE_AFTER_MS = 10 * 60_000;
/** How long to wait for another test's live window to be torn down. */
const ACTIVE_WAIT_MS = 10_000;

type OverlappingCampaign = { id: number; name: string; created_at: string };

/**
 * Inserts a window around now (minute-aligned, like the datetime-local inputs). Only one campaign
 * can be live at a time, so the EXCLUDE constraint is the lock: a leftover of a killed e2e run is
 * deleted, a live window of another test is waited out, and any other overlapping campaign (real
 * data, an integration run) fails the seed with its name instead of a bare 23P01.
 */
async function insertActiveWindow(campaignName: string, fromNowMs: number, toNowMs: number): Promise<void> {
  const deadline = Date.now() + ACTIVE_WAIT_MS;
  for (;;) {
    const now = Math.floor(Date.now() / 60_000) * 60_000;
    const startsAt = new Date(now + fromNowMs).toISOString();
    const endsAt = new Date(now + toNowMs).toISOString();
    const { error } = await serviceClient.from("campaigns").insert({ name: campaignName, starts_at: startsAt, ends_at: endsAt });
    if (!error) return;
    if (error.code !== EXCLUSION_VIOLATION) throw error;
    const overlapping = check(
      await serviceClient.from("campaigns").select("id, name, created_at").lt("starts_at", endsAt).gt("ends_at", startsAt),
    ) as OverlappingCampaign[];
    const stale = overlapping.filter((row) => row.name.startsWith("E2E-") && Date.now() - Date.parse(row.created_at) > STALE_AFTER_MS);
    if (stale.length > 0) {
      check(await serviceClient.from("campaigns").delete().in("id", stale.map((row) => row.id)));
      continue;
    }
    if (Date.now() > deadline) {
      throw new Error(`the active-window seed needs the current hours free; overlapping: ${overlapping.map((row) => row.name).join(", ")}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

type CampaignFixture = {
  /** A unique campaign name for this test: `E2E-{token} {label}`. */
  name(label: string): string;
  /** Inserts a campaign with the service role (UTC instants) and returns its name. */
  seed(seed: CampaignSeed): Promise<string>;
  /** Inserts a campaign live now, from `fromNowMs` to `toNowMs` around the current minute; returns its name. */
  seedActive(label: string, window: { fromNowMs: number; toNowMs: number }): Promise<string>;
  /** The stored row of a campaign by name, or null. */
  find(name: string): Promise<{ id: number; starts_at: string; ends_at: string } | null>;
};

export const test = base.extend<{ campaigns: CampaignFixture }>({
  campaigns: async ({}, provide) => {
    const prefix = `E2E-${randomUUID().slice(0, 8)}`;
    const name = (label: string) => `${prefix} ${label}`;
    await provide({
      name,
      seed: async ({ label, startsAt, endsAt }) => {
        check(await serviceClient.from("campaigns").insert({ name: name(label), starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() }));
        return name(label);
      },
      seedActive: async (label, { fromNowMs, toNowMs }) => {
        await insertActiveWindow(name(label), fromNowMs, toNowMs);
        return name(label);
      },
      find: async (campaignName) =>
        check(await serviceClient.from("campaigns").select("id, starts_at, ends_at").eq("name", campaignName).maybeSingle()),
    });
    check(await serviceClient.from("campaigns").delete().like("name", `${prefix}%`));
  },
});

/** The table row of one campaign (matched by its unique name). */
export const campaignRow = (page: Page, name: string): Locator => page.getByRole("row").filter({ hasText: name });

/** The "⋯" actions button of a row (named "Thao tác {name}", spec § 9). */
export const rowActions = (page: Page, name: string): Locator =>
  campaignRow(page, name).getByRole("button", { name: `Thao tác ${name}` });
