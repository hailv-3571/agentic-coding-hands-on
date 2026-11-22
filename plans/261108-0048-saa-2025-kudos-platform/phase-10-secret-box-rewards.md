---
phase: 10
feature: F010
priority: P2
status: completed
depends_on: [06]
file_ownership:
  - features/secret-box-rewards/**
  - shared/db/schema/secret-box-rewards.ts
  - db/migrations/*_secret_box*
  - db/migrations/*_national_kudos*
  - db/seeds/secret-box-prize-loader.ts
  - app/api/secret-boxes/**
  - app/api/internal/secret-box/**
  - features/kudos-feed/components/live-board-rewards-column-slot.tsx   # seam handed over by phase 05
  - tests/**/secret-box-rewards/**
shared_file_edits (additive only, sequential after owner phase):
  - db/seeds/apply-all-seeds.ts         # phase 01: append prize loader call (run-seeds.ts is the CLI entry only)
  - shared/config/env.ts, .env.example  # phase 01: add INTERNAL_JOB_SECRET
  - shared/db/schema/index.ts           # phase 01: export barrel
  - features/kudos-hearts/server/heart-ranking-query.ts  # phase 06: optional tie-break param (C-19, see Key Insights)
  - messages/vi.json, messages/en.json  # secretBox.* keys only
resolves: [C-01 (F010 side), C-02 (consumer), C-03 (SetCompleted.giftName), C-15 (prize table + loader), C-16 (writer), C-19 (National Kudos via HeartRankingQuery), C-20 (5 new tables)]
---

# Phase 10 — Secret Box rewards (F010)

## Context Links
- Spec: `spec/secret-box-rewards/functional-spec.md` (CAP-01..06, FR/BR, D001..D012), `spec/secret-box-rewards/technical-spec.md` (§ 2 A1..A7, § 4.2 data model, SM-001/002, ALG-001..003, INT-001/002)
- Screens: `spec/secret-box-rewards/screens/SCR-secret-box-open/spec.md` (Figma `1466:7069` page frame, `1466:7676`, `1466:7024`, `1466:7614`, `2995:15708`, `2995:15754` — unopened / opening / result / standby states), `spec/secret-box-rewards/screens/SCR-live-board-rewards-column/spec.md` (Live board `2940:13431` right column); icon row on profile `362:5097`
- Decisions: `spec/decision-log.md` — hearts on kudos user SENT; x2 doubles progress; anonymous counts; spam stops counting, granted/opened boxes kept; prizes/icons in DB with weight + stock; out of stock → icon; lock after `EVENT_END_AT`, existing boxes still openable; Kudos Quốc Dân finalized at `NATIONAL_KUDOS_FINALIZE_AT`
- Conflicts: `spec/system/architecture.md` § Consistency Check C-01, C-02, C-03, C-15, C-16, C-19, C-20
- Upstream: 01 (`DomainEventOutbox#add`, `db/seeds/secret-box-prize-catalog.ts`, env `SECRET_BOX_HEARTS_PER_BOX`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT`, RLS baseline test), 02 (session helper, `profiles`), 05 (`KudoPublicQuery.publicKudoIdsSubquery`, rewards-column seam), 06 (`HeartStatsQuery.receivedByUser(s)(…, asOf)` → `{weightedTotal, rawTotal, campaignActive}`, `HeartRankingQuery.heartCountsSubquery/rankKudoIds`)
- Downstream: 12 (`PersonalStatsPanel`, `IconCollection`), 13 (`BoxGranted`, `SetCompleted`, `NationalKudosFinalized`; deep link), 14 (`mystery_gift_awards.completed_at` = "Time to get 6 Badges")

## Overview
- Priority: P2 · Status: completed (2026-11-22)
- Grant boxes from heart totals (reconcile, never recount), open boxes server-side with idempotency + atomic stock, 6-icon collection + one-time mystery gift, personal stats panel, latest-10 gift winners, Kudos Quốc Dân job. Physical gifts delivered offline by BTC — app records, never tracks delivery.

## Key Insights
- **C-02:** progress = `HeartStatsQuery.receivedByUser(userId, asOf).weightedTotal` (x2 included, spam excluded at query time, anonymous included). No `kudo_hearts` SQL in this phase except via phase 06 exports.
- **Grant formula (ALG-001, adjusted):** `entitled = floor(weightedTotal(asOf = min(now, EVENT_END_AT)) / SECRET_BOX_HEARTS_PER_BOX)`; insert `seq = maxSeq+1 .. entitled`. Spec's "return 0 after lock" is dropped: clamping `asOf` already freezes hearts at `EVENT_END_AT`, and late reconcile (job lag, user first visit after event) must still grant boxes earned in-window. Totals dropping (spam/unheart) → `entitled < maxSeq` → insert nothing, never delete (BR-002). Un Spam after event can raise total → extra boxes (consistent with "Un Spam tự tính lại").
- **C-01/C-16 — no outbox consumption here.** Phase 13 is the *single* consumer of `domain_event_outbox.consumed_at` (phase 13 step 3 explicitly blocks a second consumer). So F010 does NOT consume `HeartAdded` and F005 never calls F010 in-process. Grant triggers:
  1. **Reconcile-on-read** (authoritative for UX, FR-401): stats panel load, `GET /api/secret-boxes/me`, before every open.
  2. **Sweep tick** (for timely `BoxGranted` notifications): internal job every 1 min reconciles distinct senders whose public kudos got hearts in the last 10 min (window overlap is safe: reconcile is idempotent). Missed ticks only delay a notification; read path still grants.
- **Serialization:** both reconcile and open take `pg_advisory_xact_lock(hashtext('secret_box:' || userId))` → per-user ops are serial; `UNIQUE(user_id, seq)` + `UNIQUE(user_id, open_request_id)` are the belt behind the lock. Cross-user contention only on prize stock rows (conditional `UPDATE … WHERE stock_remaining > 0 RETURNING`).
- **Open idempotency (FR-402, BR-003):** `POST /api/secret-boxes/open` requires header `Idempotency-Key` (uuid v4, else 400) — route handler per C-18 convention (header-dependent). Inside the lock: existing box with that key → return its stored result (200, `replayed: true`); else open the lowest unopened `seq` (D010); none → 409 `NO_BOX_LEFT`.
- **Draw (ALG-002):** `crypto.randomInt` weighted pick over `active AND (stock_remaining IS NULL OR > 0)`; gift → conditional decrement, lost race → redraw ≤ `MAX_REDRAW=3`, then icon-only pool. Icons have `stock_remaining NULL` (unlimited) → pool never empty if ≥1 active icon (seed + DB check test).
- **Mystery gift (BR-005, C-03):** after icon upsert, `count(*) FROM user_icons WHERE user_id=$u` = 6 → `INSERT mystery_gift_awards … ON CONFLICT (user_id) DO NOTHING RETURNING`; only on insert → outbox `SetCompleted{userId, giftName}`. `giftName` = `MYSTERY_GIFT_NAME` constant (Figma copy, BTC final), snapshotted into the row.
- **Stock re-seed safety:** table keeps `stock_total` + `stock_remaining`. Loader upsert on `code`: insert sets remaining = total; on conflict `stock_remaining = GREATEST(EXCLUDED.stock_total - (old.stock_total - old.stock_remaining), 0)` → BTC can raise/lower totals by editing the seed file and re-running without resetting issued count.
- **C-19 tie-break discrepancy:** phase 06 `rankKudoIds` breaks ties `created_at DESC` (Highlight), BR-008/D006 wants earlier kudo first. Resolution: additive optional param `rankKudoIds(subquery, limit, {asOf?, tieBreak?: 'newest'|'oldest'})`, default `'newest'` (phase 05/06 behavior unchanged). Still one ranking SQL.
- **Kudos Quốc Dân (ALG-003):** top 5 public kudos by raw heart count with `asOf = NATIONAL_KUDOS_FINALIZE_AT`, `hearts ≥ 1`, tie `oldest`; advisory lock + `EXISTS national_kudos` short-circuit + `UNIQUE(rank)`, `UNIQUE(kudo_id)` → exactly once. Spam status read at finalize time. Outbox `NationalKudosFinalized{items[{kudoId, senderId, rank}]}` (senderId internal; phase 13 must not leak it for anonymous kudos).
- **Lock config:** no `SECRET_BOX_LOCK_AT` — lock = `EVENT_END_AT` (phase 01 note, YAGNI).
- **Panel counts:** "Kudos nhận/đã gửi" = `count(*)` over `KudoPublicQuery.publicKudoIdsSubquery({recipientId|senderId})` (public only, anonymous counted for sender, D011); "Tim nhận được" = `weightedTotal` + x2 badge when `campaignActive` (FR-202); opened/unopened = `secret_boxes` grouped by status.

## Requirements
- Functional: FR-001..004, FR-101, FR-102, FR-201..207, FR-301..304, FR-401..408, FR-601..604; BR-001..009; DEC-001..003; SM-001, SM-002; ALG-001..003; INT-001, INT-002; US001..US006; D001..D012 defaults (D005 date → `EVENT_END_AT`).
- Deep link: modal opens from `/kudos?secretBox=open` (contract for phase 13 `box_granted` link).
- Non-functional: open p95 < 250 ms; stats panel ≤ 4 queries; files < 200 lines; `server-only` on every server module.

## Architecture
```
Live board RSC ─► RewardsColumn (slot rewrite)
   ├ PersonalRewardStatsQuery.forUser(sessionUser)
   │    ├ SecretBoxGrantService.reconcileForSender(u, now)   ── tx + advisory lock
   │    │     └ HeartStatsQuery.receivedByUser(u, min(now,EVENT_END_AT)).weightedTotal (06)
   │    │     └ INSERT secret_boxes seq..entitled ON CONFLICT DO NOTHING ; inserted>0 → outbox BoxGranted{userId,count}
   │    ├ counts via KudoPublicQuery.publicKudoIdsSubquery (05) ; box status counts
   │    └ HeartStatsQuery (weightedTotal, campaignActive)
   ├ PersonalStatsPanel (client button) ─► SecretBoxModal
   └ LatestGiftWinnersList ◄ LatestGiftWinnersQuery.top10 (opened boxes ⋈ prizes kind=gift ⋈ profiles, opened_at DESC)
SecretBoxModal (SM-002: waiting|empty → opening → result → waiting|empty)
   ├ GET  /api/secret-boxes/me   → SecretBoxQuery.openScreenState (reconcile first) {unopened, icons}
   └ POST /api/secret-boxes/open (Idempotency-Key) → SecretBoxOpenService.openNext(u, key)
         tx: advisory lock → replay? → pick box (min seq unopened) → PrizeDrawService.draw(tx)
             → update box opened → icon? upsert user_icons(+1) → set complete? mystery_gift_awards + outbox SetCompleted
IconCollection ◄ IconCollectionQuery.forUser(userId)  (own + other profile, phase 12)
pg_cron '* * * * *' → pg_net POST /api/internal/secret-box/tick (x-job-secret)
   └ SecretBoxSweepJob.run(now): senders with hearts in last 10 min → reconcile each
   └ NationalKudosFinalizeJob.run(now): now < FINALIZE_AT → noop ; else once → national_kudos + outbox
```
Tables (one Drizzle file, RLS on, no client policies — C-20):
- `secret_box_prizes (id uuid pk, code text unique, kind text check in ('icon','gift'), icon_code text null check (kind='icon') = (icon_code is not null), name text, weight int check >0, stock_total int null, stock_remaining int null check >=0, active bool default true)`; unique partial `(icon_code) where kind='icon'`; `icon_code` ∈ 6 codes (CHECK): `REVIVAL, TOUCH_OF_LIGHT, STAY_GOLD, FLOW_TO_HORIZON, BEYOND_THE_BOUNDARY, ROOT_FURTHER` (display order = this order).
- `secret_boxes (id uuid pk, user_id fk profiles, seq int, status text check in ('unopened','opened'), prize_id fk null, open_request_id uuid null, granted_at default now(), opened_at null)`; `UNIQUE(user_id,seq)`, `UNIQUE(user_id,open_request_id)`, index `(user_id,status)`, `(status, opened_at desc)`; CHECK `status='opened' ⇔ prize_id, opened_at, open_request_id not null`.
- `user_icons (user_id fk, icon_code text, quantity int check >=1, first_obtained_at, pk(user_id, icon_code))`.
- `mystery_gift_awards (user_id pk fk, gift_name text, completed_at default now())`.
- `national_kudos (kudo_id pk fk kudos, rank smallint unique check 1..5, hearts_at_finalize int, finalized_at)`.
- Trigger-free; one-way status (`opened` never reverts) enforced by `UPDATE … WHERE status='unopened'`.

## Related Code Files
Create:
- `shared/db/schema/secret-box-rewards.ts`; `db/migrations/NNNN_secret_box_rewards.sql` (drizzle-kit), `NNNN_secret_box_rewards_checks_rls.sql` (custom: CHECKs Drizzle can't express, RLS enable), `NNNN_secret_box_tick_cron.sql` (custom: pg_cron + pg_net + Vault secret, down unschedules)
- `db/seeds/secret-box-prize-loader.ts` (reads phase-01 catalog; stock-safe upsert)
- `features/secret-box-rewards/secret-box-config.ts` (MAX_REDRAW, ICON_CODES order, MYSTERY_GIFT_NAME, LATEST_WINNERS_LIMIT=10, NATIONAL_KUDOS_COUNT=5, SWEEP_WINDOW_MIN=10)
- `features/secret-box-rewards/server/`: `secret-box-advisory-lock.ts`, `secret-box-grant-service.ts`, `prize-weighted-pick.ts` (pure), `prize-draw-service.ts`, `secret-box-open-service.ts`, `icon-collection-service.ts` (upsert + set-complete), `secret-box-query.ts`, `icon-collection-query.ts`, `personal-reward-stats-query.ts`, `latest-gift-winners-query.ts`, `secret-box-sweep-job.ts`, `national-kudos-finalize-job.ts`, `internal-job-guard.ts` (constant-time secret compare)
- `features/secret-box-rewards/schemas/open-secret-box-schemas.ts` (Idempotency-Key, response DTO)
- `features/secret-box-rewards/components/`: `rewards-column.tsx`, `personal-stats-panel.tsx`, `open-secret-box-button.tsx`, `icon-collection.tsx`, `latest-gift-winners-list.tsx`, `secret-box-modal.tsx`, `secret-box-modal-states.tsx` (waiting/opening/result/empty views), `use-secret-box-opener.ts` (state machine + key per click)
- `app/api/secret-boxes/me/route.ts` (GET), `app/api/secret-boxes/open/route.ts` (POST), `app/api/internal/secret-box/tick/route.ts` (POST)
- Tests: unit `prize-weighted-pick.test.ts`, `use-secret-box-opener.test.ts` (SM-002), `open-secret-box-schemas.test.ts`; integration `secret-box-grant-concurrency.test.ts`, `secret-box-grant-rules.test.ts`, `secret-box-open-idempotency.test.ts`, `prize-stock-race.test.ts`, `mystery-gift-once.test.ts`, `national-kudos-finalize.test.ts`, `secret-box-api-auth.test.ts`, `internal-tick-guard.test.ts`, `prize-loader-reseed.test.ts`, `secret-box-migration.test.ts`; e2e `secret-box-open-flow.spec.ts`, `rewards-column.spec.ts`
Modify: `features/kudos-feed/components/live-board-rewards-column-slot.tsx` (seam → `RewardsColumn`), shared additive edits listed in frontmatter.
Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` — Route Handlers (headers, status), RSC data loading, client modal + `useSearchParams` deep link. Spike on local Supabase: `pg_cron` + `pg_net` + Vault (fallback: host cron hitting same endpoint; record choice for phase 13 reuse).
2. Schema + migrations (tables, CHECKs, indexes, RLS enable); up/down from empty DB; `rls-baseline.test.ts` stays green.
3. Prize loader + `apply-all-seeds.ts` hook; re-seed test (issued count preserved, total change applied, never negative).
4. `prize-weighted-pick.ts` (pure, injectable random int) — unit first: distribution, zero-stock excluded, icon fallback.
5. Grant service (ALG-001 adjusted) + advisory lock helper; outbox `BoxGranted` only when inserted > 0; HeartStatsQuery failure → throw, nothing written (caller decides: read path renders stats error, sweep logs and continues).
6. Open service + draw + icon service in one tx (ALG-002, BR-005); map results to DTO `{kind, iconCode?, name, setCompleted, giftName?, unopenedLeft, replayed}`.
7. Queries: open-screen state, icon collection (6 slots, owned flag + quantity), personal stats, latest winners (real names, FR-604; logged-in only).
8. Route handlers: session → userId (401 before DB), validate key, map `NO_BOX_LEFT` 409, unknown → 500 without internals. Tick route: guard, run sweep then finalize, return counts.
9. Heart ranking tie-break param (additive, default unchanged) + phase 06 ranking test extended for `'oldest'`.
10. Finalize job (ALG-003) via `rankKudoIds(publicKudoIdsSubquery({}), 5, {asOf: FINALIZE_AT, tieBreak:'oldest'})` ⋈ `heartCountsSubquery`.
11. Components per Figma (claude.ai Figma MCP, file `9ypp4enmFmdK3YAFJLIu6C`): panel (5 rows, x2 badge, disabled button + tooltip DEC-001), winners list (scroll, empty state), icon collection (6 circles, grey empty), modal states; new `Idempotency-Key` per user click, reused on retry of the same click; button locked while opening; network error → back to waiting + toast (box not lost: replay with same key returns result). `prefers-reduced-motion` → skip animation.
12. Rewrite seam; i18n `secretBox.*`; tests per Scope Contract; reviewer.

## Todo List
- [x] Next docs + pg_cron/pg_net spike (record fallback)
- [x] Schema, migrations, CHECKs, RLS, cron migration
- [x] Prize loader + re-seed safety
- [x] Weighted pick (+unit)
- [x] Grant service + sweep job
- [x] Open service + draw + icon/mystery gift
- [x] Queries (state, icons, stats, winners)
- [x] Route handlers + internal tick guard
- [x] HeartRankingQuery tie-break param + National Kudos job
- [x] UI: RewardsColumn, PersonalStatsPanel, IconCollection, LatestGiftWinnersList, SecretBoxModal
- [x] Seam rewrite + i18n
- [x] Concurrency/idempotency integration tests + e2e

Evidence: `plans/reports/implementer-261122-phase-10-secret-box-{backend,ui,review-fixes}.md`, `tester-261122-phase-10-full-run.md`, `reviewer-261122-phase-10.md`; screenshots in `evidence/screenshots/phase-10/` (rewards column, modal idle/result/duplicate icon; desktop 1440x900 + mobile 375x812).

## Success Criteria
- [x] **Grant never over-issues:** 20 parallel `reconcileForSender` (mix of read path + sweep) with weightedTotal 23 → exactly 4 boxes (seq 1..4), one `BoxGranted{count:4}`; rerun → 0 inserted, no event. Evidence: integration `secret-box-grant-concurrency`.
- [x] x2 heart counts 2; anonymous counts; spam lowers the total, boxes stay, no grant until the next threshold; hearts after `EVENT_END_AT` ignored; late reconcile still grants in-window boxes. Evidence: integration `secret-box-grant-rules` (also outbox-failure rollback).
- [x] **Open idempotent:** 10 parallel POST same key → one box opened, identical result; 2 unopened + different keys → exactly 2 opened, rest 409. Evidence: integration `secret-box-open-idempotency`. The replay differs only by `replayed: true`.
- [x] **Stock race:** gift stock 1, 30 users → exactly 1 gift, `stock_remaining = 0`, 29 icons. Evidence: integration `prize-stock-race`.
- [x] **Mystery gift once:** parallel opens completing the set → one `mystery_gift_awards` row, one `SetCompleted{userId, giftName}`; duplicates only add quantity. Evidence: integration `mystery-gift-once`.
- [x] National Kudos: no-op before `FINALIZE_AT`; 5 concurrent runs → 5 rows and one event; spam excluded; older kudo first on ties. Evidence: integration `national-kudos-finalize`.
- [x] No session → 401 (before any DB read); userId never from input; tick 503 when unset, 401 without/with wrong secret; winners hidden from guests. Evidence: integration `secret-box-api-auth`, `internal-tick-guard`, `rewards-column-data-loader`; e2e guest `GET /kudos` → 307 `/login`, no winners data. The tick's 200 path is verified only with an env override (integration), not on a live server.
- [x] UI: button disabled at 0 boxes (tooltip), modal states match Figma frames, deep link opens the modal. Evidence: e2e `secret-box-open-flow`, `rewards-column`, `secret-box-modal-focus-and-motion`, `rewards-column-x2-campaign-badge`; screenshots. **Not covered:** `IconCollection` on own and other profile (no profile page until phase 12); unit/component tests only.
- [x] Gates on the final code (after the review-fix round, as reported by the implementer): `tsc` 0 errors, lint 0, unit 709, integration 406, e2e 113 passed / 5 skipped (prelaunch-only, own config) / 0 failed, prelaunch e2e 5 passed / 1 skipped, build ok, `test:prod` all checks pass. The tester's own full run (unit 703, integration 393, e2e 108 + 5 skipped, `test:prod` 16/16) was on the code before the review fixes and was not repeated by the tester afterwards.
- [x] Reviewer: SEALED, score 8, 0 critical / 0 high. The 0016 portability finding and the tick overlap/cap finding are fixed; the anonymous `senderId` finding is a phase 13 constraint (decision log).
- Risk sign-off: per the user's conditional pre-approval 2026-11-22, recorded at commit time.

## Delivery Notes
Drift from the plan text:
- **Reconcile reads hearts before the lock.** `HeartStatsQuery` goes through the 10-connection pool; reading it while holding the advisory lock starved the pool under a 20-way race. Totals are read first, a cheap `max(seq)` pre-check skips the lock when nothing is due, and the insert range `max(seq)+1 .. entitled` is computed under the lock, so a stale total can only grant boxes already earned.
- **Replay derives `setCompleted` / `duplicate` from timestamps, no extra columns:** `mystery_gift_awards.completed_at = secret_boxes.opened_at`; `user_icons.first_obtained_at <> secret_boxes.opened_at` (all `now()` of the open transaction; `<>` not `<`, because a transaction that BEGINs first can take the user lock second).
- **`rankKudoIds` 3rd argument is an options object** `{ asOf?, tieBreak?: 'newest' | 'oldest' }` (was a positional `asOf`). Default `'newest'`, Highlight order unchanged; the only other caller passes none.
- **Public path for the tick:** `SECRET_BOX_TICK_PATH` added to `PUBLIC_PATHS` in `shared/auth/public-paths.ts` (outside the ownership list), exact match only. Cron sends no cookie; the handler guards itself with `x-job-secret`.
- **`INTERNAL_JOB_SECRET` is optional** (min 32 chars when set; a blank `.env.example` line means unset). Unset: boot unaffected, tick answers 503 `not_configured`.
- **0016 is guarded:** it skips with a NOTICE when `pg_cron` / `pg_net` is unavailable or not preloaded, or `vault.decrypted_secrets` is missing, so plain Postgres DBs no longer abort the migration chain. Down is a symmetric no-op guard. The plan listed a third custom migration for CHECKs and RLS; both live in 0015, so there are two migrations (0015, 0016).
- **Tick overlap guard and cap:** the whole tick runs in one transaction holding `pg_try_advisory_xact_lock(hashtext('secret_box_tick'))` (transaction-scoped, not session-level: unsafe behind the transaction pooler and leaks if the process dies); lock held → 200 `{skipped:true}`. `SWEEP_MAX_SENDERS_PER_TICK = 500`; the sweep reads two batches (totals, `max(seq)` per user), reconciles only due senders and reports `sweep.deferred`. The tick holds 1 of 10 pool connections while it runs.
- **Rewards column data loader:** `server/rewards-column-data-loader.ts` calls `requireSunner()` before any query; the seam `live-board-rewards-column-slot.tsx` is render-only. A guest is redirected to `/login` and no winners query runs.
- **No branded gift photo** (decision log): gifts show a gold glow over the open box plus the prize name.
- **`duplicate` flag added** to `OpenSecretBoxResult` (additive; DEC-002 E08 caption). The client treats a missing field as no caption.
- Opening stays allowed after `EVENT_END_AT`; no `LAUNCH_AT` gate (no box can exist before launch); no `SECRET_BOX_LOCK_AT`.

## Open items
- BTC: `MYSTERY_GIFT_NAME` ("Quà bí ẩn từ BTC SAA 2025"), catalog weights and stock are placeholders; the set-complete line copy (E09) is inferred; prize names are vi only.
- No index on `kudo_hearts.created_at` (phase 06 table): the sweep does a seq scan each minute. Add one if hearts grow large.
- Re-seed with `stock_total` below the issued count stores total < issued, and later re-seeds under-count issued (BTC-driven edge).
- `national_kudos.kudo_id` is `ON DELETE CASCADE`: if all five winners were hard-deleted, the next tick finalizes again (second event). Very unlikely.
- **Phase 13 constraint:** `NationalKudosFinalized.items[].senderId` is the real sender, also for anonymous kudos. Never put it, or anything derived (name, avatar, profile link), in a recipient-visible notification, public feed or API response to other users. Logged in `spec/decision-log.md` and in `phase-13-notifications.md`.
- Live cron path untested end to end: `INTERNAL_JOB_SECRET` is unset in the dev env, so pg_cron → pg_net → endpoint never ran, and the tick's 200/401 answers rest on integration with an env override. Do one live POST with a right and a wrong header before launch.
- Reviewer's optional "replay lookup before reconcile" is not done (each retried open pays a heart read).
- Spec text in `docs/features/F010_SecretBoxRewards/` still describes `SECRET_BOX_LOCK_AT`, `HeartAdded` consumption and `SKIP LOCKED`; sync via `rebuild-spec --features F010`.

## Scope Contract
- **Changed:** F010 feature module, 5 tables + 3 migrations, prize loader, 3 route handlers, cron job, rewards-column seam, additive edits (env, seed runner, schema barrel, ranking tie-break, i18n).
- **Impacted:** phase 05 Live board layout (seam), phase 06 ranking callers (Highlight default order), phase 12/13/14 consumers of components, events and `mystery_gift_awards`, outbox table, RLS baseline, env boot validation.
- **Will verify:** unit (weighted pick, SM-002 hook, schemas); integration on local Supabase (all concurrency criteria above, grant rules incl. spam/x2/anonymous/asOf, outbox-in-tx rollback, migration up/down + CHECKs, RLS baseline, prize re-seed, API auth + internal guard, phase 06 ranking tests re-run for default + `'oldest'`); e2e (open flow through all modal states + replay on network retry, rewards column with/without boxes, empty winners).
- **Deliberately skipped:** notification rendering of emitted events (phase 13), profile page composition (12), admin "Time to get 6 Badges" column (14), pixel-perfect animation timing (Figma marks prototype only).
- **Safety-critical → full test set required:** migrations/schema, data mutations (grant, open, stock, awards, national kudos), outbox, auth on APIs, internal secret-guarded endpoint, config (env key), shared ranking contract.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Over-grant / double open under races | M | H | Per-user advisory lock + UNIQUE(seq), UNIQUE(open_request_id); concurrency tests |
| Gift over-issued past stock | M | H | Conditional decrement in tx; redraw then icon fallback; stock race test |
| Second outbox consumer clobbers phase 13 `consumed_at` | M | H | Design forbids it: sweep + reconcile-on-read; no `consumed_at` writes in this phase (grep check in review) |
| pg_cron/pg_net unavailable | M | M | Host cron fallback to same endpoint; read path still grants (only notification delay) |
| Re-seed resets issued stock | M | H | `stock_total` + delta upsert; re-seed test |
| Ranking tie-break change breaks Highlight | L | M | Additive param, default unchanged; re-run phase 06 ranking tests |
| Stock row contention at peak | L | M | Few gift rows, short tx; measure p95 with 100 parallel opens |
| Leaking anonymous sender via winners/national event | L | H | Winners list = gift recipients only (own boxes); event payload ids only; phase 13 owns rendering |

Rollback: down migrations drop cron job, then `national_kudos`, `mystery_gift_awards`, `user_icons`, `secret_boxes`, `secret_box_prizes` (FK order); revert seam to `null`; revert ranking param (default path unchanged); unconsumed F010 outbox rows are inert. Opened-box data is lost on rollback → after event go-live, roll forward only.

## Security Considerations
- `userId` from Supabase session only; 401 before DB; box lookup always `WHERE user_id = $session`.
- Result decided server-side with CSPRNG (`crypto.randomInt`); client sends only the key (FR-602).
- Tick endpoint: secret header, constant-time compare, server DB role, secret in Vault; no browser path to finalize (FR-603).
- RLS on all 5 tables, no client policies (C-20). Outbox payloads ids + `giftName` only.

## Next Steps
- Phase 12 mounts `PersonalStatsPanel` (own profile) and `IconCollection` (own + other).
- Phase 13 consumes `BoxGranted`, `SetCompleted{userId,giftName}`, `NationalKudosFinalized`; links to `/kudos?secretBox=open`; may reuse the cron mechanism decided in step 1.
- Phase 14 reads `mystery_gift_awards.completed_at`.
- Open: BTC final prize weights/stock + `MYSTERY_GIFT_NAME` copy; responsive placement of rewards column (owned by phase 05 layout).
