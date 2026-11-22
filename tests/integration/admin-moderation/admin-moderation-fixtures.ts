import { DEFAULT_ADMIN_KUDO_FILTER } from "@/features/admin-moderation/schemas/admin-kudo-filter-schema";
import type { AdminKudoFilterValues } from "@/features/admin-moderation/schemas/admin-kudo-row";
import { profiles } from "@/shared/db/schema";
import { eq } from "drizzle-orm";
import { testDb, testSql } from "../../setup/integration-db";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Fixtures for the F007 integration tests. Kudos are seeded with phase 05's `insertKudo` (explicit
 * created_at / status / anonymity); hearts and moderation columns are written with SQL here. Teardown
 * reuses phase 04's `cleanupSunners` (kudos, their outbox rows, auth users; hearts cascade).
 */
export const filterOf = (patch: Partial<AdminKudoFilterValues> = {}): AdminKudoFilterValues => ({
  ...DEFAULT_ADMIN_KUDO_FILTER,
  ...patch,
});

export async function makeAdmin(sunner: Sunner): Promise<void> {
  await testDb.update(profiles).set({ role: "admin" }).where(eq(profiles.id, sunner.id));
}

export async function addHearts(kudoId: string, fans: Sunner[], multiplier = 1): Promise<void> {
  for (const fan of fans) {
    await testSql`insert into public.kudo_hearts (kudo_id, user_id, multiplier) values (${kudoId}, ${fan.id}, ${multiplier})`;
  }
}

export async function heartRowCount(kudoId: string): Promise<number> {
  const [row] = await testSql<{ count: number }[]>`select count(*)::int as count from public.kudo_hearts where kudo_id = ${kudoId}`;
  return row.count;
}

export async function setModeration(kudoId: string, status: "public" | "spam", adminId: string, at: string): Promise<void> {
  await testSql`update public.kudos set status = ${status}, moderated_by = ${adminId}, moderated_at = ${at} where id = ${kudoId}`;
}

export type KudoModerationSnapshot = { status: string; moderated_by: string | null; moderated_at: string | null };

export async function moderationOf(kudoId: string): Promise<KudoModerationSnapshot | undefined> {
  const [row] = await testSql<KudoModerationSnapshot[]>`
    select status::text as status, moderated_by, to_json(moderated_at) #>> '{}' as moderated_at
    from public.kudos where id = ${kudoId}`;
  return row;
}

export async function spamOutboxRows(kudoId: string): Promise<{ payload: Record<string, string> }[]> {
  return testSql<{ payload: Record<string, string> }[]>`
    select payload from public.domain_event_outbox where event_type = 'KudoMarkedSpam' and payload ->> 'kudoId' = ${kudoId}`;
}

/** `yyyy-MM-ddTHH:mm:ss` wall clock in Asia/Ho_Chi_Minh (UTC+7, no DST) → ISO instant. */
export const vietnamTime = (wallClock: string) => new Date(`${wallClock}+07:00`).toISOString();
