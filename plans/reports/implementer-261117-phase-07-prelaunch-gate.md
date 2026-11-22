# Phase 07: prelaunch gate (C-09 step 5): implementer report

Date: 2026-11-17 · Role: implementer (RED-first) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-07-awards-portal.md`

## Files changed

| File | Change |
|---|---|
| `features/awards-portal/server/prelaunch-gate.ts` | NEW, pure. `isPrelaunch(nowMs, launchAtMs)` and `decidePrelaunchRoute(input) → {pass} \| {redirect, location} \| {forbidden}` |
| `features/awards-portal/server/prelaunch-gate-step.ts` | NEW adapter: reads `Date.now()` and `env.LAUNCH_AT`, maps the decision to `NextResponse.redirect` / JSON 403 / `null` |
| `shared/auth/session-proxy.ts` | Step (5) only: one call to `prelaunchGateStep` at the marked extension point. `getRole` = memoized, fail-closed `getProfile()`. A non-null answer goes back through `carrySessionCookies(…, session.response)`. Header comment updated |
| `shared/ui/app-routes.ts` | `countdown: "/countdown"` (one line) |
| `tests/unit/awards-portal/prelaunch-gate.test.ts` | NEW: Scope Contract table (120 cells) plus request-kind cases |
| `tests/unit/awards-portal/prelaunch-gate-step.test.ts` | NEW: adapter wiring (env/clock/request → response), `getRole` not called after launch |
| `tests/e2e/awards-portal/prelaunch-gate.spec.ts` | NEW: "before LAUNCH_AT" group (prelaunch server) and "after LAUNCH_AT" group (normal dev server) |
| `tests/e2e/awards-portal/prelaunch-server.ts` | NEW: project name plus the milestone env overrides for the prelaunch server |
| `playwright.prelaunch.config.ts` | NEW config. Extends `playwright.config.ts` and runs only the gate spec on its own server |
| `package.json` | `test:e2e:prelaunch` script (one line) |

`playwright.config.ts`, `next.config.ts` and `proxy.ts` are unchanged.

## Behaviour (as implemented)

- **Prelaunch** = server `now < LAUNCH_AT`, computed on every request and never stored. At exactly `LAUNCH_AT` the site counts as launched.
- **Before launch:**
  - The allowlist (`isPublicPath`: `/login`, `/auth/callback`, `/countdown`, `/access-denied`) passes for everyone with no role read. Guests are never gated there, which keeps step 4b's session-less `/access-denied` fetch working.
  - On any other path, an admin (DB role via `getProfile()`) passes.
  - Everyone else (user, null role, lookup error, guest) gets a redirect to `/countdown` on page loads, or a 403 on other requests (see the design choice below).
  - `getRole` is called at most once. It is never called on allowlisted paths or for guests, and a rejection counts as non-admin.
- **After launch:** `/countdown` page loads redirect to `/` for everyone, guests included. Everything else passes, and `getRole` is never called (unit-tested at both the pure function and the adapter).
- **Static assets:** the `proxy.ts` matcher already excludes `_next/static`, `_next/image`, `images/`, `fonts/` and favicon/robots/sitemap. `proxy-matcher.test.ts` covers this, so the matcher needed no change. The awards fonts load through `next/font`, i.e. `/_next/static/media`.

## Design choice: non-page requests

A redirect is sent only for a **page load**: `GET`/`HEAD` with no `next-action` header and not under `/api/`. That is the same predicate as step 4b, plus the `/api/` exclusion, which mirrors step 4's 401.

- **Before launch, non-admin, gated path:** Server Action POSTs, `/api/*` calls (any method) and other methods get **JSON 403 `{ "code": "prelaunch" }`**.
  - A 307 would make `fetch()` replay the POST at `/countdown`.
  - Server Actions are resolved by action id, not by path, so a replayed action would actually run on `/countdown`.
- **Before launch, allowlisted path:** non-page requests pass. Sign-out (a Server Action posted to the current path, `/countdown`) keeps working, and so does any other action on the countdown page, such as the language switcher.
- **After launch:** non-page requests to `/countdown` pass rather than redirect, so a sign-out posted from a countdown tab left open at launch still works.

## How the second (prelaunch) server works

- **Command:** `npm run test:e2e:prelaunch`, which runs `playwright test --config playwright.prelaunch.config.ts`. Local Supabase must be running.
- **webServer:** `npm run build && npm run start -- -p 3100`, with `reuseExistingServer: false` and a 600 s timeout.
  - The env sets `PORT=3100`, which is also the target of the proxy's `/access-denied` self-fetch.
  - It sets `LAUNCH_AT` to now + 30 days, and `EVENT_AT`, `EVENT_END_AT` and `NATIONAL_KUDOS_FINALIZE_AT` to +31, +32 and +33 days. Moving the later milestones keeps the env schema's ordering refinements valid whatever `.env.local` holds.
  - Process env beats `.env*` in Next. A build takes about 10 s here.
- **Why not a second `next dev`:**
  - `next dev` takes a lockfile in its dist dir (`Lockfile.acquireWithRetriesOrExit(<distDir>/lock)` in `next/dist/server/lib/router-utils/setup-dev-bundler.js`), so a second dev server in the same folder exits.
  - An env-driven `distDir` would make Next append `<distDir>/types` and `<distDir>/dev/types` to `tsconfig.json` (`lib/typescript/writeConfigurationDefaults.js` and `type-paths.js`). That dirties a shared file, and tsc would then see two copies of the generated global route types.
  - `next build` writes `.next` while dev writes `.next/dev`, which the docs say can run at the same time (`06-cli/next.md`). This matches the existing `test:prod` pattern.
- **Which tests run where:**
  - The prelaunch config's `testMatch` runs only `awards-portal/prelaunch-gate.spec.ts`, under the project `prelaunch`.
  - The spec's "before LAUNCH_AT" group skips itself unless the project is `prelaunch`. The "after LAUNCH_AT" group skips itself on `prelaunch`.
  - `npm run test:e2e` keeps its old behaviour: it picks up the spec, skips the 4 prelaunch tests and runs the post-launch one on the :3000 dev server.
- **Docs read:**
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: execution order, Node runtime, Server Functions are POSTs to the route, Flight headers are stripped but `next-action` is not.
  - `05-config/01-next-config-js/distDir.md` and `06-cli/next.md`.
  - None of these reads were blocked.

## RED / GREEN evidence

**Unit, RED** (tests written first): `npx vitest run tests/unit/awards-portal/prelaunch-gate.test.ts tests/unit/awards-portal/prelaunch-gate-step.test.ts` gave 2 files failed with `Cannot find package '@/features/awards-portal/server/prelaunch-gate(-step)'`. The modules did not exist yet.

**Unit, GREEN:** the same command gave **2 files, 134 tests passed**. With the phase 02 auth units added (`npx vitest run tests/unit/auth <gate tests>`): **7 files, 235 passed**, including `route-access-policy` and `proxy-matcher`.

Whole unit project (`npx vitest run --project unit`): 595 passed, 3 failed, all 3 in `tests/unit/awards-portal/awards-data.test.ts` (award messages vi/en). That file belongs to the parallel UI agent's in-progress `messages/*.json`. It is not mine and does not touch the gate.

**E2E, RED** (gate built but step (5) not wired, prelaunch server, fresh build): 3 failed, 1 passed (admin), 1 skipped.
- User on `/` stayed on `/`: `Expected "/countdown", Received "/"`.
- The Server Action got 400 instead of 403.
- The guest's `/countdown` got a 404 because the page does not exist yet.

**E2E, after wiring** (`npm run test:e2e:prelaunch`): 2 passed, 2 failed, 1 skipped.
- Passed: user Server Action → 403 `{code:"prelaunch"}`; admin reaches `/` and `/admin/overview` (200).
- Failed: "user → /countdown" and "guest sees /countdown and /login". The redirect assertions pass (URL is `/countdown`), but `/countdown` answers **404 because `app/(public)/countdown/page.tsx` (UI agent's file) does not exist yet**. Both tests assert status 200 on purpose and will pass once that page lands. **Re-run `npm run test:e2e:prelaunch` after the UI agent's countdown page exists.**

**E2E, normal dev server :3000** (already serving; post-launch group plus phase 02 auth group): `npx playwright test tests/e2e/awards-portal/prelaunch-gate.spec.ts tests/e2e/auth` gave **8 passed, 4 skipped**.
- Post-launch: guest `/countdown` → 307 to `/`; signed-in `/countdown` → `/` (200).
- All 7 phase 02 auth tests pass.

**Integration** (single file, not the suite; own users, cleaned up; drives `runSessionProxy` directly): `npx vitest run --project integration tests/integration/auth/session-proxy-admin-gate.test.ts` gave **11 passed**. Step 4b is unchanged, and "does not gate other paths" still holds with the env file's (past) `LAUNCH_AT`.

**Lint:** `npx eslint` on all 9 touched/new TS files is clean.

**Typecheck:** `npx tsc --noEmit -p .` exits 0. It ran after confirming none of my servers was up (port 3100 free). I did not run `npm run typecheck` (it deletes `.next/dev/types` under the shared dev server).

## Scope Contract (as run)

- **Changed:** the gate (pure function plus adapter), step (5) in the session proxy, one route constant, the e2e config and script.
- **Impacted:** every proxied request (a step after 4/4b); `/countdown` behaviour on the normal dev server; the `npm run test:e2e` file set.
- **Verified:**
  - the full gate unit table plus the adapter;
  - the gate e2e on both servers (prelaunch group partly blocked on the missing page, see above);
  - the phase 02 auth e2e group, proxy units, the proxy integration file, lint and tsc.
- **Deliberately skipped:** the full e2e suite and the integration suite (shared DB/dev server, per brief), and `npm run test:prod` (it checks only `/admin/*` statuses, which step (5) does not change after launch).

## Open concerns

1. **The countdown page blocks 2 e2e tests.** `npm run test:e2e:prelaunch` has to be re-run once `app/(public)/countdown/page.tsx` exists.
2. **The UI agent cannot see `/countdown` on the normal dev server any more.** Step (5) is live on the shared :3000 dev server through HMR, and that server's `LAUNCH_AT` is in the past, so `/countdown` now redirects to `/` (DEC-001, intended).
   - Countdown-page e2e in `portal-pages.spec.ts` must run on the prelaunch server: widen `testMatch` in `playwright.prelaunch.config.ts` and use the same project-name skip.
   - The "auto-redirect at 0" case (LAUNCH_AT about now + 65 s) needs another server with a near `LAUNCH_AT`. `prelaunchMilestonesEnv` is the place to parameterise it if wanted.
3. **The gate is a convenience wall, not data protection** (plan, Security).
   - A prelaunch non-admin can still POST *any* Server Action id to an allowlisted path such as `/countdown`. Next resolves actions by id, and action ids sit in the ungated `/_next/static` client bundles.
   - `requireSunner()` does not check prelaunch, so writes such as composing a Kudo are possible before launch by a determined user.
   - The proxy cannot close this without breaking sign-out on `/countdown`. If it matters, add a `requireLaunched()` (or role) check in write actions. That is a product decision for the orchestrator.
4. **First-login Sunners before launch:** `/auth/callback` sends them to `/onboarding/department`, which is gated, so they land on `/countdown` and onboard after launch. This matches the decision log ("only Login + Countdown"). It is noted because onboarding is not on the allowlist.
5. **Builds share `.next`.** `test:e2e:prelaunch` runs `next build`, which rewrites the production `.next` output that `test:prod` reuses. Do not run it at the same time as another `npm run build`. The build bakes nothing gate-related, since all routes are dynamic and the proxy reads env at runtime.
6. **Docs impact: minor.** Add a `test:e2e:prelaunch` row to the Test table in `docs/code-standards.md`. Not done: docs are outside my file ownership.
7. **Next.js feedback pass:** no qualifying candidate. The dev-lock and distDir/tsconfig constraints were read from source while choosing build+start. They were not hit as a failure.

**Status:** DONE_WITH_CONCERNS
**Summary:** The prelaunch gate (pure decision, adapter, step 5) is built and wired. Unit 134/134 GREEN after RED, lint and tsc are clean, and the phase 02 auth e2e, proxy integration and post-launch e2e are green. On the prelaunch server, 2 of 4 prelaunch e2e pass. The other 2 fail only on a 404 from the not-yet-built countdown page.
**Concerns/Blockers:** Re-run `npm run test:e2e:prelaunch` after the UI agent adds the countdown page. The UI agent's countdown e2e must use the prelaunch server. Server Actions posted to allowlisted paths bypass the gate (needs an action-level check if it matters).
