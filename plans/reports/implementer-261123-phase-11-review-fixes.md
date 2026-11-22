# Phase 11 — Spotlight Board review-fix round (F008) · implementer report

Date: 2026-11-23 · Role: implementer (RED-first) · Inputs: `reviewer-261123-phase-11.md` (M1, M2 cheap part, M3), `tester-261123-phase-11-full-run.md` (criterion 7 gaps), `implementer-261123-phase-11-spotlight-{backend,ui}.md` (UI concern 7: no skeleton).
Rules kept: no git; `.env.local` not read; `.claude/**` not touched; only agent on the DB and :3000 (dev server left running: `/login` TTFB 0.116 s before the gates, 0.107 s after); integration and e2e never ran at the same time.

## Scope Contract
- **Changed:** Spotlight client resync policy (new scheduler, wired in the channel hook); reducer (`restoredIds`); channel failure state extracted into a pure helper; new region skeleton used as the slot's Suspense fallback; `docs/system/architecture.md` Deployment View; spotlight unit tests and one e2e case.
- **Impacted:** `/kudos` Live board (Spotlight region: first paint, live counts, ticker); extra `GET /api/spotlight` calls (one per moderation burst per open board, jittered after each join).
- **Will verify:** new pure units under fake timers, component markup under the real vi/en messages, e2e on the real local stack (RED with the fix reverted, then GREEN, plus repeat-each 3), then every gate on the final code.
- **Deliberately skipped:** nothing. The caller asked for full gates.

## Changes

### 1. Counter drift (reviewer M1) and post-join jitter (M2, cheap part)
- New `features/spotlight-board/lib/spotlight-resync-scheduler.ts` with `createSpotlightResync(run, random)`. At most one refetch is pending, and a new request replaces it (trailing debounce):
  - `afterEvent("removed" | "restored")` → refetch 2000 ms + 0–999 ms after the **last** event of a burst. `added` schedules nothing (it is deduped by kudo id).
  - `afterSubscribe()` → refetch after a random 0–1999 ms (was immediate).
  - `now()` (tab visible) → refetch at once and drop the pending one.
  - `dispose()` → drop the pending one (cleanup, retry).
- Timing constants live in `lib/spotlight-ui-config.ts`: `MODERATION_RESYNC_DELAY_MS`, `MODERATION_RESYNC_JITTER_MS`, `SUBSCRIBE_RESYNC_JITTER_MS`.
- `hooks/use-spotlight-channel.ts` owns the scheduler per channel generation. The board's `onResync` (abortable fetch, then REPLACE) is unchanged.
- **Decision needed to keep DEC-001:** the snapshot's `recent` lists the last 5 public kudos, so a REPLACE after `restored` would bring the restored line back 2–3 s later. That breaks "restored is not news" and the existing e2e assertion.
  - Fix: the reducer keeps `restoredIds` (kudos restored while the board is open) across `replace` and leaves their lines out of the ticker. It slices the snapshot to 5 lines first, then filters.
  - A page reload still shows such a kudo at its original time. The server sends only 5 lines, so this is the only visible difference.
  - Please log this in the decision log.

### 2. Loading skeleton
- New `components/spotlight-board-skeleton.tsx` (server component):
  - `<section aria-busy="true" aria-labelledby="spotlight-heading">` with the real `LiveBoardSectionHeader`;
  - the same `SpotlightBoardFrame`;
  - pulsing stand-ins (`motion-reduce:animate-none`, `aria-hidden`) for the search pill, the counter and 3 ticker lines;
  - sr-only "Đang tải…".
- New `components/spotlight-region-styles.ts` (`spotlightRegionLayout`), shared by the region and the skeleton. It sits in a plain module because a constant exported from the `"use client"` region file would reach a server component as a client reference, not a string.
- `features/kudos-feed/components/live-board-spotlight-slot.tsx`: `fallback={null}` → `fallback={<SpotlightBoardSkeleton />}`.
- Measured on the real page (the skeleton markup swapped in for the loaded region, same scroll position): identical boxes. Desktop 1184×738.6 at (128, 161); mobile 375×605 at (0, 103.3).

### 3. Criterion 7 test gaps
- New `lib/spotlight-channel-state.ts`: `nextChannelState(state, signal)` plus `INITIAL_CHANNEL_STATE`, the pure SM-001 logic taken out of the hook. The hook now calls `step(signal)`, and `retry()` starts a fresh generation from `INITIAL_CHANNEL_STATE`. `SpotlightChannelStatus` moved here; the banner's type import was updated.
- New tests: ticker locale time and fades, `/profile/{id}` links, the rendered error state, `fetchSpotlightSnapshot` (the retry's `GET /api/spotlight`), and the channel state machine. They are listed below.

### 4. Release checklist
`docs/system/architecture.md` → Deployment View → new **"Release checklist — Realtime (F008)"**, per environment:
1. disable Realtime "Allow public access";
2. never put `realtime` in Data API exposed schemas (`realtime.send` is EXECUTE to PUBLIC, so clients could forge events);
3. staging check of private channels on hosted Supabase: authenticated join + live event ≤ 5 s, anon private join refused, public `spotlight` join refused / receives nothing, Mark Spam / Un Spam.

## Tests (new or changed)
| File | Tests | Covers |
|---|---|---|
| `tests/unit/spotlight-board-ui/spotlight-resync-scheduler.test.ts` (new) | 9 | 2–3 s after `removed`/`restored`, jitter bounds, burst → one refetch after the last event, `added` → none, 0–2 s after join, `now()` drops pending, `dispose()`; **reviewer M1 scenario**: late `removed` after a snapshot that already reflects it → total 5 (drift) → refetch → 6 |
| `.../spotlight-state-reducer.test.ts` (+1) | 14 | a kudo restored on this board stays out of the ticker after a `replace` (twice) |
| `.../spotlight-channel-state.test.ts` (new) | 6 | 1–4 failures → `reconnecting`, 5th in a row → `failed`; TIMED_OUT/CLOSED count; a join resets; `retry()` (fresh state) needs 5 more; offline / online |
| `.../spotlight-region-loading-and-error-states.test.ts` (new) | 4 | error state: header kept, alert "Không tải được Spotlight Board. Vui lòng thử lại." + "Thử lại" button, no counter/log (vi + en); skeleton: `aria-busy`, header, no links/alert; **same section and frame classes as the loaded board and the error state** |
| `.../spotlight-ticker-and-name-links-markup.test.ts` (new) | 5 | vi `20:30`, en `08:30 PM` (local wall time, TZ-independent); opacities 0.3/0.5/0.7/1/1 and 0.7/1/1; every name `href="/profile/{id}"` with label "{name}, {n} Kudos" |
| `.../fetch-spotlight-snapshot.test.ts` (new) | 5 | GET `/api/spotlight`, `cache: no-store`, extra keys stripped; null on 401/500, bad body, network error, abort |
| `.../render-spotlight-markup.tsx` (new helper) | — | `renderToStaticMarkup` under `NextIntlClientProvider` (same pattern as the secret-box UI tests) |
| `tests/e2e/spotlight-board.spec.ts` (Mark Spam / Un Spam case extended) | — | waits for the refetch that follows `restored`, then checks the counter = DB, "{name}, 1 Kudos", and no ticker line |

## RED → GREEN
- **Unit RED** (`npx vitest run --project unit tests/unit/spotlight-board-ui`, exit 1): 5 files failed.
  - Behavioural: the reducer test failed with `expected [ 'k2', 'k3', 'k4', 'k5', 'k6' ] to deeply equal [ 'k2', 'k3', 'k4', 'k5' ]`.
  - Module not found: the scheduler, the channel state and the skeleton (honest note: this RED is only "module absent").
  - The links test first failed on a harness bug, not the product: the mock returned a new size object on every render, which looped the layout memo. Fixed by returning one stable object.
- **Unit GREEN:** 9 files / 76 tests pass. Two fixes on the way:
  - the `added`/`removed` branches dropped `restoredIds` (now `...state`);
  - the filter moved after the 5-line slice, so the test-first intent holds.
- **E2E RED** (only the reducer's restored filter reverted, debounced resync kept; `-g "Mark Spam"`, exit 1): the new assertion failed at `spotlight-board.spec.ts:115` with `Expected: 0, Received: 1`. The restored line came back after the refetch. This also proves the refetch really fires after `restored` on the live stack.
- **E2E GREEN:** both spotlight specs 5/5.
- **Mutation checks** for tests on behaviour that already existed. Each mutation was applied, run and restored, with `cmp` confirming the restore. All 9 were caught (exit 1):

| Mutation | Caught by |
|---|---|
| fade order `[1, 0.7, 0.7, 0.5, 0.3]` | ticker opacities (2 failed) |
| ticker formats with `"vi"` regardless of UI locale | en `08:30 PM` |
| cloud href `/profiles/…` | links |
| fetch `cache: "default"` | fetch contract |
| error state shows `liveFailed` | error state vi + en |
| `RECONNECT_MAX_ATTEMPTS = 6` | channel state (3 failed) |
| a join keeps the failure count | channel state |
| no debounce reset (`cancel()` removed) | scheduler burst + dispose |
| skeleton section gets an extra `gap-8` | box contract |

- **Flake check:** spotlight specs at `--repeat-each=3 --workers=2` gave 14/15. The one failure is the known hard-delete race, not this change; see concern 1.

## Gate table (final code, each alone, in order)
| # | Command | Exit | Wall | Result |
|---|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | 4 s | 0 errors |
| 2 | `npm run lint` | 0 | 10 s | no output |
| 3 | `npm run test:unit` | 0 | 5 s | 65 files, 785 tests (was 60/755: +5 files, +30 tests) |
| 4a | `npm run db:reset` | 0 | 21 s | migrations applied; seeds departments=6, hashtags=8, secretBoxPrizes=9 |
| 4b | `npm run test:integration` | 0 | 99 s | 68 files, 434 tests |
| 5 | `npx playwright test --timeout 90000` | 0 | 110 s | 118 passed, 5 skipped, 0 failed |
| 6 | `npm run test:e2e:prelaunch` | 0 | 19 s | 5 passed, 1 skipped |
| 7 | `npm run build` | 0 | 10 s | compiled, 29/29 static pages, no warning/deprecation lines |
| 8 | `npm run test:prod` | 0 | 5 s | 16/16 PASS |

Logs in scratchpad `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\`:
- gates: `gate-1-tsc.log` … `gate-8-prod.log`;
- RED/GREEN: `review-fixes-red-1.log`, `review-fixes-green.log`, `e2e-red-unspam.log`, `e2e-green-spotlight.log`;
- checks: `mutation.log`, `e2e-spotlight-repeat3.log`, `shots/shots.log`.

## Screenshots
`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-11/`:
- `spotlight-board-skeleton-desktop-1440x900.png`, `spotlight-board-skeleton-mobile-375x812.png`: the skeleton swapped in for the live region on `/kudos`, pulse frozen.
- `spotlight-board-review-fixes-loaded-desktop-1440x900.png`, `spotlight-board-review-fixes-loaded-mobile-375x812.png`: the loaded region at the same spot. It is in the empty state ("0 KUDOS") because e2e teardowns had removed every public kudo.

They came from a temporary spec (`tests/e2e/zz-tmp-…`), deleted right after use, before the gates.

## Concerns
1. **Pre-existing e2e race (not from this change).**
   - In the repeat run, "two browsers" ended at counter = DB + 4.
   - At that moment the other worker ran the reconnect and search tests (2 + 2 public kudos), and their `kudoUsers` teardown hard-deleted them. DELETE emits no event, and the product has no delete flow (UI implementer, concern 1).
   - Every count path this round touched either takes the DB snapshot or leaves counts alone.
   - The full run passed. The race can still hit any spotlight total-vs-DB check while another worker tears down. Options: one worker for the two spotlight files, or soft-delete in the shared fixture. Test infra, caller's call.
2. **Error-state retry click is not driven by an automated test.**
   - The unit project has no DOM (no jsdom/happy-dom), and e2e cannot make the server-side loader return `null`.
   - Covered: the rendered error state (alert + "Thử lại") and the GET `/api/spotlight` contract it calls. The click → `fetchSpotlightSnapshot()` → `onLoaded` wiring is 4 lines and only read.
   - Adding a DOM test environment is a dependency decision for the caller.
3. **`retry()` wiring in the hook:**
   - The state machine is unit-tested, and each generation starts from `INITIAL_CHANNEL_STATE`.
   - The hook itself (channel removal on `failed`, new channel on retry) is still exercised only through e2e offline/online.
4. **Trailing debounce has no max wait:**
   - A stream of moderation events less than 2 s apart postpones the refetch until it stops. The events keep the counts close meanwhile.
   - Admin moderation is one click per kudo, so I did not add a cap (YAGNI).
5. **Post-join refetch now waits 0–2 s.** Events missed between the server render and the join heal up to 2 s later than before. Live events are not delayed.
6. **Reviewer M2 TTL cache:** not done; it stays a watch item for 100k+ kudos.
7. **Hosted staging check:** checklist item 3 has not been run anywhere yet. Human sign-off from the reviewer report is still pending.
8. **Next.js feedback pass:** no qualifying Next.js friction in this round, so the feedback command was not run.

Docs impact: minor.
- Done here: the release checklist.
- For doc-writer:
  - decision-log / F008 technical-spec: the moderation refetch (2–3 s, debounced), the post-join jitter, and restored kudos kept out of the ticker across a REPLACE;
  - architecture "Realtime Design": the line "Mất tin được bù ở client…" could add the moderation refetch;
  - changelog.

## raw runs
```json
[
  {"command": "npx vitest run --project unit tests/unit/spotlight-board-ui (RED)", "exitCode": 1, "summary": "5 files failed: reducer behavioural (k6 back in ticker), name-links harness loop, 3 modules absent"},
  {"command": "npx vitest run --project unit tests/unit/spotlight-board-ui tests/unit/spotlight-board (GREEN)", "exitCode": 0, "summary": "9 files, 76 tests passed"},
  {"command": "mutation checks (9) on spotlight unit tests", "exitCode": 1, "summary": "9/9 mutations caught, all files restored (cmp)"},
  {"command": "npx playwright test tests/e2e/spotlight-board.spec.ts -g \"Mark Spam\" (restored filter reverted)", "exitCode": 1, "summary": "spotlight-board.spec.ts:115 expected 0 ticker lines, received 1"},
  {"command": "npx playwright test tests/e2e/spotlight-board.spec.ts tests/e2e/spotlight-board-reconnect-and-search.spec.ts", "exitCode": 0, "summary": "5 passed"},
  {"command": "npx playwright test <2 spotlight specs> --repeat-each=3 --workers=2", "exitCode": 1, "summary": "14 passed, 1 failed (two-browser total = DB + 4: concurrent teardown hard-deleted 4 kudos, no event), 1 did not run"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "0 type errors"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean, no output"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "65 files, 785 tests passed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "migrations applied; seeds departments=6 hashtags=8 secretBoxPrizes=9"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "68 files, 434 tests passed (alone, after db:reset)"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "118 passed, 5 skipped, 0 failed (alone)"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "5 passed, 1 skipped"},
  {"command": "npm run build", "exitCode": 0, "summary": "compiled clean, 29/29 static pages, no warnings"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16/16 production status checks PASS"}
]
```

**Status:** DONE_WITH_CONCERNS
**Summary:** All four review items are done test-first and all 8 gates pass on the final code (unit 785, integration 434, e2e 118 passed / 0 failed, build clean, prod 16/16). The debounced refetch fixes the counter drift, and restored kudos stay out of the ticker so DEC-001 still holds.
**Concerns:** a known hard-delete race in the shared e2e fixtures (1/15 in the repeat run, full run green); the error-state click wiring has no automated test without a DOM test environment; hosted staging check and human sign-off still pending; decision-log entry needed for the restored-ticker rule.
