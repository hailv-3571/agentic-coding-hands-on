## Review Summary: phase 13 review-fix delta (M1 backoff, M2 FK SET NULL)

### Scope
- Files: notification-event-processor.ts (120 lines), notification-config.ts, domain-event-outbox.ts, notifications.ts, migration 0021 up/down, 0021 snapshot, journal, 3 integration test files. Depth: specific. Read-only; tests not re-run by me.

### Assessment
Both mediums fixed correctly. 0 critical, 0 high, 0 medium open. Seal holds. Safety-critical (migration, data mutation) walked in full.

### Critical / High / Medium
None open.

### Low (all Defer)
- processor:91-94: recordFailure returns "retrying" and logs "will retry" even when the UPDATE matched 0 rows (another drainer consumed/recorded first). Cosmetic counter/log skew. Fix: `row ? ... : "skipped"`.
- 0021.sql:15-19: FK drop/re-add validates under lock. Fine pre-launch; use `NOT VALID` + `VALIDATE CONSTRAINT` if large.
- Earlier lows (actor_id minimisation, serial unread count, secretBox literal, docs) unchanged.

### Focus-area answers
- Concurrency: consume re-reads `FOR UPDATE SKIP LOCKED` with the due predicate; locked row skipped. recordFailure's UPDATE also requires pending AND due; under READ COMMITTED the loser re-evaluates after the winner commits, finds next_attempt_at in the future, matches 0 rows: one attempt counted per failure window. No double count.
- Starvation: predicate is applied before ORDER/LIMIT, so backed-off rows never occupy batch slots. Delay uses pre-update `attempts` (0 -> 60 s), 60/120/240/480 s = 15 min, matches config and docs.
- Index: existing partial index (occurred_at, id) where consumed/failed null still drives the scan; next_attempt_at is a residual filter on few rows. No new index needed.
- Migration: drizzle migrator runs the batch in one transaction, so drop FK / drop NOT NULL / add column / re-add FK is atomic; no window for an orphan insert. ADD COLUMN nullable, no default: metadata-only. Cost: brief ACCESS EXCLUSIVE on notifications plus validation scan.
- Down script: deletes null-event_id rows, which is what the original cascade would have done; documented in header and exercised by roll-down/up test. Acceptable, data loss only for already-detached history. Order is correct (drop FK, delete, SET NOT NULL, re-add cascade, drop column).
- Dedup under SET NULL: writer inserts non-null event_id from an existing outbox row; UNIQUE treats NULLs distinct only for detached historic rows; heart/tier unique indexes ignore event_id; signal trigger is INSERT / UPDATE OF count, so SET NULL emits nothing.
- Manual reset SQL: correct (`failed_at=null, attempts=0, next_attempt_at=null where consumed_at is null and failed_at is not null`); safe because of write-path guards 2-4.
- Schema / snapshot / journal consistent (idx 21, next_attempt_at, set null). 0018-0020 untouched; earlier lows unchanged; no regression seen.

### Done Well
Predicate shared via one constant; failure record guarded by due check; docs in code; tests cover backoff doubling, not-due skip, park, outbox-delete, 5-way concurrent drain, down/up footprint.

### Actions In Order
1. Optional: return "skipped" when recordFailure updates no row.
2. Doc-writer step for docs (pending from earlier).

### Numbers
- Type coverage / test coverage: not measured. Lint findings: not run. Files under 200 lines (test file at 198, at the limit).

### Still Unresolved
- humanSignedOff remains false (riskGate signoff required: sensitive area).

Verdict written to evidence/phase-13/inspection-verdict.json (SEALED, score 9).
