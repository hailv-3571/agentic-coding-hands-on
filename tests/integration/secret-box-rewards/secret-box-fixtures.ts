import { testSql } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Seed and probe helpers for the F010 integration tests on the local Supabase stack. Boxes, icons and
 * awards cascade with the profiles (`cleanupSunners` deletes the auth users); the F010 outbox rows
 * carry `userId`, so `cleanupSecretBoxUsers` deletes them first. Prize-pool changes are global: every
 * `restrictPrizePool` must be undone with `restorePrizePool` in `afterEach`/`afterAll`.
 */
export type BoxRow = { seq: number; status: string };
export type OutboxPayload = Record<string, unknown>;

export const createSunners = (prefixes: string[]) => Promise.all(prefixes.map((prefix) => createSunner(prefix, `${prefix} name`)));

export const boxesOf = (userId: string) =>
  testSql<BoxRow[]>`select seq, status from public.secret_boxes where user_id = ${userId} order by seq`;

export async function eventsFor(type: "BoxGranted" | "SetCompleted", userId: string): Promise<OutboxPayload[]> {
  const rows = await testSql<{ payload: OutboxPayload }[]>`
    select payload from public.domain_event_outbox where event_type = ${type} and payload ->> 'userId' = ${userId} order by occurred_at`;
  return rows.map((row) => row.payload);
}

/** Inserts `count` unopened boxes after the user's last seq (open tests start from granted boxes). */
export async function grantBoxes(userId: string, count: number): Promise<void> {
  await testSql`
    insert into public.secret_boxes (user_id, seq)
    select ${userId}, s from generate_series(
      (select coalesce(max(seq), 0) + 1 from public.secret_boxes where user_id = ${userId}),
      (select coalesce(max(seq), 0) + ${count} from public.secret_boxes where user_id = ${userId})) s`;
}

/** Removes the users' boxes, icons, awards and F010 outbox rows (per-test reset; profiles stay). */
export async function resetRewards(userIds: string[]): Promise<void> {
  await testSql`delete from public.secret_boxes where user_id = any(${userIds}::uuid[])`;
  await testSql`delete from public.user_icons where user_id = any(${userIds}::uuid[])`;
  await testSql`delete from public.mystery_gift_awards where user_id = any(${userIds}::uuid[])`;
  await testSql`
    delete from public.domain_event_outbox
    where event_type in ('BoxGranted', 'SetCompleted') and payload ->> 'userId' = any(${userIds}::text[])`;
}

export async function cleanupSecretBoxUsers(users: Sunner[]): Promise<void> {
  const ids = users.map((user) => user.id).filter(Boolean);
  if (ids.length > 0) await resetRewards(ids);
  await cleanupSunners(users);
}

const deactivated: string[] = [];

/** Leaves only the prizes with these codes active (the rest are deactivated until restored). */
export async function restrictPrizePool(activeCodes: string[]): Promise<void> {
  const rows = await testSql<{ code: string }[]>`
    update public.secret_box_prizes set active = false where active and code <> all(${activeCodes}::text[]) returning code`;
  deactivated.push(...rows.map((row) => row.code));
}

export async function restorePrizePool(): Promise<void> {
  const codes = deactivated.splice(0);
  if (codes.length > 0) await testSql`update public.secret_box_prizes set active = true where code = any(${codes}::text[])`;
}

/** A test-only gift (deleted by `deleteTestPrizes` after the users, whose boxes reference it). */
export async function insertTestGift(code: string, weight: number, stock: number): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`
    insert into public.secret_box_prizes (code, kind, name, weight, stock_total, stock_remaining)
    values (${code}, 'gift', ${`Test gift ${code}`}, ${weight}, ${stock}, ${stock}) returning id`;
  return row.id;
}

export async function deleteTestPrizes(codes: string[]): Promise<void> {
  if (codes.length > 0) await testSql`delete from public.secret_box_prizes where code = any(${codes}::text[])`;
}
