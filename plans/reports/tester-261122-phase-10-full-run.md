# Phase 10 (F010 Secret Box rewards) full test pass

Date: 2026-11-22 · Role: tester · Work context: `C:\Users\luong.viet.hai\my-app`
Inputs: `implementer-261122-phase-10-secret-box-backend.md`, `implementer-261122-phase-10-secret-box-ui.md`, `evidence/phase-10/study-context.json`

## Scope Contract
- **Changed:** F010 schema, migrations 0015/0016 (+down), prize loader and seed hook, server module, 3 route handlers, rewards seam, UI components, env key, proxy public path for the tick, ranking `tieBreak`.
- **Impacted:** Live board layout, phase 06 ranking, proxy public paths, env boot, RLS baseline, seeds, prelaunch gate, prod admin gate.
- **Will verify:** the full safety-critical group (migrations, data mutations, API auth, secret-guarded tick, proxy public path, env) at every layer the brief lists, plus the manual tick check.
- **Deliberately skipped:** coverage sweep and benchmarks (not in the brief); mobile strict E2E (web-only policy).

## Run log (all sequential, nothing concurrent with the DB or e2e)

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean (3.5 s, incremental) |
| 1b | `npx tsc --noEmit -p . --incremental false` | 0 | clean, rerun without the build cache |
| 2 | `npm run lint` | 0 | clean (11 s) |
| 3 | `npm run test:unit` | 0 | 54 files, 703 passed, 0 failed (4.8 s) |
| 4 | `npm run db:reset` | 0 | migrations applied; `Seeds applied: departments=6, hashtags=8, secretBoxPrizes=9` (31 s). No separate `db:seed` needed. |
| 5 | `npm run test:integration` (alone) | 0 | 58 files, 393 passed, 0 failed (85 s) |
| 6 | `npx playwright test --timeout 90000` (alone, full) | 0 | 113 total: 108 passed, 5 skipped, 0 failed; 98 s; 3 workers; 0 retries |
| 7 | `npm run test:e2e:prelaunch` | 0 | 6 total: 5 passed, 1 skipped (conditional normal-server-only case); 26 s. Built and served its own `:3100`, which was stopped afterwards. |
| 8 | `npm run build` | 0 | clean, no warnings or deprecations in the log (10 s); route list includes `/api/secret-boxes/*` and `/api/internal/secret-box/tick` |
| 9 | `npm run test:prod` | 0 | 16/16 production status checks PASS (own `next start` on a free port) |
| 10 | `curl -X POST http://localhost:3000/api/internal/secret-box/tick` (no header) | 0 (curl) | HTTP 503, `{"code":"not_configured"}`, `Cache-Control: no-store` |
| 10b | same, with header `x-job-secret: PROBE-MARKER-0001` | 0 (curl) | HTTP 503, `{"code":"not_configured"}`. The header is ignored while the secret is unset. |

Skipped e2e: the 5 `awards-portal/prelaunch-gate.spec.ts` cases are gated by `test.skip(!onPrelaunchServer)`. They are covered by row 7, which ran 5 passed.

## Failures
None. Every gate exited 0 on the first run. No test was edited, and no product bug was found.

## Flakiness
The e2e and integration suites each passed on their only run, with no retries. That is one clean pass, not a stability proof. No cold-compile failure occurred, so the serial rerun rule was not triggered.

## Timing
Slowest passing e2e test: 7.0 s (`admin-campaigns/settings-crud.spec.ts`, "an admin adds a campaign"). The slowest secret-box spec is 5.7 s (`secret-box-open-flow`, "opens boxes through the modal states"). Integration: 85 s for 393 tests, the slowest file-level cost. No slow tests were flagged for tightening.

## Coverage
Not measured. The brief did not ask for `test:coverage`, so no line, branch, or function numbers are reported.

## Study-context criteria mapped to tests

| # | Criterion | Covered by | Status |
|---|---|---|---|
| C1 | 20 parallel reconciles → seq 1..4, one `BoxGranted{count:4}`; rerun emits nothing | `integration/secret-box-grant-concurrency.test.ts` (2 tests) | PASS |
| C2 | x2 counts double; anonymous counts; spam lowers the total without removing boxes; hearts after `EVENT_END_AT` ignored; late reconcile still grants | `integration/secret-box-grant-rules.test.ts` (4 of 6 tests), plus outbox-rollback and read-failure cases | PASS |
| C3 | 10 parallel opens, one key → one box, identical response; 2 boxes, different keys → 2 opened, rest 409 | `integration/secret-box-open-idempotency.test.ts` (2 tests); HTTP 409 in `secret-box-api-auth.test.ts`; e2e `secret-box-open-flow` "409" case | PASS |
| C4 | Gift stock 1, 30 parallel users → one gift, stock never negative, others get icons | `integration/prize-stock-race.test.ts` | PASS |
| C5 | 6-icon set → mystery gift once, one `SetCompleted{userId, giftName}`; duplicates only increment quantity | `integration/mystery-gift-once.test.ts` (quantity asserted at lines 70-71; award-once, rollback, slot order) | PASS |
| C6 | Kudos Quốc Dân: no-op before `FINALIZE_AT`; concurrent runs write 5 rows once, one event; spam excluded; older kudo wins ties | `integration/national-kudos-finalize.test.ts` (3 tests) | PASS |
| C7a | APIs: no session → 401; `userId` never from input | `integration/secret-box-api-auth.test.ts` (401 case; body/query userId ignored); `unit/secret-box-rewards/open-secret-box-schemas.test.ts` | PASS |
| C7b | Tick refused without/with wrong secret; 503 when unset | `integration/internal-tick-guard.test.ts` (503 case; `it.each` 401 variants); `unit/.../internal-tick-proxy-access.test.ts` | PASS (integration only, see Gaps) |
| C7c | Winners list only for logged-in users | Code only: seam calls `requireSunner()` before the query (`live-board-rewards-column-slot.tsx`). **No test asserts it.** | GAP |
| C8a | Column shows the 5 stats; x2 badge only during a campaign | Flag: `integration/personal-reward-stats-query.test.ts` ("flags an active x2 campaign"). Badge rendering: not asserted by any e2e. | PARTIAL |
| C8b | Open button disabled at 0 with tooltip | `e2e/secret-box-rewards/rewards-column.spec.ts` ("without a box the button is dimmed...") | PASS |
| C8c | Latest 10 gift winners with real name | `e2e/.../rewards-column.spec.ts` ("latest gift winners list..."); `integration/prize-stock-race.test.ts` (winner first) | PASS |
| C8d | Empty and error states of the column | None. The "Chưa có Sunner nào nhận quà." empty state and the `null` → error + retry path have no test. | GAP |
| C9a | Modal idle → opening → result → idle/empty; new key per click; retry reuses key after network error | `unit/secret-box-rewards-ui/secret-box-opener.test.ts` (15 tests); e2e `secret-box-open-flow` (modal states; network failure → same key, `replayed: true`) | PASS |
| C9b | 409 → empty state | unit opener ("switches to empty on 409"); e2e 409 case | PASS |
| C9c | Deep link `/kudos?secretBox=open` | e2e `secret-box-open-flow` ("deep link opens the modal; closing removes the param") | PASS |
| C9d | Focus trap | Not asserted. The e2e only checks Esc and focus return. | GAP |
| C9e | Reduced motion (no WAAPI, 0 ms minimum frame) | None. `use-secret-box-stage-motion.ts` and the reduced-motion branch of the opener are untested. | GAP |
| C10a | Prize re-seed keeps issued count; idempotent | `integration/prize-loader-reseed.test.ts` (5 tests) | PASS |
| C10b | Migrations up/down; RLS on with no client policies | `integration/secret-box-migration.test.ts` (13 tests incl. RLS, CHECKs, cron job, down/up) | PASS |
| C10c | Phase 06 Highlight ranking order unchanged | `integration/kudos-hearts/heart-ranking-query.test.ts` ("default unchanged", "tie oldest with tieBreak 'oldest'") | PASS |

Summary: 10 criteria, 7 PASS, 1 PARTIAL, and gaps on C7c, C8d, C9d, C9e.

## Manual tick check and log review
- Tick with no header and with a probe header both return 503 `not_configured`, with `no-store`. The 503 means `INTERNAL_JOB_SECRET` is unset in the running dev server's env, which matches the brief. I did not read `.env.local`.
- Log review (static): the guard hashes the provided header and compares it with `timingSafeEqual`. It never logs the header or the secret. The only `console.error` calls log error objects, and none of them carries the header. The dev server's stdout is not captured to a file I can read, so a runtime grep of the server log was not possible. The static review is the evidence for "no secret value in logs". No secret value exists in the environment to leak, because the endpoint answers 503.

## Environment state after the run
- The :3000 dev server (PID 39336) was not started by me and was not touched. `/login` answered HTTP 200 in 0.11 s TTFB, so it is healthy, not degraded.
- The local DB now carries the e2e and integration draws. The e2e flows consumed gift stock, as the UI report predicted. `npm run db:reset` restores a clean state.

## Raw runs
```json
[
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "typecheck clean (incremental)"},
  {"command": "npx tsc --noEmit -p . --incremental false", "exitCode": 0, "summary": "typecheck clean, no build cache"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "54 files, 703 passed, 0 failed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "db reset + migrations + seeds (secretBoxPrizes=9)"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "58 files, 393 passed, 0 failed"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "113 total: 108 passed, 5 skipped (prelaunch-only), 0 failed, 3 workers"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "6 total: 5 passed, 1 skipped (normal-server-only)"},
  {"command": "npm run build", "exitCode": 0, "summary": "production build clean, no warnings"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16/16 production status checks passed"},
  {"command": "curl -X POST http://localhost:3000/api/internal/secret-box/tick (no header)", "exitCode": 0, "summary": "HTTP 503 not_configured, no-store"},
  {"command": "curl -X POST -H 'x-job-secret: PROBE-MARKER-0001' http://localhost:3000/api/internal/secret-box/tick", "exitCode": 0, "summary": "HTTP 503 not_configured (header ignored while unset)"}
]
```

## Gaps, ranked by risk
1. **C7c, winners list auth (auth-adjacent).** No test asserts that a guest gets no winners data. The seam's `requireSunner()` is the only guard. Add one integration or e2e case: a signed-out request does not reach `LatestGiftWinnersQuery`.
2. **Live tick path, not exercised.** The 401 (wrong secret) and 200 (sweep plus finalize) answers are verified only in integration with an env override. The dev server cannot test them because the secret is unset, and pg_cron → endpoint is not verified end to end. Set `INTERNAL_JOB_SECRET` in a test-only env and run one live POST with the right and wrong headers.
3. **C8d, column empty and error states.** Add a unit or e2e case for "Chưa có Sunner nào nhận quà." and the `null` → "Thử lại" path.
4. **C9d and C9e, focus trap and reduced motion.** Add an e2e case with `reducedMotion: 'reduce'` that asserts no WAAPI and that the opening frame is 0 ms, and a Tab-cycle case inside the open modal.
5. **C8a, x2 badge rendering.** The flag is tested in the query, not in the rendered badge. Add a component or e2e assertion.

## Product bugs found
None. Nothing was patched. Known contract gap (not a failure): DEC-002 E08 "icon trùng" caption needs a `duplicate` flag on `OpenSecretBoxResult`, which the implementer already flagged.

## Concerns
- Gaps 1-5 above are open. Gap 1 is the most important: it touches auth.
- The tick is verified only as far as 503 on the live server. Its 401 and 200 paths rest on integration evidence.
- Mystery-gift name, catalog weights, and stock are placeholders (implementer concern 3). They are not bugs, but BTC must confirm before launch.

**Status:** DONE_WITH_CONCERNS
**Summary:** Every gate in the brief exited 0 on its first run: typecheck, lint, unit (703), integration (393), full e2e (108 passed, 5 prelaunch-only skips), prelaunch (5 passed, 1 skipped), build, and prod status (16/16). The manual tick check answers 503 `not_configured` with and without a header. No failures, no test edits, no product bugs.
**Concerns/Blockers:** The winners-list auth guard has no test (gap 1). The live secret-set tick path (401/200 and pg_cron) is unverified end to end (gap 2). Column empty/error states, focus trap, reduced motion, and the x2 badge rendering have no test (gaps 3-5). Coverage was not measured.
