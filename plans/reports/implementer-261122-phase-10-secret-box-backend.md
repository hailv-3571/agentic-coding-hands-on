# Phase 10 (F010) Secret Box rewards — backend implementer report

Date: 2026-11-22 · Role: implementer (RED-first) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-10-secret-box-rewards.md`

**Integration runs are FINISHED (last full run 2026-11-22 ~21:40). E2E can start.** The shared DB is clean: 9 catalog prizes active at full stock, 0 boxes/icons/F010 events, `national_kudos` empty.

## Scope Contract
- **Changed:** 5 tables + 2 migrations (+down), prize loader + seed hook, F010 server module (grant / open / draw / icons / queries / jobs / guards), 3 route handlers, the rewards seam, additive edits: env `INTERNAL_JOB_SECRET`, `.env.example`, schema barrel, ranking `tieBreak` option, proxy public path for the tick.
- **Impacted:** phase 05 Live board (the seam), phase 06 ranking callers (Highlight), env boot validation, session proxy route policy and prelaunch gate, RLS baseline, seeds, the outbox.
- **Will verify:** unit for the weighted pick, the key schema, env and proxy access. Integration on local Supabase for every plan success criterion, plus migration up/down, RLS baseline, seeds, and phase 05/06 regressions. Then the full unit and integration suites once.
- **Deliberately skipped:** e2e (UI agent / tester own it, and I may not run it); notification rendering (phase 13); profile composition (phase 12).

## Files
Created (all under 200 lines, `server-only` on every server module):
- `shared/db/schema/secret-box-rewards.ts`: `secret_box_prizes`, `secret_boxes`, `user_icons`, `mystery_gift_awards`, `national_kudos`. Every CHECK is in Drizzle, RLS is on, there are no policies.
- `db/migrations/0015_secret_box_rewards.sql` (drizzle-kit, journal + snapshot) + `.down.sql`.
- `db/migrations/0016_secret_box_tick_cron.sql` (`--custom`: pg_cron + pg_net, URL/secret from Vault) + `.down.sql`.
- `db/seeds/secret-box-prize-loader.ts`: upsert by code (= catalog `iconKey`), with `icon_code` = UPPER_SNAKE of the key. Stock-safe re-seed: remaining = max(new total − issued, 0). Prizes dropped from the catalog are deactivated.
- `features/secret-box-rewards/secret-box-config.ts`: MAX_REDRAW=3, MYSTERY_GIFT_NAME, LATEST_WINNERS_LIMIT=10, NATIONAL_KUDOS_COUNT=5, SWEEP_WINDOW_MIN=10.
- `features/secret-box-rewards/schemas/open-secret-box-schemas.ts`: `IDEMPOTENCY_KEY_HEADER` and `parseIdempotencyKey` (UUID v4, lower-cased). Client-safe.
- `features/secret-box-rewards/server/`: `prize-weighted-pick.ts` (pure, injectable `randomInt`, CSPRNG by default), `secret-box-advisory-lock.ts`, `secret-box-grant-service.ts`, `secret-box-sweep-job.ts`, `prize-draw-service.ts`, `icon-collection-service.ts`, `secret-box-open-service.ts`, `secret-box-query.ts`, `icon-collection-query.ts` (**`IconCollectionQuery.forUser(userId)` for phase 12**), `personal-reward-stats-query.ts`, `latest-gift-winners-query.ts`, `national-kudos-finalize-job.ts`, `internal-job-guard.ts`, `secret-box-api-session.ts`.
- `app/api/secret-boxes/me/route.ts` (GET), `app/api/secret-boxes/open/route.ts` (POST), `app/api/internal/secret-box/tick/route.ts` (POST).
- Tests: `tests/unit/secret-box-rewards/{prize-weighted-pick,open-secret-box-schemas,internal-tick-proxy-access}.test.ts` and `tests/integration/secret-box-rewards/` (12 test files + `secret-box-fixtures.ts` + `secret-box-env-override.ts`).

Modified (additive):
- `shared/db/schema/index.ts` (+1 export line), `db/seeds/apply-all-seeds.ts` (+`secretBoxPrizes`).
- `shared/config/env-schema.ts`: `INTERNAL_JOB_SECRET`, optional, at least 32 characters.
- `.env.example`: placeholder, comment, and the generation command.
- `features/kudos-hearts/server/heart-ranking-query.ts`: `rankKudoIds(candidates, limit, { asOf?, tieBreak?: 'newest'|'oldest' })`. The default stays `'newest'`, so the Highlight order is unchanged.
- `features/kudos-feed/components/live-board-rewards-column-slot.tsx`: the seam. It wires session → `PersonalRewardStatsQuery` + `LatestGiftWinnersQuery` → `<RewardsColumn data>` (the UI agent's file was present). Each panel fails on its own to `null`, and the seam has its own `<Suspense fallback={null}>` so the feed streams first.
- **Outside my listed ownership (needed for the tick to work):** `shared/auth/public-paths.ts` adds `SECRET_BOX_TICK_PATH` to `PUBLIC_PATHS`. Without it, the session proxy answers 401 to pg_cron and host cron, because they send no cookie. The exact path only; look-alikes stay gated (unit test).
- Existing tests extended: `tests/integration/foundation/seeds.test.ts` (report shape), `tests/unit/shared/env-schema.test.ts` (new case), `tests/integration/kudos-hearts/heart-ranking-query.test.ts` (`asOf` now passed as an option, plus an `'oldest'` case and a default-unchanged case).

## Key design decisions
- **Grant (ALG-001 adjusted):** `asOf = min(now, EVENT_END_AT)`, `entitled = floor(weighted / SECRET_BOX_HEARTS_PER_BOX)`, insert seq `max+1..entitled` with `ON CONFLICT DO NOTHING`. `BoxGranted{count}` is written in the same transaction, and only when rows were inserted.
  - Heart totals are read **before** the transaction. A cheap `max(seq)` pre-check then skips the lock when nothing is due. Reason: the pool has 10 connections, and reading through the pool while holding the advisory lock starved it under a 20-way race.
- **Open:** a best-effort reconcile runs first, so already-granted boxes still open if the heart read fails. Then one transaction: user advisory lock → replay by `(user_id, open_request_id)` → lowest unopened seq `FOR UPDATE` → draw → mark opened → icon upsert → mystery gift (`ON CONFLICT DO NOTHING`, and `SetCompleted` only on insert).
  - A replay re-derives `setCompleted` / `giftName` from `mystery_gift_awards.completed_at = secret_boxes.opened_at`. Both are `now()` in the same transaction, so no extra column is needed.
- **Draw:** a conditional decrement guards gift stock. A lost race triggers a redraw (at most 3), then falls back to icons only. A transaction holds at most one prize row lock, so stock contention cannot deadlock.
- **Opening window:** allowed after `EVENT_END_AT` (decision log). **No gate before `LAUNCH_AT`:** no box can exist before launch, because hearts cannot be written then, and the proxy's prelaunch gate already returns 403 on `/api/*` for non-admins.
- **Kudos Quốc Dân:** returns `not_due` before `FINALIZE_AT`. Otherwise:
  - An `already_finalized` short-check runs, then the ranking (phase 06 `rankKudoIds`, `asOf=FINALIZE_AT`, `tieBreak:'oldest'`, joined with `heartCountsSubquery` for counts and sender), keeping hearts ≥ 1.
  - Then lock → re-check → insert ≤ 5 rows → one `NationalKudosFinalized{items[{kudoId,senderId,rank}]}`.
  - If no public kudo has hearts, nothing is written (`nothing_to_finalize`).
- **API:** the user id comes from `getSessionUser()` only, and the 401 is answered before any DB read. Error bodies are `{code}` only. Every answer carries `Cache-Control: private, no-store` (the tick uses `no-store`).
- **Tick:** 503 `not_configured` while the secret is unset. 401 for a missing or wrong `x-job-secret`, compared as SHA-256 digests with `timingSafeEqual` (length-independent). Otherwise it runs the sweep, then the finalize job (each in its own try), and answers 200 `{sweep, nationalKudos}`, or 500 if either job failed.

## Cron decision (record for phase 13 reuse)
- **Spike:** local Supabase (PG 17.11) has `pg_cron` 1.6.4 and `pg_net` 0.20.4 preloaded, plus `supabase_vault` installed. `create extension`, `vault.create_secret`/`decrypted_secrets` and `cron.schedule`/`unschedule` all worked in a rolled-back transaction.
- **Shipped:** the cron migration `0016`. It creates the extensions (`pg_net` in schema `extensions`) and upserts the job `saa-secret-box-tick` (`* * * * *`).
  - The job calls `net.http_post(url, headers{x-job-secret}, '{}', 30 s)` with the URL and secret read from Vault, and sends nothing until both secrets exist.
  - The down migration only unschedules the job; the extensions stay because they are shared.
- **Per-environment setup (docs-ready):**
  ```sql
  select vault.create_secret('<INTERNAL_JOB_SECRET>', 'saa_internal_job_secret');
  select vault.create_secret('https://<app-origin>/api/internal/secret-box/tick', 'saa_secret_box_tick_url');
  -- local Docker stack: http://host.docker.internal:3000/api/internal/secret-box/tick
  ```
  Set the same value as `INTERNAL_JOB_SECRET` in the app env.
- **Host-cron fallback:** POST the same endpoint every minute, for example:
  ```
  curl -fsS -X POST -H "x-job-secret: $INTERNAL_JOB_SECRET" https://<app-origin>/api/internal/secret-box/tick
  ```
  Reconcile-on-read works regardless; a missing tick only delays `BoxGranted`.
- **Not verified end to end:** pg_net → dev server, because `.env.local` has no `INTERNAL_JOB_SECRET` (agents cannot edit it) and the endpoint answers 503 until it is set.

## Env
- `INTERNAL_JOB_SECRET`: optional; at least 32 characters when set. Unset leaves boot unaffected and the tick answers 503. A shorter value fails boot with a readable error that never echoes the value.
- No `SECRET_BOX_LOCK_AT`: the lock is `EVENT_END_AT`.

## RED → GREEN
| Slice | RED (reason) | GREEN |
|---|---|---|
| Weighted pick (unit) | module missing | 8/8 |
| Migrations + RLS | relation `secret_box_prizes` does not exist (9 failing) | 9/9 + RLS baseline 8/8 |
| Prize loader + seeds hook | loader missing; seeds report lacked `secretBoxPrizes` | 5/5, seeds 3/3 |
| Grant + sweep (concurrency, rules, outbox rollback, stats failure) | service missing | 8/8 |
| Open / draw / icons / mystery gift / winners / icon collection / screen state | services missing | 11/11 |
| Open key schema, env key, proxy tick access (unit) | module missing / key absent / tick path gated | 303/303 in the affected unit folders |
| Routes + stats query | routes/query missing | 8/8 |
| Ranking `tieBreak` | asOf-as-option and `'oldest'` failed (2) | phase 06 ranking + highlight 13/13 |
| Kudos Quốc Dân | job missing | 3/3 |
| Tick guard | route missing | 7/7 |

Success criteria mapped to tests:
- **20-way grant race:** 20 parallel calls (half read-path, half sweep) → exactly seq 1..4 and one `BoxGranted{count:4}`; a rerun inserts nothing and emits nothing (`secret-box-grant-concurrency`).
- **Grant rules:** x2 counts 2, anonymous counts, spam keeps the boxes and grants again only past the next threshold (Un Spam restores), hearts after `EVENT_END_AT` are ignored while a late reconcile still grants, an outbox failure rolls back, a stats failure writes nothing (`secret-box-grant-rules`).
- **Open idempotency:** 10 parallel calls with the same key → one box opened and identical results; different keys against 2 boxes → 2 opened, the rest 409; replay still works after the boxes run out; a key never replays another user's box; opening works after `EVENT_END_AT` (`secret-box-open-idempotency`).
- **Stock race:** a gift with stock 1 against 30 users → exactly 1 issued, `stock_remaining = 0`, 29 icons; the winners list shows the real name and avatar, icons excluded (`prize-stock-race`).
- **Mystery gift:** parallel opens completing the set → 1 award and 1 `SetCompleted`; duplicates only increment the quantity; the completing key replays `setCompleted`; an event failure rolls the whole open back; the 6 icon slots come back in fixed order (`mystery-gift-once`).
- **Kudos Quốc Dân:** no-op before `FINALIZE_AT`; 5 concurrent runs → 5 rows and 1 event; ties put the older kudo first; spam and late hearts are excluded; the anonymous kudo's sender id appears in the event only; a rerun after a later spam change leaves the result unchanged (`national-kudos-finalize`).
- **API auth:** 401 with no DB touch, 400 for a bad key, userId from body/query ignored, replay, 409, private no-store (`secret-box-api-auth`).
- **Tick guard:** 503 unset, 401 for five bad-header variants, the sweep grants with the right secret (`internal-tick-guard`).
- **Prize re-seed safety** (`prize-loader-reseed`); **migration up/down + CHECKs + cron job** (`secret-box-migration`); **phase 06 ranking default unchanged + `'oldest'`**.

## Gates
| Gate | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Unit | `npm run test:unit` | 54 files / 703 tests passed (UI agent's `secret-box-rewards-ui` included) |
| Integration | `npm run test:integration` (full, once) | 58 files / 393 tests passed, 87.96 s |
| Schema drift | `npx drizzle-kit generate` | "No schema changes" |
| E2E | not run (forbidden for this role) | — |

## Message keys needed
- **None server-side.** The server returns `{code}` only:
  - open / me: `invalid_idempotency_key`, `unauthorized`, `no_box_left`, `unexpected`.
  - tick (internal, not user-facing): `not_configured`, `unauthorized`, `unexpected`.
- Prize names, gift names and `MYSTERY_GIFT_NAME` come from the DB or config as one language (vi); they are not i18n keys.

## Concerns
1. **Outside ownership:** `shared/auth/public-paths.ts` (tick path made public). It is required for any cron to reach the handler, and the handler guards itself. Please confirm.
2. **Contract gap (not changed):** DEC-002 "icon trùng thì kèm chú thích đã có". `OpenSecretBoxResult` has no duplicate flag, so the UI cannot show that caption. If wanted, add an optional `duplicate: boolean` later; the server knows it from the upsert.
3. **`MYSTERY_GIFT_NAME`** = "Quà bí ẩn từ BTC SAA 2025" is a placeholder; BTC confirms the final copy. Catalog weights and stock are still placeholders (phase 01 note). Prize names are not localized for `en`.
4. **Sweep performance:** the sweep filters `kudo_hearts.created_at` with no index (a seq scan every minute). That is fine at the expected volume; follow-up if hearts grow large: an index on `kudo_hearts(created_at)` (phase 06's table).
5. **x2 badge after the event:** the panel's `campaignActive` is evaluated at `min(now, EVENT_END_AT)`. After the event, the badge reflects the last counting instant.
6. **Replay `unopenedLeft`:** it is the current count at replay time, identical to the original unless other opens happened in between.
7. **Cron migration environment:** `0016` requires a Supabase Postgres (pg_cron/pg_net) wherever migrations run.
8. **Reviewer / code-simplifier not run:** the hook asked for them, but that step belongs to the orchestrator's chain.

## Docs-ready notes (for `docs/code-standards.md` / `docs/system/`)
- **Internal job endpoints** (`/api/internal/*`):
  - List the exact path in `PUBLIC_PATHS` (no prefix rule).
  - Guard with a shared-secret header compared by `timingSafeEqual` over SHA-256 digests.
  - Answer 503 while the secret is unset; send `Cache-Control: no-store`.
- **Advisory-lock transactions:** read through the `db` pool **before** taking the lock, never while holding it (pool starvation, 10 connections). The UNIQUE constraints stay as the belt.
- **Cron mechanism:** pg_cron + pg_net with the URL and secret in Vault (`saa_secret_box_tick_url`, `saa_internal_job_secret`), with host cron as the fallback. Phase 13 can reuse it.
- **Migrations 0015/0016** have `.down.sql` files (run 0016 down first).

**Status:** DONE_WITH_CONCERNS
**Summary:** The F010 backend is built RED→GREEN. Schema, migrations (incl. pg_cron/Vault tick), stock-safe prize loader, grant / open / draw / mystery gift / Kudos Quốc Dân, 3 route handlers, ranking `tieBreak`, env key and the wired seam are all in place. Every plan success criterion has an integration test, and tsc, lint, unit and the full integration suite are green. Integration runs are finished, so e2e can start.
**Concerns/Blockers:** Proxy public-path edit outside ownership (needed); contract has no duplicate-icon flag (DEC-002 caption); placeholder mystery gift name and catalog numbers; no `created_at` index for the sweep; cron not verified end to end because `INTERNAL_JOB_SECRET` cannot be set by agents.
