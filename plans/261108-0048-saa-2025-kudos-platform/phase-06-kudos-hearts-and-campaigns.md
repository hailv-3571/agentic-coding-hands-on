---
phase: 06
feature: F005, F011
priority: P1
status: completed
depends_on: [05]
file_ownership:
  - features/kudos-hearts/**
  - features/admin-campaigns/**
  - app/admin/settings/**
  - shared/db/schema/kudo-hearts.ts
  - shared/db/schema/campaigns.ts
  - db/migrations/*_kudo_hearts*
  - db/migrations/*_campaigns*
  - features/kudos-feed/server/enrich-heart-summary.ts      # seam handed over by phase 05
  - features/kudos-feed/components/kudo-card-heart-slot.tsx # seam handed over by phase 05
  - features/admin-moderation/server/admin-kudo-heart-counts.ts # seam handed over by phase 08 (replace default 0 with raw heart counts)
  - tests/**/kudos-hearts/**
  - tests/**/admin-campaigns/**
resolves: [C-01 (HeartAdded), C-02, C-11, C-19, C-14 (consumer), C-18, C-20 (kudo_hearts, campaigns)]
---

# Phase 06 — Hearts & x2 campaigns (F005 + F011)

## Context Links
- Spec: `spec/kudos-hearts/functional-spec.md`, `spec/kudos-hearts/technical-spec.md`, `spec/admin-campaigns/functional-spec.md`, `spec/admin-campaigns/technical-spec.md`
- Screens: `spec/admin-campaigns/screens/SCR-admin-campaign-settings/spec.md` (Figma `1760:8926`, `820:10492`, `820:11429`), `spec/admin-campaigns/screens/SCR-campaign-form-modal/spec.md` (Figma `1413:9045`, `820:11445`, `832:12113`, `832:12299`); heart button lives in the Kudo card (Live board `2940:13431`)
- Decisions: `spec/decision-log.md` — x2 doubles Secret Box progress; card shows raw count; hearts counted on kudos the user SENT; anonymous counts; spam stops counting; no self-heart; lock after `EVENT_END_AT`; fixed x2
- Conflicts: `spec/system/architecture.md` § Consistency Check C-01, C-02, C-11, C-19, C-18, C-20; § Concurrency-Critical Paths (Thả tim, Campaign)
- Upstream: phase-01 (`EVENT_END_AT`, `HEART_CAMPAIGN_MULTIPLIER`, `ADMIN_TIMEZONE`, outbox, shared/admin tz utils), phase-02 (`AdminGuard#requireAdmin`), phase-04 (`kudos`), phase-05 (`KudoPublicQuery.publicKudoIdsSubquery`, seams)

## Overview
- Priority: P1 · Status: completed (2026-11-17, see Delivery notes)
- F005: heart/unheart a public kudo (idempotent, no self-heart, multiplier snapshotted), batch heart summary for cards, heart stats for senders, the single heart ranking query.
- F011: admin CRUD of non-overlapping x2 campaigns on Admin › Settings; real `ActiveCampaignReader`.
- Built together: F011 is the only implementation of the reader F005 needs → no null-default reader (YAGNI).

## Key Insights
- Single statement `INSERT … SELECT FROM kudos WHERE id=$k AND status='public' AND sender_id<>$u AND now() < EVENT_END_AT ON CONFLICT DO NOTHING RETURNING` makes guard + write atomic; `HeartAdded` outbox row written in the same tx **only when a row was inserted** (C-01).
- Unheart = `DELETE`, idempotent; allowed on spam kudos, blocked after `EVENT_END_AT` (decision: read-only after event). No `HeartRemoved` event — consumers reconcile from totals (YAGNI).
- C-02: `HeartStatsQuery.receivedByUsers(userIds, asOf)` → per user `{weightedTotal, rawTotal, campaignActive}`; filters `k.status='public'` and `h.created_at <= asOf` at query time → spam stops counting, Un Spam restores, no clawback logic needed here.
- C-11: "hearts received" = hearts on kudos the user SENT (incl. anonymous). Phase 10 uses `weightedTotal`; card + phase 14 "Total Heart" use `rawTotal` (no new count elsewhere).
- C-19: `HeartRankingQuery.rankKudoIds(subquery, limit, asOf?)` = raw count DESC, `created_at` DESC, `id` DESC; Highlight (05) and Kudos Quốc Dân (10) both call it.
- Unheart/re-heart during x2 yields multiplier 2 (spec D002 accepted). Cannot inflate Secret Box: box grant is derived from totals (phase 10), removal lowers total first.
- EXCLUDE on `tstzrange(starts_at, ends_at, '[)')` uses native range GiST opclass — no `btree_gist` needed. Drizzle cannot express it → hand-written SQL migration.
- C-20 overrides spec's `user_id = auth.uid()` policy: RLS on, no client policies.

## Requirements
- F005: FR-001..003, FR-101, FR-201, FR-202, FR-301, FR-302, FR-401..406, FR-601, FR-602; BR-001..005; DEC-001, DEC-002; SM-001; ALG-001; US001..US005; D001..D009 recommended defaults.
- F011: FR-001..003, FR-101, FR-201..205, FR-301..308, FR-401..404, FR-601, FR-602; BR-001..006; DEC-001, DEC-002; ALG-001; US001_ListCampaigns..US005_ActiveCampaignDoubleHearts. Name 1–100 chars; hard delete (D008); no pagination.
- Event lock: heart add/remove rejected (409 `EVENT_ENDED`) when `!isEventWritingOpen(now)` (phase 01 helper; SQL guard keeps `now() < EVENT_END_AT` for atomicity); button disabled with tooltip.
- Non-functional: heart toggle p95 < 150 ms; summary is ONE grouped query per page; files < 200 lines.

## Architecture
```
KudoHeartButton (client, useOptimistic) ─► addHeartAction / removeHeartAction (server actions, C-18)
   └► KudoHeartService.add(tx): resolver.resolve(now) → INSERT…SELECT…ON CONFLICT DO NOTHING RETURNING
                                 └ inserted? DomainEventOutbox.add(tx,'HeartAdded',{kudoId,heartUserId,multiplier})
   └► returns {heartCount, heartedByMe} via KudoHeartQuery.summaryForKudos([id], viewer)
HeartMultiplierResolver.resolve(at) → ActiveCampaignReader.findActive(at) → 2 | 1 (never throws, never <1)
HeartStatsQuery.receivedByUsers(ids, asOf) ─► phase 10 (Secret Box, panel), phase 12, phase 14
HeartRankingQuery.rankKudoIds(KudoPublicQuery.publicKudoIdsSubquery(f), n, asOf?) ─► phase 05 Highlight, phase 10 Kudos Quốc Dân
Admin Settings (RSC, requireAdmin) ─► CampaignAdminQuery.list ; create/update/remove server actions (requireAdmin each)
```
Tables:
- `kudo_hearts (id uuid pk, kudo_id fk kudos, user_id fk profiles, multiplier smallint not null default 1 check >=1, created_at timestamptz default now(), unique(kudo_id,user_id))`, index `(user_id)`; unique index already covers `kudo_id`.
- `campaigns (id uuid pk, name varchar(100) not null, starts_at timestamptz, ends_at timestamptz, created_at, updated_at, check ends_at > starts_at, EXCLUDE USING gist (tstzrange(starts_at, ends_at,'[)') WITH &&))`.
- Campaign phase computed (`ended | active | upcoming`), never stored. Times parsed as `ADMIN_TIMEZONE`, stored UTC (shared/admin tz util, C-14).

## Related Code Files
Create:
- `shared/db/schema/kudo-hearts.ts`, `shared/db/schema/campaigns.ts` (+ export from schema index)
- `db/migrations/NNNN_kudo_hearts.sql` (drizzle-kit), `db/migrations/NNNN_campaigns.sql` (drizzle-kit), `db/migrations/NNNN_campaigns_no_overlap_exclude.sql` (hand-written EXCLUDE + RLS enable)
- `features/kudos-hearts/server/kudo-heart-service.ts`, `kudo-heart-actions.ts`, `kudo-heart-query.ts`, `heart-stats-query.ts`, `heart-ranking-query.ts`, `heart-multiplier-resolver.ts`, `active-campaign-reader.ts` (interface type only)
- `features/kudos-hearts/components/kudo-heart-button.tsx`
- `features/admin-campaigns/server/campaign-active-reader.ts` (implements `ActiveCampaignReader`, ALG-001), `campaign-admin-query.ts`, `campaign-admin-actions.ts`, `campaign-overlap-check.ts`, `campaign-phase.ts`
- `features/admin-campaigns/schemas/campaign-input-schema.ts`
- `features/admin-campaigns/components/campaign-table.tsx`, `campaign-row-menu.tsx`, `campaign-form-modal.tsx`, `campaign-delete-dialog.tsx`
- `app/admin/settings/page.tsx`
- Tests: `tests/unit/kudos-hearts/heart-multiplier-resolver.test.ts`, `tests/unit/admin-campaigns/campaign-phase.test.ts`, `campaign-input-schema.test.ts`; `tests/integration/kudos-hearts/kudo-heart-concurrency.test.ts`, `heart-stats-query.test.ts`, `heart-ranking-query.test.ts`; `tests/integration/admin-campaigns/campaign-exclude-race.test.ts`, `campaign-admin-actions.test.ts`; `tests/e2e/kudos-hearts/heart-toggle.spec.ts`, `tests/e2e/admin-campaigns/settings-crud.spec.ts`
Modify:
- `features/kudos-feed/server/enrich-heart-summary.ts` (seam → `summaryForKudos` + `HeartRankingQuery`)
- `features/kudos-feed/components/kudo-card-heart-slot.tsx` (seam → `KudoHeartButton`)
- `messages/vi.json`, `messages/en.json` — `kudosHearts.*`, `adminCampaigns.*` keys only
Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` on Server Actions (error return shape, `revalidatePath`), `useOptimistic`, `forbidden()`/403 in admin routes; record the convention (C-18: server actions for these mutations).
2. Schemas + migrations; hand-written EXCLUDE + `ALTER TABLE … ENABLE ROW LEVEL SECURITY` for both tables, no policies; up/down verified on local Supabase.
3. `campaign-phase.ts` (pure) + `campaign-input-schema.ts` (Zod: trim name 1–100; `endsAt > startsAt`; `endsAt > now`; parse `yyyy-MM-ddTHH:mm` in `ADMIN_TIMEZONE`). Unit tests first.
4. `campaign-active-reader.ts`: `SELECT … WHERE starts_at <= $at AND ends_at > $at ORDER BY starts_at DESC LIMIT 1` (warn log if >1).
5. `heart-multiplier-resolver.ts`: try reader; null/throw → 1; else `HEART_CAMPAIGN_MULTIPLIER`.
6. `kudo-heart-service.ts`: `add` (event-lock check, single INSERT…SELECT, outbox on insert, else disambiguate: exists → ok, own → 403, missing/spam → 404); `remove` (lock check, DELETE). Both in `db.transaction`.
7. `kudo-heart-actions.ts`: session → userId (never from input), Zod `kudoId` uuid, call service, return `{ok, heartCount, heartedByMe} | {error}`.
8. `kudo-heart-query.ts`: `summaryForKudos(ids, viewerId)` one `GROUP BY` with `count(*)`, `bool_or(user_id=$viewer)`.
9. `heart-stats-query.ts`: `receivedByUsers(ids, asOf = now)` one grouped query (`sum(multiplier)`, `count(*)`, `k.status='public'`, `h.created_at <= asOf`, `k.sender_id = ANY(ids)`), zero-fill missing; `campaignActive = resolver(asOf) === 2`; `receivedByUser` = batch of one.
10. `heart-ranking-query.ts`: export `heartCountsSubquery(asOf?)` (kudo_id, raw_count) — the ONE heart-count SQL fragment, also joined by phase 08 admin table sort; `rankKudoIds(subquery, limit, asOf?)` LEFT JOIN it, raw count DESC, created_at DESC, id DESC.
11. `KudoHeartButton`: optimistic toggle, pending lock, revert + toast on error, disabled when `isOwner` (DEC-001) or event ended; aria-pressed.
12. Rewrite the two phase-05 seams.
13. Campaign admin: `list` (requireAdmin, ORDER BY starts_at DESC, id DESC); actions create/update/remove (requireAdmin first; update/remove re-read row in tx and recompute phase; overlap pre-check excluding self; map `23P01` → overlap error; missing row → "Chiến dịch không còn tồn tại"); `revalidatePath('/admin/settings')`.
14. Settings page + table (ID/Name/Time/Actions, `dd/MM/yyyy - HH:mm` in `ADMIN_TIMEZONE`), row menu per DEC-001, form modal (Start locked when active, DEC-002), delete confirm.
15. i18n; tests per Scope Contract; reviewer.

## Todo List
- [x] Next.js 16 server action / optimistic docs read — backend report (`revalidatePath`, Server Functions), UI report (`useOptimistic`)
- [x] `kudo_hearts` + `campaigns` schema, migrations, hand-written EXCLUDE, RLS no-policy — `0010`, `0011`, `0012` + `.down.sql`
- [x] Campaign phase + input schema (+unit) — `campaign-phase.test.ts`, `campaign-input-schema.test.ts`
- [x] ActiveCampaignReader impl + HeartMultiplierResolver (+unit) — `heart-multiplier-resolver.test.ts`
- [x] KudoHeartService add/remove with outbox + event lock — `kudo-heart-service.ts`
- [x] Heart server actions — `kudo-heart-actions.ts`
- [x] KudoHeartQuery, HeartStatsQuery (asOf, batch), HeartRankingQuery — `heart-stats-query.test.ts`, `heart-ranking-query.test.ts`
- [x] KudoHeartButton + seam rewrites (phase 05 files) — `enrich-heart-summary.ts`, `kudo-card-heart-slot.tsx`
- [x] Admin Settings page, table, menu, form modal, delete dialog, actions — `app/admin/settings/page.tsx`, `features/admin-campaigns/**`
- [x] Concurrency + EXCLUDE race integration tests — `kudo-heart-concurrency.test.ts`, `campaign-exclude-race.test.ts`
- [x] e2e heart toggle + settings CRUD — `heart-toggle.spec.ts`, `settings-crud.spec.ts` (71/71 twice)

## Success Criteria
- 20 parallel `add` for one (kudo,user) → exactly 1 row, 1 `HeartAdded` outbox row, all succeed (SC-001).
- Self-heart → 403, spam → 404, after `EVENT_END_AT` → 409; zero rows/events written (SC-002).
- Multiplier 2 inside active campaign, stays 2 after campaign deleted/ended; 1 without campaign or on reader error (SC-003).
- `receivedByUsers` equals Σmultiplier / count over public kudos SENT by user, excludes spam and hearts after `asOf` (SC-004); anonymous kudos included.
- Card shows raw count; Highlight order matches `HeartRankingQuery`.
- Two concurrent overlapping campaign creates → one succeeds, other gets overlap error (23P01 mapped); `[a,b)` then `[b,c)` both accepted.
- Ended campaign cannot be edited/deleted even via direct action call; active campaign `startsAt` change rejected.
- Non-admin calling any campaign action → 403, no write.

## Scope Contract
- **Changed:** hearts + campaigns features, two tables + migrations, admin settings route, two phase-05 seams, i18n keys.
- **Impacted:** phase 05 card/Highlight (seams), phase 10 (stats, ranking, `HeartAdded`), phase 12/14 (stats), phase 13 (`HeartAdded` consumer), outbox table (phase 01).
- **Will verify:** unit (resolver, phase, schema); integration on local Supabase (heart concurrency, self/spam/lock guards, outbox-in-tx rollback on failure, stats asOf/spam/anonymous, ranking tie-break, EXCLUDE race, admin guard on every action, migration up/down); e2e (heart toggle optimistic + revert, settings CRUD, active start lock).
- **Deliberately skipped:** Secret Box consumption of `HeartAdded` (phase 10), notification fan-out (13), feed rendering beyond seams (05 tests).
- **Safety-critical → full test set required:** migrations (EXCLUDE), data mutations (hearts, outbox), permissions (admin actions).

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Duplicate hearts / double events under race | M | H | UNIQUE + ON CONFLICT + outbox only on `RETURNING` row; concurrency test |
| Overlapping campaigns via concurrent admins | L | H | EXCLUDE constraint + 23P01 mapping test |
| Grouped counts slow at scale (Highlight, National) | M | M | Index on `kudo_hearts(kudo_id)` via unique; measure with 50k hearts; add count column only if p95 > 300 ms |
| Timezone bugs in campaign input | M | M | Shared tz util; boundary unit tests at 00:00 VN / DST-free zone |
| Reader failure blocks hearting | L | H | Resolver never throws, defaults 1 |
| Heart spam clicking | M | L | Pending-lock in UI; unique constraint; rate limit deferred (YAGNI) |

Rollback: down migrations drop `campaigns` then `kudo_hearts` (no FK from hearts to campaigns); revert seam files to phase-05 defaults; outbox rows of type `HeartAdded` are inert if no consumer.

## Security Considerations
- `userId` only from session; actions validate `kudoId` uuid.
- Every campaign action/page calls `AdminGuard#requireAdmin` (DB role check) before any read/write.
- RLS on, no client policies (C-20). Outbox payload carries ids only, no body text.
- Heart responses never expose who hearted (D009) or kudo sender identity.

## Next Steps
- Phase 10 consumes `HeartStatsQuery` (weightedTotal, asOf), `HeartRankingQuery`, `HeartAdded`, `ActiveCampaignReader` (x2 tooltip).
- Phase 13 consumes `HeartAdded`; phase 14 uses `rawTotal` for "Total Heart".
- Phase 06 does NOT create the phase 08 seam `admin-kudo-heart-counts.ts` (decision-log 2026-11-16). Phase 08 uses `heartCountsSubquery` directly for raw heart counts (no x2). Phase 08's plan text still says otherwise and needs updating by its owner.
- Sanctioned serial edit by phase 10: optional `tieBreak: 'newest' | 'oldest'` param on `heart-ranking-query.ts` (default unchanged) for Kudos Quốc Dân.

## Delivery notes

Completed 2026-11-17. Review SEALED (score 9/10, 0 critical, 0 warning; 6 suggestions, all deferred or closed). Risk signed off by user 2026-11-17 (`evidence/phase-06/inspection-verdict.json`, `riskGate.humanSignedOff: true`). The gate covers migrations 0010–0012, hearts and outbox writes, and admin permissions.

### Decisions that overrode the phase text
- `campaigns.id` is `bigint` identity, not uuid. Tech spec §4.2 and the Figma short numeric IDs drove this.
- `HeartAdded` payload is `{ kudoId, heartUserId }`. No `multiplier`: it matches the phase 01 contract in `architecture.md` and nothing reads it (YAGNI).
- Down migrations are separate `*.down.sql` files beside `0010`, `0011` and `0012`.
- `zonedDateTimeToUtc(localDateTime, tz)` was added to `shared/admin/timezone.ts` for `datetime-local` input. Year handling was fixed in the shared `utcMs` helper: `setUTCFullYear` keeps years 0–99 (they were mapped to 1900s) and BC era maps to ISO year. Phase 01 `startOfDayInZone` and `parseCalendarDate` use the same helper; date-range-filter tests stay green.
- `heartCountsSubquery(kudoIds, asOf?)` takes a required kudo id set, not `(asOf?)`. This avoids a full-table heart aggregate. Its only caller is `rankKudoIds`.
- Phase 08 seam `features/admin-moderation/server/admin-kudo-heart-counts.ts` was NOT created (decision-log 2026-11-16). Phase 08 calls `heartCountsSubquery` directly. See Next steps for the stale plan text.
- Date fields use the native `<input type="datetime-local">` styled to Figma, not a custom calendar and time picker (decision-log 2026-11-16). Values are read in `ADMIN_TIMEZONE`. Firefox shows a double calendar icon; accepted.
- Unhearted heart is a 2 px `#D4271D` outline with a hollow fill; hearted is filled (decision-log 2026-11-16). Figma draws only the filled state.
- The detail page passes `writingOpen` (from `isKudoWritingOpen()`) into `KudoHeartButton`, the same as the feed. The plan did not name this prop.
- Playwright `workers` is capped at 3 locally; CI keeps the default (decision-log 2026-11-17). Timeouts are unchanged. At 6 workers the full suite was 65/68 red under contention with `next dev`; after a dev restart at 3 workers it was 71/71 twice.

### Deferrals and follow-ups
- US003 heart soft-error: a failed heart query fails the whole page, not just the heart zone. A flag on `KudoCardView` is needed if this is wanted (decision-log 2026-11-16).
- Migration `0012` comment says the GiST index also serves `CampaignActiveReader`. It does not; the reader filters plain columns. Fix at the next migration touch; applied migrations are not edited.
- Year floor for phase 01 `adminDateRangeSchema`, which still accepts years 0000–1999. Phase 01 owner's call.
- `heart-summary-store.ts` is never reset on sign-out. A stale entry shows only if the next user's server props equal its base. The sign-out code is outside phase 06 ownership.
- No e2e at a closed window. The blocked state is covered by code reading (`kudo-heart-button.tsx:61`) and the server `EVENT_ENDED` integration test.
- `useHydrated` is duplicated in `kudo-heart-error-toast.tsx` and in `features/kudos-feed`. Share it later.
- `heartCountsSubquery` timing at about 50k hearts was not measured. The plan risk says add a count column only if p95 > 300 ms.
- No coverage script; coverage is not measured.

### Not verified
- D003 mutation check: the ranking test passes, but no run has shown it fails under the multiplier-sum bug. This needs a scratch change to implementation code.
- `/admin/settings` is not in `test:prod`. The proxy gate covers it; a direct non-admin check is cheap.
- Figma match is qualitative only; no pixel diff was run.
- Integration (269) and `test:prod` (13/13) ran before the UI fix round. That round changed no server code, per its report, and did not re-run them.

### Test results
- `db:reset`, `typecheck`, `lint`, `build` exit 0. Unit 438/438 (36 files). Integration 269/269 (35 files). E2E 71/71 on two consecutive runs. `test:prod` 13/13.
- Sources: `plans/reports/tester-261117-phase-06-full-run.md` (its BLOCKED status is superseded by the UI fix round); `plans/reports/general-purpose-261117-phase-06-ui-fix-report.md`; `plans/reports/reviewer-261117-phase-06-final.md`.
