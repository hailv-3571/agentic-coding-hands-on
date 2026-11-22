# Review: phase 11 (F008 Spotlight Board realtime), uncommitted

## Scope
Migration 0017 (+down, journal, snapshot), features/spotlight-board (27 files, max 141 lines), app/api/spotlight/route.ts, live-board-spotlight-slot.tsx, messages en/vi (17 keys each, parity ok), tests listed. Depth: full read of SQL, server, channel hook, reducer, board components. Suites not run (shared DB); gate numbers are from the implementer report.

## Assessment
Sound. Trigger is safe on the kudo write path, payload is a field-by-field whitelist, policy is scoped on three axes. No critical findings. Residual: resync/event race can drift counters; unbounded-fanout snapshot aggregate; manual deploy gate.

## Critical
None.

## High
None.

## Medium
1. Reducer drift on event/snapshot race. `replace` keeps `applied` only for the 5 ticker ids (spotlight-state-reducer.ts:31-38). If a `removed`/`restored` broadcast for a kudo outside the ticker is delivered after a snapshot that already reflects it (resync fires on SUBSCRIBED and on tab-visible, spotlight-board.tsx:34-41), total and the name count are decremented/incremented twice (reducer.ts:75-96). Reverse order (event applied, then older snapshot) just loses it. Heals only on the next resync. Fix: after any `removed`/`restored`, schedule a debounced resync (2-3 s) so the snapshot is the final word; or add `asOf` to the snapshot and drop older events (contract change, so prefer the debounce).
2. Snapshot aggregate is O(public kudos) per call and uncached (spotlight-snapshot-query.ts:33-45). Every viewer runs it on page load, every SUBSCRIBED, every tab-visible; a Realtime blip makes all boards refetch at once. 2.7 ms at 10k kudos is fine for launch; add jitter (0-2 s random delay before the post-subscribe resync) and a 1-2 s TTL cache if kudos reach 100k+. Decision log says "no cache" on purpose, so a watch item.
3. Deploy gate lives only in a SQL comment: Realtime "Allow public access" must be OFF per environment (private only). Not found in docs/ or a release checklist. Leakage proven independent of it, but add it to the checklist so it is not lost.

## Low
- `removed` events publish kudoId + recipient of a moderated kudo to every signed-in client (moderation signal). The kudo was public, so acceptable.
- Name links go to `/profile/{id}`; no `app/**/profile` route exists until phase 12 (404 meanwhile). Expected; confirm ship order.
- Region/board take the snapshot only as initial state; `router.refresh()` does not re-seed. Harmless (resync covers it).
- `role="log"` already implies polite; `aria-live="polite"` is redundant, not wrong.
- Down migration needs a manual `__drizzle_migrations` row delete (documented).

## Hunt list results
- Trigger: SECURITY DEFINER, `SET search_path = ''`, all names qualified, REVOKE from PUBLIC/anon/authenticated (trigger firing needs no EXECUTE). Branch decided before the exception block, so no-op rows open no subtransaction. `EXCEPTION WHEN OTHERS` does not trap query_cancel, so statement timeouts still work. No recursion: it only writes realtime.messages. Fault-injection test covers the never-abort case.
- Payload: 5 keys built explicitly; no sender_id / is_anonymous / nickname / body. Snapshot selects no sender column and is Zod-stripped. Anonymous kudo leaks only recipient + time, same as the public feed.
- Policy: SELECT-only, `authenticated`, `realtime.topic()='spotlight' AND topic='spotlight' AND extension='broadcast'`. No INSERT/UPDATE/DELETE policy; anon has none. Row-topic check closes the OR-with-other-policies cross-topic read (found by their own test).
- Migration: journal idx 17, `when` above previous, snapshot present, down drops policy/trigger/function with IF EXISTS.
- Route: getSessionUser before any DB read, 401/500 bodies carry only a code, `private, no-store`. getSessionUser (no department check) is fine for a non-personal aggregate.
- Client channel: anon key only via publicEnv, `detectSessionInUrl:false`, setAuth before join, TOKEN_REFRESHED handled, stale-callback guard, 5-failure stop, offline/online rejoin, full cleanup.
- XSS: names pass as React text, `t.rich` values and aria-label strings; no dangerouslySetInnerHTML.
- Reducer: dedupe via applied, clamp at 0, zero-count names dropped; unseen `removed` decrements (Medium 1).
- a11y: search has sr-only label, ticker log, status/alert regions mounted before content, motion-safe, fullscreen label toggles and `fullscreenchange` sync, rejection toast.
- i18n en/vi key parity. All files < 200 lines.

## Acceptance (study-context.json)
All 7 met by code reading plus implementer-reported tests (28 spotlight integration tests pass; not re-run by me). Criterion 6 "within 5 s" and criterion 7 visuals rest on e2e and screenshots (9 present in evidence/screenshots/phase-11, listed, not opened).

## Done well
RED-first with a real policy defect caught; fault injection via a re-owned function; rolled-back-transaction tests; subscribe-then-fetch ordering; column whitelist as the leak control; single-source constants.

## Actions in order
1. Debounced resync after removed/restored (Medium 1).
2. Add Realtime private-only to the release checklist (Medium 3).
3. Jitter the post-subscribe resync; revisit caching at scale (Medium 2).
4. Confirm phase 12 ships with or before the profile links.

## Numbers
Type/test coverage: not measured. Lint: 0 (implementer-reported). 28 spotlight integration tests plus a unit schema test.

## Still unresolved
Human sign-off (trigger on kudos write path, RLS on realtime.messages). Local `private_only=false` unchanged.

**Status:** DONE_WITH_CONCERNS
**Summary:** No critical or high findings; trigger, payload and policy hold. Three medium items (counter drift race, uncached fan-out aggregate, manual deploy gate).
**Concerns:** drift on late removed/restored events; Realtime public access must be off per environment; sign-off pending.
