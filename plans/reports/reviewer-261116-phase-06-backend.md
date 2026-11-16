# Review: phase 06 backend (F005 hearts + F011 x2 campaigns)

Scope: features/kudos-hearts/{server,schemas}, features/admin-campaigns/{server,schemas}, shared/db/schema/{kudo-hearts,campaigns}.ts, migrations 0010-0012 (+down), shared/admin/timezone.ts, kudos-feed enrich-heart-summary + highlight caller, phase 06 tests (read only). Unit tests run: 5 files / 33 tests pass. Integration/e2e/typecheck NOT run (per instruction). Coverage and lint counts not measured.

## Assessment
Solid. No critical findings. The hot paths (atomic add, admin gate, EXCLUDE race) are designed correctly and the tests target the real failure modes. Remaining items are one performance warning and a handful of low-severity edges.

## Critical
None.

## Warning

W1. `heartCountsSubquery` aggregates the whole `kudo_hearts` table, then left-joins candidates (heart-ranking-query.ts:52-59, 66-75).
Postgres cannot push the candidate filter below a GROUP BY subquery, so every Highlight load (home page, hot path) is a full scan plus hash aggregate of all hearts, however few candidates survive the filters. Fine at seed scale, linear in hearts afterwards.
Fix: restrict the aggregate to the candidates, e.g. add `.where(and(asOf ? lte(...) : undefined, inArray(kudoHearts.kudoId, db.select({ id: candidates.id }).from(candidates))))` (pass `candidates` into the helper; phase 08 sort can pass its own id set), or use a correlated `(select count(*) from kudo_hearts where kudo_id = c.id)`, which the unique(kudo_id,user_id) index serves. Note the helper is documented as shared with phase 08, so changing the signature now is cheaper than later.

W2. Year 0000-0099 accepted and silently mapped to 1900-1999 (campaign-input-schema.ts:33, shared/admin/timezone.ts:~85 and parseCalendarDate:67).
`Date.UTC(year, ...)` treats 0-99 as 1900+year. `0050-01-01T00:00` passes validation and is stored as 1950. Admin-only and the end must still be in the future, so low impact, but the stored value differs from the input. Also `0000-02-29` is rejected by the same quirk.
Fix: reject years below 1970 (or 2000) in `isLocalDateTime`, or use `new Date(0).setUTCFullYear(...)`. One shared date-validity helper would also remove the duplicated regex/validation between schema and timezone.ts (DRY).

W3. No direct unit test for `zonedDateTimeToUtc` (and none for the new `wallClockToUtc` refactor of `startOfDayInZone`).
Only the zod schema test touches it. Boundaries to pin: 23:59 / 00:00 in UTC+7 crossing the UTC day, leap day, `24:00`, `T09:5`, seconds suffix (`T09:00:00` is rejected by the regex, good), and a DST zone (America/New_York gap/overlap) to document the behaviour. Existing `startOfDayInZone` tests should stay green (not run in the integration set; unit set passed).

## Suggestion

S1. Heart add classification is a second statement under READ COMMITTED (kudo-heart-service.ts:242-251). A kudo flipping to spam between the insert and the classify yields KUDO_UNAVAILABLE, which is correct; spam-during-insert can leave one heart on a just-spammed kudo, harmless because spam is filtered at query time (D006). If you want zero window, add `for share of k` to the insert's SELECT (costs a lock on a hot row; not recommended). Document only.

S2. `HeartAdded` payload carries `heartUserId` (kudo-heart-service.ts:258). Internal outbox, not a response, so D009 holds, but whoever builds the phase 10 consumer must not forward it to clients. Add a one-line note in the contract doc.

S3. Migration 0012 comment claims the GiST index "also serves CampaignActiveReader" (0012...sql:7-8, campaign-active-reader.ts:17). The reader filters on plain columns (`starts_at <= at AND ends_at > at`), which does not use an index on `tstzrange(...)`. Table is a handful of rows, so harmless; fix the comment or query `tstzrange(starts_at, ends_at, '[)') @> at`.

S4. `heartedByMe: bool_or(user_id = ${viewerId})` (kudo-heart-query.ts:188) relies on param type inference to uuid. Works with postgres.js today; `::uuid` cast would remove the dependency, consistent with the service's explicit casts.

S5. `removeHeart` rejects before checking existence and says nothing for a kudo that does not exist: idempotent by design, no oracle. OK. Just note `toggleHeart` returns `heartCount: 0` for ids that do not exist (kudo-heart-actions.ts:152) instead of KUDO_UNAVAILABLE on remove of an unknown well-formed uuid; spec says idempotent, so acceptable.

S6. 0012.down.sql does not restore the REVOKE (harmless: privileges were already absent per 0002) and drops only the constraint, so the down chain works as the migration test proves. Fine.

## Focus-area verdicts

1. Atomicity of add: PASS. Guards (public, sender <> user, now() < EVENT_END_AT) and insert are one `INSERT...SELECT...ON CONFLICT DO NOTHING RETURNING`; the outbox write happens only when RETURNING yields a row, in the same tx; rollback test and 20-parallel test cover it. Disambiguation (classifyNoInsert) is a separate read, but every outcome is safe on a race (see S1); sender_id is NOT NULL so `<>` cannot silently NULL-skip.
2. Permissions: PASS. `requireAdmin()` is the first statement in create/update/remove and in `CampaignAdminQuery.list`; non-admin 403 and guest redirect tested. Heart actions take userId only from `requireSunner()`; kudoId is the only client input and is uuid-validated, so `removeHeart` has no IDOR (deletes only `user_id = session`). `requireSunner` redirect sits outside the try/catch, so NEXT_REDIRECT is not swallowed. Active reader is server-only, not a server action.
3. EXCLUDE / 23P01: PASS. `tstzrange(starts_at, ends_at, '[)')` matches half-open semantics and the pre-check (`lt startsAt < end`, `gt endsAt > start`); touching windows tested. 23P01 detected on error or `cause`. Row lock (`FOR UPDATE`) plus fresh phase computed under the lock makes ended/active-start guards race-free against concurrent edit/delete; create/update races fall to the constraint. Race test genuinely forces lock-wait (not a sleep).
4. Timezone: PASS with W2/W3. Regex strict, hour/minute ranges checked, calendar validity checked; offset re-check handles fixed-offset Vietnam correctly; DST gap/overlap resolve to one deterministic instant (acceptable, undocumented).
5. Stats/ranking: PASS. Stats filter `status='public'` (spam), `created_at <= asOf`, include anonymous kudos (hearts are keyed on sender_id, which is never returned); ranking uses raw count, `created_at DESC, id DESC` tie-break; Highlight still re-checks `status='public'` and cards are masked in buildKudoCardViews before enrichment (enrich receives masked cards, so no sender field is added).
6. Migrations: PASS. Journal 0010-0012 has monotonically increasing `when`; snapshots 0010-0012 present; RLS enabled, no policy, REVOKE for anon/authenticated; down scripts are in correct reverse order and verified by a rollback test.
7. Leaks: PASS. Action results carry only `{heartCount, heartedByMe}` or an error code; SELF_HEART is only returned to the sender about their own kudo; unknown vs spam both give KUDO_UNAVAILABLE (no existence oracle).
8. Performance: statement count per page is constant (4, test updated); see W1 for the scan.
9. Test strength: Good. Concurrency, rollback-with-outbox, SELF_HEART on anonymous, spam reject, EVENT_ENDED, multiplier snapshot, 23P01 mapping and five-way create race would all fail on the bugs in scope. Gaps: no unit test for timezone helper (W3); no test that the response of a spam-then-unspam kudo restores stats beyond the existing case; no test that ranking ignores multiplier (multiplier-2 heart vs two multiplier-1 hearts) - add one assertion, since that is D003's whole point.

## Done well
- Single-statement guarded insert with outbox on RETURNING only.
- `requireAdmin` first, plus server-side phase recompute instead of trusting the client.
- EXCLUDE as last line with a friendly pre-check naming the winner.
- Tests assert statement count and prove the race via pg_stat_activity wait, not timing.
- Resolver never throws, never < 1, so hearting survives an F011 outage.

## Actions in order
1. W1: bound `heartCountsSubquery` to the candidate ids before phase 08 depends on its signature.
2. W3 + W2: unit-test `zonedDateTimeToUtc`; reject years < 100 (or < 1970) in one shared validator.
3. Add multiplier-vs-raw-count ranking assertion (test strength).
4. S3/S4/S2 comment and cast tidy-ups.

## Numbers
- Unit tests: 33/33 passing (phase 06 unit set). Integration: not run (DB in use).
- Type coverage, test coverage, lint findings: not measured.

## Still unresolved
- The 13 deviations in the backend report were not individually re-audited beyond the areas above.
- Integration behaviour not re-executed in this review; relied on reading tests.

**Status:** DONE
**Summary:** Phase 06 backend is production-ready modulo one scaling warning (full-table heart aggregate in ranking) and low-severity date-edge / test gaps. No critical findings; atomicity, authz, EXCLUDE handling, leaks and migrations verified.
**Concerns/Blockers:** None blocking. Fix W1 before phase 08 reuses `heartCountsSubquery`.
