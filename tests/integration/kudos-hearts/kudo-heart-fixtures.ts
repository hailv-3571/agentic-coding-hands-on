import { testSql } from "../../setup/integration-db";

/**
 * Seed and probe helpers for the F005 integration tests on the local Supabase stack. Hearts are
 * removed with their kudos by phase 04's `cleanupSunners` (kudo_hearts.kudo_id ON DELETE CASCADE;
 * HeartAdded outbox rows carry `kudoId`, so its outbox cleanup covers them). Campaigns are global:
 * every test file deletes the ones it created.
 */
export type HeartRow = { user_id: string; multiplier: number };

export const heartRowsOf = (kudoId: string) =>
  testSql<HeartRow[]>`select user_id, multiplier from public.kudo_hearts where kudo_id = ${kudoId} order by created_at, user_id`;

export const heartAddedRowsOf = (kudoId: string) =>
  testSql<{ payload: unknown }[]>`
    select payload from public.domain_event_outbox where event_type = 'HeartAdded' and payload ->> 'kudoId' = ${kudoId}`;

/** Inserts a heart directly (seeds for read-side tests); `createdAt` defaults to now. */
export async function insertHeart(kudoId: string, userId: string, multiplier = 1, createdAt?: string): Promise<void> {
  await testSql`
    insert into public.kudo_hearts (kudo_id, user_id, multiplier, created_at)
    values (${kudoId}, ${userId}, ${multiplier}, ${createdAt ?? new Date().toISOString()})`;
}

/** Removes every heart and HeartAdded row of the given kudos (per-test reset). */
export async function resetHearts(kudoIds: string[]): Promise<void> {
  await testSql`delete from public.kudo_hearts where kudo_id = any(${kudoIds}::uuid[])`;
  await testSql`
    delete from public.domain_event_outbox where event_type = 'HeartAdded' and payload ->> 'kudoId' = any(${kudoIds}::text[])`;
}

/** A campaign whose window holds the current instant: [now - 1h, now + 1h). Returns its id. */
export async function insertActiveCampaign(name = "Test x2 campaign"): Promise<number> {
  const [row] = await testSql<{ id: number }[]>`
    insert into public.campaigns (name, starts_at, ends_at)
    values (${name}, now() - interval '1 hour', now() + interval '1 hour') returning id::int as id`;
  return row.id;
}

export async function deleteCampaigns(ids: number[]): Promise<void> {
  if (ids.length > 0) await testSql`delete from public.campaigns where id = any(${ids}::bigint[])`;
}
