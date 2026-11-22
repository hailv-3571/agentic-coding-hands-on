# Implementer — Phase 07 portal pages (F006)

Scope: the 5 awards-portal pages, pure countdown logic, the single awards module, `awardsPortal` messages, e2e spec, screenshots. Gate files (`features/awards-portal/server/**`, `session-proxy.ts`, `app-routes.ts`, gate tests) not touched. No git operations.

## Scope Contract
- **Changed:** `remainingParts` / `msUntilNextMinuteChange`, `AWARDS` module, 5 pages, portal components, `awardsPortal` messages (vi/en).
- **Impacted:** `/` (placeholder replaced). Other phases' e2e that open `/` (app-shell header spec, smoke) now render the real homepage. Header and footer are unchanged.
- **Will verify:** unit tests (countdown boundaries, awards data + message keys); e2e `portal-pages.spec.ts` on :3000; eslint; a scoped type check; screenshots compared against Figma.
- **Deliberately skipped:** gate unit/e2e (other agent); integration suite; the whole e2e suite (per brief); `/countdown` render on :3000 (the gate sends it to `/`, as intended).

## Files
Created
- `features/awards-portal/countdown-parts.ts`: pure, shared by client and server. `remainingParts`, `msUntilNextMinuteChange`.
- `features/awards-portal/request-time.ts`: server-only. `await connection(); Date.now()`, same pattern as `isKudoWritingOpen`.
- `features/awards-portal/data/awards-data.ts`: `AWARDS`, unit/note keys, `formatAwardQuantity`, `formatAwardAmount`.
- `features/awards-portal/components/` (21 files, all under 100 lines):
  - Countdown: `countdown-timer` (client), `use-server-clock-now` (client hook), `countdown-digit-tile` (loads DSEG7 via `next/font/local`).
  - Shared: `portal-styles`, `portal-icon`, `portal-keyvisual-background`, `portal-section-header`, `award-thumbnail`.
  - Homepage: `homepage-hero`, `homepage-event-info`, `homepage-theme-article`, `homepage-awards-section`, `award-card`, `kudos-banner`.
  - Awards page: `awards-anchor-menu` (client), `award-detail-block`, `award-prize-facts`.
  - Thể lệ: `rules-panel`, `rules-kudos-rewards`, `rules-close-button` (client).
  - Standards: `community-standards-content`.
- Pages: `app/(public)/countdown/page.tsx`, `app/(app)/awards/page.tsx`, `app/(app)/rules/page.tsx`, `app/(app)/community-standards/page.tsx`.
- Tests: `tests/unit/awards-portal/countdown-parts.test.ts`, `tests/unit/awards-portal/awards-data.test.ts`, `tests/e2e/awards-portal/portal-pages.spec.ts`.

Modified
- `app/(app)/page.tsx`: placeholder replaced by the homepage.
- `messages/vi.json`, `messages/en.json`: new key `awardsPortal` only (+177 lines each, insert-only).

Every page that reads the session or the clock exports `instant = false`, calls `requireSunner()` (the `(app)` pages, per code standards), and reads the clock through `readRequestTimeMs()`.

## RED → GREEN evidence
`npx vitest run tests/unit/awards-portal/countdown-parts.test.ts tests/unit/awards-portal/awards-data.test.ts`

| Step | Result |
|------|--------|
| Tests written first | RED: 2 files failed, "Cannot find package '@/features/awards-portal/countdown-parts'" and "'…/data/awards-data'" (modules absent) |
| `remainingParts` + `awards-data.ts` added | awards-data RED 3/8: `Cannot read properties of undefined (reading 'awards')` (no messages yet) |
| `msUntilNextMinuteChange` tests vs. module without it | RED 5 failed / 13 passed: `msUntilNextMinuteChange is not a function` |
| `menu` label key required | RED 2 failed: `top-talent.menu: expected undefined` |
| Final | **GREEN: 2 files, 26 tests passed** |

Behaviour fixes proven in e2e:
- **Clock-skew test discriminates.** With the hook mutated to `offset = 0`, it fails ("Expected <= 1, Received 576000" min). Restored hook (byte-identical): passes.
- **Anchor menu "jump back to top".** The test fails on the old IntersectionObserver logic (Top Talent never re-activates) and passes on the position-based logic.

## Other checks
- eslint on all my files (incl. the e2e spec): clean.
- Type check: `next dev` was running on :3000, so I skipped `npm run typecheck` / project-wide `tsc`. I ran a read-only scoped `tsc` instead: scratch tsconfig extending the project, `incremental: false`, `noEmit`, only my files + the e2e spec + `.next/dev/types`; 48 project files checked, nothing written to the repo. Exit 0. **Please run `npm run typecheck` once dev is stopped.**
- Browser console: no errors or warnings on `/`, `/awards`, `/rules`, `/community-standards` at 1440 and 375. Before the fix there were two `next/image` aspect warnings (rounding); fixed by passing intrinsic file dimensions.

## E2E
`npx playwright test tests/e2e/awards-portal/portal-pages.spec.ts` → **12 passed (16.6 s)** on the :3000 dev server (gate live, LAUNCH_AT past). Covers:
- Homepage sections; ABOUT AWARDS (clicked) → `/awards`; ABOUT KUDOS and banner "Chi tiết" → `/kudos`.
- "Sắp diễn ra" shown only while time is left.
- Date shown as `dd/MM/yyyy`.
- Card "Chi tiết" → `/awards#top-project`, block in viewport, its menu item `aria-current` (only one).
- Server-clock countdown with the device clock set ±400 days (`page.clock.setFixedTime` + `visibilitychange` recompute).
- Menu click → hash + active item.
- Jump back to top → first item active.
- Unknown hash → `scrollY` 0, no page errors.
- Signature shows 2 values + "Hoặc"; Best Manager has no note.
- Switch to EN → headings and labels change.
- Rules: 4 tier images, 6 badges, no `form/input/textarea/select` in `main`; Viết KUDOS → `/kudos`; Đóng → previous page, or `/` when opened directly.
- Standards: 10 rules, "Tiêu chuẩn bảo mật" h2, no form/input.
- 375 px: no horizontal page scroll on all 4 pages; chip bar works.
- `/countdown` itself is not reachable on a launched server. Its timer logic is unit-tested, and the same `CountdownTimer` is exercised on the homepage.

## Screenshots
`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-07/`: this is where the phase-06 screenshots live; there is no repo-root `evidence/`.
- `homepage-{desktop-1440x900,mobile-375x812}.png`
- `awards-{desktop-1440x900,mobile-375x812}.png`
- `awards-anchor-signature-{desktop-1440x900,mobile-375x812}.png`
- `rules-{desktop-1440x900,mobile-375x812}.png`
- `community-standards-{desktop-1440x900,mobile-375x812}.png`

All are full page except the anchor shots. The temporary capture specs were deleted.

Figma comparison:
- Matches: hero, countdown (DSEG7 tiles), event info, CTAs, theme article, 3×2 grid, Kudos banner, Awards KV/title/menu/alternating blocks/prize rows (the Signature unit even wraps "Cá / nhân / hoặc / tập thể" as drawn), Thể lệ panel, Standards page.
- Fixed after comparing:
  - Kudos banner text was unreadable over the gold streak on phones; added a scrim below `xl`.
  - "NGƯỜI GỬI KUDOS…" heading rendered at weight 400 (type tokens set the weight); now 700, verified with computed style.
  - Chip bar stayed on MVP after a jump to the top (anchor logic, above).
  - Two `next/image` aspect warnings.

## Deviations (and why)
1. **Content column = the header's inner box** (`max-w-360 px-36`): 1152 wide at 1440, 1224 in a 1512 frame, x=144 in both, matching Figma's alignment with the header.
2. **Phone sizes** (Figma is desktop only):
   - Countdown tiles 40×64, digit 38 px below `sm`; hero size from `sm`; page size from `md`.
   - 57/45 px titles drop to 32/40.
   - Theme body is 16/24 below `md`.
   - Banner stacks, with the logo below the text below `xl`.
3. **Anchor menu is position-based** (rAF-throttled scroll/resize: last block past a line at 25 % of the viewport), not IntersectionObserver. IntersectionObserver gets no callback on jumps (Home key, back-to-top), so the highlight went stale. Observable behaviour is otherwise the same.
4. **Menu labels** come from new `awards.<slug>.menu` keys: Figma shows "Signature 2025 Creator" and "MVP", which differ from the award names.
5. **Thể lệ panel sits in normal page flow** (min-height = viewport − header) instead of a scrolling drawer. The app footer follows it.
6. **`request-time.ts` helper:** `react-hooks/purity` (eslint-config-next) rejects `Date.now()` in a Server Component body even after `await connection()`.
7. **Event date** uses `toAdminZone` (ADMIN_TIMEZONE, default Asia/Ho_Chi_Minh, the single event zone per C-14).
8. **"Hoặc"** is drawn in #2E3940 as in Figma (see concerns).

## Concerns / open items
- **Low contrast:** "Hoặc" in #2E3940 on #00101A is roughly 1.5:1 (WCAG AA fails), but Figma is authoritative. BTC or design should confirm.
- **Not visually verified:** the `/countdown` page layout and its large tile size (76.8×122.88) on :3000. Check it on a prelaunch server (the gate agent's `prelaunch-server.ts`?).
- **Specs I didn't run:** other phases' e2e that open `/` (`app-shell/signed-in-header-and-menus.spec.ts`, `smoke.spec.ts`) now hit the real homepage. Header and footer are unchanged, so they should pass, but please run them.
- **PII question:** the Standards contact line includes the Slack handle "duong.thi.thuy.an" (verbatim Figma copy). It is copy, not user data, but please confirm with BTC under FR-603.
- **Dev-only LCP warning:** `kudos-banner-bg` appears as LCP only under scripted scrolling (programmatic scroll does not end LCP tracking). I deliberately did not mark that below-the-fold image eager.
- **Translation and unused keys:**
  - English copy is my temporary translation (D007).
  - `common.comingSoon` / `common.appName` are no longer used by `/`; `common.comingSoon` and `common.appName` are still used by `app/admin/overview`, so I left them.
- **Docs impact:** minor. `docs/code-standards.md` could note the request-time helper pattern and the portal message layout (`awardsPortal.*`; lists read with `t.raw`). I left that to doc-writer.
- **Next.js feedback pass (AGENTS.md):** one candidate (documentation mismatch: the `connection()` example vs. the `react-hooks/purity` lint). The draft is encoded only; nothing was sent. I did not open a browser from a background subagent. The user can review and send it at:
  `https://nextjs.org/agent-feedback#report=eyJzY2hlbWFWZXJzaW9uIjo1LCJ0cmlnZ2VyUmVhc29uIjoiZG9jdW1lbnRhdGlvbi1taXNtYXRjaCIsInRpdGxlIjoiZXNsaW50LWNvbmZpZy1uZXh0IHB1cml0eSBydWxlIHJlamVjdHMgRGF0ZS5ub3coKSBhZnRlciBhd2FpdCBjb25uZWN0aW9uKCkgaW4gYSBTZXJ2ZXIgQ29tcG9uZW50Iiwic2V0dXAiOnsibW9kZSI6ImRldmVsb3BtZW50IiwiYnVuZGxlciI6InR1cmJvcGFjayIsInJlbGV2YW50RmVhdHVyZXMiOlsiQ2FjaGUgQ29tcG9uZW50cyIsImNvbm5lY3Rpb24oKSIsImVzbGludC1jb25maWctbmV4dCJdfSwic3RlcHMiOlsiRW5hYmxlIGNhY2hlQ29tcG9uZW50cyBhbmQgdXNlIGVzbGludC1jb25maWctbmV4dCBjb3JlLXdlYi12aXRhbHMgKGZsYXQgY29uZmlnKSBkZWZhdWx0cy4iLCJJbiBhbiBhc3luYyBwYWdlIFNlcnZlciBDb21wb25lbnQsIGNhbGwgYXdhaXQgY29ubmVjdGlvbigpIGFuZCB0aGVuIHJlYWQgRGF0ZS5ub3coKSBpbiB0aGUgY29tcG9uZW50IGJvZHksIGFzIHRoZSBjb25uZWN0aW9uKCkgQVBJIHJlZmVyZW5jZSBleGFtcGxlIGRvZXMgd2l0aCBNYXRoLnJhbmRvbSgpLiIsIlJ1biBlc2xpbnQgb24gdGhlIHBhZ2UgZmlsZS4iXSwib2JzZXJ2ZWQiOlsiZXNsaW50IHJlcG9ydHMgcmVhY3QtaG9va3MvcHVyaXR5OiBDYW5ub3QgY2FsbCBpbXB1cmUgZnVuY3Rpb24gZHVyaW5nIHJlbmRlciBmb3IgRGF0ZS5ub3coKSBvbiB0aGUgbGluZSBhZnRlciBhd2FpdCBjb25uZWN0aW9uKCkuIiwiVGhlIGNvbm5lY3Rpb24oKSByZWZlcmVuY2UgcGFnZSBzaG93cyByZWFkaW5nIE1hdGgucmFuZG9tKCkgZGlyZWN0bHkgaW4gdGhlIHBhZ2UgYm9keSBhZnRlciBhd2FpdCBjb25uZWN0aW9uKCkuIl0sImV4cGVjdGVkIjoiRG9jcyBhbmQgdGhlIGJ1bmRsZWQgbGludCBjb25maWcgc2hvdWxkIGFncmVlIG9uIHdoZXJlIHJlcXVlc3QtdGltZSB2YWx1ZXMgbWF5IGJlIHJlYWQsIG9yIHRoZSBkb2NzIHNob3VsZCBzaG93IHRoZSBwYXR0ZXJuIHRoYXQgcGFzc2VzIHRoZSBkZWZhdWx0IGxpbnQuIiwiY29tcGFyaXNvbiI6Ik1vdmluZyBhd2FpdCBjb25uZWN0aW9uKCkgcGx1cyBEYXRlLm5vdygpIGludG8gYSBzZXBhcmF0ZSBhc3luYyBoZWxwZXIgZnVuY3Rpb24gcGFzc2VzIHRoZSBzYW1lIGxpbnQgY29uZmlnLiIsImZyZXF1ZW5jeSI6InJlcHJvZHVjZWQiLCJvdXRjb21lIjoid29ya2VkLWFyb3VuZCIsIm5leHRWZXJzaW9uIjoiMTYuNC41IiwiYWdlbnQiOiJDbGF1ZGUgQ29kZSAoT3B1cyA1LjUpIHN1YmFnZW50In0`
- **Shared paths unchanged:** `APP_ROUTES.countdown` was not needed; nothing in my code links to `/countdown`. `AGENTS.md` is unchanged.

**Status:** DONE_WITH_CONCERNS
**Summary:** The 5 portal pages, server-clock countdown, single awards module, vi/en `awardsPortal` messages and e2e coverage are in place. Unit tests: 26/26 GREEN, with RED shown first. E2E: 12/12 GREEN. ESLint is clean and the scoped type check passes. Screenshots were captured and compared against Figma, and the mismatches found were fixed.
**Concerns/Blockers:**
- The project-wide `npm run typecheck` still needs to run with the dev server stopped.
- `/countdown`'s large-size layout is not visually verified on a prelaunch server.
- "Hoặc" contrast follows Figma.
- Other phases' `/` e2e specs should be re-run.
