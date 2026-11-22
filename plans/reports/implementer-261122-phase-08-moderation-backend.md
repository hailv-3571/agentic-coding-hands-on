# Phase 08 Admin moderation (F007): backend implementer report

Date: 2026-11-22. Role: implementer (RED-first). Nothing staged or committed.

## Scope Contract
- **Changed:** `kudos.moderated_by` / `moderated_at` (migration 0013 + Drizzle columns), `features/admin-moderation/{schemas/admin-kudo-filter-schema.ts, server/**}`, `app/admin/review/page.tsx`, `app/api/admin/kudos/route.ts`, `app/api/admin/kudos/export/route.ts`.
- **Impacted:** every reader of `kudos` (feed, highlight, detail, hearts, authoring), phase 04 edit path (spam lock), outbox consumers (`KudoMarkedSpam`).
- **Will verify:** unit (filter schema, CSV mapping); integration on local Supabase (migration up/down, service transitions + concurrency + rollback, query filters/tz/diacritics/LIKE/paging/sort, access matrix, export route, spam visibility + masking, phase 04 lock); full integration suite (shared schema changed, so fail open).
- **Deliberately skipped:** e2e (UI agent owns it), notification delivery (phase 13).

## Files
Created:
- `db/migrations/0013_kudos_moderation_columns.sql`, `.down.sql`, `db/migrations/meta/0013_snapshot.json` (+ journal entry, via `npm run db:generate -- --name kudos_moderation_columns`)
- `features/admin-moderation/schemas/admin-kudo-filter-schema.ts`
- `features/admin-moderation/server/`: `admin-kudo-where-builder.ts`, `admin-kudo-row-select.ts`, `kudo-admin-query.ts`, `kudo-moderation-service.ts`, `kudo-moderation-actions.ts`, `admin-kudo-export.ts`, `admin-kudo-selected-people.ts`, `admin-api-guard.ts`
- `app/admin/review/page.tsx`, `app/api/admin/kudos/route.ts`, `app/api/admin/kudos/export/route.ts`
- Tests: `tests/unit/admin-moderation/{admin-kudo-filter-schema,admin-kudo-export}.test.ts`; `tests/integration/admin-moderation/{moderation-migration,kudo-admin-query,kudo-admin-query-paging,kudo-moderation-service,admin-access,admin-kudo-export-route,spam-visibility}.test.ts` + `admin-moderation-fixtures.ts`

Modified: `shared/db/schema/kudos.ts` (two columns only). Contract files `admin-kudo-row.ts`, `kudo-moderation-result.ts` unchanged.

## Migration notes
- `moderated_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL`, `moderated_at timestamptz NULL`, CHECK `kudos_moderated_by_needs_moderated_at` (`moderated_by IS NULL OR moderated_at IS NOT NULL`, hand-appended to the generated SQL like 0007).
- **No new index.** EXPLAIN ANALYZE on 10k synthetic kudos + 10k hearts (rolled back): newest page 1 3.6 ms, page 500 14 ms, `count(*)` 1.8 ms, Heart sort 8.6 ms, diacritic search 94 ms. All under the 300 ms budget with the existing indexes.
- Reuses `public.f_unaccent` (0007). No `immutable_unaccent` and no heart seam (decision log 2026-11-22).
- Applied with `npm run db:migrate`. Down → up checked in a rolled-back transaction (the phase 06 method): columns gone after down, back after up, CHECK present, rows kept.

## RED → GREEN evidence
| Slice | RED | GREEN |
|---|---|---|
| Migration | `moderation-migration.test.ts` 6/6 failed: `column "moderated_by" does not exist`, journal count 0, `ENOENT …0013….down.sql` | 6/6 |
| Filter schema | `Failed to resolve import …admin-kudo-filter-schema` | 20/20 |
| CSV mapping | `Cannot find package …/server/admin-kudo-export` | 6/6 (unit total 26/26) |
| Query + paging | `Cannot find package …/server/kudo-admin-query` (2 files) | 13/13, then 14/14 with the resolver case |
| Selected-people resolver | `Cannot find package …/admin-kudo-selected-people` | 8/8 in `kudo-admin-query.test.ts` |
| Service | `Cannot find package …/kudo-moderation-service` | 7/7 (incl. 10 concurrent → 1 change / 1 outbox row / 0 errors; forced failure after the outbox insert rolls back status + outbox) |
| Routes + actions | `Cannot find package '@/app/api/admin/kudos/export/route'` (2 files) | 17/17. One failure on the way was a test bug: `Response#text()` strips the BOM, so the test now checks the bytes |
| Spam visibility | passed on first run: it checks upstream behavior (phase 04 `SPAM_LOCKED`, phase 05 masking / `includeOwnSpam`) through my already-green service, as the brief asked | 3/3 |

Final gates:
- `npx vitest run --project unit tests/unit/admin-moderation`: 26/26. Full unit suite: 46 files, 649/649.
- `npx vitest run --project integration` (FULL suite, 2026-11-22 16:34–16:36 +07): 42 files, 317/317. Afterwards only single admin-moderation files were re-run, by ~16:38. **I will run no more integration tests; e2e is free to use the DB.**
- `npx tsc --noEmit -p .`: exit 0 (`review-content-screen` has landed).
- `npx eslint` on every file I own: clean.

## Access choices
- **Actions** (`markKudoSpam`, `unSpamKudo`): `requireAdmin()` first, matching phase 06 (guest → redirect `/login`, non-admin → `forbidden()` 403 interrupt, nothing written, no revalidate). Zod uuid → `{ok:false, code:'invalid'}`. Unknown → `not_found`. DB error → `unexpected`. The admin id comes from the session only. `revalidatePath('/admin/review')` runs after every DB-backed outcome (changed, `changed:false`, not_found).
- **Routes**: `requireAdminApi()` (wraps `resolveAdminAccess`) runs BEFORE parsing. It answers 401 `{code:'unauthorized'}` / 403 `{code:'forbidden'}`, the same codes as proxy step 4/4b. Then 400 `{code:'invalid_params'|'invalid_date_range'}`, 422 `{code:'export_too_large'}`, 500 `{code:'unexpected'}`. Every answer has `Cache-Control: private, no-store` (repo convention, includes no-store). Bodies carry `{code}` only.
- **Page**: `requireAdmin()` → `await searchParams` → parse. On a parse error the page shows `DEFAULT_ADMIN_KUDO_FILTER` + `filterError` (unfiltered page 1, so the filter shown matches the data). A query failure gives `loadError: true` + an empty page. `searchParams` is typed explicitly, not with `PageProps<"/admin/review">`, so plain `tsc` does not need regenerated route types. No `instant` export: the admin layout sets `instant = false`, and `loading.tsx` (UI) is the Suspense fallback.
- `KudoAdminQuery` has **no internal guard**: route handlers need JSON 401/403, not the `forbidden()` page. Every entry point guards, and the module doc says so.
- CSV: full uuid, Vietnamese headers and labels (`Có/Không`, `Public/Spam`), Vietnamese hashtag labels joined with `, `, instants via `formatInZone`. File name `kudos-yyyyMMdd-HHmm.csv` in ADMIN_TIMEZONE.

## Message keys for the UI
None needed beyond `adminModeration.metaTitle`, which the UI agent has already added in vi and en.

## Open concerns
1. The plan's mitigation of an ESLint `no-restricted-imports` rule (block `features/admin-moderation/server` from `features/kudos-feed`) is not done: `eslint.config.mjs` is outside my ownership. Masking is covered by `spam-visibility.test.ts` instead.
2. `admin-kudo-filter-schema.ts` is `server-only` (it uses phase 01 `date-range-filter` → env). Client components must not import it. `ADMIN_KUDO_QUERY_MAX_LENGTH = 200` lives there; if the UI wants the same cap on its input, move the constant into the contract file.
3. q limit: the tech spec says 100, the brief and plan say 200. I followed 200.
4. Export builds one CSV string (≤ EXPORT_MAX_ROWS rows), not batches of 1,000 as the plan's risk row suggests. KISS: the shared serializer is whole-file. Between count and list, a few concurrent inserts could push the file slightly past the limit (acceptable).
5. `app/admin/review/error.tsx` is not created. Query failures already reach the screen as `loadError` (FR-407), and the app has no error-boundary pattern.
6. The phase 08 plan text is stale (heart seam file, `immutable_unaccent`, `kudos (created_at DESC, id DESC)` index). None of these was created, per the decision log and EXPLAIN. Plan sync is needed.
7. The page's 403 for a plain user is not tested at integration level (the page imports the client screen). The layout guard, e2e and `test:prod` cover it, and the page calls `requireAdmin()` itself.

**Status:** DONE
**Summary:** Migration 0013, filter schema, admin query, moderation service and actions, list and export routes, and the review page are all in place, with RED → GREEN evidence for each slice. Full integration 317/317, unit 649/649, tsc and eslint clean.
**Concerns/Blockers:** Non-blocking items 1–7 above (ESLint import rule outside my ownership, the filter schema is server-only, plan text needs a sync).
