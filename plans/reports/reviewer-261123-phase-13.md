# Review: Phase 13 (F013 Notifications), uncommitted

## Scope
- Reviewed: migrations 0018/0019/0020 (+down), shared/db/schema/notifications.ts, features/notifications/** (34 files, 1764 lines, all <200), app/api/notifications/**, app/api/internal/notifications/drain, app/(app)/notifications, app/(app)/layout.tsx, public-paths, env-schema, supabase-browser-client move + spotlight hook, messages en/vi, tests added.
- Depth: recent (git status/diff + full read of server, SQL, hooks). Suites not run (tester owns the shared DB); tsc/lint/test numbers are the implementer's reports, not re-verified.

## Assessment
Solid. Single-consumer and idempotency hold (per-event tx, `FOR UPDATE SKIP LOCKED`, `consumed_at` in the same tx as rows, UNIQUE guards). Anonymity is decided at read time from the kudo's current state. Realtime policy and trigger are tight. 0 critical, 0 high. Two medium operability/coupling items, rest low.

## Critical
None.

## High
None.

## Medium
1. **Attempts exhausted at cron cadence, parked forever.** notification-event-processor.ts:70-90 + OUTBOX_MAX_ATTEMPTS=5. Cron fires every 5 s, each run tries a failing event once, so a ~25 s transient fault (lock timeout, pool exhaustion, brief partial DB error) parks the event with `failed_at` and no replay path; notification permanently lost. Fix: backoff (skip events retried less than 2^attempts s ago) or count only attempts spaced >= 30 s; at minimum document a manual reset (`update domain_event_outbox set failed_at=null, attempts=0 where ...`). Alt: raise max to 20.
2. **FK cascade couples notification history to outbox retention.** 0018_notifications.sql (event_id FK ON DELETE cascade), schema notifications.ts:34. Any future outbox purge of consumed rows silently deletes users' notifications incl. read state; D009 says no retention. No purge exists today, so latent. Fix: drop the cascade (no action, or nullable event_id with set null) or note in outbox docs that purging requires decoupling.

## Low
- Real sender id persists in `notifications.actor_id` after edit-to-anonymous (map-event-to-notifications.ts:36); only read-time masking hides it. Safe today (no client grant, RLS on, 0002 revokes default privileges, query selects name only for a non-anonymous kudo). Defense in depth: do not store actor_id (join sender via kudo at read) or null it on anonymization.
- Anonymous -> named edit shows "An anonymous Sunner..." (actor_id null; notification-message.ts:17). Privacy-safe, wording stale.
- Header bell unread count is awaited serially after requireSunner/getShellUser, not in Suspense (layout.tsx:13, notification-bell-slot.tsx:12). One indexed count per full load (layout not re-run on client navigations). Wrap in Suspense or run in parallel.
- Hard-coded English fallback "Hero" (notification-message.ts:37) and literal `?secretBox=open` (notification-view-mapper.ts:50) instead of the phase 10 constant (client module; drift risk).
- Docs not updated: INTERNAL_JOB_SECRET is listed in docs/code-standards.md, docs/system/architecture.md, docs/project-changelog.md; OUTBOX_DRAIN_SECRET, the drain path, notifications table and cron setup are absent. doc-writer step still due.
- 0020: `'5 seconds'` needs pg_cron >= 1.5; guard checks availability, not version (failure would abort the migration run). About 17k drain calls/day plus `cron.job_run_details` growth (documented).
- Info: drain answers 503 vs 401, revealing configured state (same as phase 10 tick); Un Spam never notifies (D005, accepted); console.error of driver errors may carry SQL params (ids only, server-side).

## Edge Cases Turned Up (all checked)
- Concurrent drains: candidate list read lock-free, then per-event `SKIP LOCKED` re-check with `consumed_at/failed_at is null`; loser skips, no double rows; no deadlock (single hot row = heart upsert, serialized).
- Heart upsert vs mark-read race: conflict target carries `read_at is null`; a read row frees the key, a new unread row opens. Re-delivery to an already-read row would hit the event unique, but consumption is atomic so it cannot recur.
- Tier-up out-of-order/burst: "before" = highest tier already notified; partial unique index guards concurrent drainers. Deviation from ALG-002 is logged in the decision log.
- Late drain after edit-to-anonymous: processor reads CURRENT kudo state so actor_id is null; list masks again at read time. National kudos: `senderId` only picks the recipient (the sender); params hold kudoId + rank.
- Malformed/unknown event: consumed, log has Zod paths only.
- List keyset: (occurred_at, id) with microsecond cursor, id-dedupe on merge handles bumped heart rows; kudoId cast guarded by UUID regex; all SQL parameterized.
- Realtime: policy requires join topic AND row topic = `notifications:{auth.uid()}`, broadcast only, no INSERT/UPDATE/DELETE policy; payload built field by field {notificationId,type,occurredAt}; trigger SECURITY DEFINER, `search_path=''`, EXECUTE revoked from PUBLIC/anon/authenticated, catch-all RAISE LOG; signal fires inside the processor tx (rollback never signals). Spotlight's policy checks its own row topic, so no cross-read.
- Drain route: sha256 + timingSafeEqual, 503/401 before any DB work, exact public path (no prefix), secret never logged, env optional min 32.
- Cron: NOTICE no-op without pg_cron/pg_net (preloaded)/vault; secrets only in Vault, job guards on both secrets existing; up/down symmetric.
- Browser client: anon key only (`publicEnv`), no service key; spotlight hook + unit mock repointed, old file deleted, no leftover importers.
- Read actions: recipient always the session user; foreign/unknown/malformed id gives the same `not_found` (no oracle); read is one-way.

## Done Well
Per-event transaction with consumption atomic to writes; layered idempotency; anonymity decided at read time with the other value never leaving the DB; content-free signal; migrations with tested down scripts; optimistic UI with revert and bell/panel/page sync; a11y (stretched link, aria-expanded/controls, live region, non-modal dialog with focus); thorough integration tests (privacy, policy, trigger fault-injection, drain auth, migration rollback); en/vi key parity 0 diffs; edits outside ownership limited to the sanctioned spotlight repoint.

## Actions In Order
1. Decide backoff/replay for parked events (Medium 1).
2. Decide FK cascade vs outbox retention (Medium 2).
3. doc-writer: env, endpoint, table, cron setup in docs.
4. Optional lows: actor_id minimisation, Suspense for bell, constant reuse.

## Numbers
- Type/test coverage: not measured by reviewer. Implementer: tsc exit 0, eslint exit 0, unit 878 pass, integration 520 pass.
- Lint findings: 0 (implementer report).
- Source files >200 lines: 0 (largest use-notification-list.ts 171).

## Still Unresolved
- Final tester run on the final code (in progress) and the human sign-off.
- Docs update pending.
- Human to accept or fix Medium 1/2 before commit.

**Status:** DONE_WITH_CONCERNS (no blockers; 2 medium)
**Summary:** 0 critical/high; single-consumer, anonymity, realtime scope, trigger safety, drain guard verified by reading code and SQL.
**Concerns:** parked-event loss under transient faults; outbox cascade latent; docs not updated; suite results not independently verified.
