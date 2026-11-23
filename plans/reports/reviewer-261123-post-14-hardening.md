## Review Summary: post-phase-14 hardening

### Scope
- Files: db/migrations/0023_* (+down, journal, snapshot), tests/integration/housekeeping/**, admin-kudo-export.ts, production-admin-403-status.ts, e2e fixtures/helpers/specs, composer toast host + layout + modal + toast, comment edits, .gitleaksignore, docs/system/permissions.md, handover-open-decisions.md
- Depth: recent (uncommitted diff). Not run (tester is on them): integration, Playwright, db:reset, build, test:prod.

### Assessment
Sound. No critical or high findings. The migration predicate is safe by construction and the tests execute the scheduled command text itself. Verdict is REWORK only because 5 acceptance criteria rest on tester or scan evidence I cannot see; no code defect blocks.

### Critical / High / Medium
None.

### Low
1. handover-open-decisions.md:123 still lists the housekeeping schedule as open; 0023 does it. Reword. (Accept)
2. spotlight-board-e2e-helpers.ts:70-76 unguarded `JSON.parse` of every text frame; wrap in try/catch, forward unparsed frames. (Accept)
3. 0023.sql:32-35 unbatched delete, no consumed_at index; fine at volume, threshold documented. (Defer)
4. edit-kudo.spec.ts:85 1 s toast timeout tight under load; intentional. (Defer)
5. toast-host:30-32 hook throws outside app/(app); all consumers verified inside. (Defer)

### Edge Cases Turned Up
- Pending, retrying, parked: `consumed_at IS NOT NULL` excludes all; the test seeds each.
- SET NULL on notifications: trigger is `UPDATE OF count` only, so no realtime signal; UNIQUE(event_id, ...) treats NULLs as distinct, no conflict.
- cron.job_run_details: running rows have end_time NULL and are never deleted; RLS limits the delete to the owner role (all saa-* jobs).
- Snapshot 0023 deep-equals 0022 tables (key order differs textually only); prevId chain correct.
- Toast: modal returns null when closed; toast outlives the modal and feed remount; new object per save restarts the timer; one live region.
- Layout is `instant = false` (blocking), so a client provider around children does not affect static shell/PPR; children stay RSC-passed.
- Teardown public to spam fires `removed` (0017 trigger), so other boards stay consistent.

### Done Well
- Tests run the exact command read from cron.job, in rolled-back transactions, including portability and down/up/up.
- Down script symmetric with up, NOTICE no-op.
- Regression test for the toast flake added without touching existing assertions.
- Shared filename helper reused, output identical.

### Actions In Order
1. Get tester evidence (criteria 2, 3, 6, 8) and secret-scan result (7); then seal.
2. Guard JSON.parse in broadcastTopic.
3. Update handover row 123.

### Numbers
- tsc: clean. eslint on touched dirs: 0 findings. Unit (admin-moderation, kudos-authoring): 158/158.
- Coverage: not measured by me (criterion 6 unproven).

### Still Unresolved
- Criteria 2, 3, 6, 7, 8 unproven by me.
- .gitleaksignore: 3 fingerprints scoped to test-only constants; confirm the scan output on final history before push. docs/system/permissions.md spot-checked (countdown public, prelaunch allow-list in shared/auth/public-paths.ts); no false claims found.

## Delta (after tester and scan evidence)
- Tester run (plans/reports/tester-261123-post-14-hardening.md): unit 943, integration 607, Playwright 142 passed / 5 skipped / 0 failed x3 at 3 workers, prelaunch, build, test:prod all exit 0; coverage ~49% statements, no threshold. Cron-drain evidence: event consumed in ~2 s, notification row, HTTP 200, Vault saa_* secrets 0 before and after.
- gitleaks v8.21.2 full history: clean with 3 test-only fingerprints. Rescan the working tree before push (new files are uncommitted).
- Low finding 2 verified fixed by reading (try/catch returns null, frame forwarded). Finding 1 still Accept, doc-writer fixing.
- package.json/vitest.config.mts: @vitest/coverage-v8 5.1.0 exact devDependency; coverage.include only used with --coverage; no prod dependency change, no issue.
- Criteria 2, 3, 6, 7, 8 now proven; all 8 in acceptanceCovered. Decision SEALED (humanSignedOff false).
