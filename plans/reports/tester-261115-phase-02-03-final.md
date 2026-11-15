# Tester Final Report: Phases 02 (auth) and 03 (app shell), after review fix round 2

- Date: 2026-11-15
- Work context: C:\Users\luong.viet.hai\my-app
- Plan: plans/261108-0048-saa-2025-kudos-platform
- Scope: FULL suite (auth and migrations are safety-critical). Nothing skipped.
- Logs: C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\tester-final-*.log
- App code: not edited.

## Run results (in order)

(appended as each step completes)

| # | Command | Exit | Duration | Result |
|---|---------|------|----------|--------|
| 1 | `npm run db:reset` | 0 | 23s | Supabase reset, drizzle migrations applied, seeds (departments=6, hashtags=8) |
| 2 | `npm run typecheck` | 0 | 5s | Route types generated, no errors |
| 3 | `npm run lint` | 0 | 4s | No findings |
| 4 | `npm run test:unit` | 0 | 3s | 15 files, 176 passed, 0 failed |
| 5 | `npm run test:integration` | 0 | 16s | 14 files, 108 passed, 0 failed |
| 6 | `npm run test:e2e` | 0 | 22s | 30 passed, 0 failed (dev server via webServer) |
| 7 | `npm run build` | 0 | 9s | Compiled, TypeScript clean, 8 app routes plus Proxy |
| 8 | `npm run test:prod` | 0 | 5s | 13 PASS lines on `next start`, 0 FAIL |
| 9 | auth.users row count | 0 | - | `select count(*) from auth.users` = 0 |

Notes on the run:
- `psql` is not on the Git Bash PATH. The count ran through the container's own psql: `docker exec supabase_db_saa-2025-kudos psql -U postgres -d postgres`, which targets the same DB at 127.0.0.1:54322.
- The e2e run logs `language switch failed` on stderr. That line comes from the test that asserts the failure alert (case 12), so it is expected output, not a failure.
- The e2e run logs a dev-only cache-bypass warning for `/access-denied`. It is not a failure.
- The build prints an environment-file line. I did not open any secret-bearing env file.
- Port 3000 had no listener before the run. The only node processes were the Playwright MCP servers.

## Screenshots

(appended below)

Inventory: 24 PNGs, all present. Phase 02 has 6 (login, login-error-domain, onboarding-department, each desktop 1440x900 and mobile 375x812). Phase 03 has 18 (8 desktop plus mobile pairs, and 2 mobile-only: admin-mobile-menu-open, mobile-menu-open).

Duplicate evidence: `phase-02/login-desktop-1440x900.png` and `phase-03/login-with-footer-desktop.png` are byte-identical (1438700 bytes). `phase-02/login-mobile-375x812.png` and `phase-03/login-with-footer-mobile.png` are byte-identical (320667 bytes). Both pairs are the same capture, so only one copy is needed.

Comparison method: visual judgment only. No pixel-diff metric was run, so every result below is qualitative. None is labelled "exact".

| Capture (desktop unless noted) | Figma reference | Result |
|---|---|---|
| `phase-03/app-home-header-footer-desktop.png` | `research/figma-frames/homepage-header-crop.png`, `homepage-full-2167-9026.png` | Header logo, nav (About SAA 2025 / Award Information / Sun* Kudos), VN switcher and footer (4 links plus copyright) match the frame. Two differences: no bell icon, and the body is the "Đang được xây dựng" placeholder rather than the homepage hero. The spec explains both (see below), so neither is a defect. |
| `phase-03/forbidden-403-desktop.png` | `research/figma-frames/error-403-2182-9291.png` | Layout matches: centred heading, monitor/lock illustration, one line of body copy. Copy is Vietnamese (`Không có quyền truy cập`, `Về trang chủ` button) against an English frame ("Access Denied"). The frame's body text is the 404 boilerplate, and the spec shares error-panel across 404/403. Locale difference, not a visual defect. |
| `phase-02/login-mobile-375x812.png` (also `phase-03/login-with-footer-mobile.png`) | `research/figma-frames/mobile-login-6885-8963.png` | Matches qualitatively: ROOT FURTHER wordmark, tagline, yellow "LOGIN With Google" button in the lower third, footer copyright, VN switcher top right. The frame has a device status bar, which the capture does not, and it is not a product element. |
| `phase-03/admin-top-bar-desktop.png` | `research/figma-frames/admin-overview-620-7712.png` | Four items, active underline on Overview, ADMIN label, VN switcher, avatar box. Two differences. (a) Item label is "User" where the frame reads "Role". The spec records "User" as the decision that resolves Role vs User, so this is intended. (b) No bell, same deferral as home. The avatar is an "E" initial box where the frame shows a person icon. The spec describes an avatar initial, so this matches the spec, but I did not confirm it against a frame. |

Material mismatches: none found. Items that look different but match the spec or the locale:
- Missing bell icon: the header bell slot renders nothing until phase 13 (`AppHeader bellSlot`).
- Admin "User" label: recorded decision.
- Home body placeholder: page bodies belong to phases 05, 07 and 12.
- Vietnamese 403 copy: locale default is vi.

Open for the orchestrator: the avatar initial-vs-person-icon difference was not checked against a design frame. I left it qualitative.

Flakiness: each suite ran once. No retries and no reruns. The e2e run used 6 workers and passed 30/30.

**Status:** DONE_WITH_CONCERNS
**Summary:** All eight commands exited 0, and auth.users holds 0 rows. Screenshot review found no material mismatch against the Figma frames. The concerns are qualitative-only visual checks and duplicate evidence files.
**Concerns/Blockers:**
- Visual comparisons are judgment only, with no pixel metric, so none is "exact".
- Two byte-identical screenshot pairs across phase-02 and phase-03.
- Avatar initial vs person icon not checked against a frame.
- Single run per suite; flakiness was not measured beyond one green pass.
- `psql` is not on PATH; the count used the Supabase container's psql.
