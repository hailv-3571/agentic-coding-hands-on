# Implementer report — phase 14 UI (F014 Admin › User, F015 Admin › Overview)

Date 2026-11-23 · scope: UI only (`features/admin-users/{components,lib}`, `features/admin-overview/{components,lib}`, `adminUsers.*`/`adminOverview.*` messages, UI unit + e2e tests). Backend pages/routes/action by the parallel backend agent.

## Scope Contract
- **Changed:** both screens + client libs; i18n keys; 7 phase 08 components generalised (behaviour kept) + 4 shared pieces extracted into `features/admin-moderation/components/`.
- **Impacted:** Review content screen (uses the generalised pieces); backend `user-export-columns.ts` imports my `formatAdminDateTime`.
- **Will verify:** unit (URL params, sort cycle, role-menu states, error-code mapping, date formatter); e2e on the real pages (users: filter → sort → page → role change → export, phone width; overview: range + All = Σ units + reload + reversed range + export); phase 08 e2e as regression for the generalisation.
- **Deliberately skipped:** server guards/concurrency/parity (backend integration tests own them); env-admin and last-admin flows in e2e (ADMIN_EMAILS and the global admin count can't be controlled from e2e — the UI states are unit-tested via `roleMenuState`/`roleErrorKey`).

## RED evidence
`plans/261108-0048-saa-2025-kudos-platform/evidence/phase-14/ui-unit-red.log`: the 4 new unit files were written first and failed (exit 1; reason: the `features/admin-users/lib/*` and `features/admin-overview/lib/*` modules didn't exist yet). After implementing: 4 files / 29 tests passed. Two e2e failures on the first real run were test-side (Playwright refuses to click an `aria-disabled` button → switched to keyboard + tooltip check; `"Export"` locator matched a user named "…Exported" → `exact: true`).

## Gates (final code)
| Gate | Result |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:unit` | 85 files / 943 tests passed |
| e2e `tests/e2e/admin-users` + `tests/e2e/admin-overview` | 7/7 passed (`evidence/phase-14/ui-e2e-green.log`) |
| e2e `tests/e2e/admin-moderation` (phase 08 regression) | 13/13 passed |
| Files < 200 lines, kebab-case | yes (largest: role menu 159, users spec 199) |

## Files
- Users: `admin-users-screen.tsx` (Server Component entry), `admin-users-view.tsx`, `admin-user-filters.tsx`, `admin-user-table.tsx`, `admin-user-table-row.tsx`, `admin-user-sortable-header.tsx`, `admin-user-role-menu.tsx`, `admin-user-role-dialog.tsx`, `admin-users-skeleton.tsx`, `admin-users-styles.ts`; lib `admin-user-url-params.ts`, `admin-user-role-menu-state.ts`, `format-admin-date-time.ts`, `admin-user-view-row.ts`.
- Overview: `admin-overview-screen.tsx`, `overview-unit-stats-table.tsx`, `admin-overview-skeleton.tsx`; lib `overview-url-params.ts`.
- Tests: `tests/unit/admin-users-ui/{admin-user-url-params,admin-user-role-menu-state,format-admin-date-time}.test.ts`, `tests/unit/admin-overview-ui/overview-url-params.test.ts`, `tests/e2e/admin-users/user-table-and-role.spec.ts`, `tests/e2e/admin-overview/overview-date-range.spec.ts`.

## Phase 08 / 06 reuse
Imported unchanged: `ReviewPagination`, `useExternalResetKey`, `CampaignDialogFrame`, `CampaignSettingsToast`, phase 06 table/button tokens, phase 08 white field/popover/spinner tokens, `AdminCampaignIcon("more")`.
Generalised (behaviour kept, phase 08 e2e green):
- `review-status-filter.tsx` → thin wrapper over new `admin-filter-select.tsx` (generic listbox, same keyboard model); Unit/Level/Role use it.
- `review-search-input.tsx` + optional `label`/`placeholder`; `review-date-range-filter.tsx` + optional `groupLabel`.
- `review-export-button.tsx` takes `href` + `fallbackFilename` instead of the kudo filter (Review screen passes `reviewExportHref(filter)`); 422 → same "too large" toast on all three screens.
- Extracted `admin-sort-carets.tsx` (Heart header + 7 user headers), `admin-load-error-panel.tsx` (error + retry on all three screens), `admin-table-skeleton-rows.tsx` (all three skeletons).
Not generalised: phase 06 `CampaignRowMenu`. The role menu has a single item, so it follows the phase 08 one-item popover mechanics and uses the phase 06 trigger and item look. Generalising would have added placement/disabled/busy options to a phase 06 component that only this screen needs.

## Decisions
1. `AdminUsersScreen` is a **Server Component**. It formats "Time to get 6 Badges" and "Last Logged in" with the shared `toAdminZone`, plus the pure `formatAdminDateTime` (`dd/MM/yyyy HH:mm`), so the browser never needs ADMIN_TIMEZONE. That is the phase 06 pattern; `shared/admin/timezone` is server-only. The interactive part is the client `AdminUsersView`. The backend reuses the same formatter for the CSV.
2. Sorting: clicking a new column starts it descending (largest first), and clicking it again toggles asc/desc. `dir` is always written next to `sort`, and both are left out when unsorted (name A–Z).
3. Role menu: User row → "Set as Admin"; Admin row → "Set as User". An ADMIN_EMAILS admin gets a disabled item with a tooltip (`aria-describedby`). The actor's own row keeps the ⋯ button, locked (`aria-disabled`), with the "Bạn không thể tự hạ role của mình." tooltip. Confirm goes through an alertdialog with Cancel focused. While pending, the dialog buttons and the ⋯ button are locked with a spinner. Errors show inline per code (`roleErrorKey`) and the dialog stays open for a retry. Focus returns to ⋯.
4. On success the row is patched locally from the action result. I removed my extra `router.refresh()` because the backend action already calls `revalidatePath('/admin/users')`, which brings the fresh rows in the same round trip.
5. Export uses the server `filter` (not the optimistic view). When the overview URL range is invalid (`filterError`), export uses all time so the file matches the table shown.
6. vi copy follows the Figma text: English column headers and labels, Vietnamese placeholders, and the D010 fixed labels "Total received kudos" / "Total users with at least 1 kudo". The en copy is a draft. Unassigned is localised in the UI (`unitId === null`).
7. Users table uses the phase 06 cells with 8 px side padding (derived from the phase 06 strings) so 12 columns fit the 1152 px admin frame at 1440 with no desktop scroll.

## Figma differences (screenshots: `evidence/screenshots/phase-14/{desktop,mobile}-admin-users{,-role-menu,-role-dialog,-role-filter}.png`, `{desktop,mobile}-admin-overview.png`)
User (773:26403):
- Dark admin frame instead of the grey canvas: gold title, white labels (same as phase 08).
- Table is 1152 px wide instead of 1280, so headers wrap to 2–3 lines and User/Email wrap more.
- Level shows the Hero tier label ("New Hero"…) instead of 1–5 (C-12). ID shows the 8-char `shortId`.
- Level/Role selects are 144 px instead of ~135/~122 so "Chọn Level"/"Chọn Role" aren't cut. Lists add "Tất cả" (clear), plus "Chưa gán đơn vị" and "Chưa có Level". The search field is phase 08's (max 360).
- Not drawn in Figma, built with phase 06/08 tokens: pagination, ⋯ menu, confirm dialog, "Admin · env" badge, tooltips.
- Matches: centred counts and dates, two-line dates, red Total Heart, list style of 1002:15714.

Overview (620:24669):
- The "All" row's No is blank and units are numbered from 1 (spec E05 note; Figma numbers All as 1). The backend CSV does the same.
- "All" label is Medium weight (spec says bold [INFERRED], Figma Regular).
- Date range uses native date inputs at the phase 08 width (296 instead of 256), with "Ngày bắt đầu/Ngày kết thúc" placeholders. No quick-range select (D009).
- Zebra rows and divided header match.
- Export failure copy is the shared phase 08 "Không xuất được tệp…" rather than the spec's "Không xuất được số liệu…".

## For the orchestrator / backend
- `app/admin/users/loading.tsx` and `app/admin/overview/loading.tsx` don't exist yet. Ready to use: `AdminUsersSkeleton` (`features/admin-users/components/admin-users-skeleton.tsx`) and `AdminOverviewSkeleton` (`features/admin-overview/components/admin-overview-skeleton.tsx`).
- While I was working, the contract changed department ids to uuid strings. UI, tests and URL builder follow it.

## Unresolved questions
- Should a failed overview export use the spec copy ("Không xuất được số liệu…")? Doing that means adding an optional message prop to the shared export button.
- Should the "All" row be bold (spec, inferred) or Regular (Figma)?
