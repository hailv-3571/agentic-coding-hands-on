# Phase 11 full test pass: Spotlight Board (F008)

Date: 2026-11-23 · Role: tester · Work context: `C:\Users\luong.viet.hai\my-app`
Inputs: `implementer-261123-phase-11-spotlight-backend.md`, `implementer-261123-phase-11-spotlight-ui.md`, `evidence/phase-11/study-context.json`
Scope: full set (kudos write path, RLS policy, public API). No git used. `.env.local` not read. `.claude/**` not touched. No test file edited. Run order kept serial: integration finished before e2e started.

## Commands and exit codes

| # | Command | Exit | Wall | Result |
|---|---------|------|------|--------|
| 1 | `npx tsc --noEmit -p .` | 0 | 5 s | no errors |
| 2 | `npm run lint` | 0 | 9 s | no output |
| 3 | `npm run test:unit` | 0 | 6 s | 60 files, 755 tests passed |
| 4 | `npm run db:reset` | 0 | 28 s | migrations applied; `Seeds applied: departments=6, hashtags=8, secretBoxPrizes=9` |
| 5 | `npm run test:integration` (alone) | 0 | 109 s | 68 files, 434 tests passed |
| 6 | `npx playwright test --timeout 90000` (alone, full) | 0 | 102 s | 118 passed, 5 skipped, 0 failed, 0 flaky (123 total) |
| 7 | `npm run test:e2e:prelaunch` | 0 | 28 s | 5 passed, 1 skipped (`--config playwright.prelaunch.config.ts`, port 3100) |
| 8 | `npm run build` | 0 | 11 s | clean; no warning or deprecation lines in the log |
| 9 | `npm run test:prod` | 0 | 5 s | 16/16 production status checks PASS |

No failures occurred, so no serial reruns were needed. Flake check: `flaky: 0` in the Playwright JSON stats; the Spotlight e2e specs ran inside the full 6-run without retries.

Dev server on :3000 was left running. `/login` TTFB 0.099 s before the run and 0.075 s after it (under the 3 s bar).

Logs: `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\` (`tsc.log`, `lint.log`, `unit.log`, `dbreset.log`, `integration.log`, `e2e-full.log`, `prelaunch.log`, `build.log`, `prod.log`).

## Failures

None. No product bugs found in this run.

## Criterion to test map (study-context.json)

| # | Acceptance criterion | Covering test(s) | Result | Gap |
|---|---|---|---|---|
| 1 | Trigger: new public → added; new spam → nothing; public→spam → removed; spam→public → restored; body edit / no status change → nothing | `tests/integration/spotlight-board/spotlight-trigger.test.ts` (branches: 22, 46, 51, 62, 71) | PASS | none |
| 2 | Exactly 5 contract keys (+ Realtime `id`); no sender id/name/isAnonymous/body, incl. anonymous | `spotlight-trigger.test.ts` "payload privacy" (anonymous kudo); `spotlight-realtime-delivery.test.ts:50`; `tests/unit/spotlight-board/spotlight-event-schema.test.ts:21,41` | PASS | none |
| 3 | Failing `realtime.send` never aborts kudo insert or status update | `spotlight-trigger-fault-injection.test.ts:55` (insert as public, Mark Spam UPDATE both commit, 0 messages, 2 catch-all LOG lines) | PASS | the fault is simulated by re-owning the function (`realtime.send` cannot be replaced by `postgres`); this is a fair proxy, not a real Realtime outage |
| 4 | `realtime.messages` policy: authenticated reads `spotlight` only; anon denied; authenticated INSERT denied; other topics unaffected | `spotlight-realtime-policy.test.ts:68` (spotlight only), `:72` (other topics), `:77` (anon), `:81` (INSERT refused for authenticated and anon), `:90` (single policy, scoped) | PASS | none |
| 5 | Snapshot: spam excluded from counts; names top N by count then id; `recent` ordered; no sender column; GET /api/spotlight 401 without session and `no-store` | `spotlight-snapshot-query.test.ts:67,73,85,95`; `spotlight-route.test.ts:34` (401), `:40` (no-store), `:48` (500), `:57` (loader null on error) | PASS | the `recent` order assertion checks oldest first per the contract; no separate check of the 5-line cap beyond the preload test |
| 6 | Two browsers see a new kudo ≤ 5 s without reload; Mark Spam then Un Spam returns the counter, no extra ticker line; reconnect refetches without double count | `tests/e2e/spotlight-board.spec.ts:28` (two browsers, 5 s); `:68` (admin Mark Spam / Un Spam, no ticker line); `spotlight-board-reconnect-and-search.spec.ts:24` (offline → online, 2 Kudos not 3); reducer unit `spotlight-state-reducer.test.ts:112,130` | PASS | none material |
| 7 | Region: counter, 4-tier name cloud linking to profiles, 5-line fading ticker in locale time, diacritic-insensitive search dimming, fullscreen toggle, empty and error states, connection status | counter: e2e `spotlight-board.spec.ts:28`. Cloud tiers: `spotlight-cloud-layout.test.ts:41,52`. Ticker lines: e2e `:28`. Search: `spotlight-board-reconnect-and-search.spec.ts:47` + `normalize-search-text.test.ts`. Empty state: `reconnect-and-search.spec.ts:78`. Offline/reconnect label: `reconnect-and-search.spec.ts:24`. Spotlit `#F17676` → white: `spotlight-board.spec.ts:62` | PASS for the covered parts | see gaps below |

### Gaps against criterion 7 (no automated test)

1. **Ticker locale time and fade**: vi `20:30` / en `08:30 PM` and opacity 100/100/70/50/30 are checked only by the manual screenshots in `evidence/screenshots/phase-11/`. No unit or e2e assertion.
2. **Profile link**: `spotlight-name-cloud.tsx:46` renders `href="/profile/{id}"`, but no test asserts it (grep of the spotlight e2e files finds no `profile`). Phase 12 owns the target page, so this is a small, cheap assertion to add later.
3. **Fullscreen toggle**: no automated test. Only a manual Chromium check (Esc exit via `fullscreenchange` cannot be driven headless).
4. **Error state UI**: the server-side null path is tested (`spotlight-route.test.ts:57`); the rendered `spotlight-load-error` / error region is not.
5. **Connection `failed` state**: after 5 consecutive channel failures the hook sets `failed` and `retry()` restarts it. Not tested. `use-spotlight-channel.ts` has no unit test; it is exercised only through the e2e offline path.

Other non-criterion gaps: the cloud tier and layout are unit-tested, but `spotlight-cloud-input.ts` (phone cap 24, obstacles) only through the layout tests. The UI-side decisions the implementer flagged (distinct-count tiers, phone cap 24, 460 px board) are not in the product spec yet, so no test can settle them.

## Timing and slow tests

- Integration: 109 s wall (vitest: tests 58%, setup 27%).
- Full e2e: 102 s wall, 123 tests. Slowest: `spotlight-board.spec.ts` "two browsers" 7.9 s (its 5 s assertion is inside it); `review-content.spec.ts` sender filter 6.6 s; `heart-highlight-ranking-and-sync.spec.ts` 6.1 s. Nothing exceeded the 90 s per-test timeout. No tightening needed now.
- Unit: 4.4 s (import 59%).

## Concerns

1. Local Realtime tenant allows public channels (`private_only=false`). The backend report flags this as a production deploy checklist item: disable "Allow public access" in Realtime settings. Not a test failure; verify on the hosted environment.
2. The spotlight e2e and integration runs leave public kudos in the local DB (each committed kudo is broadcast). I did not verify this against the DB. `db:reset` restores the seed state; run it before the next pass that counts kudos.
3. Phase 11 backend report notes a staging check of private-channel auth on hosted Supabase is still open.
4. Build and prelaunch both run `next build`; the :3000 dev server was live during the production build with no errors. Not a problem seen here, but `.next` was rewritten under a running dev server.

## Criteria the run does not cover

- Code coverage percentages were not produced (not in the requested command set).
- Flaky-check beyond a single full e2e pass: no `--repeat-each` run this pass. Backend and UI reports cite repeat-each 3 earlier.

## Status / Summary / Concerns

**Status:** DONE_WITH_CONCERNS

**Summary:** All nine required commands exited 0: typecheck, lint, unit (755/755), db reset, integration (434/434, run alone), full Playwright (118 passed, 5 skipped, 0 failed, 0 flaky, run alone), prelaunch (5 passed, 1 skipped), build (clean), and production status check (pass). Every study-context acceptance criterion maps to at least one passing automated test. Criterion 7 is only partly automated: ticker time and fade, the profile link, fullscreen, the error UI and the `failed` connection state have no automated check.

**Concerns/Blockers:**
- Criterion 7 gaps above (ticker locale time/fade, profile href, fullscreen, error UI, channel `failed` state). Suggested tests listed below.
- Public-channel setting in Realtime must be off per environment (backend deploy checklist).
- Test kudos persist in the local DB after the run; `db:reset` before the next count-sensitive pass.

## Next work (ranked, heaviest first)

1. Add a unit test for the ticker formatter and opacity map (vi `20:30`, en `08:30 PM`, opacities 100/100/70/50/30).
2. Add an e2e assertion that each cloud name's link points to `/profile/{id}` (or to the phase 12 route once it lands).
3. Add a unit test for `use-spotlight-channel` state machine: 5 consecutive `CHANNEL_ERROR` → `failed`, `retry()` starts a fresh channel.
4. Add an e2e for the region error state (snapshot fetch returns 500 → `spotlight-load-error` shows and retry recovers).
5. Decide whether fullscreen gets a Playwright check (Chromium `requestFullscreen` can be stubbed; Esc exit cannot).
6. Staging check of private-channel auth on hosted Supabase before release.

## raw runs

```json
[
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "0 type errors"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean, no output"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "60 files, 755 tests passed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "migrations applied; seeds departments=6 hashtags=8 secretBoxPrizes=9"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "68 files, 434 tests passed (run alone, after db:reset)"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "118 passed, 5 skipped, 0 failed, 0 flaky of 123 (run alone)"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "5 passed, 1 skipped (port 3100)"},
  {"command": "npm run build", "exitCode": 0, "summary": "compiled clean, no warnings"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16/16 production status checks PASS"}
]
```
