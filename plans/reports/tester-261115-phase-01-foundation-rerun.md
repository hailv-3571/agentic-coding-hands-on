# Tester Re-verify: Phase 01 Foundation (after review fix round 1)

Date: 2026-11-15 | Plan: 261108-0048-saa-2025-kudos-platform | Work context: C:\Users\luong.viet.hai\my-app
Scope: full Scope Contract (safety-critical: migrations, config, RLS, grants). No application code changed.

**Status:** DONE_WITH_CONCERNS

## Command results

| # | Command | Exit | Result / counts | Time |
|---|---------|------|-----------------|------|
| 1 | `npm run db:reset` (run 1, backgrounded) | 0 | migrations applied; `Seeds applied: departments=6, hashtags=8` | not captured (backgrounded) |
| 2 | `npm run db:reset` (run 2) | 0 | same counts | 38 s |
| 3 | `npm run test:unit` | 0 | 7 files, 52 passed, 0 failed | 4 s |
| 4 | `npm run test:integration` (run 1) | 0 | 4 files, 18 passed, 0 failed | 8 s |
| 5 | `npm run test:integration` (run 2) | 0 | 4 files, 18 passed, 0 failed (stable) | 7 s |
| 6 | `npm run test:e2e` | 0 | 2 passed, 0 failed (chromium) | 14 s |
| 7 | `npm run typecheck` (normal env) | 0 | route types generated; `tsc --noEmit` clean | n/a |
| 8 | `npm run typecheck` with `.env.local` renamed | NOT RUN | BLOCKED by guardrail (see Blockers) | n/a |
| 9 | `npm run lint` | 0 | no findings | n/a |
| 10 | `npm run build` (run 1) | 0 | compiled; routes `/` and `/_not-found`; no warnings | 15 s |
| 11 | `npm run build` (run 2) | 0 | same; no warnings | 11 s |
| 12 | `LAUNCH_AT=garbage npm run build` | 1 (expected) | readable Zod error, see below | n/a |

Counts vs the previous run: unit 48 to 52 (5 to 7 files), integration 13 to 18 (4 files). The added cases come from the review fixes (outbox type test, bucket DO UPDATE, pool/env tests).

## Verifications

- **Empty-DB reset:** `db:reset` passes twice; seed counts stay at 6 and 8, so there are no duplicates.
- **Flakiness:** integration is green on both runs with identical counts. Unit and e2e ran once each; no repeat soak.
- **Vitest ESM warning:** gone. No "ESM syntax in file loaded as CommonJS" line in the unit or integration logs after the `vitest.config.mts` rename.
- **Bad-env fail-fast:** `LAUNCH_AT=garbage npm run build` exits 1:
  ```
  Error: Invalid environment configuration (see .env.example):
  ✖ Expected ISO-8601 with offset, e.g. 2026-11-01T00:00:00+07:00
    → at LAUNCH_AT
  ```
  The offending value is not echoed back, so secrets stay out of the log.
- **`SKIP_ENV_VALIDATION` scope (grep):** referenced only in `next.config.ts:9` (the guard that skips `parseServerEnv`) and `scripts/typecheck.mjs:9` (sets it for typegen and tsc). The only other mention is a comment in `.env.example:6`. Dev, build and start all parse the env.
- **RLS and grants after REVOKE:** `0002` REVOKE applied cleanly in both resets. The rls-baseline integration tests pass, and the e2e `/` smoke tests (status below 500, `lang` = vi, and the NEXT_LOCALE switch to en) pass on the revoked-grants DB.
- **Bucket (0003):** `ON CONFLICT DO UPDATE` applied on re-reset; the storage bucket integration test passes.
- **File size:** largest code file is `tests/unit/shared/env-schema.test.ts` at 131 lines. All code files are under 200 lines.
- **Secrets:** `.env.local` was not read by this run. Its md5 was checked before any action and is unchanged (`e19b8a8bc91787ba25ad2277afcd38be`).

## Slow-build verdict

**Not reproduced.** Two consecutive builds completed in 15 s and 11 s with exit 0. The 25-minute stall did not recur. Build 1 ran in the foreground to completion; its log shows "Generating static pages (4/4) in 1163ms" and "Finalizing page optimization", with no stall. No build exceeded 5 minutes, so there was nothing to capture on that front.

The stall's cause is not proven. Two plausible causes are a DB connection without a timeout (the pool now has `connect_timeout: 10`, `idle_timeout: 20`, `max: 10`) and a leftover dev server or lock during the earlier run. The current prerender of `/` does not touch the DB. If it comes back, capture the `.next` build log and the `postgres` connect errors first.

## Screenshots (one-off, not committed)

Captured from the production build (`npm start`, port 3000) with a one-off script in the scratchpad. Full page, 200 status, and the server was stopped afterwards.

- `C:\Users\luong.viet.hai\my-app\plans\261108-0048-saa-2025-kudos-platform\evidence\screenshots\phase-01\home-desktop.png` (1440x900, page height 900)
- `C:\Users\luong.viet.hai\my-app\plans\261108-0048-saa-2025-kudos-platform\evidence\screenshots\phase-01\home-mobile.png` (375x812, page height 812)

Computed styles versus the tokens (identical on both viewports):

| Element | Observed | Token | Match |
|---------|----------|-------|-------|
| body background | rgb(0, 16, 26) | `--color-background` #00101a | yes |
| h1 colour | rgb(255, 234, 158) | `--color-primary` #ffea9e | yes |
| p colour | rgb(153, 153, 153) | `--color-text-muted` #999999 | yes |
| body colour | rgb(255, 255, 255) | `--color-text` #ffffff | yes |
| font | Montserrat (100-900 variable loaded) | Montserrat | yes |
| h1 size | 36 px | `text-display-small` | n/a (not checked against Figma) |

The desktop screenshot shows the placeholder: "Sun* Annual Awards 2025" with "Đang được xây dựng" beneath. This is the expected phase 01 content. The mobile shot is the same layout at 375 px width. Note: the `<html lang>` is `vi` by default. The screenshots are a visual check of tokens and fonts only, not a pixel comparison against Figma. Nothing was marked "exact".

## Blockers

1. **Typecheck with `.env.local` renamed (command 8): NOT RUN.** The Bash guardrail blocked the command because it names `.env.local`. It asks for explicit user approval to access that file. I did not read it, did not bypass the hook, and nothing was renamed. The file is in place (timestamp unchanged, md5 unchanged). To finish this step, the user needs to approve it, or run it by hand: `mv .env.local .env.local.bak && npm run typecheck; mv .env.local.bak .env.local`, then verify the md5 is `e19b8a8bc91787ba25ad2277afcd38be`. The typecheck script sets `SKIP_ENV_VALIDATION=1` itself, so the expected result is exit 0.

## Failures

None. Every command that ran exited with the expected code.

## Concerns (non-blocking)

1. The `.env.local` rename test is outstanding (see Blockers).
2. The slow build did not reproduce, but the root cause of the original 25-minute run is unproven.
3. Flakiness sampled lightly: integration 2 runs, unit and e2e 1 run each.
4. e2e ran against `npm run dev` (Playwright webServer). The screenshots used the production build. Both are green.
5. `db:reset` run 1 duration was not captured because it ran in the background.

## Open questions

- Approve the `.env.local` rename step, or run it manually as shown above?
- Should the screenshot set be replaced once phase 07 ships the real homepage? Yes, when phase 07 lands.
