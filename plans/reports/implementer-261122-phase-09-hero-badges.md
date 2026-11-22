# Implementer report — Phase 09 Hero badges (F009)

Date: 2026-11-22 · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-09-hero-badges.md` · Role: implementer (RED-first)

**Status:** DONE_WITH_CONCERNS (all gates green; concerns are copy/docs follow-ups, not correctness)

## Scope Contract
- **Changed:** `features/hero-badges/**` (new), seams `enrich-hero-tier.ts` + `kudo-card-hero-badge-slot.tsx`, `kudo-card-sender.tsx` (slot call site), partial-index migration 0014 (+ down, journal, snapshot, one index line in `shared/db/schema/kudos.ts`), `hero.*` messages (vi/en), Thể lệ tier list now reads `hero.*` + `HeroBadge`.
- **Impacted:** every Kudo card (Live board feed, Highlight, detail, `/api/kudos` JSON), `kudos` write path (index maintenance), Thể lệ page, phase 05 statement-count + card-shape assertions.
- **Verified:** unit (ALG-001 boundaries, `tierCountRange`, tooltip placement at 375 px, one-open store); integration (counting rules, batching, payload, seam incl. anonymous + failure, migration up/down, EXPLAIN); e2e (badges, tooltip hover/focus/Esc/tap/one-at-a-time, anonymous sender); full suites as gates.
- **Skipped:** none — migration + anonymous exposure are safety-critical, so the full unit/integration/e2e/build/prod suites ran.

## Next.js 16 docs read (plan step 1)
`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `08-caching.md`.
- `HeroBadge` has no directive and no server imports → renders in RSC (Thể lệ) and inside client trees (All Kudos feed is `"use client"`). `HeroBadgeTooltip` / panel are `"use client"`; props are a tier string (serializable).
- Cache Components (`cacheComponents: true`): data is uncached unless `use cache`; the count query has none and runs inside the existing per-request feed loader → spam/un-spam shows on the next load (SC-003). No deviation.

## Files
Created
- `features/hero-badges/schemas/hero-tier.ts` — `HERO_TIERS`, `HeroTier` (client-safe)
- `features/hero-badges/server/hero-tier-constants.ts` — `HERO_*_MIN` 1/5/10/21, `HERO_QUERY_MAX_IDS = 500` (thresholds defined once)
- `features/hero-badges/server/tier-from-count.ts` — `tierFromCount`, `tierCountRange`
- `features/hero-badges/server/hero-tier-query.ts` — `HeroTierQuery.{getDistinctSenderCounts, getTiersByRecipientIds, distinctSenderCountSubquery}`
- `features/hero-badges/components/hero-badge.tsx`, `hero-badge-tooltip.tsx`, `hero-badge-tooltip-panel.tsx`, `place-hero-tooltip.ts`, `active-hero-tooltip-store.ts`
- `db/migrations/0014_kudos_hero_tier_index.sql` (+ `.down.sql`), `db/migrations/meta/0014_snapshot.json`, journal entry idx 14
- Tests: `tests/unit/hero-badges/{tier-from-count,place-hero-tooltip,active-hero-tooltip-store}.test.ts`; `tests/integration/hero-badges/{hero-tier-index-migration,hero-tier-query,hero-tier-query-plan,kudo-card-hero-tier}.test.ts`; `tests/e2e/hero-badges/hero-badge-tooltip.spec.ts`
- Evidence: `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-09/` — `phase-09-live-board-card-tooltip-desktop-1440x900.png`, `phase-09-live-board-card-tooltip-mobile-375x812.png`, `phase-09-rules-hero-tiers-desktop-1440x900.png` (temp spec deleted)

Modified
- `features/kudos-feed/server/enrich-hero-tier.ts` — one batch lookup (recipient + named sender ids), anonymous sender untouched (no `tier` field), failure → `console.error` + cards unchanged
- `features/kudos-feed/components/kudo-card-hero-badge-slot.tsx` — dot (4 px, #999/40 %) + `HeroBadgeTooltip`; nothing without tier
- `features/kudos-feed/components/kudo-card-sender.tsx` — passes `tabbable` (spam-overlay card keeps badge out of Tab order), shows the badge even without a department (no dot then), row `flex-wrap`, text block `@container` (dot hidden < 12rem so phones show the badge alone under the code)
- `shared/db/schema/kudos.ts` — partial index declaration (source of the drizzle migration, like the 0009 feed indexes)
- `messages/vi.json`, `messages/en.json` — new top-level `hero.<tier>.{label,tooltipTitle,tooltipBody}`; `awardsPortal.rules.tiers` removed (one source)
- `features/awards-portal/components/rules-kudos-rewards.tsx` — reads `hero.*`, draws tags with `HeroBadge size="rules"` (same src/alt/intrinsic size/126 px)
- Phase 05 tests updated to the phase 09 contract: `tests/integration/kudos-feed/kudo-public-query.test.ts` (r1 recipient tier `null` → `"new"`), `tests/integration/kudos-feed/kudo-feed-cursor-pagination.test.ts` (4 → 5 statements per page: + Hero tiers)

## RED → GREEN per slice
| Slice | RED (before code) | GREEN |
|---|---|---|
| 1 `tierFromCount`/`tierCountRange` | exit 1 — module not found | 6/6 |
| 2 migration 0014 | 3/3 failed (no index, no journal entry, no down file) | 3/3 after `db:generate` + `db:migrate` |
| 3 `HeroTierQuery` | exit 1 — module not found | 11/11; mutation: dropping `sender_id <> recipient_id` → self-row test fails (2 ≠ 1) |
| 3b EXPLAIN | n/a (new guard) | 1/1, 3 stable runs; mutation: drop the partial index → fails (bitmap on `kudos_recipient_id_created_at_id_idx`) |
| 4 seam | 4/4 failed (tiers null, lookup never called, no log) | 4/4; phase 05 feed suite: 2 expected failures (old seam default) → updated → 35/35 |
| 5 UI unit | exit 1 — modules not found | 14/14 (hero unit total) |
| 5 e2e | 3/3 failed (no badge button) | 3/3, then `--repeat-each 3` 9/9 |

## EXPLAIN (exact statement captured from the app pool, 50 recipients, 10k kudos / 2,000 recipients / 10 % spam)
```
Aggregate > Index Only Scan using <copy of kudos_public_recipient_sender_idx>   Heap Fetches: 0   0.11–0.17 ms
```
- Test runs on a session-local temp `kudos` (`LIKE public.kudos INCLUDING ALL`, so the same partial index definition), VACUUM ANALYZE’d; the real table is never touched.
- Inside a rolled-back transaction (no VACUUM possible) the same statement uses `Bitmap Index Scan` on `kudos_public_recipient_sender_idx` (0.18–0.25 ms), but at 10k rows the planner sometimes flips to Seq Scan — that first variant was flaky, hence the vacuumed temp copy.
- Manual psql check, same shape: `Index Only Scan using k_recipient_id_sender_id_idx … Heap Fetches: 0, Buffers: local hit=50, Execution Time: 0.178 ms`. Budget was < 20 ms.

## Gate table
| # | Command | Exit | Counts |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | 0 errors |
| 2 | `npm run lint` | 0 | 0 problems |
| 3 | `npm run test:unit` | 0 | 49 files, 663 passed |
| 4 | `npm run test:integration` (alone) | 0 | 47 files, 341 passed (72.6 s) |
| 5 | `npx playwright test --timeout 90000` (alone, full) | 0 | 100 passed, 5 skipped (prelaunch-gate, own config), 0 failed (1.5 m) |
| 6 | `npm run build` | 0 | 25 static pages, no warnings |
| 7 | `npm run test:prod` | 0 | 16 PASS, 0 FAIL |

Rules page e2e (`portal-pages.spec.ts` "Thể lệ: 4 Hero tiers…") and all phase 05 feed e2e are inside gate 5, green. Dev server :3000 still up; local DB has 0 kudos/profiles after the runs.

## Raw runs
```json
[
  {"command": "npx vitest run --project unit tests/unit/hero-badges", "exitCode": 1, "summary": "RED slice 1: tier-from-count module missing"},
  {"command": "npx vitest run --project unit tests/unit/hero-badges", "exitCode": 0, "summary": "GREEN slice 1: 6 passed"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/hero-tier-index-migration.test.ts", "exitCode": 1, "summary": "RED slice 2: 3 failed"},
  {"command": "npm run db:generate -- --name kudos_hero_tier_index", "exitCode": 0, "summary": "0014_kudos_hero_tier_index.sql + 0014 snapshot + journal idx 14; snapshot diff = the index only"},
  {"command": "npm run db:migrate", "exitCode": 0, "summary": "migrations applied to local Supabase"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/hero-tier-index-migration.test.ts", "exitCode": 0, "summary": "GREEN slice 2: 3 passed"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/hero-tier-query.test.ts", "exitCode": 1, "summary": "RED slice 3: hero-tier-query module missing"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/hero-tier-query.test.ts", "exitCode": 0, "summary": "GREEN slice 3: 11 passed"},
  {"command": "npx vitest run ... hero-tier-query.test.ts -t self-sent (sender<>recipient removed)", "exitCode": 1, "summary": "mutation caught: expected 2 to be 1; code restored"},
  {"command": "npx vitest run ... hero-tier-query-plan.test.ts (in-transaction variant, x3)", "exitCode": 1, "summary": "flaky 1/3 Seq Scan vs Bitmap at 10k unvacuumed rows; replaced by vacuumed temp-copy variant"},
  {"command": "npx vitest run ... hero-tier-query-plan.test.ts (x3)", "exitCode": 0, "summary": "Index Only Scan, Heap Fetches 0, 0.111/0.173/0.125 ms"},
  {"command": "npx vitest run ... hero-tier-query-plan.test.ts (copied partial index dropped)", "exitCode": 1, "summary": "mutation caught: Bitmap on kudos_recipient_id_created_at_id_idx; restored, 1 passed"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/kudo-card-hero-tier.test.ts", "exitCode": 1, "summary": "RED slice 4: 4 failed"},
  {"command": "npx vitest run --project integration tests/integration/hero-badges/kudo-card-hero-tier.test.ts", "exitCode": 0, "summary": "GREEN slice 4: 4 passed"},
  {"command": "npx vitest run --project integration tests/integration/kudos-feed", "exitCode": 1, "summary": "2 phase 05 assertions encoded the old seam default (tier null, 4 statements)"},
  {"command": "npx vitest run --project integration tests/integration/kudos-feed tests/integration/hero-badges", "exitCode": 0, "summary": "10 files, 54 passed after updating the 2 assertions"},
  {"command": "npx vitest run --project unit tests/unit/hero-badges", "exitCode": 1, "summary": "RED slice 5: placement + store modules missing"},
  {"command": "npx vitest run --project unit tests/unit/hero-badges", "exitCode": 0, "summary": "GREEN slice 5: 14 passed"},
  {"command": "npx playwright test tests/e2e/hero-badges --timeout 60000", "exitCode": 1, "summary": "RED slice 5 e2e: 3 failed (no badge button)"},
  {"command": "npx playwright test tests/e2e/hero-badges --timeout 60000", "exitCode": 0, "summary": "GREEN: 3 passed"},
  {"command": "npx playwright test tests/e2e/hero-badges --timeout 60000 --repeat-each 3", "exitCode": 0, "summary": "9 passed"},
  {"command": "npx playwright test tests/e2e/hero-badges/phase-09-evidence-screenshots.spec.ts --timeout 90000", "exitCode": 0, "summary": "temp spec: 3 screenshots, spec deleted"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "0 errors"},
  {"command": "npm run lint", "exitCode": 0, "summary": "0 problems"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "49 files, 663 passed"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "47 files, 341 passed"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "100 passed, 5 skipped, 0 failed"},
  {"command": "npm run build", "exitCode": 0, "summary": "compiled, 25 static pages"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16 PASS, 0 FAIL"}
]
```

## Decisions taken (beyond the plan text)
- `HeroTier` lives in `features/hero-badges/schemas/hero-tier.ts` (client-safe, per code-standards "client imports schemas, not server/"); phases 12–14 import it from there.
- `getDistinctSenderCounts(ids, executor = db)` takes an optional `Db | DbTx` so phase 13 can read before/after inside the Kudo write transaction (C-04). Counts are pre-filled with 0 for every requested id.
- `HeroTierQuery` exported as an object (codebase pattern; lets the seam failure test spy it). No Zod on ids: callers pass DB ids, a malformed uuid makes Postgres throw → host logs, no badges.
- Tooltip rendered via `createPortal` to `<body>` + `position: fixed` (the Highlight track is transformed/overflow-hidden); `createPortal` used directly, not `kudos-feed`'s `DocumentBodyPortal`, so `hero-badges` does not depend on its consumer.
- Tap handling: press-initiated focus does not open; click decides (mouse keeps open, touch toggles); a press elsewhere closes; mouse-leave closes after 120 ms so the pointer can reach the panel.

## Concerns
1. **Thể lệ copy changed by two characters**: "1-4"/"5-9" → "1–4"/"5–9" (vi and en). With one message source, the en-dash rule (decision-log § 2026-11-22, figma-hero-badges-spec) applies to the rules page too. Layout, images, alt text and the e2e are unchanged. If BTC wants hyphens on the rules page, that would bring back a second copy of the text.
2. **Docs impact: minor** — `docs/code-standards.md` § phase 05 still says "`enrich-hero-tier.ts` chờ phase 09"; changelog/roadmap/plan todo not updated (doc-writer / delivery-tracker step). Spec BR-003 text sync stays as listed under the plan's "Unresolved".
3. Two phase 05-owned files changed: `kudo-card-sender.tsx` (slot props, `flex-wrap`, `@container`) and two phase 05 integration assertions (new seam contract). Reviewer should confirm.
4. The partial index needs the `'public'` value known at plan time. The pool uses `prepare: false` (custom plans), so it is fine today; switching to named prepared statements could fall back to the recipient feed index (correct, just slower).
5. Reviewer agent not run from here (the orchestrator owns that step). Tooltip "bạn" wording on someone else's badge is kept as in Figma (orchestrator default, still waiting for user review).

**Summary:** Hero tiers are computed on read by one batched, index-only query and shown as the shared badge + tooltip on every Kudo card. Anonymous senders count toward tiers but never get a badge or a lookup. The Thể lệ page and the tooltip share one `hero.*` copy. All 7 gates are green.
