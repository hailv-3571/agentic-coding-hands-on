# Tester full run: phase 05 (F004 Kudos Live board, detail, read APIs)

- Date: 2026-11-16 · Branch `main` · HEAD `26c504c` · Changes are uncommitted and unstaged (nothing staged, nothing committed or pushed).
- Scope: full suite (migrations, API contracts and auth-guarded routes are safety-critical).

## Changes made in this run

| File | Change |
|---|---|
| `tests/e2e/kudos-feed/kudo-card-and-detail.spec.ts` | Unknown/malformed id and foreign-spam tests now assert the uniform not-found heading (`Kudo này không tồn tại hoặc đã bị gỡ.`) and no status code. The foreign-spam test also asserts the spam body is absent. |
| `features/kudos-feed/components/kudo-card-can-edit.ts` (new) | Pure `kudoCardCanEdit({isOwner, isSpam, writingOpen})` = `isOwner && !isSpam && writingOpen`. |
| `features/kudos-feed/components/kudo-card.tsx` | Uses `kudoCardCanEdit`; behaviour unchanged. |
| `tests/unit/kudos-feed/kudo-card-can-edit.test.ts` (new) | 8-row truth table plus the writingOpen=false case (9 tests). |
| `public/images/kudos-composer/ic-pencil.svg` | Deleted. Grep found references only in `plans/reports/*.md` (docs), none in code. |
| `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-05/*` | Refreshed (see Screenshots). |

## Commands, exit codes, counts

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run db:reset` | 0 | Supabase reset, migrations applied, seeds: departments=6, hashtags=8 |
| 2 | `npm run typecheck` (before dev restart) | 0 | Route types generated |
| 3 | `npm run dev` (restarted, port 3000) | n/a | Up. `/kudos`, `/kudos/<uuid>`, `/kudos/not-a-uuid` return 307 to `/login` for anonymous users (no 500). No worker exceptions in the dev log. |
| 4 | `npm run lint` | 0 | 0 errors, 0 warnings (final run) |
| 5 | `npm run test:unit` | 0 | 29 files, 376 passed, 0 failed (includes 9 new) |
| 6 | `npm run test:integration` | 0 | 27 files, 203 passed, 0 failed |
| 7 | `npm run test:e2e` (run 1) | 0 | 59 passed, 0 failed, 0 skipped, 39.5 s |
| 8 | `npm run test:e2e` (run 2) | 0 | 59 passed, 0 failed, 0 skipped, 34.5 s |
| 9 | `npm run typecheck` (final, dev stopped) | 0 | Route types generated |
| 10 | `npm run build` | 0 | Compiled; no warn/deprecate lines in log; `/kudos/[id]` Partial Prerender |
| 11 | `npm run test:prod` | 0 | 13 of 13 production status checks passed |

Notes:
- Playwright reused the running dev server (`reuseExistingServer`), so e2e ran against `next dev`.
- Lint first reported one warning I introduced (an import left unused after a partial edit). It was fixed before the final lint run, which is clean.
- Coverage was not measured: `package.json` has no coverage script.

## Flakiness and speed

- 0 flaky results across the two e2e passes (no retries, no skips, identical 59/59).
- Slowest e2e tests: owner pen opens composer (6.9 s), send kudo with title, bold body, hashtags, image and anonymous nickname (6.5 s), open prefilled and save (5.9 s), soft not-found (5.9 s).
- Integration suite is the slowest layer overall (35.9 s).

## Screenshots (phase-05, desktop 1440x900 and mobile 375x812)

Refreshed this run, same naming: `01-live-board-top`, `01-live-board-full`, `01b-highlight-carousel` (new, follows `05b` pattern), `02-all-kudos-feed`, `03-anonymous-card`, `05-hashtag-filter-open`, `05b-department-filter-open`, `06-kudo-detail`, `06-kudo-detail-full`, `07-not-found`.

Spot-checked visually: live board top with Highlight carousel, detail page (no pen, Copy Link and Đóng), not-found page, anonymous card ("Bí ẩn số 7" with "Người gửi ẩn danh"), hashtag dropdown open on mobile.

Not refreshed (not in the requested view list, still from the earlier run): `desktop-04-owner-card-with-pen`, `mobile-04-owner-card-with-pen`, `desktop-08-writing-closed-owner-card-no-pen`, `mobile-08-writing-closed-owner-card-no-pen`.

Captures were taken from the dev server, so the mobile live-board shot includes Next's dev "Compiling" indicator.

## Leftover test data

Checked after the e2e runs and after the capture script's own cleanup: `kudos` 0, `kudo_hashtags` 0, `kudo_images` 0, `profiles` 0, auth users 0, `kudo-images` bucket objects 0. The capture script counted before and after and the numbers matched.

## Concerns / blockers

1. Step 0 ordering: the prompt says to restart dev first but also forbids typecheck while dev runs. I stopped the port-3000 dev process (PID 33248), ran db:reset and typecheck, then started dev. Dev was stopped again for the build and restarted for screenshots. The dev server is currently running as PID 32972.
2. The pure-function unit test was written after the extraction, not RED-first. The extraction is behaviour-preserving (same expression), so I did not manufacture a RED. The truth table is not mutation-tested.
3. The soft-404 e2e no longer asserts status. That is intended per the 2026-11-16 decision, but it means no automated check that production answers 200 for these cases.
4. No coverage numbers (no coverage script in the repo).
5. Four screenshots from earlier runs remain (see Screenshots).
6. I did not re-read the backend and UI fix reports. The run did not depend on them.

## Ranked next steps

1. Add a `test:coverage` script (Vitest v8 coverage) so the 80% bar can be measured for `features/kudos-feed`.
2. Re-capture the owner-pen and writing-closed screenshots (needs an `EVENT_END_AT`-controlled run).
3. Capture screenshots from `next start` on the production build to drop the dev indicator.
4. Add a mutation check on `kudoCardCanEdit` (drop `!isSpam` and confirm the truth table fails).

**Status:** DONE_WITH_CONCERNS

**Summary:** Full phase 05 run is green: db:reset, typecheck, lint, unit 376/376, integration 203/203, e2e 59/59 twice (no flakes), build, and test:prod 13/13, all exit 0. Two test-side edits and one behaviour-preserving extraction are in place, the orphan SVG is deleted, screenshots are refreshed, and the DB has no leftover test rows.

**Concerns/Blockers:** See the concerns list above. None blocks the phase; the items are the RED-first gap on the pure function, no coverage measurement, and the four stale screenshots.
