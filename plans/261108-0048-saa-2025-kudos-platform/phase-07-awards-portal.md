---
phase: 07
feature: F006
priority: P1
status: completed
depends_on: [02, 03]
file_ownership:
  - app/(public)/countdown/page.tsx
  - app/(app)/page.tsx, app/(app)/awards/page.tsx, app/(app)/rules/page.tsx, app/(app)/community-standards/page.tsx
  - features/awards-portal/**
  - shared/auth/session-proxy.ts                # modify only: add step (5) prelaunch gate (owned by 02, sanctioned serial edit)
  - public/images/awards-portal/**
  - messages/*.json key `awardsPortal` only
  - tests/unit/awards-portal/**, tests/e2e/awards-portal/**
---

# Phase 07 — Awards Portal & Prelaunch (F006)

## Context Links
- Spec: [spec/awards-portal/functional-spec.md](spec/awards-portal/functional-spec.md), [spec/awards-portal/technical-spec.md](spec/awards-portal/technical-spec.md), screens `spec/awards-portal/screens/{SCR-countdown-prelaunch,SCR-homepage,SCR-awards-system,SCR-rules,SCR-community-standards}/spec.md`
- Decisions: [spec/decision-log.md](spec/decision-log.md) — dates configurable via env (Figma dates are examples); Countdown public, guests + Sunners see only Login + Countdown before launch, Admin bypasses (C-09)
- Architecture: [spec/system/architecture.md](spec/system/architecture.md) § Cross-Feature Contracts (`SessionProxy`), C-09
- Upstream: [phase-01](phase-01-foundation-infrastructure.md) (`shared/config/env.ts`: `LAUNCH_AT`, `EVENT_AT` as `Date`), [phase-02](phase-02-auth-and-onboarding.md) (proxy order, public allowlist incl. `/countdown`, role lookup), [phase-03](phase-03-app-shell-and-i18n.md) (`(public)`/`(app)` layouts, `app-routes.ts`)
- Figma `9ypp4enmFmdK3YAFJLIu6C`: Countdown `2268:35127`, Homepage `2167:9026`, Hệ thống giải `313:8436`, Thể lệ `3204:6051`, Tiêu chuẩn cộng đồng `1161:8944`
- Next.js 16 docs: `node_modules/next/dist/docs/` (proxy, dynamic rendering / `connection()`, cache components, `next/image`, static assets)

## Overview
- Priority: P1
- Status: completed (2026-11-22). Delivered-vs-planned and open items: see Delivery Notes below.
- Description: Prelaunch gate (pure `isPrelaunch` + proxy step with admin bypass), public Countdown page, Homepage, Hệ thống giải (sticky left anchor menu), static Thể lệ and Tiêu chuẩn cộng đồng pages, single awards data module.

## Key Insights
- Owns the **prelaunch half of C-09**: phase 02 owns proxy order + allowlist (`/login`, `/auth/callback`, `/countdown`); this phase adds step (5) only. Step (4) already sent guests to `/login`, so step (5) sees signed-in users only.
- Decision overrides spec D002: before `LAUNCH_AT` non-admins see **only Login + Countdown** (Awards page NOT allowlisted). Countdown "award info" link is therefore hidden while prelaunch (or removed) — no link into a gated page.
- BR-002: "prelaunch" is derived from server time vs `LAUNCH_AT`, never stored. Phase 02 proxy reads DB role **only while prelaunch** → zero per-request DB cost after launch.
- DEC-001: after launch, `/countdown` → `/` (handled inside the gate step, also for guests since `/countdown` is allowlisted before step 4 — gate must run for `/countdown` regardless of session).
- FR-401/BR-001: countdown uses server time; client computes offset `serverNow − Date.now()` once, ticks each minute, clamps at 0 (never negative). Pages that read `now` must render dynamically (check Next 16 `connection()` / cache-components rules in docs).
- D005: Homepage counts down to `EVENT_AT`; after it shows `00 00 00` and hides "Coming soon"/"Sắp diễn ra" (D006 typo fix). Figma event date/venue text (26/12/2025, Âu Cơ Art Center) formatted from `EVENT_AT` where it is a date; venue stays copy.
- BR-003: 6 awards (name, short + long description, quantity, value; Signature 2025 – Creator has two values) live in ONE typed module read by Homepage and Awards page. Localized text via message keys referenced by award `slug`; numbers in the module.
- D007: Thể lệ and Tiêu chuẩn cộng đồng copy taken verbatim from Figma now, BTC final copy later — stored in `messages/*.json` (`awardsPortal.rules`, `awardsPortal.standards`) so the swap is a JSON edit.
- D008 livestream = text only; D009 mobile anchor menu = horizontal scrollable chip bar.

## Requirements
Functional
- CAP-01: FR-002, FR-201..203, FR-401, FR-601, BR-001, BR-002, DEC-001, US001 — gate redirects non-admin signed-in users on any non-allowlisted path to `/countdown` while `now < LAUNCH_AT`; Admin passes; at/after launch `/countdown` → `/`. Countdown shows DAYS/HOURS/MINUTES to `LAUNCH_AT`, updates per minute without reload, at 0 navigates to `/`.
- CAP-02: FR-101..104, FR-211..216, US002 — hero "ROOT FURTHER", Coming soon + countdown to `EVENT_AT`, time/venue/livestream line, theme article, 6 award cards ("Chi tiết" → `/awards#<slug>`), buttons ABOUT AWARDS → `/awards`, ABOUT KUDOS → `/kudos`, Sun* Kudos banner "Chi tiết" → `/kudos`.
- CAP-03: FR-301..306, US003 — hero + title, sticky left anchor menu (6 items, scroll-to, active by scroll position), 6 blocks with image/name/description/quantity/value (Signature two values), Kudos banner at bottom; invalid hash → top of page.
- CAP-04: FR-311, FR-312, FR-321, FR-603, US004, US005 — static Thể lệ (4 Hero tiers, Secret Box, Kudos Quốc Dân) and Tiêu chuẩn cộng đồng (incl. "Tiêu chuẩn bảo mật"); no user data, no inputs.
- FR-001: all copy vi + en via next-intl.

Non-functional
- Countdown digits: `aria-live="polite"` on minute change only; respects `prefers-reduced-motion`.
- Images in `public/images/awards-portal/` via `next/image` with explicit size; alt text localized; broken image keeps layout (US002 error scenario).
- Static pages server components; only `CountdownTimer` and `AwardsAnchorMenu` are client components. Files < 200 lines.

## Architecture
```
proxy.ts → shared/auth/session-proxy.ts (02)
   (1) matcher (2) refresh session (3) allowlist (4) no session → /login
   (5) [07] prelaunchGateStep({ path, now: new Date(), launchAt: env.LAUNCH_AT, getRole })
            path == /countdown && !isPrelaunch → redirect /
            isPrelaunch && path ∉ {/login,/auth/callback,/countdown} → role = await getRole()  (02 lookup)
                 role == admin → pass ; else → redirect /countdown

features/awards-portal/
  server/prelaunch-gate.ts   isPrelaunch(now, launchAt) ; decidePrelaunchRoute({path, now, launchAt, role}) → 'pass'|'/countdown'|'/'   (pure)
  server/countdown-parts.ts  remainingParts(target, now) → {days, hours, minutes, done} (floor, clamp 0)       (pure, shared client+server)
  data/awards-data.ts        AWARDS: readonly Award[6] {slug, imageSrc, quantity{count, unitKey}, values[{amountVnd, labelKey?}]}
  components/                countdown-timer (client), award-card, award-detail-block, awards-anchor-menu (client),
                             kudos-banner, homepage-hero, event-info, theme-article, static-content-section
app/(public)/countdown/page.tsx  → connection(); <CountdownTimer target=LAUNCH_AT serverNow=now onZero="/"/>
app/(app)/page.tsx               → Homepage (CountdownTimer target=EVENT_AT, onZero=none) + AWARDS cards
app/(app)/awards/page.tsx        → AwardsAnchorMenu + AWARDS blocks (id=slug)
app/(app)/rules, community-standards → static sections from messages
```
- Data flow countdown: server `now` + target ISO → client offset once → `setTimeout` aligned to next minute boundary → re-run `remainingParts`; `visibilitychange` recomputes immediately (tab-hidden edge case); `done` on Countdown page → `router.replace('/')` (proxy then lets user through since launch passed).
- Anchor menu: `IntersectionObserver` on blocks → active slug; click → `scrollIntoView` + `history.replaceState` hash; `position: sticky` desktop, chip bar below `md`.

## Related Code Files
Create
- `features/awards-portal/server/prelaunch-gate.ts`, `features/awards-portal/server/prelaunch-gate-step.ts` (adapter called by session proxy: builds input, returns `NextResponse.redirect` or `null`)
- `features/awards-portal/server/countdown-parts.ts`, `features/awards-portal/data/awards-data.ts`
- `features/awards-portal/components/{countdown-timer,award-card,award-detail-block,awards-anchor-menu,kudos-banner,homepage-hero,event-info,theme-article,static-content-section}.tsx`
- `app/(public)/countdown/page.tsx`, `app/(app)/page.tsx`, `app/(app)/awards/page.tsx`, `app/(app)/rules/page.tsx`, `app/(app)/community-standards/page.tsx`
- `public/images/awards-portal/*` (hero, 6 award images, Kudos banner — exported from Figma)
- Tests: `tests/unit/awards-portal/prelaunch-gate.test.ts`, `tests/unit/awards-portal/countdown-parts.test.ts`, `tests/unit/awards-portal/awards-data.test.ts`, `tests/e2e/awards-portal/prelaunch-gate.spec.ts`, `tests/e2e/awards-portal/portal-pages.spec.ts`

Modify
- `shared/auth/session-proxy.ts` — insert step (5) call to `prelaunchGateStep` (one call site; coordinate serially with 02)
- `shared/ui/app-routes.ts` — add `countdown`, `rules`, `communityStandards` if missing (03-owned; one-line serial edit)
- `messages/vi.json`, `messages/en.json` — `awardsPortal.*` keys (Vietnamese verbatim from Figma; English temporary)

Delete
- `app/page.tsx` (create-next-app default) if phase 01 left it — conflicts with `app/(app)/page.tsx` at `/`.

## Implementation Steps
1. Read `node_modules/next/dist/docs/`: proxy redirect API + matcher, `connection()` / dynamic rendering vs cache components, `next/image` with local assets, route-group root page.
2. `prelaunch-gate.ts` + exhaustive unit tests (table-driven, see Scope Contract) — write tests first.
3. `prelaunch-gate-step.ts`; wire into `session-proxy.ts` step (5) using phase 02's role lookup (only invoked when prelaunch and path not allowlisted). Unknown/failed role lookup → treat as non-admin (fail closed → `/countdown`).
4. `countdown-parts.ts` + unit tests (exact boundaries, past target → zeros + `done`, 59 s → 0 min, multi-day, DST-free offset input).
5. `awards-data.ts` from SCR-awards-system table (Top Talent 10 cá nhân 7.000.000; Top Project 02 tập thể 15.000.000; Top Project Leader 03 cá nhân 7.000.000; Best Manager 01 cá nhân 10.000.000; Signature 2025 – Creator 01 cá nhân hoặc tập thể 5.000.000 cá nhân / 8.000.000 tập thể; MVP 01 15.000.000) + test (6 unique slugs, every slug has vi+en message keys, Signature has 2 values). VNĐ formatting via `Intl.NumberFormat('vi-VN')`.
6. Figma pass (`create_session` on `9ypp4enmFmdK3YAFJLIu6C`; `get_design_context` per frame listed above; export images to `public/images/awards-portal/`). Phase 01 tokens only; no guessed values.
7. `countdown-timer.tsx` (props: `targetIso`, `serverNowIso`, `redirectOnZero?`), Countdown page under `(public)`.
8. Homepage components + `app/(app)/page.tsx`.
9. `awards-anchor-menu.tsx`, `award-detail-block.tsx`, `/awards` page (+ Kudos banner).
10. Rules + Community Standards pages via `static-content-section.tsx` from messages.
11. E2E (env-driven `LAUNCH_AT`/`EVENT_AT` per test server; see Scope Contract), then `typecheck`, `lint`, unit + e2e green.

## Todo List
- [x] Next 16 docs read (proxy, dynamic rendering, images): proxy.md, distDir, next.md read (prelaunch report); `connection()` pattern in `request-time.ts`
- [x] `isPrelaunch` / `decidePrelaunchRoute` + exhaustive unit tests: 120-cell table + request-kind cases, 134 gate tests green
- [x] Proxy step (5) wired with admin bypass: `npm run test:e2e:prelaunch` exit 0, 5 passed / 1 skipped (final code)
- [x] `remainingParts` + tests: `countdown-parts.test.ts` green; file lives in `features/awards-portal/countdown-parts.ts`, not `server/` (see drift D8)
- [x] `awards-data.ts` + test: 6 slugs, vi/en keys 121/121, Signature has 2 values; numbers match SCR-awards-system
- [x] Figma extraction + image assets: 21 webp + 8 svg in `public/images/awards-portal/`, DSEG7 woff2 under `features/awards-portal/fonts/`; pixel diff not run
- [x] Countdown page + timer: `app/(public)/countdown/page.tsx`; redirect at zero verified on prelaunch server; desktop and mobile screenshots taken
- [x] Homepage: `app/(app)/page.tsx`; `portal-pages.spec.ts` 12/12
- [x] Hệ thống giải with anchor menu: position-based menu (drift D9); jump-to-top and hash tests pass
- [x] Thể lệ + Tiêu chuẩn cộng đồng: Thể lệ drawn as 553px right panel (drift D1); both pages have no form or input
- [x] E2E gate + pages: full e2e 84 passed / 5 skipped (exit 0, fresh dev server); prelaunch 5 passed / 1 skipped

## Success Criteria
- [x] SC-001..SC-005 (technical spec) covered: gate both directions (unit table + prelaunch e2e); client clock skew ignored (`page.clock` test, fails with offset set to 0); auto-switch at 0 (prelaunch e2e); one data source (`AWARDS`); no `<input>`/`<form>` on static pages (e2e).
- [x] Changing `LAUNCH_AT`/`EVENT_AT` flips Countdown ↔ Homepage: evidenced by two env profiles (dev server with past `LAUNCH_AT`, prelaunch server with `LAUNCH_AT` = now + 30 d). No single test toggles env mid-run.
- [x] Admin reaches `/` and `/admin/overview` before launch; User redirected to `/countdown`; guest sees `/countdown` and `/login` only (e2e). Admin on `/kudos` and the rest of `/admin/*` is covered by the unit table only.
- [x] After launch no DB role lookup in the proxy: `getRole` not called (adapter unit test and pure-function test).
- [x] Awards numbers match SCR-awards-system table (`awards-data.test.ts`; reviewer re-checked against research table).

## Delivery Notes (2026-11-22)

Evidence sources: `spec/decision-log.md` (sessions 2026-11-17, 2026-11-22), `reports/implementer-261117-phase-07-prelaunch-gate.md`, `reports/implementer-261117-phase-07-portal-pages.md`, `reports/tester-261122-phase-07-full-run.md`, `reports/reviewer-261122-phase-07.md`, `evidence/phase-07/temper-results.json`.

Final verification (final code): unit 600/600 · integration 94/94 subset (kudos-authoring, hearts) · tsc 0 · lint 0 · full e2e 84 passed / 5 skipped · prelaunch e2e 5 passed / 1 skipped · review 0 critical, 2 warnings handled.

### Delivered vs planned (drift log)
| # | Planned | Delivered | Reason | Cost |
|---|---------|-----------|--------|------|
| D1 | Thể lệ as a page with a drawer | `/rules` drawn as 553px right panel on a darkened key visual, in normal page flow (min-height = viewport − header). "Đóng" goes back, "Viết KUDOS" goes to `/kudos` | Figma 3204:6051, decision 2026-11-17 | Footer follows the panel; no scroll drawer |
| D2 | Floating pen / Kudos logo widget on Homepage | Deferred, not built | Figma 5022:15169; decision 2026-11-17 (F003 D014, F002 D003) | Open item O2 |
| D3 | "Digital Numbers" countdown font | DSEG7 Classic (SIL OFL 1.1), self-hosted woff2, loaded only by the countdown digit component | Font missing; decision 2026-11-17 | License file added |
| D4 | Prelaunch gate redirects every blocked request with 307 | Page loads redirect to `/countdown`. Server Actions, `/api/*` and non-GET get JSON 403 `{code:"prelaunch"}` | A 307 makes `fetch` replay the POST on `/countdown`; decision 2026-11-17 | Client code must handle a JSON 403 |
| D5 | Second `next dev` for prelaunch e2e | `next build` + `next start -p 3100` via `playwright.prelaunch.config.ts` (`npm run test:e2e:prelaunch`) | `next dev` dir lock; a custom `distDir` dirties `tsconfig.json` | About 10 s build per run; shares `.next` with `test:prod` |
| D6 | Write gate tied to the page gate | Write window `LAUNCH_AT ≤ now < EVENT_END_AT` (`isEventWritingOpen`), applied to Admin too. Reuses `WRITING_CLOSED` | Server Actions bypass the page gate; decision 2026-11-22 | Admin cannot write before launch; message wording open (O3) |
| D7 | Allowlist `/login`, `/auth/callback`, `/countdown` | `/access-denied` added to the allowlist | Step 4b self-fetch needs it; decision 2026-11-15 | None |
| D8 | `countdown-parts` in `server/` | `features/awards-portal/countdown-parts.ts` (pure, used by client and server). `request-time.ts` added for server-only `connection()` + `Date.now()` | Client bundle must import it; `react-hooks/purity` rejects `Date.now()` in a Server Component body | One extra file |
| D9 | Anchor menu on IntersectionObserver | rAF scroll-position logic (last block past 25 % line) | IO fires no callback on jumps (Home, back-to-top), so the highlight went stale | Same behaviour; more scroll code |
| D10 | Menu labels = award names | New `awards.<slug>.menu` keys | Figma shows "Signature 2025 Creator" and "MVP" | 6 extra keys |
| D11 | Figma is desktop only | Phone sizes chosen for below `sm`/`md`/`xl` (countdown tiles 40×64, titles 32/40, banner stacks) | No mobile design | Not in Figma; design should look at it |
| D12 | Normal e2e assumes launch has passed | Launched-server `globalSetup` (`tests/e2e/global-setup-require-launched-server.ts`) stops the run if guest `/countdown` returns 200 | Review W2 (2026-11-22) | A future `LAUNCH_AT` now fails fast with a clear message |
| D13 | Prelaunch allowlisted paths open to all writes | Accepted: `choose-department` action and locale switch still run pre-launch via action id | Review W1, decision 2026-11-22: own profile only, sign-out and locale must stay open | Open item O5 |

### Scope notes (not drift, but affects users)
- First-login Sunners before launch land on `/countdown` and cannot reach `/onboarding/department` until launch. Consistent with "only Login + Countdown"; the onboarding flow waits until launch.
- The gate is a convenience wall. Data protection stays in `requireSunner()` and write-window checks.
- Ship-time docs: `docs/code-standards.md` needs the `test:e2e:prelaunch` row (not done, O13).

### Open items carried forward
Owner names are roles on this team. "Done when" is the check that closes the item.

| ID | Item | Owner | Done when | Blocks |
|----|------|-------|-----------|--------|
| O9 | ~~Full integration suite after the write-window change~~ **Closed 2026-11-22:** `npm run test:integration` 35 files, 270/270, exit 0 on final code (recorded in `evidence/phase-07/temper-results.json`) | orchestrator | done | — |
| O1 | BTC final copy for Thể lệ, Tiêu chuẩn cộng đồng, and English (current EN is a temporary translation, D007). Open since 2026-11-08 | BTC via user | BTC copy merged as JSON edits in `messages/*.json`; no code change | Final content sign-off |
| O2 | Floating widget button (Figma 5022:15169) | user + BTC | BTC decides build or drop; decision recorded in decision log | Homepage completeness |
| O3 | `WRITING_CLOSED` wording shown pre-launch ("Sự kiện đã kết thúc…") for admin or crafted requests | phase 04 owner + BTC copy | Pre-launch message key exists and an integration test asserts it | Copy only |
| O4 | Heart button shows `EVENT_ENDED` to Admin pre-launch (review S1) | phase 06 owner | Neutral pre-launch reason and a test for it | Copy only |
| O5 | `choose-department` action and any Server Action run pre-launch (review W1). Accepted 2026-11-22 | user (product) | Either recorded as accepted (done) or a guard in `choose-department-action` plus test if BTC wants it blocked | Policy only |
| O6 | "Hoặc" in #2E3940 on #00101A is about 1.5:1, fails WCAG AA. Figma is authoritative | design + BTC | Colour confirmed or changed in Figma, decision logged | Accessibility |
| O7 | Slack handle "duong.thi.thuy.an" in Tiêu chuẩn cộng đồng (FR-603, copy not user data) | BTC via user | Kept or removed as a JSON edit, decision logged | Privacy review |
| O8 | Real-browser minute-tick latency near a boundary not measured (review S3 says the client lags the server by network and hydration time) | tester | Measured in a real browser at a minute boundary; numbers in `evidence/phase-07/` | Accuracy claim only |
| O10 | FR-203 mutation check not run (reasoning only) | tester | Throwaway branch: test fails with `redirectOnZero` removed | Test trust |
| O11 | Distinct log tag for role-lookup failures so an outage is not read as "admin blocked" (review S2) | phase 07 implementer | Log tag added, test asserts it | Ops clarity |
| O12 | Note on client clock lag in `use-server-clock-now.ts` header (review S3) | phase 07 implementer | Comment present | None |
| O13 | Docs drift: `docs/features/F006_AwardsPortal/technical-spec.md` still lists `/awards` as allowed pre-launch (DEC-001 TBD) and says the countdown links to `/awards`. `docs/development-roadmap.md` row 07 still reads "Chưa làm". `docs/project-changelog.md` has no phase 07 entry. `docs/code-standards.md` lacks the prelaunch test row | doc-writer, delivery-tracker | Grep shows no conflicting statement; roadmap and changelog updated | Documentation rule |
| O14 | Next.js feedback candidate (`connection()` docs vs `react-hooks/purity` lint) drafted, not sent | user | Sent or dropped by user | None |

- Phase 13/14 and phase 11 are unaffected. Admin bypass covers prelaunch rehearsal.

## Scope Contract
- **Changed:** prelaunch gate (pure fn + proxy step), countdown logic, awards data module, 5 pages, `awardsPortal` messages, image assets.
- **Impacted:** every request via `session-proxy.ts` (step 5); root `/` route; footer/header links to `/awards`, `/rules`, `/community-standards` (03).
- **Will verify:** unit — `decidePrelaunchRoute` table: {before, exactly at, after `LAUNCH_AT`} × {admin, user, null role} × {`/`, `/kudos`, `/awards`, `/admin/overview`, `/countdown`, `/login`, `/auth/callback`} incl. admin bypass, `/countdown`→`/` after launch, and `getRole` never called after launch or on allowlisted paths; `remainingParts` boundaries/clamp; awards data invariants. E2E — gate redirects (user, admin, guest) with future and past `LAUNCH_AT`; auto-redirect at 0 (`LAUNCH_AT` = now+~65 s, Playwright clock); client clock skew via `page.clock`; Homepage links; anchor menu active state + hash; static pages have no form.
- **Deliberately skipped:** session/allowlist internals (phase 02, fully tested there); shell layouts (03); pixel-perfect visual diff (manual Figma compare).
- Gate touches authorization path (proxy, admin bypass) → safety-critical: run the full gate unit table and full gate e2e group plus phase 02 proxy e2e group every time.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Gate lets User through before launch (bypass bug) | M | H | Table-driven unit tests; fail closed on role lookup error; e2e as User |
| Proxy runtime can't read DB role | M | M | Phase 02 fallback (service-role REST); lookup only while prelaunch |
| Static/cached render freezes `serverNow` | M | M | `connection()` / dynamic per docs on Countdown + Homepage; e2e skew test |
| `/countdown` ↔ `/` redirect loop near boundary (server vs client clock) | L | M | Client navigates only when server-offset clock ≥ target; proxy is the authority; at worst one extra redirect then stable |
| Route conflict `app/page.tsx` vs `(app)/page.tsx` | M | L | Delete default page (step listed) |
| Final BTC copy late | H | L | Copy in messages JSON; swap without code change |

Rollback: remove step (5) call from `session-proxy.ts` (one line) → site behaves as post-launch; pages additive, revert per file. No data changes.

## Security Considerations
- Gate is a convenience wall, not data protection: every Sunner page/action still requires `requireSunner()` (02/03); admin bypass checked from DB role, never from a cookie/claim the client controls.
- Fail closed: role lookup error while prelaunch → `/countdown`.
- Countdown page public: exposes only `LAUNCH_AT` (intended); no user data. Static pages render no user input or PII (FR-603).
- `LAUNCH_AT`/`EVENT_AT` read server-side from `env.ts`; passed to client only as ISO strings.

## Next Steps
- Phase 04/05 pages under `(app)` automatically gated by step (5).
- BTC delivers final Thể lệ / Tiêu chuẩn cộng đồng / English copy → JSON edit only.
- Phase 13/14 none; phase 11 Spotlight unaffected (admin bypass covers prelaunch rehearsal).
