import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { profiles } from "@/shared/db/schema";
import { testDb, testSql } from "../../setup/integration-db";
import { createAuthUser, deleteAuthUsers, uniqueEmail } from "../auth/auth-test-users";

/**
 * Fixtures for the F011 integration tests. `campaigns` is one global table guarded by an EXCLUDE
 * constraint, so each test file names its rows with a unique prefix and deletes them after every
 * test; windows that must hold "now" are minute-aligned like datetime-local input.
 */
export type TestUser = { id: string; email: string };

export async function createUser(prefix: string, role: "admin" | "user"): Promise<TestUser> {
  const email = uniqueEmail(prefix);
  const { id } = await createAuthUser(email, { full_name: prefix });
  if (role === "admin") await testDb.update(profiles).set({ role: "admin" }).where(eq(profiles.id, id));
  return { id, email };
}

export const deleteUsers = (users: TestUser[]) => deleteAuthUsers(users.map((user) => user.id));

export const uniquePrefix = (label: string) => `${label}-${randomUUID().slice(0, 8)}`;

export type CampaignRow = { id: number; name: string; starts_at: Date; ends_at: Date };

/** Inserts a campaign whose window is given in minutes relative to now (minute-aligned). */
export async function insertCampaignAround(name: string, startMinutes: number, endMinutes: number): Promise<number> {
  const [row] = await testSql<{ id: number }[]>`
    insert into public.campaigns (name, starts_at, ends_at)
    values (${name}, date_trunc('minute', now()) + make_interval(mins => ${startMinutes}),
            date_trunc('minute', now()) + make_interval(mins => ${endMinutes}))
    returning id::int as id`;
  return row.id;
}

export async function insertCampaignAt(name: string, startsAt: string, endsAt: string): Promise<number> {
  const [row] = await testSql<{ id: number }[]>`
    insert into public.campaigns (name, starts_at, ends_at) values (${name}, ${startsAt}, ${endsAt}) returning id::int as id`;
  return row.id;
}

// drizzle (testDb) replaces the shared client's timestamp parsers with identity: read ISO text, build Dates.
type RawCampaignRow = { id: number; name: string; starts_at: string; ends_at: string };
const toRow = (raw: RawCampaignRow): CampaignRow => ({ ...raw, starts_at: new Date(raw.starts_at), ends_at: new Date(raw.ends_at) });

export async function campaignRow(id: number): Promise<CampaignRow | undefined> {
  const rows = await testSql<RawCampaignRow[]>`
    select id::int as id, name, to_json(starts_at) #>> '{}' as starts_at, to_json(ends_at) #>> '{}' as ends_at
    from public.campaigns where id = ${id}`;
  return rows.map(toRow)[0];
}

export async function campaignsNamed(prefix: string): Promise<CampaignRow[]> {
  const rows = await testSql<RawCampaignRow[]>`
    select id::int as id, name, to_json(starts_at) #>> '{}' as starts_at, to_json(ends_at) #>> '{}' as ends_at
    from public.campaigns where name like ${`${prefix}%`} order by starts_at`;
  return rows.map(toRow);
}

export async function deleteCampaignsNamed(prefix: string): Promise<void> {
  await testSql`delete from public.campaigns where name like ${`${prefix}%`}`;
}

/** `yyyy-MM-ddTHH:mm` of `instant` (+ `minutes`) in Asia/Ho_Chi_Minh (UTC+7, no DST), floored to the minute. */
export function vnLocal(instant: Date, minutes = 0): string {
  return new Date(instant.getTime() + minutes * 60_000 + 7 * 3_600_000).toISOString().slice(0, 16);
}

export const vnLocalFromNow = (minutes: number) => vnLocal(new Date(), minutes);
