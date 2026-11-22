# Tester: phase 07 full run (prelaunch gate + awards portal)

Date: 2026-11-22 · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-07-awards-portal.md`
Inputs: implementer reports `implementer-261117-phase-07-prelaunch-gate.md`, `implementer-261117-phase-07-portal-pages.md`
Scope: Changed = prelaunch gate (proxy step 5), countdown, awards data, 5 pages, `awardsPortal` messages, `playwright.prelaunch.config.ts`. Impacted = every proxied request, `/`, header/footer links. Safety-critical (proxy/authorization), so suites ran in full.

## Commands and exit codes

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean, 9.6 s |
| 2 | `npm run lint` | 0 | clean |
| 3 | `npm run test:unit` | 0 | 40 files, **598 passed**, 0 failed (3.1 s). The 3 awards-data failures the implementer saw are gone. |
| 4 | `npm run test:integration` | 0 | 35 files, **269 passed**, 0 failed (72.8 s) |
| 5 | `npm run test:e2e` (dev server :3000, LAUNCH_AT in past) | non-zero (Playwright: 10 failed) | **74 passed, 10 failed, 4 skipped** of 88 (2.9 min). Exact exit code not captured: my output pipe hid it. |
| 5a | rerun failed files, default 3 workers | 1 | 7 passed, 14 failed of 21 (the failing set changed between runs) |
| 5b | serial `--workers=1`: heart-toggle + kudo-card-and-detail | 1 | 3 passed, 10 failed of 13 |
| 6 | `npm run test:e2e:prelaunch` (run 1, before new test) | 0 | **4 passed, 1 skipped** (56.8 s) |
| 6b | same, after adding FR-203 test (run 2) | 1 | my test bug: `clock.fastForward("31d")` is not valid, it takes ms or mm:ss. Fixed. |
| 6c | same (run 3) | 0 | **5 passed, 1 skipped** (40.7 s) |
| 7 | temp screenshot spec on prelaunch server | 0 | 2 passed. Spec and temp config deleted afterwards. |

## Phase 07 surface: all green
- `awards-portal/portal-pages.spec.ts`: 12/12 pass on the dev server (homepage, awards anchor menu, countdown follows the server clock, EN switch, Thể lệ / Tiêu chuẩn static pages, 375 px no sideways scroll).
- `awards-portal/prelaunch-gate.spec.ts`, prelaunch server: user Sunner redirected to `/countdown` from `/`, `/kudos`, `/awards`; Server Action outside the allowlist gets 403 `{code:"prelaunch"}`; admin reaches `/` and `/admin/overview`; guest sees `/countdown` and `/login`, and `/` goes to `/login`.
- Gate, after-launch group on :3000: `/countdown` gives 307 for a guest and goes to `/` for a Sunner.
- App-shell, auth and smoke specs in the full run: all pass.
- Unit gate table and adapter tests are inside the 598 unit passes.

### New test (FR-203), `tests/e2e/awards-portal/prelaunch-gate.spec.ts`
"counts down to LAUNCH_AT with no link to the awards, then asks for the home page once the clock passes it":
- Signs in a Sunner, installs `page.clock`, opens `/countdown`.
- Asserts DAYS, HOURS and MINUTES units are present. Days is 29 or 30. No `a[href*="/awards"]`.
- Fast-forwards the browser clock 31 days and waits for a non-prefetch request to `/`. That is the timer's `router.replace("/")`.
- Asserts the URL ends at `/countdown` again, since the prelaunch proxy sends the user back. This bounce is expected.
- **Mutation check:** not executed, because the rule forbids leaving product code changed. By reasoning: with `redirectOnZero` removed, the timer never calls `router.replace`, so no such request is made. Prefetches of `/` are excluded by the `next-router-prefetch` filter. The `waitForRequest` then times out at 15 s, and the test fails.

## Screenshots (`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-07/`)
- `countdown-desktop-1440x900.png`: DAYS / HOURS / MINUTES tiles centred, 29 23 59 at capture. scrollWidth = clientWidth = 1440.
- `countdown-mobile-375x812.png`: 3 units on one row (same top y = 406), scrollWidth = clientWidth = 375, no horizontal scroll.
- Looked at both. Layout and the no-links rule look right. Pixel diff vs Figma not run (out of scope per contract).

## Failures (full e2e), with error text
All 10 failing tests are in `kudos-feed` and `kudos-hearts`. None is in phase 07 code. The page DOM renders in the failure snapshots, so these are timeouts and data assertions.

| Spec : test | Error (first line) |
|---|---|
| kudo-card-and-detail : edit pen opens composer | `toHaveValue`: "Bài của chính tôi" not found; dialog textbox not found |
| kudo-card-and-detail : pen after switching accounts | expected "Bạn không có quyền sửa Kudo này." got "Đã có lỗi xảy ra, vui lòng thử lại." |
| kudo-card-and-detail : long unbroken text wraps | 30 s timeout in `locator.evaluate` |
| kudo-card-and-detail : HH:mm - MM/DD/YYYY time | "10:00 - 10/30/2025" not found (`time` element not visible) |
| kudo-card-and-detail : unknown id not-found copy | heading "Kudo này không tồn tại hoặc đã bị gỡ." not visible |
| kudo-card-and-detail : author spam view | "Spam" badge not visible |
| live-board : anonymous card nickname | "Mèo Ẩn Danh" not visible |
| heart-highlight-ranking : ranks by hearts | 30 s `waitForResponse` timeout, then heart button click 30 s timeout |
| heart-toggle : hearting updates count and persists | 30 s `page.goto("/kudos/{id}")`, waiting for `load` |
| heart-toggle : own Kudo disabled heart | heart button not found (5 s expect) |

Rerun-only failures (passed in the full run, failed on rerun or serial): Xem chi tiết → `toHaveURL`; live-board "Tải thêm" (`not 10, received 10`); live-board no horizontal scroll at 375/1440; heart-highlight "heart given in Highlight shows on All Kudos"; heart-toggle refused toggle reverts.

### Root-cause guess: environment, not product (unverified)
- It is not contention. The same tests fail with `--workers=1`, so the memory note's first rule does not explain it.
- The dev server is degraded. PID 44984 (`node.exe`, started 2026-11-17, working set 1.5 GB) is the `:3000` process I did not start, so I did not kill it.
  - `/login` TTFB: 2.5 s at the start of the run, 4.5 to 5.1 s later.
  - A static `.webp` took 3.3 s.
  - `page.goto` waits for `load` and times out at 30 s.
- About 30 leftover `chrome.exe` processes are running, which may add CPU load.
- The phase 07 change to proxy step 5 is a no-op for non-countdown paths after launch, and `getRole` is not called there (implementer unit tests). It is not an obvious cause.
- Still, I cannot prove a regression is absent. Per the rules, these stay red.

## Status
**Status:** BLOCKED (full e2e is not green). Phase 07 specs are green.

**Summary:** Typecheck, lint, unit (598) and integration (269) are green. The prelaunch gate is green (5 passed, 1 skipped), with FR-203 added. The screenshots meet the layout rules. The full e2e run has 10 failures, all in the kudos specs. They fail serially on a degraded dev server, so they are not verified as product bugs.

**Concerns and blockers:**
1. Full e2e is red on `:3000`. Next step: the orchestrator restarts the stale `next dev` (I did not kill it), then reruns `npx playwright test tests/e2e/kudos-feed tests/e2e/kudos-hearts`. If it is still red on a fresh server, it is a product bug for the kudos owner.
2. The exact exit code of the full e2e run was not captured (my pipe). Its counts are reported above.
3. Brief violation, disclosed: I ran one read-only `git status --short` on `tests/` by mistake. No other git command was run. No product code was changed.
4. The gate is a convenience wall (implementer concern 3). Server Actions posted to allowlisted paths (e.g. `/countdown`) bypass it before launch. Not tested here, and it is a product decision.
5. Coverage was not run. `package.json` has no coverage script, and the contract did not ask for it.

## Ranked next work
1. Restart the `:3000` dev server, then rerun the kudos specs once. This decides whether the phase 07 run can be called green.
2. Decide on the Server Action bypass before launch (add a `requireLaunched()` check in write actions, or accept the risk).
3. Keep the FR-203 test; add a real mutation check in a throwaway branch if the team wants proof, not reasoning.
4. Re-run `test:e2e:prelaunch` after any change to `session-proxy.ts`, since its server build is separate from `:3000`.
