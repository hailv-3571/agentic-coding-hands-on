---
phase: 06
feature: F005 hearts, F011 x2 campaigns
scope: review fixes W1-W3, D003 ranking test, cheap suggestions (backend only)
created: 2026-11-16
---

# Phase 06 backend: review fix report

Nothing staged, committed or pushed. No UI, `app/**`, `messages/**` or `tests/e2e/**` file touched.
No DB access (integration tests not run: the UI agent holds the DB).

## Scope Contract
- **Changed:** `heartCountsSubquery` (now bounded to a kudo id set) and its caller `rankKudoIds`;
  `shared/admin/timezone.ts` year handling; campaign input year floor; tests; contracts doc.
- **Impacted:** Highlight ranking (phase 05 seam, unchanged signature), campaign create/update
  validation, every `shared/admin/timezone.ts` user (`startOfDayInZone` → admin date-range filter,
  `toAdminZone`/`formatInZone` → admin tables, CSV, campaign time format).
- **Verified:** `npm run test:unit`, `npx tsc --noEmit -p .` (covers the integration test files),
  `npm run lint`, plus the generated ranking SQL rendered with `toSQL()` (no connection).
- **Skipped:** integration, e2e, db:reset (DB in use). The tester runs
  `tests/integration/kudos-hearts/heart-ranking-query.test.ts` and the rest of the suite.

## W1: bounded heart aggregate
`features/kudos-hearts/server/heart-ranking-query.ts`
- New signature: `heartCountsSubquery(kudoIds: KudoIdSet, asOf?: Date)` with
  `type KudoIdSet = SQLWrapper | readonly string[]`. The parameter is required, so no caller can
  aggregate the whole table by accident.
- The WHERE clause is now `kudo_id IN (kudoIds) [AND created_at <= asOf]`. The unique
  `(kudo_id, user_id)` index serves it.
- `rankKudoIds(candidates, limit, asOf?)` is unchanged in signature, joins and ORDER BY
  (`coalesce(raw,0) DESC, created_at DESC, id DESC`). It passes
  `db.select({ id: candidates.id }).from(candidates)`.
- Callers: `enrich-heart-summary.ts` and `kudo-highlight-query.ts` needed no change, because they
  only call `rankKudoIds`.
- Rendered SQL checked with `toSQL()`:
  - the subquery form renders `"kudo_hearts"."kudo_id" in (select "id" from (<candidates>) "public_kudo_ids") and "kudo_hearts"."created_at" <= $5`;
  - the list form renders `in ($1)`;
  - an empty list renders `where false`.
- Phase 08 and phase 14 usage is documented in the contracts file (§5, "heartCountsSubquery").
  Phase 08 passes its admin-filtered select and then sorts and pages. Phase 14 passes the public kudos.

## W2: years 0000-0099
- `shared/admin/timezone.ts`, the root fix, which covers every caller:
  - The private `utcMs(y, m, d, h, mi, s)` helper (`setUTCFullYear`) replaces all four `Date.UTC`
    calls. Years 0-99 no longer turn into 1900-1999. This also fixes `startOfDayInZone`, which the
    admin date-range filter uses.
  - The formatter now requests `era`, and `toAdminZone` maps "1 BC" to ISO year 0. Without this,
    year 0000 and 0001-01-01 in zones behind UTC still converted wrongly, because Intl reports year
    0 as "1" with no era.
- `features/admin-campaigns/schemas/campaign-input-schema.ts`: `isLocalDateTime` rejects years
  before 2000 (`CAMPAIGN_MIN_YEAR`) with the existing `invalidDateTime` key, so no i18n change was
  needed.
- RED evidence: the run before the fix showed 4 failures:
  - `0050-06-15T10:00` gave `1950-06-15T10:00:00.000Z`;
  - `0000-02-29` threw `RangeError`;
  - the schema accepted `0050-01-01T10:00` and `1999-12-31T23:59`.

## W3: direct `zonedDateTimeToUtc` tests
New file: `tests/unit/admin-campaigns/zoned-date-time-to-utc.test.ts`, 25 cases. I moved the old
`zonedDateTimeToUtc` block out of `campaign-input-schema.test.ts`, so each contract has one owner
test. It covers:
- **Normal values:** the default zone and explicit zones, including New York DST. The DST gap and
  overlap behaviour is now pinned: 02:30 in the gap resolves to 01:30 EST, and in the overlap the
  first (EDT) occurrence wins.
- **Midnight in ADMIN_TIMEZONE:** 23:59 and 00:00 map to 16:59Z and 17:00Z. 06:59 and 07:00 Vietnam
  time sit on either side of the UTC day change. Month end, year end and leap day roll back
  correctly.
- **Malformed input:** 16 shapes, among them `T09:5`, `T24:00`, seconds, `Z`/offset, month 00/13,
  day 00/32 and `2101-02-29`.
- **Year edge:** 0050 and 0099 are kept; year 0000 and 0001 behind UTC (`Etc/GMT+5`) are correct;
  9999 converts.

## D003 ranking test (written, not run: needs DB)
`tests/integration/kudos-hearts/heart-ranking-query.test.ts`
- A second probe hashtag holds two kudos. The older one has two x1 hearts. The newer one has one
  x2 heart.
- The test expects `[twoSingle, oneDouble]`. Ranking by the multiplier sum would tie at 2 and put
  the newer x2 kudo first, so the test would fail under that bug.
- Existing expectations are untouched, because the new kudos carry only the new tag.
- The `heartCountsSubquery` test now passes an id list and has no outer filter. If the bound
  leaked, every other hearted kudo would appear in the result.
- W1 RED: there is no runtime evidence, since the DB was not available. Under the old
  `(asOf?: Date)` signature, the updated call does not compile (an id array is passed where
  `asOf` was expected). The tester confirms the behaviour.

## Suggestions
| # | Decision | Reason |
|---|---|---|
| S1 | Applied (doc) | Added the READ COMMITTED window note to `classifyNoInsert` JSDoc. The reviewer asked for documentation only, with no lock. |
| S2 | Applied (doc) | Contracts §5: `heartUserId` is internal and is never forwarded to clients (D009). |
| S3 | Partly applied | `campaign-active-reader.ts` now says the 0012 GiST index does not serve its filter. The wrong comment in migration 0012 is outside my ownership, and editing an applied migration is undesirable. I did not switch the query to `tstzrange @>`: it needs a `::timestamptz` cast I cannot verify without the DB, and the table has a handful of rows. |
| S4 | Applied | `bool_or(user_id = ${viewerId}::uuid)` in `kudo-heart-query.ts`. The integration suite covers it (tester). |
| S5 | Skipped | The reviewer judged it acceptable: idempotent remove per spec, no oracle. |
| S6 | Skipped | The reviewer judged it fine: the down chain is proven by the migration test. |

## Commands
| Command | Exit | Result |
|---|---|---|
| `npx vitest run --project unit <2 new/changed files>` (RED) | 1 | 4 failed / 40 passed, all for the intended reason |
| `npx vitest run --project unit tests/unit/admin-campaigns tests/unit/shared/date-range-filter.test.ts` | 0 | 62 passed |
| `npm run test:unit` | 0 | 35 files, 434 tests passed |
| `npx tsc --noEmit -p .` | 0 | clean (no typegen-only route type errors) |
| `npm run lint` | 0 | 0 problems |
| `tsx --conditions=react-server` SQL probe (scratchpad, placeholder env, no connection) | 0 | SQL as above |

## Files
- Modified:
  - `features/kudos-hearts/server/heart-ranking-query.ts`
  - `features/kudos-hearts/server/kudo-heart-query.ts`
  - `features/kudos-hearts/server/kudo-heart-service.ts` (comment only)
  - `features/admin-campaigns/server/campaign-active-reader.ts` (comment only)
  - `features/admin-campaigns/schemas/campaign-input-schema.ts`
  - `shared/admin/timezone.ts`
  - `tests/unit/admin-campaigns/campaign-input-schema.test.ts`
  - `tests/integration/kudos-hearts/heart-ranking-query.test.ts`
  - `plans/261108-0048-saa-2025-kudos-platform/research/phase-06-backend-contracts.md`
- Created: `tests/unit/admin-campaigns/zoned-date-time-to-utc.test.ts`

## Unresolved / follow-ups
- Tester: run `tests/integration/kudos-hearts/**` and the full integration suite. They cover the
  D003 test, the bounded subquery, and the S4 cast.
- Migration 0012 comment (S3): fix it whenever a migration owner next touches that area.
- `adminDateRangeSchema` (phase 01 file, not mine) still accepts years 0000-1999. The conversion
  is now correct, but a floor there is the owner's call.
- The duplicated `yyyy-MM-ddTHH:mm` validation between the schema and `timezone.ts` remains. The
  schema is client-safe and `timezone.ts` is `server-only`, so a shared helper needs a new
  client-safe module in `shared/`, which is outside my ownership.
- No Next.js friction found, so I did not run the AGENTS.md feedback pass.

**Status:** DONE_WITH_CONCERNS
**Summary:** W1, W2, W3, the D003 test and S1/S2/S4 (plus part of S3) are in place. Unit tests (434), tsc and lint are green, and the RED was shown before each W2 fix.
**Concerns/Blockers:** The integration tests (D003, bounded `heartCountsSubquery`, S4 cast) are written and type-check but have not run because the DB is in use. The tester must run them.
