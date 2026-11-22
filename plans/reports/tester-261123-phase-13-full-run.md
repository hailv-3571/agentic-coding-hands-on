# Phase 13 (F013 Notifications) full test pass

Date: 2026-11-23 · Role: tester · Work context: `C:\Users\luong.viet.hai\my-app` · Branch: main (no git used)
Inputs: `implementer-261123-phase-13-notifications-backend.md`, `implementer-261123-phase-13-notifications-ui.md`, `study-context.json`
Test files changed: **none** (no test was wrong, so nothing was edited). `.env.local` not read. `.claude/**` not touched. No Vault secrets set.

## Commands (run serially, in this order)

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean |
| 2 | `npm run lint` | 0 | clean |
| 3 | `npm run test:unit` | 0 | 76 files, **878 passed**, 0 failed (9.6 s) |
| 4 | `npm run db:reset` | 0 | migrations 0018–0020 applied; pg_cron/pg_net already present (NOTICE only); seeds: departments=6, hashtags=8, secretBoxPrizes=9 (26 s) |
| 5 | `npm run test:integration` (alone) | 0 | 81 files, **520 passed**, 0 failed (2 m 12 s). Per-file notification count not split out in this run; backend report states 10 files / 62 tests |
| 6 | `npx playwright test --timeout 90000` (alone, full) | 0 | **132 passed, 5 skipped, 0 failed**, 2 m 44 s. Skips are `prelaunch-gate.spec.ts` cases that skip by design on the normal server |
| 7 | `npm run test:e2e:prelaunch` | 0 | **5 passed, 1 skipped** (after-LAUNCH case, by design), 0 failed (~30 s + its own build) |
| 8 | `npm run build` | 0 | compiles; route table lists `/notifications`, `/api/notifications`, `/api/notifications/unread-count`, `/api/internal/notifications/drain`; 0 warning lines |
| 9 | `npm run test:prod` | 0 | **16/16 PASS** (4.9 s) |
| 10 | `curl -X POST http://localhost:3000/api/internal/notifications/drain` (no header) | 0 (curl) | **HTTP 503** `{"code":"not_configured"}`, as expected |

Dev server on :3000 was reused (not restarted). `/login` answered 200 with TTFB 0.10 s before the run and 0.31 s after the builds, well under the 3 s limit.

Notification e2e (`tests/e2e/notifications.spec.ts`) inside run 6: 3/3 passed.

## Failures

None. No test failed in any run, so no serial reruns were needed. No flakiness observed (one run per suite; the 6 grep hits for "failed" were test titles such as "a failed save", not failures).

## Criterion → test map (study-context acceptance criteria)

| # | Criterion | Covered by | Status |
|---|---|---|---|
| 1 | Each event type gives the right rows, params and links; re-drain and concurrent drains never duplicate | unit `map-event-to-notifications`, `notification-view-mapper`; integration `notification-event-processor` (types, re-drain, 'concurrent drainers process every event exactly once') | covered |
| 2 | Failures increment attempts and set failed_at at the max; malformed/unknown consumed and logged | integration `notification-event-processor` (rolls back + attempt; parks with failed_at; malformed/unknown consumed + logged) | covered |
| 3 | Hearts aggregate per kudo while unread, new row after read; tier-up once per tier | integration `notification-heart-and-tier-rules` (5 cases incl. two drainers racing); unit `detect-hero-tier-up` | covered |
| 4 | Anonymous kudos never expose sender (nickname only); national kudos never expose senderId | integration `notification-anonymous-privacy` (4 cases); unit `map-event-to-notifications` (no senderId); e2e anonymous test checks panel and API JSON | covered (API/DB). UI national copy not e2e-tested |
| 5 | Realtime carries ids only on `notifications:{userId}`; own topic only; clients cannot insert | integration `notification-realtime-trigger`, `notification-realtime-policy` (incl. anon denied, cross-topic denied), `notification-realtime-delivery` | covered |
| 6 | List and unread routes 401 without session, `private, no-store`; read actions only touch own rows | integration `notification-routes` (401 + no-store, pagination, 400 bad input), `notification-read-actions` (own only, foreign id = not_found, guest to /login) | covered |
| 7 | Drain 503 unconfigured, 401 missing/wrong secret; cron migration no-op without pg_cron/pg_net/Vault | integration `drain-route-auth` (503, 5 wrong-header variants → 401, 200, 500); `notification-migration` (cron up no-op with NOTICE for each missing dependency) + live probe (503) | covered |
| 8 | Bell live dot without reload; panel with localized copy, relative time, click marks read and navigates, mark-all; /notifications page with infinite scroll and empty state | e2e `notifications.spec.ts` (3 tests: live dot, click-to-read, mark-all, Esc, anonymous; page empty state, 20 then more on scroll, "Xem tất cả"); unit `notifications-ui/*` (relative time, message copy, merge) | covered at e2e (vi). See gaps |

## Gaps (not failures)

1. **Real cron path never runs locally.** No Vault secrets, so `pg_cron → pg_net → /api/internal/notifications/drain` never fires. The e2e drains by calling `NotificationEventProcessor.drain()` directly. The route itself is tested in-process (`drain-route-auth`). Only a staging/prod run proves the schedule.
2. **English copy is untested in e2e.** The vi strings are the only ones asserted. The en strings are drafts (UI report, D006).
3. **Placeholder copy for Kudos Quốc Dân** (national kudos, "hạng {rank}" plus "Root Further") is not confirmed by BTC. No test can prove it correct.
4. **Mobile layout is not asserted.** 375 px screenshots exist in `evidence/screenshots/phase-13/` but there is no mobile assertion.
5. **National-kudos UI row** and **heart-aggregation UI count** have no e2e. They are covered at integration/unit only.
6. **Coverage not measured.** `package.json` has no `test:coverage` script and the brief did not ask for it, so no line/branch/function numbers exist for this phase.
7. **Admin bell absent** (UI report concern 3). Not a test gap, but no test asserts it either way.

## Performance notes

- Slowest e2e test: `review-content.spec.ts` "filters by Sender…" at 10.6 s (not notification code). Notification e2e tests run 5–8 s each.
- Integration suite is the long pole at 2 m 12 s.
- Full e2e at 3 workers: 2 m 44 s, no timeouts.

## Concerns for follow-up

1. Backend concern 3 still stands: `cron.job_run_details` grows about 17k rows a day at 5 s. Production needs a cleanup job.
2. Backend concern 5: `last_error` may hold driver text with SQL params (ids). It is server-only (RLS, no grant), but worth a note in ops docs.
3. UI report concern 2: `docs/system/architecture.md:454` still names the removed `spotlight-browser-supabase.ts` path. Doc-writer should update it.
4. The e2e run used the already-running dev server on :3000. Its environment (e.g., `OUTBOX_DRAIN_SECRET` unset) is inherited; the 503 probe matches that.

## raw runs

```json
[
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "typecheck clean"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "76 files, 878 passed, 0 failed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "migrations 0018-0020 applied, seeds applied (departments=6, hashtags=8, secretBoxPrizes=9)"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "81 files, 520 passed, 0 failed"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "132 passed, 5 skipped (prelaunch-only by design), 0 failed, 2m44s"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "5 passed, 1 skipped (after-LAUNCH by design), 0 failed"},
  {"command": "npm run build", "exitCode": 0, "summary": "production build compiled, 0 warnings, notification routes listed"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16/16 production status checks PASS"},
  {"command": "curl -X POST http://localhost:3000/api/internal/notifications/drain (no header)", "exitCode": 0, "summary": "HTTP 503 not_configured as expected (curl exit 0)"}
]
```

**Status:** DONE_WITH_CONCERNS
**Summary:** All nine suite commands exit 0 and the no-header drain probe returns 503. Unit 878/878, integration 520/520, e2e 132 passed with 5 by-design skips, prelaunch 5 passed with 1 by-design skip, prod 16/16. The eight study-context criteria each map to at least one passing test. No test was edited and no failures needed reruns.
**Concerns/Blockers:** Real pg_cron to drain-route path is only proven in staging/prod (no Vault locally). English copy and the Kudos Quốc Dân copy await BTC confirmation. Mobile layout is not asserted. Coverage was not measured (no script exists). Details under Gaps and Concerns.
