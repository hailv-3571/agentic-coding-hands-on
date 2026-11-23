import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { withRollback } from "../../setup/integration-db";
import { CRON_HISTORY_PRUNE_JOB, OUTBOX_PRUNE_JOB } from "./housekeeping-cron-script-runner";

/**
 * Migration NNNN_housekeeping_outbox_and_cron_history_prune, behaviour: each test runs the EXACT command
 * pg_cron has scheduled (read from cron.job, never a copy) as this connection's role — the job owner, so
 * the same role and cron RLS scope as the cron worker — inside an always rolled-back transaction (now()
 * is the transaction start for the seeds and the command alike). Retention: consumed outbox events 30
 * days; pending, retrying and parked events never; cron run history 7 days.
 */
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];

async function runScheduledCommand(tx: Tx, jobName: string): Promise<void> {
  const [job] = await tx.execute<{ command: string }>(sql`select command from cron.job where jobname = ${jobName}`);
  if (!job) throw new Error(`pg_cron job ${jobName} is not scheduled (housekeeping migration not applied)`);
  await tx.execute(sql.raw(job.command));
}

/** Days ago (fractions allowed); null = column stays null. */
type OutboxSeed = { occurred: number; consumed: number | null; failed: number | null; attempts: number; retryInMinutes: number | null };
const OUTBOX_SEEDS = {
  consumedLongAgo: { occurred: 31.5, consumed: 31, failed: null, attempts: 0, retryInMinutes: null },
  consumedMalformedLongAgo: { occurred: 90, consumed: 89, failed: null, attempts: 0, retryInMinutes: null },
  consumedRecently: { occurred: 45, consumed: 29, failed: null, attempts: 2, retryInMinutes: null },
  pendingLongAgo: { occurred: 60, consumed: null, failed: null, attempts: 0, retryInMinutes: null },
  retryingLongAgo: { occurred: 60, consumed: null, failed: null, attempts: 2, retryInMinutes: 5 },
  parkedLongAgo: { occurred: 60, consumed: null, failed: 59, attempts: 5, retryInMinutes: null },
} satisfies Record<string, OutboxSeed>;
type OutboxLabel = keyof typeof OUTBOX_SEEDS;

const daysAgo = (days: number | null) => sql`now() - make_interval(secs => ${days}::float8 * 86400)`;

async function seedOutbox(tx: Tx): Promise<Map<string, OutboxLabel>> {
  const labels = new Map<string, OutboxLabel>();
  for (const [label, seed] of Object.entries(OUTBOX_SEEDS) as [OutboxLabel, OutboxSeed][]) {
    const [row] = await tx.execute<{ id: string }>(sql`
      insert into public.domain_event_outbox (event_type, payload, occurred_at, consumed_at, failed_at, attempts, next_attempt_at, last_error)
      values ('KudoCreated', ${JSON.stringify({ kudoId: randomUUID() })}::jsonb, ${daysAgo(seed.occurred)}, ${daysAgo(seed.consumed)},
              ${daysAgo(seed.failed)}, ${seed.attempts}, now() + make_interval(mins => ${seed.retryInMinutes}::int),
              ${label === "consumedMalformedLongAgo" ? "malformed KudoCreated: kudoId Invalid UUID" : null})
      returning id`);
    labels.set(row.id, label);
  }
  return labels;
}

/** A Sunner (the AFTER INSERT trigger creates the profile) with one notification produced by `eventId`. */
async function seedNotification(tx: Tx, eventId: string): Promise<string> {
  const [user] = await tx.execute<{ id: string }>(sql`
    insert into auth.users (id, email, raw_user_meta_data)
    values (${randomUUID()}, ${`housekeeping-${randomUUID()}@sun-asterisk.com`}, '{}'::jsonb) returning id`);
  const [notification] = await tx.execute<{ id: string }>(sql`
    insert into public.notifications (recipient_id, type, event_id, params)
    values (${user.id}, 'secret_box_granted', ${eventId}, '{"count":1}'::jsonb) returning id`);
  return notification.id;
}

describe("outbox prune job (consumed events past the 30-day retention)", () => {
  it("deletes only events consumed more than 30 days ago; pending, retrying, parked and recent ones stay", async () => {
    const remaining = await withRollback(async (tx) => {
      const labels = await seedOutbox(tx);
      await runScheduledCommand(tx, OUTBOX_PRUNE_JOB);
      const rows = await tx.execute<{ id: string }>(sql`
        select id::text as id from public.domain_event_outbox where id::text in ${[...labels.keys()]}`);
      return rows.map((row) => labels.get(row.id)).sort();
    });
    expect(remaining).toEqual(["consumedRecently", "parkedLongAgo", "pendingLongAgo", "retryingLongAgo"]);
  });

  it("keeps the notification history of a pruned event, with event_id set to null", async () => {
    const result = await withRollback(async (tx) => {
      const labels = await seedOutbox(tx);
      const prunedEventId = [...labels].find(([, label]) => label === "consumedLongAgo")?.[0] ?? "";
      const notificationId = await seedNotification(tx, prunedEventId);
      await runScheduledCommand(tx, OUTBOX_PRUNE_JOB);
      const [event] = await tx.execute<{ count: number }>(sql`
        select count(*)::int as count from public.domain_event_outbox where id = ${prunedEventId}`);
      const notifications = await tx.execute<{ id: string; event_id: string | null; type: string }>(sql`
        select id, event_id, type::text as type from public.notifications where id = ${notificationId}`);
      return { notificationId, eventRows: event.count, notifications: [...notifications] };
    });
    expect(result.eventRows).toBe(0);
    expect(result.notifications).toEqual([{ id: result.notificationId, event_id: null, type: "secret_box_granted" }]);
  });
});

describe("cron history prune job (cron.job_run_details past the 7-day retention)", () => {
  it("deletes only runs that ended more than 7 days ago", async () => {
    const remaining = await withRollback(async (tx) => {
      const ends = { endedLongAgo: 7.5, endedRecently: 6.5, endedJustNow: 0 } as const;
      const labels = new Map<string, keyof typeof ends>();
      for (const [index, [label, days]] of (Object.entries(ends) as [keyof typeof ends, number][]).entries()) {
        // username = current_user: cron.job_run_details RLS (username = current_user) scopes reads and writes.
        // Explicit negative runids: the migration role may not use cron.runid_seq, and they never collide with it.
        const [row] = await tx.execute<{ runid: string }>(sql`
          insert into cron.job_run_details (runid, jobid, database, username, command, status, return_message, start_time, end_time)
          select ${-(index + 1)}::bigint, jobid, current_database(), current_user, 'select 1', 'succeeded', '1 row',
                 ${daysAgo(days + 0.001)}, ${daysAgo(days)}
          from cron.job where jobname = ${CRON_HISTORY_PRUNE_JOB}
          returning runid::text`);
        if (!row) throw new Error(`pg_cron job ${CRON_HISTORY_PRUNE_JOB} is not scheduled (housekeeping migration not applied)`);
        labels.set(row.runid, label);
      }
      await runScheduledCommand(tx, CRON_HISTORY_PRUNE_JOB);
      const rows = await tx.execute<{ runid: string }>(sql`
        select runid::text as runid from cron.job_run_details where runid::text in ${[...labels.keys()]}`);
      return rows.map((row) => labels.get(row.runid)).sort();
    });
    expect(remaining).toEqual(["endedJustNow", "endedRecently"]);
  });
});
