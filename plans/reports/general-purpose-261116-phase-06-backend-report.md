---
phase: 06
feature: F005 hearts, F011 x2 campaigns
scope: backend half (steps 1–10, 13); UI, e2e out of scope
created: 2026-11-16
---

# Phase 06 backend — implementation report

Nothing staged or committed: everything sits in the working tree.

## Done (RED-first)
- [x] Next 16 docs read: Server Actions (untrusted POST, return in-band results; `forbidden()` with
      `authInterrupts`), `revalidatePath` (Server Functions only; throws outside a request scope → mocked in tests).
- [x] Unit RED (modules missing) → GREEN: resolver, campaign phase, input schema + timezone boundaries, i18n coverage.
- [x] Migration test RED (tables missing) → `db:migrate` → GREEN.
- [x] Hearts integration RED (modules missing) → GREEN; campaigns integration RED → GREEN.
- [x] Mutation checks (temporary, restored): outbox written on every add, self-heart guard dropped, stats spam
      filter dropped, rank by Σmultiplier, ended-guard dropped on update, `requireAdmin` dropped on remove,
      23P01 mapping disabled — each turns its test red.
- [x] Real rollback cycle on local Supabase: ran the 3 `.down.sql` (0012→0010), removed their 3
      `drizzle.__drizzle_migrations` rows → 0 tables left; `db:migrate` → 2 tables + exclusion constraint back;
      phase 06 + RLS baseline tests re-run green (73/73).

## Commands (final run, after `npm run db:reset`)
| Command | Exit | Result |
|---|---|---|
| `npm run db:reset` | 0 | migrations 0000–0012 applied, seeds departments=6 hashtags=8 |
| `npx drizzle-kit check` / `npm run db:generate` | 0 | "Everything's fine" / "No schema changes" (journal + snapshots consistent) |
| `npm run typecheck` | 0 | clean (a `next dev` NOT started by me was running on :3000; ran anyway, it stayed up — HTTP 200 after) |
| `npm run lint` | 0 | 0 problems |
| `npm run test:unit` | 0 | 34 files, 409 tests passed |
| `npm run test:integration` | 0 | 35 files, 268 tests passed |
| `npm run build` | 0 | compiled, 17 static pages, no errors |

Phase 06 tests: unit 33 in 5 files (resolver 4, phase 4, input schema 19, heart msgs 3, campaign msgs 3);
integration 65 in 8 files (heart actions 16, concurrency 3, stats+summary 7, ranking 6, campaign actions 19,
query+reader 4, EXCLUDE race 4, migrations 6).

## Scope Contract
- Changed: `features/kudos-hearts/**`, `features/admin-campaigns/{schemas,server}/**`, `shared/db/schema/{kudo-hearts,campaigns}.ts`
  (+2 barrel lines), migrations 0010–0012 (+snapshots, journal, `.down.sql`), phase-05 seam
  `features/kudos-feed/server/enrich-heart-summary.ts`, `shared/admin/timezone.ts` (additive), i18n
  `kudosHearts.errors.*` / `adminCampaigns.errors.*`.
- Impacted: phase 05 feed/Highlight/detail (real counts, heart ranking), outbox (`HeartAdded`), RLS baseline.
- Verified: full unit + integration suites (safety-critical: migration, mutations, permissions), build.
- Skipped: e2e and all UI (UI agent next).

## Deviations from the phase file (and why)
1. **`campaigns.id` = `bigint` identity, not uuid.** Tech spec § 4.2 and Figma 820:10492 show "1", "2" in a 60px ID column.
2. **`HeartAdded` payload stays `{ kudoId, heartUserId }`** (strict phase-01 contract, architecture.md, F013 spec);
   the plan diagram's `multiplier` field is not added (no consumer needs it; consumers read totals).
3. **Rollback files** `db/migrations/00NN_*.down.sql` (drizzle-kit has no down files; it ignores files outside the
   journal — `check`/`generate`/`migrate` verified). Tested in a rolled-back transaction + one real cycle.
4. **RLS enable is in the generated migrations** (`.enableRLS()`, same pattern as phase 04); hand-written 0012
   holds the EXCLUDE plus an explicit `REVOKE ALL … FROM anon, authenticated`.
5. `KudoHeartService.remove` is one DELETE without an explicit transaction (a single statement is atomic).
6. `zonedDateTimeToUtc(local, tz)` added to `shared/admin/timezone.ts` (C-14 single tz util, DST-safe two-pass;
   `startOfDayInZone` now shares the private `wallClockToUtc`). Shared file, additive change.
7. FKs: `kudo_hearts.kudo_id` and `user_id` both `ON DELETE CASCADE` (plan was silent; kudos are never deleted in
   app, test/e2e teardown deletes kudos then users).
8. Update input: `startsAt` optional (kept when absent); active campaigns compare start at minute precision, so
   resending the prefilled value is not a change.
9. `revalidatePath('/admin/settings')` also on NOT_FOUND / ENDED / OVERLAP (spec: "bảng tải lại"), not on
   VALIDATION / UNEXPECTED.
10. Phase-05 test changed where behaviour requires it: `kudo-feed-cursor-pagination` statement count 3 → 4
    (the heart summary is one grouped query per page; empty page still 1). Other phase-05 assertions (0/false
    with no hearts, recency order with no hearts) still hold unchanged.
11. Extra files: `campaign-time-format.ts`, `campaign-write-transaction.ts` (keeps actions < 200 lines),
    client-safe result contracts `kudo-heart-result.ts` / `campaign-admin-result.ts`; extra tests
    `kudo-heart-actions`, `campaign-admin-query`, `hearts-and-campaigns-migrations`, two i18n coverage tests.
12. Extra DB CHECK `campaigns_name_not_blank`; extra i18n key `adminCampaigns.errors.overlapWith`
    (spec sentence with `{name} ({startsAt} - {endsAt})`), `OVERLAP` is the generic fallback.
13. `EVENT_ENDED` copy is authored ("Sự kiện đã kết thúc, không thể thả tim nữa") — no verbatim text in specs.
14. Phase-08 seam not created (decision-log 2026-11-16); `heartCountsSubquery` is exported for it.

## Concerns (observational)
- US003 error scenario ("heart data fails → card still renders, light heart error") is not implemented: a
  failing summary query fails the page like any other feed query. Supporting it needs a flag on the phase-05
  `KudoCardView` type; deferred (YAGNI) — flag to orchestrator if wanted.
- `heartCountsSubquery` aggregates all hearts before the join (plan's single fragment). Fine at company scale;
  measure with 50k hearts before launch per the plan's risk table.
- Status of AGENTS.md Next.js feedback pass: no qualifying Next.js friction found, so no report was run.

## Unresolved questions
- None blocking. Confirm deviation 1 (bigint campaign id) and 2 (no `multiplier` in `HeartAdded`).
