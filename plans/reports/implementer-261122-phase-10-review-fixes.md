# Phase 10 (F010 Secret Box) — review-fix round, implementer report

Date: 2026-11-22 · Role: implementer (RED-first) · Inputs: `reviewer-261122-phase-10.md`, `tester-261122-phase-10-full-run.md`, `implementer-261122-phase-10-secret-box-{backend,ui}.md`, spec `spec/secret-box-rewards/` (DEC-002, SCR-secret-box-open E08)

## Scope Contract
- **Changed:** open result contract (`duplicate`), open service + icon service, modal result caption + SR announcement, vi/en `secretBox.modal.duplicateIcon`; migration 0016 up/down (guarded DO blocks); tick route → new tick job (advisory-lock overlap guard), sweep cap (`SWEEP_MAX_SENDERS_PER_TICK`), grant-service sweep path (batched due filter); seam data moved to `rewards-column-data-loader.ts`.
- **Impacted:** POST `/api/secret-boxes/open` body (additive field), tick response (`{skipped:true}` + `sweep.deferred`), migration chain on non-Supabase DBs, Live board seam, phase 12/13 consumers of the result type.
- **Will verify:** RED→GREEN per behaviour at unit/integration; e2e for the UI; then the full gate list (safety-critical: migration, API contract, cron/internal endpoint → full suites).
- **Deliberately skipped:** nothing from the brief. Reviewer's optional "replay lookup before reconcile" not done (not in this brief).

## Changes

### 1. Duplicate-icon flag (E08 "Bạn đã có icon này rồi")
- `schemas/secret-box-views.ts`: `OpenSecretBoxResult.duplicate: boolean` (true = icon already owned before this open; false for first copies and gifts; replay returns the original value).
- `server/icon-collection-service.ts`: upsert `RETURNING quantity` → `duplicate = quantity > 1` (first answer).
- `server/secret-box-open-service.ts`: replay derives it migration-free from `user_icons.first_obtained_at <> secret_boxes.opened_at` (a new icon's `first_obtained_at` = the open's `now()`). `<>`, not `<`: a transaction that BEGINs first can take the user lock second, so its `now()` can be the earlier one (covered by the parallel test).
- UI `secret-box-modal-states.tsx`: caption under the box on a duplicate icon result, appended to the `role=status` announcement; never on gifts / set completion. Keys: vi "Bạn đã có icon này rồi", en "You already have this icon".
- Client opener left lenient (missing field = no caption), so a new client against an older server never loops on "unreadable".
- Evidence: `evidence/screenshots/phase-10/phase-10-secret-box-modal-duplicate-icon-{desktop-1440x900,mobile-375x812}.png` (checked visually).

### 2. W1 — 0016 cron migration portability
- Up: one `DO $tick$` block. Skips with `RAISE NOTICE 'saa-secret-box-tick not scheduled, unavailable: …; use a host cron instead'` when `pg_cron`/`pg_net` is not in `pg_available_extensions` or not in `shared_preload_libraries` (pg_cron's CREATE EXTENSION errors when not preloaded), or `vault.decrypted_secrets` is missing. Otherwise unchanged behaviour (create extensions + `cron.schedule` upsert).
- Down: symmetric `DO` block, NOTICE + no-op when `cron.job` does not exist.
- Verified: `db:reset` applied it through drizzle-kit; local Supabase still schedules `* * * * *` (existing test + down→up test).

### 3. Tick overlap guard + cap
- `server/secret-box-advisory-lock.ts`: `tryLockSecretBoxTick(tx)` = `pg_try_advisory_xact_lock(hashtext('secret_box_tick'))`. Transaction-scoped on purpose (brief said `pg_try_advisory_lock`): a session lock is unsafe behind Supabase's transaction pooler and would leak if a process died mid-tick.
- New `server/secret-box-tick-job.ts`: whole tick inside one transaction holding the lock; held → `{ skipped: true }` (route answers 200 `{skipped:true}`); jobs still fail independently. Route also maps a tick that cannot start to 500 `unexpected`.
- `secret-box-config.ts`: `SWEEP_MAX_SENDERS_PER_TICK = 500`. Grant service sweep path now does 2 batched reads (heart totals + `max(seq)` per user), keeps only DUE senders, reconciles at most the cap; `SweepOutcome` gains `deferred`. Up-to-date senders take no slot, so deferred ones are picked up next tick (window overlaps). `sweep.senders` now means "reconciled this tick".

### 4. Tester gaps
- (a) Seam data moved to `server/rewards-column-data-loader.ts` (`requireSunner()` before any query); seam file is now render-only. Integration: guest → redirect `/login`, `LatestGiftWinnersQuery.top10` and `PersonalRewardStatsQuery.forUser` never called; Sunner → own stats. E2E: guest `GET /kudos` → 307 `/login`, no winners title in the body or the page.
- (b) Component-level unit (renderToStaticMarkup + real messages): empty winners line, winners-only error, stats-only error (no `dl`), both errors.
- (c) E2E: Tab/Shift+Tab cycle close ↔ box and focus never leaves the dialog; `reducedMotion: 'reduce'` → 0 WAAPI animations while opening and after the result, and an instant answer renders in < 800 ms (no 900 ms hold; network stub used only for that timing check). Control added to the existing open-flow test: with motion on, the wobble IS detected (> 0).
- (d) E2E with the F011 `seedActive` fixture (merged fixtures): x2 flame visible while the seeded campaign is live, gone after it is deleted.

### 5. Record for the orchestrator (phase 13 constraint)
`NationalKudosFinalized` (written by `national-kudos-finalize-job.ts`) carries `items[{kudoId, senderId, rank}]` where `senderId` is the REAL sender, also for anonymous kudos (needed to notify the sender). Phase 13 must never put that id (or anything derived from it: name, avatar, profile link) in a recipient-visible notification, public feed, or any API response to other users. Safe today: the outbox is RLS-closed and read by no API. Please log it in the phase 13 plan / decision log.

## RED → GREEN
| Item | Test | RED (reason) | GREEN |
|---|---|---|---|
| 1 | unit `secret-box-duplicate-icon-caption.test.ts` | 1 failed: `expected '' to be 'Bạn đã có icon này rồi'` | 2/2 (folder 25/25) |
| 1 | integration `secret-box-duplicate-icon.test.ts` + `secret-box-api-auth.test.ts` key list | 5 failed: field absent; parallel case `expected length 1 but got 4` | 5 open-path files, 21/21 |
| 1 | e2e caption (open-flow) + first-prize negative | — (behaviour proven RED at unit/integration) | green |
| 2 | integration `secret-box-migration.test.ts` (3 up variants + down) | 4 failed: `the script has no guard check …` | 13/13 |
| 3 | integration `secret-box-tick-overlap-and-cap.test.ts` | 3 failed: `tryLockSecretBoxTick is not a function`; `{senders: 3}` vs cap 2; up-to-date senders counted | 4 tick/grant files, 18/18 |
| 4a | integration `rewards-column-data-loader.test.ts` | module missing (seam not separable) | 2/2 |
| 4a–d | unit column states, e2e guest / focus / reduced motion / x2 | test gaps on existing behaviour (passed first run) | secret-box e2e 13/13, `--repeat-each=2` 26/26 |

## Gates (final code, each alone, in order)
| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean |
| 2 | `npm run lint` | 1 → 0 | first run: `react/no-children-prop` in my unit render helper; helper moved to `.tsx`/JSX, rerun clean |
| 3 | `npm run test:unit` | 0 | 56 files, 709 passed |
| 4a | `npm run db:reset` | 0 | migrations applied (guarded 0016), seeds `secretBoxPrizes=9` |
| 4b | `npm run test:integration` | 0 | 61 files, 406 passed (79 s) |
| 5 | `npx playwright test --timeout 90000` | 0 | 118: 113 passed, 5 skipped (prelaunch-only), 0 failed, 0 flaky |
| 6 | `npm run test:e2e:prelaunch` | 0 | 6: 5 passed, 1 skipped (normal-server-only) |
| 7 | `npm run build` | 0 | compiled, no warnings; 3 secret-box routes listed |
| 8 | `npm run test:prod` | 0 | all production status checks passed |

Dev server :3000 untouched and healthy after the run (`/login` 200). The local DB carries e2e/integration draws (gift stock consumed); `npm run db:reset` restores it.

## Raw runs
```json
[
  {"command": "npx vitest run --project unit <2 new secret-box UI files>", "exitCode": 1, "summary": "RED: duplicate caption absent (1 failed, 5 passed)"},
  {"command": "npx vitest run --project integration secret-box-duplicate-icon + secret-box-api-auth", "exitCode": 1, "summary": "RED: 5 failed, duplicate field missing"},
  {"command": "npx vitest run --project integration open-path files (5)", "exitCode": 0, "summary": "GREEN 21/21"},
  {"command": "npx vitest run --project integration secret-box-migration.test.ts", "exitCode": 1, "summary": "RED: 4 failed, scripts have no guard"},
  {"command": "npx vitest run --project integration secret-box-migration.test.ts", "exitCode": 0, "summary": "GREEN 13/13"},
  {"command": "npx vitest run --project integration secret-box-tick-overlap-and-cap.test.ts", "exitCode": 1, "summary": "RED: 3 failed (no lock fn, no cap, up-to-date senders counted)"},
  {"command": "npx vitest run --project integration tick/grant files (4)", "exitCode": 0, "summary": "GREEN 18/18"},
  {"command": "npx vitest run --project integration rewards-column-data-loader.test.ts", "exitCode": 1, "summary": "RED: loader module missing"},
  {"command": "npx vitest run --project integration rewards-column-data-loader.test.ts", "exitCode": 0, "summary": "GREEN 2/2"},
  {"command": "npx playwright test tests/e2e/secret-box-rewards --timeout 90000", "exitCode": 0, "summary": "13/13"},
  {"command": "npx playwright test tests/e2e/secret-box-rewards --timeout 90000 --repeat-each=2", "exitCode": 0, "summary": "26/26"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "typecheck clean"},
  {"command": "npm run lint", "exitCode": 1, "summary": "react/no-children-prop in tests/unit/secret-box-rewards-ui/render-secret-box-markup.ts (fixed: .tsx)"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "typecheck clean after the fix"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "56 files, 709 passed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "reset + migrations + seeds (secretBoxPrizes=9)"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "61 files, 406 passed"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "118 total: 113 passed, 5 skipped, 0 failed"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "6 total: 5 passed, 1 skipped"},
  {"command": "npm run build", "exitCode": 0, "summary": "production build clean"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "all production status checks passed"}
]
```

## Files
Created: `features/secret-box-rewards/server/secret-box-tick-job.ts`, `features/secret-box-rewards/server/rewards-column-data-loader.ts`; tests `tests/integration/secret-box-rewards/{secret-box-duplicate-icon,secret-box-tick-overlap-and-cap,rewards-column-data-loader}.test.ts`, `secret-box-cron-script-runner.ts`; `tests/unit/secret-box-rewards-ui/{secret-box-duplicate-icon-caption,rewards-column-empty-and-error-states}.test.ts`, `render-secret-box-markup.tsx`; `tests/e2e/secret-box-rewards/{secret-box-modal-focus-and-motion,rewards-column-x2-campaign-badge}.spec.ts`; 2 screenshots.
Modified: `schemas/secret-box-views.ts`, `secret-box-config.ts`, `server/{icon-collection-service,secret-box-open-service,secret-box-advisory-lock,secret-box-grant-service,secret-box-sweep-job}.ts`, `components/secret-box-modal-states.tsx`, `app/api/internal/secret-box/tick/route.ts`, `features/kudos-feed/components/live-board-rewards-column-slot.tsx`, `db/migrations/0016_secret_box_tick_cron{,.down}.sql`, `messages/{vi,en}.json` (+1 key each), tests `secret-box-api-auth`, `secret-box-migration`, `secret-box-opener` (fixture field), e2e `secret-box-e2e-fixtures`, `secret-box-open-flow`, `rewards-column`.
All files < 200 lines (largest touched: 194, the existing opener unit test).

Docs impact: minor — tick response (`{skipped:true}`, `sweep.deferred`), sweep cap, 0016 portability/host-cron note, `duplicate` field. For doc-writer.

Next.js feedback pass (AGENTS.md): no qualifying Next.js friction retained.

## Concerns
1. **x2 e2e and global campaigns:** while the seeded campaign is live (a few seconds) UI hearts from parallel specs get x2; no current spec asserts weighted totals from UI hearts. A foreign live window opening between the delete and the reload would fail the "hidden" step (small window; `seedActive` serialises seeding only).
2. **Duplicate replay derivation** relies on two transactions of the same user never sharing a microsecond `now()` (same assumption as the existing `completed_at = opened_at` replay).
3. **Brief deviation:** transaction-scoped `pg_try_advisory_xact_lock` instead of session `pg_try_advisory_lock` (pooler safety); the tick holds 1 of 10 pool connections for its duration.
4. **Item 5** must be logged in the phase 13 plan by the orchestrator (not done here: plan/docs edits out of my scope).
5. Human sign-off still required (migration, internal endpoint, auth-adjacent seam).

**Status:** DONE_WITH_CONCERNS
**Summary:** Duplicate-icon flag (server + caption), portable 0016 cron migration, tick overlap guard + 500-sender cap, and the four tester gaps are done RED-first where behaviour changed; every gate exits 0 on the final code.
**Concerns/Blockers:** x2 e2e touches global campaign state briefly; xact-lock instead of session lock (deliberate); phase 13 anonymous-senderId constraint needs logging by the orchestrator.
