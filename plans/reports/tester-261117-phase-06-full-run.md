---
phase: 06
feature: F005 hearts, F011 x2 campaigns
role: tester
date: 2026-11-17
status: BLOCKED
---

# Phase 06 full run

Nothing staged, committed or pushed. Test-side edits: none. Temporary capture spec created for the screenshots and deleted after use.

## Scope Contract
- **Changed:** `kudo_hearts` and `campaigns` tables plus 3 migrations (0010-0012), heart service and actions, heart ranking queries, campaign admin actions, heart UI, admin Settings UI, `shared/admin/timezone.ts`.
- **Impacted:** phase 05 feed and Highlight (seams and ordering), phase 01 admin date-range filter (`shared/admin/timezone.ts`), the outbox, the admin area.
- **Will verify:** everything. Migrations, data mutations and permissions are safety-critical, so every layer ran in full.
- **Deliberately skipped:** nothing.

## Command results

| # | Command | Exit | Counts / result |
|---|---|---|---|
| 1 | `npm run db:reset` | 0 | Migrations applied; seeds departments=6, hashtags=8 |
| 2 | `npm run typecheck` | 0 | Route types generated, no errors |
| 3 | `npm run lint` | 0 | No problems |
| 4 | `npm run test:unit` | 0 | 35 files, 434 passed, 0 failed (3.6 s) |
| 5 | `npm run test:integration` | 0 | 35 files, 269 passed, 0 failed (62 s). `heart-ranking-query.test.ts` 7/7, incl. D003 and the scoped `heartCountsSubquery` |
| 6a | `npx playwright test` (run 1) | 1 | 65 passed, **3 failed**, 68 total (2.1 min) |
| 6b | `npx playwright test` (run 2) | 1 | 65 passed, **3 failed**, 68 total (2.0 min) |
| 6c | `npx playwright test --workers=3` (diagnostic, after 6a/6b) | 0 | 68 passed, 0 failed (1.5 min) |
| 7 | `npm run build` | 0 | Compiled, 18 static pages, no warnings. `/admin/settings` is ƒ |
| 8 | `npm run test:prod` | 0 | 13/13 status checks passed on `next start` |
| - | Dev server check after typecheck and after build | - | `/login` 200; `/kudos`, `/admin/settings`, `/kudos/not-a-uuid` 307. No 500. Process not restarted |

Coverage: no coverage script exists in `package.json`, so line, branch and function coverage were not measured.

## E2E failures (6a and 6b)
Every failure is an expect timeout (5 s) on a navigation or dialog close that did not finish. Phase 06 specs (`kudos-hearts/heart-toggle`, `admin-campaigns/settings-crud`) passed in both runs.

| Run | Test | Error (verbatim, first line) |
|---|---|---|
| 6a | `app-shell/signed-in-header-and-menus.spec.ts:85` Logout | `Expected pattern: /\/login$/ Received string: "http://localhost:3000/"` |
| 6a | `auth/guest-redirect-and-logout.spec.ts:63` first login | `Expected pattern: /\/kudos$/ Received string: "http://localhost:3000/onboarding/department?next=%2Fkudos"` |
| 6a | `kudos-feed/kudo-card-and-detail.spec.ts:155` not-found | `Expected pattern: /\/kudos$/ Received string: "http://localhost:3000/kudos/not-a-uuid"` |
| 6b | `auth/guest-redirect-and-logout.spec.ts:63` first login | same as 6a |
| 6b | `kudos-authoring/compose-kudo.spec.ts:20` send kudo | `expect(locator).toBeHidden()` failed: the composer dialog stayed visible for 5 s. Then `page.waitForResponse: Test ended` at `kudo-composer-e2e-steps.ts:53` |
| 6b | `kudos-feed/kudo-card-and-detail.spec.ts:155` not-found | same as 6a |

**Diagnosis.** The failing set changes between runs, and each failing spec passes alone:
- `--workers=1`: the three run-1 specs passed in 2.4 s, 2.8 s and 3.0 s.
- `--workers=3`, full suite: 68/68 passed (6c).

Phase 05 ran 59 tests in about 35 to 40 s with zero flakes. Today, 68 tests take 2 minutes at 6 workers, and individual tests take 5 to 22 s. The likely cause is contention: six browsers plus one `next dev` process (2.1 GB RSS) with on-demand compilation, against 5 s expects. This is not an implementation defect in the paths the failures touched. The phase 06 kudo-detail change (`isKudoWritingOpen` in `Promise.all`, `app/(app)/kudos/[id]/page.tsx:27`) is on the not-found path, but that spec passed alone and at 3 workers. I did not change the worker count or the timeouts. Either would be a stopgap, and that call belongs to you (see Concerns).

## Slowest e2e tests (run 2)
22.0 s hearting and unhearting updates the count (phase 06); 19.4 s owner edit pen opens the composer; 19.2 s admin adds, edits and deletes a campaign (phase 06); 18.6 s send kudo with title, bold body, hashtags, image; 16.7 s Hủy/Esc during send; 16.6 s uniform not-found. Phase 05 slowest was 6.9 s.

## Screenshots (`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-06/`)
- **Heart states** (`heart-card-hearted`, `heart-card-unhearted`, `heart-own-kudo-disabled`), desktop 1440x900 and mobile 375x812: current. Every heart source file is older than the capture at 00:01 on 2026-11-17. Kept as is.
- **Settings** (`settings-table`, `settings-row-menu-open`, `settings-add-modal-empty`, `settings-add-modal-errors`, `settings-edit-modal-active`, `settings-delete-dialog`), both viewports: were stale. `features/admin-campaigns/components/campaign-settings-panel.tsx` (00:07) and `tests/e2e/admin-campaigns/settings-crud.spec.ts` (00:06) changed after the 00:01 capture. Recaptured all 12 files at 00:25 with a temporary spec (run 2 passed, exit 0; spec deleted).
- I looked at `settings-add-modal-errors-desktop` and `settings-row-menu-open-mobile`. They show the intended states.
- Visual check is qualitative only. No pixel-diff against Figma was run. The datetime-local inputs use the headless Chrome locale (en-US, mm/dd/yyyy), as the UI report noted.

## Leftover test data (checked after the last run)
| Table / store | Rows |
|---|---|
| `kudos`, `kudo_hearts`, `kudo_hashtags`, `kudo_images`, `kudo_image_uploads` | 0 |
| `campaigns` | 0 |
| `domain_event_outbox` | 0 |
| `profiles`, `auth.users` | 0 |
| `storage.objects` (bucket `kudo-images`) | 0 |

Seeded reference rows remain (departments 6, hashtags 8). They are expected.

## Files
- Created then deleted: `tests/e2e/admin-campaigns/zz-phase06-capture.spec.ts`
- Created: this report; `.claude/agent-memory/tester/e2e-worker-contention-on-next-dev.md` (plus an index line in `MEMORY.md`)
- Logs: `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\` (`01-db-reset.log` through `09b-capture.log`)

## Unresolved and follow-ups
1. **Decide the e2e fix.** Options, with my recommendation first:
   - Cap the worker count in `playwright.config.ts`, for example at 3 locally. This matches the only green evidence. It needs one more green run to confirm.
   - Raise `expect.timeout`. This hides latency and is not recommended.
   - Run e2e against `next start`. More stable timing, but it changes the webServer setup.
   Until you choose, the default-config run stays red.
2. **D003 mutation check.** The D003 test passes, but I did not confirm it fails under the multiplier-sum bug. That needs a temporary change to implementation code, which is outside my ownership. Ask the backend owner or approve a scratch run.
3. **Prod status gap.** `test:prod` does not cover `/admin/settings`. The `/admin/*` proxy gate covers it, but a direct check for a non-admin would be cheap.
4. **Coverage** is not produced. Add a `test:coverage` script if the 80% bar is to be read.

**Status:** BLOCKED
**Summary:** Typecheck, lint, unit (434), integration (269), build and test:prod all exit 0. Phase 06 e2e specs pass in both default runs. The full e2e suite is red on the default config twice (65/68 each, 3 different timing failures). Each failing spec passes alone, and the full suite passes 68/68 at 3 workers. Settings screenshots were stale and are recaptured. No test rows or storage objects are left behind.
**Concerns/Blockers:** The full e2e gate is not green under the default config, and the fix (worker cap, timeout or prod-mode server) is a config decision for you. Also open: the D003 mutation check, coverage tooling, and the `/admin/settings` prod check.
