---
phase: 03
feature: F002
priority: P0
status: pending
depends_on: [01]
file_ownership:
  - app/(app)/layout.tsx                        # phase 13 passes bell into the slot (sanctioned one-line edit)
  - app/(public)/layout.tsx
  - app/admin/layout.tsx, app/admin/page.tsx
  - app/not-found.tsx, app/forbidden.tsx
  - features/app-shell/**
  - shared/i18n/resolve-locale.ts, shared/i18n/set-locale-action.ts
  - shared/i18n/request.ts                      # modify only: plug resolveLocale (owned by 01, serial edit)
  - shared/ui/app-routes.ts
  - messages/*.json keys `shell`, `errors` only
  - tests/unit/app-shell/**, tests/e2e/app-shell/**
---

# Phase 03 — App Shell & i18n (F002)

## Context Links
- Spec: [spec/app-shell/functional-spec.md](spec/app-shell/functional-spec.md), [spec/app-shell/technical-spec.md](spec/app-shell/technical-spec.md), screens `spec/app-shell/screens/{SCR-app-layout,SCR-admin-layout,SCR-error-403,SCR-error-404}/spec.md`
- Decisions: [spec/decision-log.md](spec/decision-log.md) § Default policy — admin top bar, footer content, tablet = scaled desktop
- Architecture: [spec/system/architecture.md](spec/system/architecture.md) § Module Boundaries (F002), § Cross-Feature Contracts (bell slot)
- Foundation: [phase-01-foundation-infrastructure.md](phase-01-foundation-infrastructure.md) (next-intl base, tokens); auth helpers from [phase-02-auth-and-onboarding.md](phase-02-auth-and-onboarding.md)
- Figma `9ypp4enmFmdK3YAFJLIu6C`: header/footer from Homepage `2167:9026` and Live board `2940:13431`; admin top bar from Admin `620:7712`; shared atoms from Components `39:28`; 404/403 frames — locate via `get_metadata` on the file pages (spec has no frame id)
- Next.js 16 docs: `node_modules/next/dist/docs/` (layouts, route groups, `not-found`, `forbidden`, cookies in server actions)

## Overview
- Priority: P0
- Status: pending
- Description: Sunner layout (header, footer, mobile collapsed menu, account menu, language switcher, bell slot), public layout (logo + language switcher only), admin layout (top bar 4 items), 404/403 pages, cookie-based locale resolution.

## Key Insights
- No C-id is owned here; this phase **implements the bell-slot contract** (architecture § Cross-Feature Contracts) and consumes C-09/C-20 results from phase 02.
- Decisions applied: admin menu = **horizontal top bar** "Overview · Review content · User · Settings" (label "User", resolves spec "Role vs User"); footer = logo + About SAA 2025 · Award Information · Sun* Kudos · Tiêu chuẩn chung + "Bản quyền thuộc về Sun* © 2025" (resolves D006); tablet = desktop layout scaled (collapse only below `md` 768px).
- Spec defaults adopted (decision-log default policy): D001 no URL prefix; D002 public pages show language switcher only; D003 FAB not in shell (phase 05); D004 locale in cookie only; D005 404 renders the shell when signed in, otherwise bare page with Login button; 403 bare page with Home button.
- Role-based hiding of "Admin Dashboard" is cosmetic (BR-002); real gate is `requireAdmin()` in `app/admin/layout.tsx` **and** in every admin action/handler (phases 08/11/14).
- Layouts don't re-run on client navigation → shell never acts as a guard beyond the layout call.
- Bell slot: `AppHeader` takes `bellSlot?: ReactNode`; renders nothing until phase 13 passes `<NotificationBell />` from `app/(app)/layout.tsx`.

## Requirements
Functional
- CAP-01: FR-101..105, FR-402, US001 — header logo + 3 links (About SAA 2025 → `/`, Award Information → `/awards`, Sun* Kudos → `/kudos`), active link highlight by pathname prefix, footer on every signed-in page, mobile collapsed menu closes on select / outside click / Escape.
- CAP-02: FR-201, FR-601, BR-002, DEC-001, US003 — avatar (initial fallback, name ellipsis) → menu Profile (`/profile`), Admin Dashboard (admin only → `/admin/overview`), Logout (phase 02 `signOut`; on failure stay + toast "Không thể đăng xuất, vui lòng thử lại.").
- CAP-03: FR-001, FR-002, FR-202, FR-401, BR-001, US002 — switcher shows current locale, options Tiếng Việt / English; `setLocale` (Zod `vi|en`) writes cookie `NEXT_LOCALE` (name from phase 01 `locales.ts`, max-age 365 d, `sameSite=lax`, `path=/`) then `router.refresh()`; resolution order cookie → `Accept-Language` (vi/en) → `vi`; invalid cookie ignored.
- CAP-04: FR-301..303, FR-602, US004 — admin top bar with 4 items (`/admin/overview`, `/admin/review`, `/admin/users`, `/admin/settings`), active item, link back to Sunner area (`/`), account menu + language switcher; `/admin` redirects to `/admin/overview`.
- CAP-05: FR-351..353, FR-603, DEC-002, US005, US006 — localized 404 (status 404) and 403 (status 403), no internal details.

Non-functional
- Keyboard accessible menus (focus trap not required; Escape closes, focus returns to trigger), `aria-current` on active links, visible focus ring.
- No client fetch for user data: user/profile resolved in server layout and passed as props.
- Files < 200 lines.

## Architecture
```
app/layout.tsx (01: html lang, NextIntlClientProvider)
├─ app/(public)/layout.tsx  → PublicHeader(logo, LanguageSwitcher)  ─ /login (02), /countdown (07)
├─ app/(app)/layout.tsx     → requireSunner() (02) → AppHeader(user, isAdmin, bellSlot) + main + AppFooter
│                              pages: / , /awards, /rules, /community-standards (07), /kudos… (04/05), /profile (12)
├─ app/admin/layout.tsx     → requireAdmin() (02) → AdminTopBar(user) + main     pages: 08/11/14
├─ app/not-found.tsx        → getSessionUser() ? AppHeader+NotFoundPanel+AppFooter : NotFoundPanel(login CTA)
└─ app/forbidden.tsx        → ForbiddenPanel(home CTA)

Locale: request → shared/i18n/request.ts → resolveLocale({cookie, acceptLanguage}) → messages/<locale>.json
Switch: LanguageSwitcher (client) → setLocaleAction (server action) → cookie → router.refresh()
```
- `shared/ui/app-routes.ts`: single typed route map used by header, footer, admin bar, and later phases (no hard-coded paths elsewhere).
- Header/footer/admin bar are server components; only `MobileNavMenu`, `AccountMenu`, `LanguageSwitcher` are client components.

## Related Code Files
Create
- `app/(app)/layout.tsx`, `app/(public)/layout.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx` (redirect), `app/not-found.tsx`, `app/forbidden.tsx`
- `features/app-shell/components/app-header.tsx`, `app-header-nav-links.tsx` (client: active state via `usePathname`), `mobile-nav-menu.tsx`, `account-menu.tsx`, `user-avatar.tsx`, `app-footer.tsx`, `public-header.tsx`, `admin-top-bar.tsx` (client links + active), `language-switcher.tsx`, `error-panel.tsx` (shared by 404/403)
- `shared/ui/app-routes.ts`
- `shared/i18n/resolve-locale.ts` (pure, BR-001), `shared/i18n/set-locale-action.ts`
- Tests: `tests/unit/app-shell/resolve-locale.test.ts`, `tests/unit/app-shell/set-locale-schema.test.ts`, `tests/e2e/app-shell/navigation-and-language.spec.ts`, `tests/e2e/app-shell/admin-frame-and-errors.spec.ts`

Modify
- `shared/i18n/request.ts` (call `resolveLocale` with `cookies()` + `headers().get('accept-language')`)
- `messages/vi.json`, `messages/en.json` (`shell`, `errors` keys; Vietnamese copy verbatim from Figma)

Delete — none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/`: route groups + nested layouts, `not-found.tsx`, `forbidden.tsx` / `forbidden()` (and required config flag), setting cookies in server actions, `usePathname`. Read next-intl docs for cookie-only (no routing) setup on Next 16.
2. `resolve-locale.ts` + unit tests (cookie valid/invalid, `Accept-Language` q-values `en-US,en;q=0.9` → `en`, `fr` → `vi`). Wire into `request.ts`.
3. `set-locale-action.ts` (Zod enum, set cookie, return `{ok}`) + schema test (`fr` rejected, cookie untouched).
4. `app-routes.ts` route map.
5. Figma pass (`create_session` on `9ypp4enmFmdK3YAFJLIu6C`; `get_design_context` on header/footer nodes inside `2167:9026`, admin bar inside `620:7712`, menus/dropdowns in `39:28`). Use phase 01 tokens only; no guessed values.
6. Build `app-header.tsx`, `app-header-nav-links.tsx`, `mobile-nav-menu.tsx` (below `md`), `user-avatar.tsx`, `account-menu.tsx` (admin item by `isAdmin` prop; logout via phase 02 action with `useTransition`, error toast), `language-switcher.tsx`, `app-footer.tsx`.
7. `app/(app)/layout.tsx`: `const { profile } = await requireSunner()`; `isAdmin = profile.role === 'admin'`; render header (no `bellSlot` yet) + footer.
8. `public-header.tsx` + `app/(public)/layout.tsx` (logo + switcher, no nav, D002).
9. `admin-top-bar.tsx` + `app/admin/layout.tsx` (`await requireAdmin()` first, before any markup) + `app/admin/page.tsx` redirect.
10. `error-panel.tsx`, `app/not-found.tsx` (shell when signed in, D005), `app/forbidden.tsx`; enable forbidden flag in `next.config.ts` if docs require (coordinate: one-line edit, phase 01 file).
11. E2E: nav links + active state; mobile viewport 375 collapsed menu open/close (outside click); language switch persists across reload; `Accept-Language: en` first visit → English; user sees no Admin Dashboard item; user GET `/admin/overview` → 403 page without admin bar HTML; admin sees 4-item bar; unknown path → 404 with no stack trace.
12. `typecheck`, `lint`, unit + e2e green.

## Todo List
- [ ] Next 16 + next-intl docs read (forbidden flag, cookie-only)
- [ ] `resolveLocale` + request wiring + tests
- [ ] `setLocale` action + test
- [ ] Route map
- [ ] Figma extraction for header/footer/admin bar/menus/error pages
- [ ] Header, nav links, mobile menu, account menu, avatar, switcher, footer
- [ ] `(app)`, `(public)`, `admin` layouts
- [ ] 404 / 403 pages
- [ ] E2E navigation, language, admin frame, error pages

## Success Criteria
- SC-001..SC-005 of technical spec pass.
- Every signed-in page shows header + footer; footer content matches decision-log exactly.
- Admin bar shows exactly Overview · Review content · User · Settings with correct active state.
- At 768–1199 px layout equals desktop scaled (no collapsed menu); below 768 px collapsed menu.
- No layout performs its own role check other than calling phase 02 guards.

## Scope Contract
- **Changed:** layouts, shell components, error pages, locale resolution/switching, route map.
- **Impacted:** every page (layouts wrap them), `request.ts` (all translations), admin area access path (layout calls `requireAdmin`).
- **Will verify:** unit (locale resolution, setLocale schema); e2e (navigation, mobile menu, language persistence, admin 403/allow, 404/403 content).
- **Deliberately skipped:** guard internals (owned and fully tested in phase 02); bell content (phase 13); page bodies (07/05/12).
- Touches the admin authorization path (layout guard call) → run the admin-access e2e group in full.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| `forbidden()` requires experimental flag / behaves differently | M | M | Step 1; fallback: `requireAdmin` redirects to a `/forbidden` page rendered with status 403 |
| next-intl cookie-only setup differs on Next 16 | M | M | Step 1 docs; phase 01 smoke already loads messages |
| Layout guard assumed to protect client navigations | M | H | Documented; admin actions/handlers each call `requireAdmin` (phases 08/11/14 checklist) |
| Hydration mismatch on active link / locale | L | L | Active state computed client-side in small client component only |
| Missing copy in English | H | L | `en.json` mirrors keys; temporary English from Figma/BTC; missing-key test via next-intl `onError` in dev |

Rollback: layouts are additive files; revert per file. No data changes.

## Security Considerations
- Admin layout calls `requireAdmin()` before rendering anything; 403 page contains no admin markup (SC-004).
- Error pages never render `error.message`/stack (FR-603).
- `setLocale` accepts only `vi|en`; cookie not `httpOnly`-sensitive (non-secret) but set server-side with `sameSite=lax`.
- User data passed to client components limited to display name, avatar URL, `isAdmin` boolean.

## Next Steps
- Phase 07 places homepage/awards/rules/community-standards under `(app)` and `/countdown` under `(public)`.
- Phases 04/05/12 render inside `(app)`; phases 08/11/14 add pages under `app/admin/*` and must still call `requireAdmin()` in every action.
- Phase 13 edits `app/(app)/layout.tsx` to pass `bellSlot={<NotificationBell />}` (also admin layout if spec requires).
