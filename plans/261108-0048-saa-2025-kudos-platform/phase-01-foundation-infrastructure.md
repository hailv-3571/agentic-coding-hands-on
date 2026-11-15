---
phase: 01
feature: all (enables F001–F015)
priority: P0
status: completed
depends_on: []
file_ownership:
  - package.json, package-lock.json            # only phase allowed to add base deps (later phases: serial edits only)
  - next.config.ts, tsconfig.json, eslint.config.mjs
  - drizzle.config.ts, vitest.config.mts, playwright.config.ts
  - supabase/config.toml
  - .env.example
  - app/layout.tsx, app/globals.css             # root layout + Tailwind @theme tokens
  - shared/config/**
  - shared/db/client.ts, shared/db/schema/index.ts, shared/db/schema/reference-data.ts, shared/db/schema/domain-event-outbox.ts
  - shared/db/supabase-service-client.ts
  - shared/events/**
  - shared/admin/**
  - shared/i18n/request.ts, shared/i18n/locales.ts
  - messages/vi.json, messages/en.json          # skeleton + `common` namespace only
  - db/migrations/0000_* … 0003_*               # foundation migrations
  - db/seeds/**
  - tests/setup/**, tests/unit/shared/**, tests/integration/foundation/**, tests/e2e/smoke.spec.ts
---

# Phase 01 — Foundation & Infrastructure

## Context Links
- Plan: [plan.md](plan.md) (code layout, phase table)
- Decisions: [spec/decision-log.md](spec/decision-log.md) — env-configurable dates, `ADMIN_EMAILS`, seeded departments, fixed hashtags, Secret Box stock in DB
- Architecture: [spec/system/architecture.md](spec/system/architecture.md) § Shared Data Model Ownership, § Cross-Feature Contracts (outbox events), § Consistency Check
- Permissions: [spec/system/permissions.md](spec/system/permissions.md) § Quy tắc dữ liệu: Supabase RLS
- Feature list: [spec/feature-list.md](spec/feature-list.md)
- Image rules: [spec/kudos-authoring/functional-spec.md](spec/kudos-authoring/functional-spec.md) D012 (JPG/PNG/WEBP, 5 MB, max 5)
- Figma `9ypp4enmFmdK3YAFJLIu6C` token sources: Components page `39:28`, Homepage `2167:9026`, Live board `2940:13431`, Admin `620:7712`
- Next.js 16 docs: `node_modules/next/dist/docs/` (AGENTS.md — APIs differ from training data)

## Overview
- Priority: P0 — blocks every other phase
- Status: completed (2026-11-15; see Delivery Notes)
- Description: wire Supabase (local CLI + Docker), Zod-validated env config, Drizzle + migration pipeline, cross-cutting tables (outbox, reference data), seeds, Storage bucket, RLS baseline, shared admin utils, next-intl base, Figma design tokens, test + lint tooling. No feature UI.

## Key Insights
- Resolves **C-16, C-01 (infra side), C-03, C-15, C-20, C-14**, and the timezone half of C-14 (single `ADMIN_TIMEZONE` replaces F006 `EVENT_TIMEZONE`).
- Drizzle connects as a server role and **bypasses RLS** → RLS is defence-in-depth only; all authz lives in server code (permissions.md).
- One migration pipeline: `drizzle-kit` owns the journal; hand-written SQL (RLS, triggers, EXCLUDE, storage bucket, `realtime.send`) is added via `drizzle-kit generate --custom` so it is ordered in the same journal. Supabase CLI only provides the local stack (Postgres/Auth/Storage/Realtime); `supabase/migrations` stays empty.
- Storage bucket via SQL `insert into storage.buckets` → identical on local and hosted.
- **Image paths must not contain sender id** (public-feed images of anonymous Kudos would leak the sender). Bucket is private; reads via server-signed URLs. Path convention fixed in phase 04.
- Table ownership split (C-15): phase 01 creates `departments`, `hashtags` (reference data, needed by 02/04/05) + seeds them. `secret_box_prizes` table stays with F010 (phase 10); phase 01 ships only the typed seed **data** file (`db/seeds/secret-box-prize-catalog.ts`: kind, name, icon key, weight, stock) — phase 10 creates the table and adds its loader to the seed runner.
- `SECRET_BOX_LOCK_AT` is not a user-decided env var; phase 10 decides (default = `EVENT_END_AT`). Not defined here (YAGNI).
- Mutation convention (C-18) is decided by the first phase that reads Next docs: **server actions for form/internal mutations, route handlers for reads + header-dependent endpoints (Idempotency-Key)**. Recorded here so 04/06/10 align.
- Messages files are shared: rule = each phase owns one top-level namespace key in `messages/*.json` and edits only that key.

## Requirements
Functional
- Env (`shared/config/env.ts`, server-only, Zod, fail-fast at boot): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LAUNCH_AT`, `EVENT_AT`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT` (ISO-8601 with offset → `Date`), `ADMIN_EMAILS` (comma list → lowercased `string[]`), `ALLOWED_EMAIL_DOMAIN` (default `sun-asterisk.com`), `HEART_CAMPAIGN_MULTIPLIER` (int ≥ 2, default 2), `SECRET_BOX_HEARTS_PER_BOX` (int ≥ 1, default 5), `ADMIN_TIMEZONE` (default `Asia/Ho_Chi_Minh`, validated via `Intl`), `EXPORT_MAX_ROWS` (int, default 10000). Refinement: `LAUNCH_AT < EVENT_END_AT <= NATIONAL_KUDOS_FINALIZE_AT`.
- Public env split (`shared/config/public-env.ts`) exposes only `NEXT_PUBLIC_*`.
- `domain_event_outbox` (unified F013 schema): `id uuid pk default gen_random_uuid()`, `event_type text not null`, `payload jsonb not null`, `occurred_at timestamptz default now()`, `consumed_at timestamptz null`, `attempts int default 0`, `failed_at timestamptz null`, `last_error text null`; partial index `(occurred_at, id) where consumed_at is null and failed_at is null`.
- `DomainEventOutbox#add(tx, type, payload)`: validates payload against Zod discriminated union of the six events (`KudoCreated{kudoId}`, `HeartAdded{kudoId,heartUserId}`, `KudoMarkedSpam{kudoId,ownerId,moderatedAt}`, `BoxGranted{userId,count}`, `SetCompleted{userId,giftName}`, `NationalKudosFinalized{items[{kudoId,senderId,rank}]}`); inserts with the caller's `tx` only (never opens its own transaction); payload holds ids only — no body/names.
- `departments` (`id`, `code` unique, `name_vi`, `name_en`, `sort_order`), `hashtags` (`id`, `slug` unique, `label_vi`, `label_en`, `sort_order`, `is_active`). Seeds idempotent (`ON CONFLICT (code|slug) DO UPDATE`).
- Storage bucket `kudo-images`: private, `file_size_limit` 5 MB, mime `image/jpeg,image/png,image/webp` (D012).
- RLS baseline: every table in `public` has RLS enabled and **zero** policies for `anon`/`authenticated` (C-20).
- `shared/admin`: `csv-serializer.ts` (UTF-8 BOM, RFC 4180 quoting, cells starting `= + - @` (also tab/CR) prefixed with `'`), `date-range-filter.ts` (Zod schema `{from?, to?}` dates in `ADMIN_TIMEZONE` → half-open UTC `[start, end)`), `timezone.ts` (`toAdminZone`, `startOfDayInZone`, `formatInZone`), `export-limit.ts` (`assertWithinExportLimit(count)`).
- next-intl: locales `vi` (default) + `en`, locale from cookie `NEXT_LOCALE`, no URL prefix; `messages/{vi,en}.json` with `common` namespace.
- Design tokens in `app/globals.css` `@theme`: colors, font families (must support Vietnamese diacritics; load via `next/font`), type scale, spacing/radius/shadow as present in Figma variables.
- Tooling: Vitest (projects `unit`, `integration`), Playwright (chromium, `webServer`), scripts `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `db:reset`.

Non-functional
- Every code file < 200 lines; kebab-case names.
- `server-only` import in every module touching secrets/DB.
- Migrations forward-only; each must run on a fresh DB and on hosted Supabase.

## Architecture
```
.env.local ─► shared/config/env.ts (Zod parse once, frozen) ─► server modules
                                    └► public-env.ts ─► client
shared/db/client.ts (postgres-js + drizzle, DATABASE_URL) ─► feature server/ code
   tx ─► shared/events/domain-event-outbox.ts#add ─► domain_event_outbox  ─► (phase 13 processor)
db/migrations/ (drizzle journal: generated + custom SQL) ─ drizzle-kit migrate ─► Postgres (local: supabase start :54322)
db/seeds/run-seeds.ts (CLI) ─► apply-all-seeds.ts ─► departments, hashtags   (phase 10 appends prize loader in apply-all-seeds.ts)
tests: unit (pure) │ integration (local Supabase, truncate per file) │ e2e (Playwright vs next dev)
```
- Schema barrel `shared/db/schema/index.ts` re-exports per-feature schema files; each later phase appends one export line (only line-level edits).
- Integration test helper `tests/setup/integration-db.ts`: connects with `DATABASE_URL`, provides `withRollback(fn)` (tx + rollback) for isolation.

## Related Code Files
Create
- `supabase/config.toml` (via `supabase init`; Google provider block added in phase 02)
- `.env.example`, `drizzle.config.ts`, `vitest.config.mts`, `playwright.config.ts`
- `shared/config/env.ts`, `shared/config/env-schema.ts`, `shared/config/public-env.ts`, `shared/config/event-window.ts` (`isEventWritingOpen(now)` = `now < EVENT_END_AT`; single helper reused by phases 04, 06, 10)
- `shared/db/client.ts`, `shared/db/schema/index.ts`, `shared/db/schema/reference-data.ts`, `shared/db/schema/domain-event-outbox.ts`, `shared/db/supabase-service-client.ts`
- `shared/events/domain-event-types.ts`, `shared/events/domain-event-outbox.ts`
- `shared/admin/csv-serializer.ts`, `shared/admin/date-range-filter.ts`, `shared/admin/timezone.ts`, `shared/admin/export-limit.ts`
- `shared/i18n/locales.ts`, `shared/i18n/request.ts`, `messages/vi.json`, `messages/en.json`
- `db/migrations/0000_reference_data.sql` (generated), `0001_domain_event_outbox.sql` (generated), `0002_rls_baseline.sql` (custom), `0003_storage_kudo_images_bucket.sql` (custom)
- `db/seeds/run-seeds.ts`, `db/seeds/departments.ts`, `db/seeds/hashtags.ts`, `db/seeds/secret-box-prize-catalog.ts` (data only: 6 icons REVIVAL, TOUCH OF LIGHT, STAY GOLD, FLOW TO HORIZON, BEYOND THE BOUNDARY, ROOT FURTHER + gifts, each `weight`, `stock`)
- `tests/setup/integration-db.ts`, `tests/unit/shared/env-schema.test.ts`, `tests/unit/shared/csv-serializer.test.ts`, `tests/unit/shared/date-range-filter.test.ts`, `tests/integration/foundation/domain-event-outbox.test.ts`, `tests/integration/foundation/rls-baseline.test.ts`, `tests/integration/foundation/seeds.test.ts`, `tests/e2e/smoke.spec.ts`

Modify
- `package.json` (deps: `drizzle-orm`, `postgres`, `zod`, `next-intl`, `@supabase/supabase-js`, `@supabase/ssr`, `server-only`; dev: `drizzle-kit`, `supabase`, `vitest`, `@playwright/test`, `tsx`; scripts above)
- `next.config.ts` (next-intl plugin → `shared/i18n/request.ts`), `app/layout.tsx` (fonts, `<html lang={locale}>`, `NextIntlClientProvider`), `app/globals.css` (`@theme` tokens), `tsconfig.json` (path alias `@/*` if absent)

Delete
- `app/page.tsx` boilerplate content (replace with minimal placeholder; phase 07 owns the real homepage)

## Implementation Steps
1. Read `node_modules/next/dist/docs/` guides: project structure, `proxy` (ex-middleware), server actions vs route handlers, `next.config`, fonts, env vars. Record the C-18 convention above if docs contradict it.
2. Install deps; add scripts. `npx supabase init`; `supabase start`; copy local keys into `.env.local`; write `.env.example` (no secrets).
3. Write `env-schema.ts` (pure Zod, testable) + `env.ts` (parses `process.env` once, `server-only`) + `public-env.ts`. Unit-test refinements and list parsing.
4. `shared/db/client.ts` (singleton across HMR via `globalThis`), export `Db` and `DbTx` types. `drizzle.config.ts` → `out: db/migrations`, `schema: shared/db/schema/index.ts`.
5. Define `reference-data.ts` + `domain-event-outbox.ts` schemas; `db:generate`.
6. `drizzle-kit generate --custom` → `0002_rls_baseline.sql`: `alter table … enable row level security` for `departments`, `hashtags`, `domain_event_outbox`. Convention for all later phases: every migration creating a table enables RLS in the same migration.
7. `0003_storage_kudo_images_bucket.sql`: insert bucket (private, 5 MB, 3 mime types) `on conflict (id) do nothing`.
8. `domain-event-types.ts` (Zod discriminated union + `DomainEventType`), `domain-event-outbox.ts#add(tx, type, payload)`.
9. Seeds: data files + `run-seeds.ts` (upsert, logs counts). Department + hashtag lists: take verbatim from Figma (Live board filter dropdowns, Write Kudo hashtag dropdown) until BTC confirms.
10. `shared/admin/*` utilities + unit tests (BOM, formula guard, quotes/newlines, zone boundary at 00:00 +07).
11. next-intl: `locales.ts` (`['vi','en']`, default `vi`, cookie name), `request.ts` (read cookie, fallback `vi`, load messages), plugin in `next.config.ts`, provider in root layout.
12. Design tokens: in Figma MCP `create_session` for file `9ypp4enmFmdK3YAFJLIu6C`, `get_variable_defs` / `get_design_context` on `39:28`, `2167:9026`, `2940:13431`, `620:7712`; map to `@theme` (`--color-*`, `--font-*`, `--text-*`, `--radius-*`). Never guess values.
13. Vitest config (two projects; integration uses `tests/setup/integration-db.ts`, `fileParallelism: false`). Playwright config (`webServer: npm run dev`, baseURL env). Smoke test: GET `/` returns status < 500 and `<html lang>` is `vi` (robust to later redirects).
14. Integration tests: outbox add inside tx (committed row visible; rolled-back tx leaves no row; invalid payload throws); RLS baseline (query `pg_class.relrowsecurity` for every `public` table = true and `pg_policies` has no rows for `anon`/`authenticated` — runs green for every future table); seeds idempotent (run twice → same counts).
15. Run `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`; `next build` passes.

## Todo List
- [x] Read Next.js 16 docs; confirm C-18 convention
- [x] Deps + scripts + Supabase local stack + `.env.example`
- [x] Zod env schema + tests
- [x] Drizzle client, config, reference + outbox schemas, migrations 0000–0003
- [x] Outbox types + `add` helper + integration test
- [x] Seeds (departments, hashtags, prize catalog data) + runner + test
- [x] RLS baseline migration + system-wide RLS test
- [x] Storage bucket migration
- [x] `shared/admin` utils + tests
- [x] next-intl base wiring + messages skeleton
- [x] Figma tokens → `@theme` + fonts
- [x] Vitest + Playwright config + smoke test
- [x] typecheck / lint / build green

## Delivery Notes
Delivered 2026-11-15. Evidence: tester reports `tester-261115-phase-01-foundation.md` and `-rerun.md` (db:reset, unit 52, integration 18, e2e 2, typecheck, lint, build all green); reviewer `reviewer-261115-phase-01-foundation-recheck.md` (9.3, SEALED).

Deviations from the plan text:
- `vitest.config.ts` renamed to `vitest.config.mts` (no `"type": "module"` added; removes the ESM warning).
- `scripts/typecheck.mjs` sets `SKIP_ENV_VALIDATION=1` for `next typegen` + `tsc` only. `next.config.ts` skips the boot check only when the value is exactly `"1"`. `env.ts` still validates on import. dev/build/start always validate.
- `db/seeds/apply-all-seeds.ts` holds the transactional seed list (all-or-nothing). `run-seeds.ts` is only the CLI entry. Phase 10 appends its loader in `apply-all-seeds.ts`.
- Root layout `export const instant = false` (recorded in `spec/decision-log.md`, 2026-11-15 technical decisions). `next.config.ts` also sets `cacheComponents: true`.
- `0002_rls_baseline.sql` adds `REVOKE ALL` on tables from `anon`/`authenticated`, including default privileges, on top of RLS.
- `0003_storage_kudo_images_bucket.sql` uses `ON CONFLICT DO UPDATE`, so the bucket is forced to `public=false`, 5 MB, jpeg/png/webp.
- Milestone env vars (`LAUNCH_AT`, `EVENT_AT`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT`) are epoch ms numbers, not `Date`, because `Object.freeze` is shallow.
- C-18 convention confirmed: server actions for form/internal mutations; route handlers for reads and header-dependent endpoints (Idempotency-Key). Server action body limit is the 1 MB default. The middleware convention is now `proxy.ts`.

Open after delivery:
- Typecheck without `.env.local` was not run. The tester's Bash guardrail blocked it. Run `mv .env.local .env.local.bak && npm run typecheck; mv .env.local.bak .env.local` and confirm the `.env.local` md5 is unchanged.
- Human sign-off on the safety-critical changes (RLS/grants, migrations, env) is pending. The inspection verdict has `humanSignedOff: false`.
- The 25-minute static-generation stall was not reproduced. Root cause is unproven. Pool timeouts (`connect_timeout` 10 s, `idle_timeout` 20 s) bound the likely cause.
- Future realtime policies that subquery a public table will need a narrow `GRANT SELECT` plus a policy (phases 11 and 13).

## Success Criteria
- Fresh clone: `supabase start && npm run db:reset` (reset → migrate → seed) succeeds; `npm run test:integration` green.
- App boots and fails fast with a readable Zod error when an env var is missing/invalid.
- `rls-baseline.test.ts` fails if any `public` table lacks RLS or has a client policy.
- Outbox row written only when the business tx commits.
- CSV output opens in Excel with Vietnamese intact; `=SUM()` cell rendered as text.
- Tokens visible via Tailwind utilities (e.g., `bg-primary`) matching Figma values.

## Scope Contract
- **Changed:** project tooling, env config, DB client, foundation migrations, outbox, seeds, admin utils, i18n base, root layout/tokens.
- **Impacted:** every later phase (schema barrel, env, outbox contract, RLS convention, test harness).
- **Will verify:** unit (env schema, CSV, date range); integration on local Supabase (outbox tx semantics, RLS baseline, seeds idempotent, migrations from empty DB); e2e smoke; `next build`.
- **Deliberately skipped:** feature behaviour (none exists yet); hosted Supabase deploy (hosting TBD).
- **Safety-critical (migrations, config, RLS, data mutations) → full test set required.**

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Next 16 APIs differ from assumptions (proxy, next-intl plugin compatibility) | M | H | Step 1 docs read; pin `next-intl` version that declares Next 16 support; smoke test |
| `.tkmignore` blocks agents from `node_modules/next/dist/docs` | H | M | User adds `!dist` re-include or reads docs manually; flag before phase starts |
| drizzle custom SQL vs generated drift | M | M | Single journal; `db:reset` in CI-like local run on every migration change |
| Storage schema differs local vs hosted | L | M | SQL bucket insert is the documented approach; verify once on hosted |
| Figma variables incomplete | M | L | Fall back to `get_design_context` styles on the listed frames; record gaps |
| Seed lists not final (BTC) | H | L | Upsert-by-key seeds; re-run safe |

Rollback: each migration is additive; local `db:reset`. No production data yet.

## Security Considerations
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` server-only (`server-only` import; never `NEXT_PUBLIC_`). `.env*` git-ignored except `.env.example`.
- RLS on, no client policies (C-20); public Realtime off is a dashboard setting — document in `.env.example` comments / phase 11.
- Outbox payloads carry ids only (no Kudo body, no anonymous sender name).
- CSV formula-injection guard centralised (C-14).
- Private bucket; no sender id in object paths.

## Next Steps
- Unblocks 02 ∥ 03 immediately.
- Contracts consumed later: `DomainEventOutbox#add` (04, 06, 08, 10), `shared/admin/*` (08, 11, 14), seeds (02 departments, 04 hashtags, 10 prize catalog), `rls-baseline.test.ts` guards every new table.
