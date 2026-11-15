---
phase: 07
feature: F006
priority: P1
status: pending
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
- Status: pending
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
- [ ] Next 16 docs read (proxy, dynamic rendering, images)
- [ ] `isPrelaunch` / `decidePrelaunchRoute` + exhaustive unit tests
- [ ] Proxy step (5) wired with admin bypass
- [ ] `remainingParts` + tests
- [ ] `awards-data.ts` + test
- [ ] Figma extraction + image assets
- [ ] Countdown page + timer
- [ ] Homepage
- [ ] Hệ thống giải with anchor menu
- [ ] Thể lệ + Tiêu chuẩn cộng đồng
- [ ] E2E gate + pages

## Success Criteria
- SC-001..SC-005 of technical spec pass (gate both directions, client clock skew ignored, auto-switch at 0, one data source, no `<input>`/`<form>` on static pages).
- Changing `LAUNCH_AT`/`EVENT_AT` in env (no code change) flips Countdown ↔ Homepage and retargets the Homepage countdown.
- Admin reaches `/`, `/kudos`, `/admin/*` before launch; User redirected to `/countdown`; guest sees `/countdown` and `/login` only.
- After launch no DB role lookup happens in the proxy (verified by unit test on step adapter: `getRole` not called).
- Awards numbers match SCR-awards-system table exactly.

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
