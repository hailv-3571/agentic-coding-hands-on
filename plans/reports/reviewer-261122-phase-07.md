# Review: phase 07 Awards portal & prelaunch gate (uncommitted)

Status: DONE_WITH_CONCERNS (0 critical, 2 warning, 4 suggestion). Verdict SEALED.

## Scope
Gate (prelaunch-gate.ts, prelaunch-gate-step.ts, session-proxy step 5, app-routes, playwright.prelaunch.config.ts, prelaunch-server.ts, package.json), event-window.ts, awards-portal UI, pages, messages, tests. Read by code; suites not re-run by me (taken from orchestrator: unit 600, e2e 84/5, prelaunch 5/1, tsc 0, eslint 0).

## Critical
None.

## Warning
W1. features/awards-portal/server/prelaunch-gate.ts:67 - a signed-in non-admin can POST any Server Action (header `next-action`) to an allowlisted path (/login, /countdown, /access-denied) before launch; actions resolve by id, not path. Kudo/heart/image-sign are now blocked by `isEventWritingOpen` (good), but `features/auth/server/choose-department-action.ts` (profile write) and set-locale still run. Low impact (own profile only), but "the gate is backed up on actions" is incomplete. Fix: accept and document, or guard choose-department with `now >= LAUNCH_AT || admin`. Sign-out and locale must stay open.
W2. The normal e2e suite silently depends on the local env file having LAUNCH_AT in the past (no CI workflow in repo to pin it). A future LAUNCH_AT redirects every Sunner spec to /countdown with an opaque failure. Fix: one assertion in the auth fixture / global setup ("LAUNCH_AT must be past for test:e2e"), or a note in the test docs. The prelaunch spec already skips by project name.

## Suggestion
S1. features/kudos-hearts/components/kudo-heart-button.tsx:61 - `writingOpen` false before LAUNCH_AT (admin only) shows reason EVENT_ENDED; server throws EVENT_ENDED too. Misleading wording pre-launch. Neutral code (WRITING_CLOSED) if it matters.
S2. features/awards-portal/server/prelaunch-gate.ts:69 - a role lookup failure sends an admin to /countdown (fail closed, logged in session-proxy). Correct; use a distinct log tag so an outage is not read as "admin blocked".
S3. features/awards-portal/components/use-server-clock-now.ts:21 - offset = serverNow(render) - Date.now()(mount), so the client lags the server by network+hydration latency. Safe direction (redirect late, never early, so no loop); the minute tile can show one minute more for up to that latency. Accepted; note it in the header comment.
S4. docs/features/F006_AwardsPortal technical-spec still lists /awards in the prelaunch allowlist (DEC-001 rows) and a flip animation; decision-log overrides. Hand to doc-writer.

## Hunt list results
- Non-admin before launch: gated paths -> 307 /countdown (pages) or JSON 403 (actions/API/non-GET); look-alikes (/login-help) gated (exact match); /api/* never redirected. OK.
- Admin blocked: no. Role read only while prelaunch, on a gated path, signed in; memoized with step 4b (one DB read). After launch zero DB reads.
- Loop /countdown <-> /: proxy at launch sends /countdown -> /; timer redirects only when the server-offset clock is done (client lags server, never leads). Cross-instance skew resolves in one hop (page not done -> no replace). No loop.
- /access-denied for guests: public, passes step 5 (needed by the 4b self-fetch). Static page, no data.
- Timer: never negative (remainingParts clamp), minute aligned to the time LEFT, +50 ms slack, stops at target, tick on visibilitychange, aria-live text changes only with the minute.
- Cache Components: pages use `connection()` via readRequestTimeMs plus `instant=false`. env imported only in server files; client components get ISO strings.
- Awards numbers match the research table (10/2/3/1/1/1; 7/15/7/10/5+8/15 M VND). vi/en awardsPortal keys 121/121, no diff.
- Files: all under 200 lines (max 114 component, 193 e2e spec). No leftover temp specs in tests/e2e/awards-portal.
- Prelaunch config: testMatch limited to one spec, own port 3100, reuseExistingServer false; normal config untouched; spec groups skip by project name. No leak into the normal suite.
- Write window `LAUNCH_AT <= now < EVENT_END_AT`: boundary tests inclusive/exclusive present; all callers (create/update kudo, image sign, heart service, page flags) use isEventWritingOpen.
- Contracts: env schema unchanged, no DB change, exports unchanged (APP_ROUTES gains countdown). contractStatus OK.

## Done well
Pure gate separated from env/proxy; fail-closed role; no 307 replay of a POST; server-clock-only timer; single awards data module; defense-in-depth write window; prelaunch e2e on a real build.

## Actions in order
1. W1: accept+document or guard choose-department.
2. W2: assert LAUNCH_AT-in-past in e2e setup.
3. S4 doc sync; S1/S2/S3 optional.

## Numbers
Unit 600/600, e2e 84 pass/5 skip, prelaunch 5/1, tsc 0, eslint 0 (orchestrator). Coverage not measured.

## Unresolved
- Real-browser latency of the minute tile near a boundary not measured.
- Screenshots vs Figma frames not pixel-compared by me.
