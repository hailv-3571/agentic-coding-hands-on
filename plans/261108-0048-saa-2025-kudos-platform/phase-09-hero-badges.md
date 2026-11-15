---
phase: 09
feature: F009
priority: P2
status: pending
depends_on: [05]
file_ownership:
  - features/hero-badges/**
  - features/kudos-feed/server/enrich-hero-tier.ts            # seam created by 05, owned by 09 from here
  - features/kudos-feed/components/kudo-card-hero-badge-slot.tsx  # seam created by 05, owned by 09 from here
  - db/migrations/*_kudos_hero_tier_index.sql
  - tests/unit/hero-badges/**
  - tests/integration/hero-badges/**
resolves: [C-04 (tier source + tierFromCount for 13), C-12 (Level = Hero tier, consumed by 14), C-11 (single tier count)]
---

# Phase 09 — Hero badges (F009)

## Context Links
- Spec: `spec/hero-badges/functional-spec.md`, `spec/hero-badges/technical-spec.md` (A1–A3, ALG-001, § 4.6 config, SC-001..006)
- Decisions: `spec/decision-log.md` — anonymous kudos count (line 22), Level = Hero tier (C-12, line 29), one source per count (C-04/C-11/C-19)
- Figma tooltip frames: `3241:14991` (New), `3241:14995` (Rising), `3241:14999` (Super), `3241:15003` (Legend) — file `9ypp4enmFmdK3YAFJLIu6C`
- Upstream: phase 04 (`kudos` with `status`, `sender_id`, `recipient_id`; self-kudo blocked), phase 05 (seam files `enrich-hero-tier.ts`, `kudo-card-hero-badge-slot.tsx`, `KudoCardView`, `maskKudoRow`)
- Downstream consumers: 12 (profile), 13 (tier-up notification), 14 (admin Level column/filter)

## Overview
- Priority: P2 · Status: pending · Runs in parallel with 06 (disjoint seam files).
- Computed-on-read Hero tier: number of DISTINCT senders of public kudos per recipient → tier. No stored column, no table, no recompute job (DEC-002).
- Ships the ONE tier source (`HeroTierQuery`), the pure `tierFromCount`, and the shared `HeroBadge` + `HeroBadgeTooltip`. Hosts fetch tiers in batch and pass `tier` down; hosts never count or draw their own badge (FR-202).

## Key Insights
- Batch only: one aggregate per page (`WHERE recipient_id = ANY($ids) GROUP BY recipient_id`) → no N+1. Empty batch returns `{}` without hitting DB; ids de-duplicated first.
- C-04: phase 13 detects tier-up by comparing tier before/after a kudo is written. Expose counts separately (`getDistinctSenderCounts`) so 13 calls `tierFromCount(before)` vs `tierFromCount(after)` — same constants, same function, no second counting rule.
- C-12: admin "Level" = Hero tier (4 values or empty); phase 14's `LevelQuery` calls `getTiersByRecipientIds`. Filter-by-Level in 14 needs counts in SQL → export the count subquery builder too (`distinctSenderCountSubquery()`), so 14 filters via `HAVING` ranges built from the same constants.
- Anonymous senders count (decision log) — but on an anonymous card the SENDER's own badge must not render (FR-603); the recipient's badge renders normally. Masking already drops sender id in phase 05 mapper → enrichment simply has no sender id to look up.
- Spam excluded by `status='public'`. Self-kudo impossible (blocked in 04); keep `sender_id <> recipient_id` in the query as cheap defense-in-depth.
- Partial index `kudos (recipient_id, sender_id) WHERE status='public'` makes the aggregate index-only. Spec left index ownership open (§ 5.3 Q2) → resolved: this phase owns it in its own migration file.
- No caching v1 (consistent with phase 05) → spam/un-spam reflected on next load (SC-003).

## Requirements
- Functional: FR-001..003, FR-101, FR-201, FR-202, FR-401..403; BR-001..003; DEC-001..003; US001..US003; ALG-001.
- Security: FR-601 (session-gated via hosts; no public route), FR-602 (result = tier name only, no sender ids), FR-603 (no sender tier on anonymous cards).
- Non-functional: one query per page; batch of 50 recipients < 20 ms at 10k kudos (index-only scan); files < 200 lines; i18n vi/en.

## Architecture
```
Host (05 feed / 12 profile / 14 admin) collects recipient+sender ids on page
  └─► HeroTierQuery.getTiersByRecipientIds(ids)
        dedupe → [] ? {} : getDistinctSenderCounts(ids)  -- 1 SQL, COUNT(DISTINCT sender_id) GROUP BY recipient_id
        → map count → tierFromCount(count) → Record<userId, HeroTier>   (absent key = no tier)
  └─► view model carries `tier` → <HeroBadgeTooltip tier> → <HeroBadge tier>  (null → renders nothing)
```
Contracts (exported from `features/hero-badges/server/`):
```ts
type HeroTier = 'new' | 'rising' | 'super' | 'legend';
tierFromCount(n: number): HeroTier | null                // pure, monotonic; used by 13
getDistinctSenderCounts(ids: string[]): Promise<Map<string, number>>
getTiersByRecipientIds(ids: string[]): Promise<Record<string, HeroTier>>
distinctSenderCountSubquery()                            // Drizzle subquery (recipient_id, sender_count) for 14 filter
tierCountRange(tier: HeroTier): { min: number; max: number | null }  // inclusive bounds from the same constants, for 14 HAVING filter
```
- Constants `HERO_NEW_MIN=1, HERO_RISING_MIN=5, HERO_SUPER_MIN=10, HERO_LEGEND_MIN=21`, `HERO_QUERY_MAX_IDS=500` (chunk above) in one module; not env.
- Error path: query throws → host catches, renders without badges (edge case A1). Phase 05 seam does this inside `enrich-hero-tier.ts` (log + return tiers empty).
- `HeroBadge` is server/client-neutral (pure markup + next-intl `hero.<tier>.label`); `HeroBadgeTooltip` is a client component (hover/focus/tap open; leave/blur/Esc/second tap close; `aria-describedby`; one open at a time).

## Related Code Files
Create:
- `features/hero-badges/server/hero-tier-constants.ts` — thresholds + max ids
- `features/hero-badges/server/tier-from-count.ts` — ALG-001
- `features/hero-badges/server/hero-tier-query.ts` — counts, tiers, count subquery
- `features/hero-badges/components/hero-badge.tsx`, `hero-badge-tooltip.tsx`
- `db/migrations/NNNN_kudos_hero_tier_index.sql` — `CREATE INDEX kudos_public_recipient_sender_idx ON kudos (recipient_id, sender_id) WHERE status = 'public'` + down `DROP INDEX`
- `messages/vi.json`, `messages/en.json` — `hero.<tier>.label|tooltipTitle|tooltipBody` keys only (vi verbatim from Figma frames; en draft per D006)
- Tests: `tests/unit/hero-badges/tier-from-count.test.ts`; `tests/integration/hero-badges/hero-tier-query.test.ts`
Modify (seams from 05, now owned here):
- `features/kudos-feed/server/enrich-hero-tier.ts` — collect recipient ids + non-anonymous sender ids, one call, attach `tier` to card view
- `features/kudos-feed/components/kudo-card-hero-badge-slot.tsx` — render `<HeroBadgeTooltip tier>`
Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` on server/client component boundaries (tooltip) and data caching defaults; confirm no implicit caching of the count query; note deviations here.
2. Migration: partial index; apply on local Supabase; `EXPLAIN` the aggregate for 50 ids → index-only scan; verify down script.
3. Constants + `tierFromCount` (unit tests first: 0,1,4,5,9,10,20,21 → null,new,new,rising,rising,super,super,legend; negative/NaN → null).
4. `hero-tier-query.ts`: dedupe, empty short-circuit, chunk by `HERO_QUERY_MAX_IDS`, Drizzle `countDistinct(sender_id)` with `status='public' AND sender_id <> recipient_id AND recipient_id IN (...)`; return tier names only.
5. Fetch Figma tooltip copy for the 4 frames (Figma MCP) → i18n keys; follow D006 for non-New sender-count lines.
6. `HeroBadge` (null → nothing, no empty pill), `HeroBadgeTooltip` (DEC-003 interactions, a11y).
7. Rewrite the two phase-05 seams; anonymous card → no sender id → no sender badge.
8. Tests per Scope Contract; reviewer.

## Todo List
- [ ] Next.js 16 docs read (component boundary, caching)
- [ ] Index migration + EXPLAIN + down
- [ ] Constants + tierFromCount (+boundary unit)
- [ ] HeroTierQuery (counts, tiers, subquery) (+integration)
- [ ] Figma tooltip copy → vi/en keys
- [ ] HeroBadge + HeroBadgeTooltip
- [ ] Rewrite 05 seams (enrich + slot)
- [ ] Tests green, review

## Success Criteria
- SC-001..SC-006 of technical spec pass.
- Integration: 10 kudos from one sender → count 1; spam kudo not counted, un-spam restores tier on next read; anonymous sender counted; empty batch issues zero queries; 50-recipient page issues exactly one tier query.
- Response/RSC payload for an anonymous kudo has no sender tier and no sender id; tier result contains no sender ids.
- Phase 13 and 14 can import `tierFromCount` / `getTiersByRecipientIds` / `distinctSenderCountSubquery` without re-implementing thresholds (grep: thresholds defined once).

## Scope Contract
- **Changed:** `features/hero-badges/**`, two phase-05 seam files, partial index migration, `hero.*` i18n keys.
- **Impacted:** Live board cards (05), later 12/13/14 consumers; `kudos` table write path (index maintenance on insert/status update).
- **Will verify:** unit — `tierFromCount` boundaries; integration (local Supabase) — distinct counting, spam exclusion, anonymous counted, self-row excluded, batch/empty/dup ids, payload has no sender ids, migration up/down + index used; component — badge null renders nothing, tooltip hover/focus/Esc (SC-006); phase 05 feed integration suite re-run (seams changed).
- **Deliberately skipped:** profile/admin/notification hosts (not built yet; their phases test consumption), heart logic (06).
- **Safety-critical → full test set required:** database migration (index) + anonymous-sender exposure via badge.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Sender tier leaks anonymous identity (tier lookup by sender id) | M | H | Enrichment uses only ids left after phase 05 masking; payload test |
| N+1 when host calls per card | M | M | Batch-only API; integration test counts queries |
| Off-by-one at 5/10/20/21 | M | M | Boundary unit tests; constants single module |
| Aggregate slow on large data | L | M | Partial index; chunking; denormalize only if measured slow |
| Migration conflicts with 05 index migration | L | L | Separate file, distinct index name |
| Query failure breaks page | L | M | Seam catches, renders without badge |

Rollback: revert seam files to phase-05 defaults (`tier null`), remove `features/hero-badges/**`, run index down migration. No data written.

## Security Considerations
- No route of its own; only callable from session-gated server code (FR-601). No client Supabase reads (C-20).
- Output is tier names keyed by already-visible user ids; never sender lists (FR-602).
- Anonymous cards: no sender badge (FR-603).

## Next Steps
- Phase 12: profile calls `getTiersByRecipientIds([profileId])`, renders `HeroBadgeTooltip`.
- Phase 13: tier-up notice = `tierFromCount(before) !== tierFromCount(after)` using `getDistinctSenderCounts` (C-04).
- Phase 14: Level column/filter via `getTiersByRecipientIds` + `distinctSenderCountSubquery` (C-12).

## Unresolved
- D006: en/other-tier tooltip sender-count copy pending BTC; Figma verbatim for vi.
- Spec BR-003 (functional spec, D001) still marks anonymous counting `[NEEDS_DOMAIN_CONFIRMATION]`; decision log settles it (counts) — spec text to be synced at promote.
