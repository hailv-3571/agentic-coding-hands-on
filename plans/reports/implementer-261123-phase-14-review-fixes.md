# Implementer report: phase 14 review fixes (F014 Admin users, F015 Admin overview)

Date: 2026-11-23 · Tree: working tree on `main` (uncommitted, no git writes) · Dev server: reused `:3000`
Inputs: `plans/reports/reviewer-261123-phase-14.md` (Medium 1), `plans/reports/tester-261123-phase-14-full-run.md` (G1, G3)

## Scope Contract
- **Changed:** where `adminCsvFilename` and `formatAdminDateTime` live, plus their importers. Two new e2e cases. The users e2e helpers moved into a steps module.
- **Impacted:** both admin export routes (filename), the users table date cells and the users CSV (date format). The Review content export does **not** share either helper: it has its own `adminKudoExportFilename`, so it is unaffected.
- **Will verify:** the full suite, serially, on the final code. The phase is safety-critical (permissions, migration).
- **Deliberately skipped:** nothing.

## Changes

### 1. Medium: feature-neutral helpers moved to `shared/admin/` (no behaviour change)
| New | Was | Importers updated |
|---|---|---|
| `shared/admin/admin-csv-filename.ts` (`server-only`, `toAdminZone`) | `adminCsvFilename` in `features/admin-users/server/user-export-columns.ts` | `app/api/admin/users/export/route.ts`, `app/api/admin/overview/export/route.ts` |
| `shared/admin/admin-date-time-format.ts` (pure, type-only import of `./timezone`) | `features/admin-users/lib/format-admin-date-time.ts` | `features/admin-users/server/user-export-columns.ts`, `features/admin-users/components/admin-users-screen.tsx` |

- Function bodies were copied verbatim. The old file was deleted, and `adminCsvFilename` was removed from `user-export-columns.ts`. No re-export shims.
- `admin-date-time-format.ts` keeps the original's lack of a `server-only` marker. Today only server code imports it, so nothing changes.
- Tests moved alongside, assertions unchanged:
  - `tests/unit/shared/admin-date-time-format.test.ts`, moved from `tests/unit/admin-users-ui/format-admin-date-time.test.ts` (deleted).
  - `tests/unit/shared/admin-csv-filename.test.ts`, the `adminCsvFilename` block lifted out of `tests/unit/admin-users/user-export-columns.test.ts`.
  - The unit count stays at 943. The file count goes from 85 to 86.
- Grep shows no remaining reference to the old paths in `app/`, `features/`, `shared/`, `tests/` or `docs/`. Historical plan reports and evidence still name the old path, and I left them as they are.

### 2. G1: Overview at 375×812 (`tests/e2e/admin-overview/overview-date-range.spec.ts`)
New `describe("at 375 px")`, using the same approach as the users mobile case: `documentElement` overflow = 0; the table's parent has `overflow-x: auto`, `scrollWidth > clientWidth`, and its right edge ≤ 375. It also checks that the container really scrolls:
- "Total received secret box" is out of the viewport at first.
- After `scrollIntoViewIfNeeded` it is in the viewport, the container's `scrollLeft` is > 0, and `window.scrollX` is still 0.

**Mutation check:** I removed `overflow-x-auto` from the overview table wrapper and the case failed with "horizontal page overflow at 375px" (exit 1). I then restored the file and confirmed with `cmp` that it is byte-identical to the backup.

### 3. G3: Users zero-row empty state (`tests/e2e/admin-users/user-table-and-role.spec.ts`)
New case "a search that matches nobody shows the empty state with zero totals and no pager". It types a token that matches nobody into the search box and waits for `?q`. Then it asserts:
- the copy "Không có người dùng nào phù hợp bộ lọc.";
- exactly one body row, with "Xoá bộ lọc" inside it;
- `∑ sent Kudos (0)` and `∑ Received Kudos (0)`;
- no "Phân trang" navigation.

- **Correction to the tester's G3:** the existing filter test already asserted the same empty-state copy, under the `role=admin` filter (old lines 97–99). The new case adds the search-only path, the zero totals and the hidden pager. Overview has no zero-row state to test, because the unit rows always render.
- **200-line limit:** the spec was at 199 lines. I moved its helpers (`tokenName`, `bodyRows`, `userRow`, `searchParam`, `openUsers`, `storedRole`, `pick`) verbatim into `tests/e2e/admin-users/admin-users-e2e-steps.ts`. This follows the `admin-moderation/review-content-e2e-steps.ts` precedent. The spec is now 186 lines.

Untouched: role-service semantics, server-action result shapes (in-band codes), production UI.

## Gates (serial, final code, real exit codes)

| # | Command | Exit | Result | Wall |
|---|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | no type errors | 4 s |
| 2 | `npm run lint` | 0 | eslint clean | 12 s |
| 3 | `npm run test:unit` | 0 | 86 files, 943 passed | 7 s |
| 4 | `npm run db:reset` | 0 | migrations applied; seeds departments=6, hashtags=8, secretBoxPrizes=9 | 21 s |
| 5 | `npm run test:integration` (alone) | 0 | 93 files, 598 passed | 147 s |
| 6 | `npx playwright test --timeout 90000 --workers=3` (alone) | 0 | 141 passed (139 + 2 new), 5 skipped, 0 failed | 142 s |
| 7 | `npm run test:e2e:prelaunch` | 0 | 5 passed, 1 skipped (normal-server gate) | 23 s |
| 8 | `npm run build` | 0 | compiled, 0 warnings in log; `/admin/users`, `/admin/overview`, both export routes present | 11 s |
| 9 | `npm run test:prod` | 0 | 16 PASS, 0 FAIL | 5 s |

- Before the full run, a targeted run of the two admin specs gave 9/9 passed, exit 0.
- Flakes: none. The spotlight-board counter and edit-kudo toast specs passed first time, so I did no reruns.
- Logs, each ending with `EXIT=` and `WALL=`: `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\p14fix\`

## Size
All touched files are under 200 lines. The largest is the users spec at 186 lines. The overview spec is 145, and each new shared helper is 9–12 lines.

## Concerns
- `features/admin-moderation/server/admin-kudo-export.ts:53` `adminKudoExportFilename(now)` duplicates `adminCsvFilename("kudos", now)`. It was out of scope, so I left it. A one-line follow-up could make it delegate, which is behaviour-identical, and its existing unit test would guard it.
- I could not count admins and profiles after the runs, because `psql` is not on PATH. The suites clean up after themselves, and the earlier tester run confirmed 0/0.
- The mutation-check backup landed in the system temp dir instead of the scratchpad. It was deleted after the `cmp` check.
- Docs impact: none. No `docs/` page names these paths.
