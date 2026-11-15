# Tester report: phases 02 (Auth & onboarding) and 03 (App shell & i18n)

**Date:** 2026-11-15 · **Tree:** `C:\Users\luong.viet.hai\my-app` on `main`, uncommitted · **Scope:** safety-critical (auth, sessions, RBAC, migrations) → full set
**Status:** DONE_WITH_CONCERNS. Every suite is green. Two spec defects remain (F1 and F2), and one contract-text mismatch (D1) needs a decision.

## 1. Command table

| # | Command | Exit | Result | Time |
|---|---|---|---|---|
| 1 | `npm run db:reset` (from empty local DB) | 0 | Migrations 0004 and 0005 applied; seeds: departments=6, hashtags=8 | 21.5 s |
| 2 | `npm run test:unit` | 0 | 13 files, **115/115** passed | 2.8 s |
| 3 | `npm run test:integration` (run 1) | 0 | 11 files, **67/67** passed | 11.3 s |
| 4 | `npm run test:integration` (run 2) | 0 | 11 files, **67/67** passed | 11.1 s |
| 5 | `npm run typecheck` (first attempt) | **2** | 2 TS2307/TS2344 errors, both in stale generated `.next/dev/types/validator.ts` (see §4 note N1) | — |
| 6 | `rm -rf .next` (ignored build cache), then `npm run typecheck` | 0 | Types generated, `tsc --noEmit` clean | — |
| 7 | `npm run lint` | 0 | No findings | — |
| 8 | `npm run test:e2e` (run 1) | 0 | 28 tests, **28/28** passed (6 workers) | 23.6 s |
| 9 | `npm run test:e2e` (run 2) | 0 | **28/28** passed | 26.3 s |
| 10 | `npm run build` (output to scratch log) | 0 | Compiled, TypeScript clean, no warnings. Routes: `/`, `/login`, `/auth/callback`, `/onboarding/department`, `/admin`, `/admin/overview`, `/_not-found`; Proxy present | 12.9 s |
| 11 | `npx vitest run --project integration tests/integration/auth tests/integration/foundation/rls-baseline.test.ts --reporter=verbose` | 0 | All named cases pass (see §3) | — |
| 12 | `npm start` + one-off capture script (not committed) | 0 | 23 shots + manual checks; results in scratch `results.json` | — |
| 13 | One-off diagnostic script (not committed) | 0 | Confirmed F1 status and 404 prefetch URLs | — |
| 14 | One-off mobile language capture (not committed) | 0 | `aria-expanded=true` confirmed | — |

Counts: unit 115 run / 115 pass / 0 fail / 0 skip. Integration 67 / 67 / 0 / 0 per run. E2E 28 / 28 / 0 / 0 per run.

**Coverage:** not produced. Coverage is not in this Scope Contract's "Will verify" list.

**Logs:** `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\` (`db-reset.log`, `unit-1.log`, `integ-1.log`, `integ-2.log`, `typecheck.log`, `typecheck-2.log`, `lint.log`, `e2e-1.log`, `e2e-2.log`, `build.log`, `capture.log`, `diag.log`).

## 2. Scope Contract checks

| Check | Result |
|---|---|
| Foreign-domain sign-up via Auth API | **PASS**. `POST /auth/v1/signup` with `@gmail.com` returned HTTP 403, `msg: "domain_not_allowed"`. Profile rows for that email: 0. |
| Triggers reject foreign domain (direct insert, sub-domain, suffix look-alike, email change) | **PASS** (integration, `auth-user-triggers.test.ts`) |
| Domain literal equals env `ALLOWED_EMAIL_DOMAIN` | **PASS** (integration) |
| Anon key cannot read `profiles` (incl. with Sunner token); no self-promotion | **PASS** (integration, `anon-key-cannot-read.test.ts`) |
| RLS baseline still green with `profiles` (8 cases) | **PASS** (integration, `rls-baseline.test.ts`) |
| Email/password provider marked local-only | **PASS**. `supabase/config.toml` `[auth.email]` carries a `LOCAL ONLY` comment and the hosted dashboard note. |
| No real Google secret or service-role key in tracked or new files | **PASS**. `git grep` for `GOCSPX-`, `sb_secret_`, `sk_live`, JWT-shaped strings returned nothing. The only new-file hit is `.env.example:14` `<service-role-key>`, a placeholder. Google secret is `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)`. `.env.local` was not opened (ignored by `.env*`). |
| All code files < 200 lines | **PASS**. The largest in-scope file is 89 lines (`shell-icons.tsx`). |
| Guest `GET /` | **Discrepancy D1**. Final URL is `/login` (HTTP 200), not `/login?next=%2F`. The code omits `next` when it equals `/` (`shared/auth/public-paths.ts` `withQuery`, pinned by the integration test "omits next for '/'"). The destination is equivalent. The contract text needs correcting or explicit acceptance. |
| Non-admin `GET /admin` and `/admin/overview` | **FAIL F1**. Body is the correct 403 page (no admin bar), but HTTP status is **200**. |
| Admin `GET /admin/overview` shows the admin frame | **PASS**. HTTP 200. Top bar lists exactly Overview · Review content · User · Settings (desktop). `/admin` → `/admin/overview` redirect for admin. |
| Signed-in 404 renders the shell (D005) | **FAIL F2**. Status 404 is correct, but no header or footer renders. |

## 3. Verbose integration evidence (run 11)

- `complete-login`: safe `next` kept; `//evil.com`, `https://evil.com`, `/\evil.com` dropped; `ADMIN_EMAILS` promotes on every login, even after manual demotion; foreign-domain session rejected with profile untouched.
- `admin-guard`: guest → login; user → 403; admin → pass; **403 on the very next call after mid-session demotion** (same cookies).
- `current-user`: forged cookie treated as signed out; revoked-on-server session rejected; `requireSunner` sends a first-time user to the department picker before any `(app)` page.
- `choose-department`: second call is a no-op; invalid, non-UUID and unknown department ids return `invalid_department` with nothing saved.
- `auth-user-triggers`: first-sign-in profile created with `role=user`; name and avatar fallbacks; D005 first-login name kept; cascade delete.

## 4. Failures and defects (with evidence)

### F1. Non-admin on `/admin/*` gets HTTP 200 in production (medium)

- **Evidence:** diagnostic run against `npm start`, Sunner session.
  - `GET /admin/overview`, vi-VN: `documentStatus: 200`, `h1: "Không có quyền truy cập"`, no admin nav.
  - `GET /admin/overview`, en-US: `documentStatus: 200`, `h1: "Access Denied"`.
  - `GET /admin`: 200 (capture run).
- **Expected:** 403 (phase 03 CAP-05, FR-602, SC-004).
- **Why e2e missed it:** `tests/e2e/app-shell/admin-frame-and-errors.spec.ts:62` asserts `status() === 403` and passes, but the webServer is `next dev`, where the same request returns 403. The gap is production-only. Dev log shows `Route "/admin": Could not validate instant UI ... NEXT_HTTP_ERROR_FALLBACK;403` at `shared/auth/admin-guard.ts:33` (2 lines per e2e run).
- **Root-cause hypothesis (not proven):** `forbidden()` is thrown from `app/admin/layout.tsx` via `requireAdmin` after the root layout has started streaming. Under this stack's rendering mode, the status is already committed as 200. Hint: move the admin role check to a point before streaming starts (for example a role gate for the `/admin` prefix in `proxy.ts`, which phase 07 already extends), or otherwise return 403 before the shell flushes. Then add an e2e status assertion against a production server (`PLAYWRIGHT_BASE_URL` or a `next start` project).

### F2. Signed-in 404 has no shell (medium)

- **Evidence:** `app/not-found.tsx` calls `getShellUser()` but renders only `<ErrorPanel>` with a Home CTA. It never renders `AppHeader` or `AppFooter`. Screenshot `phase-03/not-found-404-desktop.png` shows no header or footer.
- **Expected:** `app-shell/functional-spec.md` D005: "404 hiện khung chung nếu đã đăng nhập" (404 shows the common shell if signed in). Phase 03 architecture: `getSessionUser() ? AppHeader+NotFoundPanel+AppFooter : NotFoundPanel`.
- **Test gap:** the e2e 404 tests assert status and copy, not the shell.
- **Hint:** when `getShellUser()` returns a user, wrap `ErrorPanel` with the same header and footer the `(app)` layout uses. Add a banner and contentinfo assertion to the signed-in 404 e2e test.

### D1. Contract text vs behaviour (decision needed)

Guest `GET /` ends at `/login`, not `/login?next=%2F`. This is deliberate in code and tests. Either amend the Scope Contract to `/login`, or accept it explicitly.

### Not failures (noted for transparency)

- My first capture flagged the 403 heading as missing. That was a tester error: the script matched the English heading under a Vietnamese session. The diagnostic showed the correct heading. The page content is right.

## 5. Flaky observations

- No flakiness across two runs of integration (67/67 both times) and two runs of e2e (28/28 both times).
- Slowest e2e tests, run 2: "404 renders in English" 5.4 s, "404 localized copy" 5.1 s, "admin four top-bar items" 5.1 s, "non-admin 403" 5.2 s. None needs tightening.
- Integration runs `fileParallelism: false` by design, so shared-DB timing did not surface.

## 6. Notes

- **N1 (typecheck fragility, local only):** `tsconfig.json` includes `.next/dev/types/**/*.ts`. A stale `validator.ts` from before the `app/page.tsx` → `app/(app)/page.tsx` move broke `npm run typecheck` (exit 2). Clearing `.next` fixed it (exit 0). Fix: exclude `.next/dev` from the typecheck include, or clear `.next/dev/types` inside the typecheck step. A clean CI checkout should not hit this.
- **N2 (dev noise):** the Next dev overlay logs `NEXT_HTTP_ERROR_FALLBACK;403` for every non-admin hit under `/admin`. It is non-fatal but will read as an error in CI logs.
- **N3 (prefetch 404s, expected):** the signed-in home logs 404 prefetches for `/awards`, `/kudos`, `/community-standards`. These routes land in phases 05 and 07. Admin pages probably log the same for `/admin/review`, `/admin/users` and `/admin/settings` (phases 08 and 14). Not verified per URL.
- **Test data:** after all runs, local `auth.users` = 0 rows, sunner-domain users = 0, orphan profiles = 0, foreign-domain users = 0. Teardown works.
- **Not run:** real Google consent (declared skip). Prelaunch gate (phase 07). Coverage report.
- **Repo state:** no application code changed by tester. Only `.next/` (ignored build cache) was deleted and regenerated, and the evidence screenshot folders were replaced.

## 7. Screenshots (1440x900 desktop, 375x812 mobile, production `next start`)

Folder: `C:\Users\luong.viet.hai\my-app\plans\261108-0048-saa-2025-kudos-platform\evidence\screenshots\`

- **phase-02/** (6): `login-desktop-1440x900.png`, `login-mobile-375x812.png`, `login-error-domain-desktop-1440x900.png`, `login-error-domain-mobile-375x812.png`, `onboarding-department-desktop-1440x900.png`, `onboarding-department-mobile-375x812.png`
- **phase-03/** (18): `app-home-header-footer-{desktop,mobile}.png`, `header-language-dropdown-open-{desktop,mobile}.png`, `account-menu-user-{desktop,mobile}.png`, `account-menu-admin-{desktop,mobile}.png`, `mobile-menu-open-mobile.png`, `admin-mobile-menu-open-mobile.png`, `admin-top-bar-{desktop,mobile}.png`, `forbidden-403-{desktop,mobile}.png`, `not-found-404-{desktop,mobile}.png`, `login-with-footer-{desktop,mobile}.png`

The previous phase-02 and phase-03 sets were replaced by these files.

## 8. Visual diff vs Figma frames (qualitative only)

No deterministic pixel metric was run, so every item below is a judgment, not "exact". Frames are in `plans/261108-0048-saa-2025-kudos-platform/research/figma-frames/`.

**Home header (vs `homepage-header-crop.png`)**
- Active nav link: Figma gold with underline. Build white with glow and underline.
- Right side: Figma shows a bell and a person glyph. Build shows an "S" initial (phase 03 fallback). The bell is phase 13's slot.
- Home body is the phase 07 placeholder ("Đang được xây dựng"), so hero art is absent. Expected.
- Footer compared by copy only: 4 links and copyright match. Not compared against `homepage-footer-crop.png` visually.

**Mobile home (vs `mobile-home-6885-8978.png`)**
- Figma shows search and bell icons plus a bottom tab bar (SAA 2025 · Awards · Kudos · Profile). Build shows an avatar and a hamburger, with no bottom bar. The build follows the collapsed-menu spec. Figma diverges.

**Login desktop (vs `login-662-14387.png`)**
- Copy, Google button, footer line and wordmark placement match.
- Figma frame is 1024 px tall; build is 900 px viewport, so heights are not comparable.
- Language switcher sits about 20 px further right in the build.
- Background artwork crop differs slightly.

**Login mobile (vs `mobile-login-6885-8963.png`, 375x812)**
- Build wordmark sits about 100 px higher (y≈145 vs Figma y≈250).
- Build intro wraps onto three lines and is heavier. Figma is one line, regular weight.
- Build Google button is at y≈652–692. Figma's is at y≈626–665, so the build's sits lower.
- Build header has a border line; Figma does not.
- Artwork crop differs.

**Language dropdown desktop (vs `dropdown-language-721-4942.png`)**
- Close match: VN highlighted, EN below, gold border.
- Build's trigger turns gold while open; Figma's stays white.
- Mobile dropdown captured (`header-language-dropdown-open-mobile.png`), no Figma mobile frame. Not compared visually.

**Account menu user (vs `dropdown-profile-721-5223.png`)**
- Matches: Profile with person icon, Logout with chevron, gold border.
- Figma highlights Profile (hover state). Build shows no highlight.

**Account menu admin (vs `dropdown-profile-admin-721-5277.png`)**
- Matches: Profile, Dashboard with grid icon, Logout. Same hover-state difference.

**Admin top bar (vs `admin-overview-620-7712.png`)**
- Third item: Figma says "Role", build says "User". The decision log resolves this to "User", so the build follows the decision.
- Figma header is a lighter grey band; build is near-black, like the Sunner header.
- Figma logo is larger and has a divider after it before "ADMIN". Build has no divider.
- Figma shows bell and person glyph. Build shows "S" initial.
- Mobile: the four items sit in the collapsed panel (`admin-mobile-menu-open-mobile.png`), confirmed by count.

**403 (vs `error-403-2182-9291.png`)**
- Figma frame is English ("Access Denied"). Build renders Vietnamese by default ("Không có quyền truy cập"). Locale difference, not a layout defect.
- Build adds a "Về trang chủ" button. Figma frame has none. Phase 03 D005 requires a home button on 403, so the build is spec-correct.
- Illustration sits about 50 px higher in the build. Scale is similar.
- Build background art is dimmer.

**404 (vs `error-404-1378-5063.png`)**
- Layout, numerals, robot and text position closely match.
- Differences: build copy is Vietnamese ("KHÔNG TÌM THẤY") versus Figma's English "NOT FOUND". Build adds a Home button (D005). Build shows no shell when signed in (F2).

**Login error banner (no Figma frame)**
- Banner sits above the button with "Chỉ tài khoản @sun-asterisk.com được phép đăng nhập." Visually clean. Copy not verifiable against a design.

**Onboarding (no Figma frame in set)**
- Centered card with six departments from the seed (CEVC1–4, OPD, Infra), single-choice radios and "Tiếp tục". No shell, which fits the bare-page intent.

## 9. Concrete next work (ranked by impact)

1. **F1 (fix before phase close).** Make non-admin `/admin/*` return HTTP 403 in production. Add an e2e status assertion that runs against `next start`, not only `next dev`.
2. **F2 (fix before phase close).** Render header and footer on the signed-in 404. Extend the 404 e2e test to assert the banner and contentinfo.
3. **D1 (decide).** Amend the contract to `/login` or accept it explicitly.
4. **N1.** Exclude `.next/dev` from the typecheck include, or clear it inside the typecheck script.
5. **N2.** Quiet the dev-overlay 403 log for admin hits, or document it as expected.
6. **Visual polish (optional).** Mobile login spacing and intro weight; active-link colour in the header; admin header background and logo size. Only if the design owner wants pixel parity.

## 10. Open questions

- Does the owner accept D1 (`/login` without `next` for a guest on `/`)?
- Should the 403 status be enforced in `proxy.ts` (phase 07's extension point) rather than in the layout?
