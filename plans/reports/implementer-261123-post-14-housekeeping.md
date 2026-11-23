# Implementer report: post-14 housekeeping, kudo export filename, prod admin checks

Date: 2026-11-23 · Role: implementer (RED-first) · Brief: `plans/261108-0048-saa-2025-kudos-platform/evidence/post-14-hardening/study-context.json`

## Scope Contract
- **Changed:** migration 0023 (+ down, + drizzle meta), `adminKudoExportFilename`, `tests/prod/production-admin-403-status.ts`, new `tests/integration/housekeeping/**`.
- **Impacted:** outbox consumers, notification history (FK SET NULL), kudos CSV filename, cron history.
- **Will verify:** integration (full suite, since this is a data mutation and counts as safety-critical), unit, tsc, lint, build, test:prod.
- **Deliberately skipped:** Playwright (a parallel agent owns it; tester reruns everything later).

## 1. Housekeeping migration `0023_housekeeping_outbox_and_cron_history_prune`
Files:
- `db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql`
- `db/migrations/0023_housekeeping_outbox_and_cron_history_prune.down.sql`
- `db/migrations/meta/0023_snapshot.json` and `_journal.json` (idx 23): generated with `npm run db:generate -- --custom --name ...`, which is the documented way to add custom SQL. The snapshot is 0022 with a new id and prevId = 0022's id, the same key-reorder-only pattern as 0019→0020.

Jobs (each `cron.schedule` upserts by name, so re-running is safe):
| Job | Schedule (GMT, `cron.timezone`) | Command |
|---|---|---|
| `saa-outbox-prune` | `0 19 * * *` (02:00 ICT) | `DELETE FROM public.domain_event_outbox WHERE consumed_at IS NOT NULL AND consumed_at < now() - interval '30 days'` |
| `saa-cron-history-prune` | `15 19 * * *` (02:15 ICT) | `DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'` |

Decisions:
- **Retention.** Consumed outbox rows are kept for 30 days. That leaves a month of forensics, including malformed events' `last_error`, and nothing reads a row once it is consumed. Cron history is kept for 7 days, the pg_cron-recommended window. The drain alone adds about 17k rows a day.
- **Safety.** The predicate requires `consumed_at`. Pending rows (`consumed_at` null) and parked rows (`failed_at` set, `consumed_at` null) can therefore never match at any age.
- **Consumer audit.** The only reader is `NotificationEventProcessor` (`features/notifications/server/notification-event-processor.ts`), and it reads only pending, due rows. `notification-writer.ts` joins the outbox only for the event being consumed.
  - Producers only insert: create-kudo, hearts, moderation, secret-box grant, icon set, national-kudos finalize.
  - National-kudos "once" is guarded by the `national_kudos` table.
  - The spotlight board uses a realtime trigger (0017), not the outbox.
  - `notifications.event_id` is `ON DELETE SET NULL` (0021, `confdeltype 'n'`), so history survives.
  - The notifications realtime trigger fires only on `UPDATE OF count`, so the FK set-null does not signal.
- **Permissions.** pg_cron runs a job as the role that scheduled it, here `postgres`, which is not a superuser on Supabase. cron RLS (`username = current_user`) limits the history prune to `postgres`-owned jobs, which covers every `saa-*` job. Jobs of other roles keep their history; this is documented in the header. Checked live: the real pg_cron worker ran both exact commands as `succeeded` (`DELETE 0`). Evidence: `evidence/post-14-hardening/housekeeping-pg-cron-worker-probe.txt`. The probe jobs were then unscheduled.
- **No batching and no `consumed_at` index (YAGNI).** Each daily run deletes about one day of rows, and a sequential scan over a few weeks of events is cheap. The header says to revisit this if the outbox grows past about 1M rows.
- **Portability.** The guard copies the style of 0016/0020 but checks only pg_cron (pg_net and Vault are not needed). If pg_cron is not preloaded or not available, the migration raises a NOTICE, schedules nothing and returns. The down script unschedules both jobs, or raises a NOTICE and does nothing if `cron.job` is absent.

Tests (`tests/integration/housekeeping/`):
- `housekeeping-prune-jobs.test.ts` reads the command text from `cron.job` and runs it in a rolled-back transaction as the job owner's role. It seeds:
  - Outbox: consumed 31 days ago (deleted), consumed malformed 89 days ago (deleted), consumed 29 days ago (kept), pending 60 days (kept), retrying 60 days (kept), parked 60 days (kept).
  - Notifications: a notification of a pruned event survives with `event_id` null.
  - Cron history: rows that ended 7.5 days ago (deleted), and 6.5 days ago and just now (kept).
- `housekeeping-migration.test.ts`: journal entry applied; both jobs active and owned by `current_user` with the expected command text; NOTICE and no jobs when pg_cron is not preloaded or not available (via `brokenGuard`); down is a no-op with a NOTICE without `cron.job`; down → up → up leaves exactly one row per job and other jobs untouched.
- `housekeeping-cron-script-runner.ts`: job names, tag suffix and a NOTICE-recording rollback runner.

RED-first evidence:
- RED: 9/9 failed before the migration existed, for the right reasons ("no journal entry", "pg_cron job saa-outbox-prune is not scheduled"). See `evidence/post-14-hardening/housekeeping-red-run.txt`.
- GREEN: 9/9 passed. See `housekeeping-green-run.txt`.
- Mutation probe: I rescheduled the jobs with wrong predicates (`occurred_at < 30d`; `start_time < 1d`). Both predicate tests failed. I then restored the real commands and the tests passed again.
- Test-side fix during GREEN: `postgres` lacks USAGE on `cron.runid_seq`, so the history seeds use explicit negative runids.

## 2. `adminKudoExportFilename`
`features/admin-moderation/server/admin-kudo-export.ts` now returns `adminCsvFilename("kudos", now)` and no longer imports `toAdminZone`. I kept the export name because `app/api/admin/kudos/export/route.ts` and the unit test import it. Output is unchanged; `tests/unit/admin-moderation/admin-kudo-export.test.ts` passes.

## 3. `tests/prod/production-admin-403-status.ts` (191 lines)
- Added an optional `contentType` check (prefix match on `content-type`).
- Added 9 checks:
  - Member RSC GET and RSC prefetch of `/admin/users` → 403 page without the admin frame.
  - Admin `/admin/users` → 200 with the `>ADMIN<` frame and the users filter region.
  - Member GET of each export route → 403 `{"code":"forbidden"}`.
  - Admin GET of each export route → 200 `text/csv`.
- The export routes are `/api/admin/users/export`, `/api/admin/overview/export` and `/api/admin/kudos/export`. They sit outside the proxy's `/admin` gate, so the route's `requireAdminApi` is what answers.

## Gates (run serially, final code)
| Gate | Exit | Result |
|---|---|---|
| `npx tsc --noEmit -p .` | 0 | clean (after one union-type fix in the runner) |
| `npm run lint` | 0 | clean |
| `npm run test:unit` | 0 | 86 files, 943 tests |
| `npm run db:reset` | 0 | 0023 applied; four cron jobs present |
| `npm run test:integration` | 0 | 95 files, 607 tests (`integration-full-run-summary.txt`) |
| `npm run build` | 0 | compiled |
| `npm run test:prod` | 0 | 25/25 PASS (`test-prod-admin-status-run.txt`) |

## Notes
- **Docs impact: minor.** The deployment and ops notes should list the two prune jobs, the 30-day and 7-day retention, and the host-cron fallback. I did not edit `docs/` (outside my files). The 0020 header's "prune it with the project's usual pg_cron housekeeping" now refers to 0023; I left the applied migration untouched.
- **Stale production server.** A `next start -p 3200` started 2026-11-22 17:07 from an earlier session is still running. My `npm run build` replaced `.next` under it. I did not kill it because it is not mine.
- **Shared database.** `db:reset` ran while a long-lived `next dev` (started 2026-11-22) was up, and it wipes the shared local DB.
- **Other agents' uncommitted files** are in the tree and were not touched by me: `docs/system/permissions.md`, `tests/e2e/*`, `tests/e2e/zz-tmp-flake-repro*.spec.ts`, `.gitleaksignore`, `plans/.../handover-open-decisions.md`.

**Status:** DONE_WITH_CONCERNS
**Summary:** Migration 0023 schedules daily, guarded, idempotent prunes of consumed outbox rows (30 days) and cron history (7 days), and the integration tests run the scheduled commands themselves (RED, then GREEN, plus a mutation probe). The kudo export filename reuses the shared helper, and test:prod covers /admin/users and the three CSV exports. All seven gates exit 0.
**Concerns/Blockers:** Concerns only, nothing blocking. The deployment docs need the two jobs and their retention added (doc-writer). The history prune covers only jobs owned by the migration role (cron RLS); this is by design and documented. A stale `next start -p 3200` from 2026-11-22 is still running.
