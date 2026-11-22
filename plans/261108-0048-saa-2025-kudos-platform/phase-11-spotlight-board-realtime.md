---
phase: 11
feature: F008
priority: P2
status: completed
depends_on: [05, 08]
file_ownership:
  - features/spotlight-board/**
  - app/api/spotlight/**
  - db/migrations/*_spotlight_realtime*.sql
  - tests/unit/spotlight-board/**
  - tests/integration/spotlight-board/**
  - tests/e2e/spotlight-board*.spec.ts
---

# Phase 11 — Spotlight Board (realtime)

## Context Links
- Spec: `spec/spotlight-board/functional-spec.md`, `spec/spotlight-board/technical-spec.md`, `spec/spotlight-board/screens/SCR-spotlight-board-region/spec.md`
- Decisions: `spec/decision-log.md` (spam = stop counting, re-count on Un Spam; anonymous sender never shown to users)
- Architecture: `spec/system/architecture.md` § Realtime Design, § Cross-Feature Contracts, § Consistency Check (C-10, C-18, C-20)
- Figma: file `9ypp4enmFmdK3YAFJLIu6C`, Live board frame `2940:13431` (region R4); mobile `[iOS] Sun*Kudos` frame (same elements). Study: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md` §3 (Spotlight Board)
- Upstream phases: 05 (Live board page + Spotlight slot), 08 (`kudos.status` public/spam, Mark/Un Spam write path), 04 (`kudos` insert path)

## Overview
- Priority: P2 · Status: completed
- Spotlight region on Live board: name cloud of recipients (size by public kudo count), total "{n} KUDOS", 5-line live ticker, in-board search, fullscreen. Snapshot via server query; live updates via **private Broadcast emitted by a Postgres trigger** (`realtime.send`) with RLS on `realtime.messages`.

## Key Insights
- Trigger sits on the `kudos` write path (F003 insert, F007 status update) → migration is **safety-critical**; it must never abort the business transaction (catch-all + `RAISE LOG`).
- Payload is hand-built per field: `{type, kudoId, recipientId, recipientName, occurredAt}`. Never `sender_id`, `is_anonymous`, `body` (FR-602, BR-003). Do not use `realtime.broadcast_changes` (ships whole row → leaks sender).
- `realtime.send` writes into `realtime.messages`; integration tests can assert payload shape by reading that table — no browser needed for the privacy proof.
- C-20: business tables keep zero client policies. `realtime.messages` is a Supabase system table; the one SELECT policy here is the sanctioned exception (topic-scoped). No INSERT policy → clients cannot forge spotlight events.
- C-10 resolved upstream (no self-kudos exist) → no special branch here.
- Missed events are never replayed: reconnect = refetch snapshot, replace state (no double count).
- Spam handling: `public→spam` = `removed`, `spam→public` = `restored` (counts only, no ticker line), new spam insert = nothing (DEC-001, BR-004).

## Requirements
- Functional: FR-001, FR-002, FR-101, FR-201..FR-204, FR-206, FR-401..FR-406, FR-601, FR-602; BR-001..BR-005; DEC-001, DEC-002; SM-001; ALG-001; INT-001; US001..US004.
- Defaults adopted (decision-log default policy = spec `recommended`): D001 4 size tiers, top 60 names; D002 all-time public total; D003 client-side filter on visible names; D004 click name → `/profile/{id}` (phase 12 route); D005 browser Fullscreen API; D006 5 lines, newest at bottom, preload 5 most recent; D007 private Broadcast.
- Non-functional: snapshot ≤ 2 queries, no N+1; trigger adds ≤ 1 indexed lookup (`profiles` PK); a few hundred concurrent viewers on one topic; vi/en labels + locale time format (next-intl).

## Architecture
```
kudos INSERT / UPDATE OF status
  └─ AFTER trigger spotlight_publish_kudo_event()  (SECURITY DEFINER, search_path pinned)
       ├─ INSERT & NEW.status='public'            → type 'added'
       ├─ UPDATE public→spam                       → type 'removed'
       ├─ UPDATE spam→public                       → type 'restored'
       └─ else                                      → no-op
       payload = jsonb_build_object(type,kudoId,recipientId,recipientName(profiles.full_name),occurredAt(NEW.created_at))
       realtime.send(payload, 'kudo', 'spotlight', true)   -- EXCEPTION WHEN OTHERS → RAISE LOG, RETURN NEW
realtime.messages RLS: SELECT to authenticated USING (realtime.topic()='spotlight' AND extension='broadcast')

Browser (Live board slot, phase 05)
  SpotlightBoardRegion (client) ← initial snapshot (server-rendered via SpotlightSnapshotQuery)
    useSpotlightChannel: setAuth(session) → channel('spotlight',{config:{private:true}})
      SM-001: connecting → live → reconnecting → live | failed (RECONNECT_MAX_ATTEMPTS=5)
      on (re)subscribe → GET /api/spotlight → replace state
    spotlightReducer (DEC-001, dedupe by kudoId, never negative) → cloud layout (ALG-001) / ticker / counter
```
- Snapshot query (`SpotlightSnapshotQuery`): (1) `COUNT(*) WHERE status='public'`; (2) group public kudos by `recipient_id` join `profiles` → top `NAME_CLOUD_MAX` by count desc, id asc; (3) last `TICKER_HISTORY_ON_LOAD` public kudos (id, recipient, name, created_at). Selects no sender column. Returns `{total, names[], recent[]}`.
- Read endpoint = Route Handler `GET /api/spotlight` (C-18: reads via route handler); same query reused by the server component for first paint (DRY).
- Clock: browser local time, locale formatting (spec §5.3 Q5 default).

## Related Code Files
Create:
- `db/migrations/NNNN_spotlight_realtime.sql` — function + trigger + `realtime.messages` policy (hand-written SQL)
- `features/spotlight-board/spotlight-config.ts` — NAME_CLOUD_MAX, SIZE_TIERS, TICKER_*, SEARCH_MAX_LENGTH, SPOTLIGHT_TOPIC, RECONNECT_MAX_ATTEMPTS
- `features/spotlight-board/schemas/spotlight-event-schema.ts` — Zod event + snapshot schemas
- `features/spotlight-board/server/spotlight-snapshot-query.ts`
- `app/api/spotlight/route.ts` — GET, session required (401), `Cache-Control: no-store`
- `features/spotlight-board/lib/spotlight-state-reducer.ts` — DEC-001 pure reducer
- `features/spotlight-board/lib/spotlight-cloud-layout.ts` — ALG-001 tiers + stable spiral placement
- `features/spotlight-board/lib/normalize-search-text.ts` — lowercase + strip Vietnamese diacritics (đ→d), substring match
- `features/spotlight-board/hooks/use-spotlight-channel.ts` — subscribe, SM-001, refetch on reconnect
- `features/spotlight-board/components/spotlight-board-region.tsx` (client container)
- `features/spotlight-board/components/spotlight-name-cloud.tsx`
- `features/spotlight-board/components/spotlight-ticker.tsx`
- `features/spotlight-board/components/spotlight-search-input.tsx`
- `features/spotlight-board/components/spotlight-fullscreen-button.tsx`
- `features/spotlight-board/components/spotlight-connection-banner.tsx`
- Tests: `tests/unit/spotlight-board/{spotlight-state-reducer,spotlight-cloud-layout,normalize-search-text}.test.ts`, `tests/integration/spotlight-board/{spotlight-trigger,spotlight-realtime-policy,spotlight-snapshot-query}.test.ts`, `tests/e2e/spotlight-board.spec.ts`

Modify:
- Live board page from phase 05 (Spotlight slot) — mount `SpotlightBoardRegion` with server snapshot; one-line change, coordinate with phase 10 owner if it also mounts on that page
- `messages/vi.json`, `messages/en.json` — add `spotlight.*` namespace only (append-only keys)

Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` guides for Route Handlers, Server/Client Components data passing, and caching defaults (Next 16 changes); confirm `no-store` semantics.
2. Verify on local Supabase that `realtime.send(payload jsonb, event text, topic text, private bool)` exists and that private-channel authorization reads `realtime.messages` policies (architecture §Realtime `[UNVERIFIED]`). If signature differs, adjust before step 3; record result in phase notes.
3. Write migration: `CREATE FUNCTION public.spotlight_publish_kudo_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''` with the three branches; wrap body in `BEGIN … EXCEPTION WHEN OTHERS THEN RAISE LOG … ; END; RETURN NEW;`. `CREATE TRIGGER … AFTER INSERT OR UPDATE OF status ON public.kudos FOR EACH ROW`. `REVOKE EXECUTE … FROM public, anon, authenticated`. Add policy `spotlight_authenticated_read` on `realtime.messages` FOR SELECT TO authenticated. Down migration drops trigger, function, policy.
4. Ensure Realtime "allow public channels" is disabled (project setting; document in deploy notes, verify in integration env).
5. `spotlight-config.ts` + Zod schemas (event type enum `added|removed|restored`, uuid ids, ISO time).
6. `SpotlightSnapshotQuery` (Drizzle, 3 queries in parallel); index check: rely on phase 08 `(status, created_at DESC)`; add none unless EXPLAIN shows seq scan on group-by at seed scale.
7. `GET /api/spotlight`: session check via phase 02 server session helper → 401 JSON; returns validated snapshot; errors → 500 without detail.
8. Pure libs: reducer (dedupe `seenKudoIds`, `removed` for unseen id still decrements, clamp ≥ 0, drop name at 0, `restored` adds no line), cloud layout (BR-002 tier formula, hash(recipientId) start angle, keep position if tier unchanged), search normalizer.
9. `use-spotlight-channel`: browser Supabase client (phase 01/02), `realtime.setAuth(accessToken)`, subscribe private; status callbacks drive SM-001; on `SUBSCRIBED` after a drop → fetch snapshot and `REPLACE`; backoff up to 5 attempts then `failed` with retry button. Refresh auth on token refresh event.
10. Components per screen spec: label + title, counter, cloud (click → profile route), ticker (5 lines, fade older, newest bottom), search (debounced, `SEARCH_MAX_LENGTH`, DEC-002 empty/no-match message), fullscreen (Fullscreen API, sync on `fullscreenchange`, toast on reject), connection banner, empty state "Chưa có Kudos nào để vinh danh.", load error + retry isolated to the region.
11. Mount in phase 05 Live board slot; add i18n keys.
12. Tests (see Scope Contract), then run phase 04 kudo-create and phase 08 moderation integration suites unchanged.

## Todo List
- [ ] Read Next 16 docs (route handlers, caching) — no record in the implementer reports; the handler sets `Cache-Control: private, no-store` and `next build` is clean
- [x] Verify `realtime.send` + private channel policy on local Supabase (spike, see Delivery Notes)
- [x] Migration: function, trigger, policy, revoke, down script (`0017_spotlight_realtime`, journal idx 17)
- [x] Disable public Realtime channels — written into the release checklist (`docs/system/architecture.md` → Deployment View); the switch itself is per environment and is NOT flipped locally (`private_only=false`)
- [x] Config + Zod schemas
- [x] SpotlightSnapshotQuery + GET /api/spotlight
- [x] Reducer, cloud layout, search normalizer
- [x] Channel hook with SM-001 + reconnect refetch (SM-001 logic extracted to `lib/spotlight-channel-state.ts`)
- [x] Region components + i18n keys (`spotlight`, 17 keys vi/en) + mount in Live board slot
- [x] Unit, integration, e2e tests; re-run phase 04/08 write-path suites (22 files / 141 tests, unchanged, green)

## Success Criteria
- [x] **SC-001 trigger branches:** new public → `added`; new spam → nothing; public→spam → `removed`; spam→public → `restored`; body edit / no status change → nothing. Evidence: integration `spotlight-trigger`.
- [x] **Payload privacy:** exactly the 5 contract keys; no sender id / name / `isAnonymous` / body, also for an anonymous kudo. The browser sees a 6th key, `id`, added by `realtime.send`; `SpotlightEventSchema` strips it. Evidence: integration `spotlight-trigger` ("payload privacy"), `spotlight-realtime-delivery`; unit `spotlight-event-schema`.
- [x] **Never aborts the write:** a failing `realtime.send` does not stop the kudo INSERT or the Mark Spam UPDATE; 0 messages, 2 catch-all LOG lines. Evidence: integration `spotlight-trigger-fault-injection`. Proxy only: `realtime.send` cannot be replaced by `postgres`, so the trigger function is re-owned by a role without USAGE on `realtime` inside a rolled-back transaction; a real Realtime outage was not simulated.
- [x] **Policy:** authenticated reads `spotlight` only, other topics unaffected, anon denied, INSERT refused for authenticated and anon, one scoped policy. Evidence: integration `spotlight-realtime-policy`; real websocket join in `spotlight-realtime-delivery` (anon refused; a public channel named `spotlight` joins but receives nothing).
- [x] **Snapshot:** spam excluded; names top N by count desc then id asc; `recent` oldest first; no sender column; `GET /api/spotlight` 401 before any read, `no-store`, 500 carries only a code. Evidence: integration `spotlight-snapshot-query`, `spotlight-route`.
- [x] **Live behaviour:** new kudo in two independent browsers ≤ 5 s without reload; Mark Spam then Un Spam returns the counter and adds no ticker line; offline → online resyncs without double count. Evidence: e2e `spotlight-board.spec.ts` (two browsers; Mark Spam / Un Spam), `spotlight-board-reconnect-and-search.spec.ts`; unit reducer.
- [x] **Region UI:** counter, 4-tier cloud with `/profile/{id}` links, 5-line ticker with fade and locale time, diacritic-insensitive search, fullscreen, empty / error / skeleton states, connection label. Evidence: unit `spotlight-cloud-layout`, `normalize-search-text`, `spotlight-ticker-and-name-links-markup`, `spotlight-region-loading-and-error-states`, `spotlight-channel-state`; e2e search and empty state; screenshots in `evidence/screenshots/phase-11/` compared with Figma 2940:14170. **Not automated:** fullscreen (manual Chromium check; Esc exit cannot be driven headless) and the error-state retry click (the unit project has no DOM).
- [x] Gates on the final code (after the review-fix round, as reported by the implementer): `tsc` 0 errors, lint 0, unit 785 (65 files), `db:reset` + integration 434 (68 files), e2e 118 passed / 5 skipped (prelaunch-only) / 0 failed, prelaunch e2e 5 passed / 1 skipped, build clean, `test:prod` 16/16. The tester's own full run (unit 755, integration 434, e2e 118 / 5 / 0, `test:prod` 16/16) was on the code before the review fixes and was not repeated by the tester afterwards.
- [x] Reviewer: 0 critical / 0 high, 3 medium. M1 counter drift fixed (debounced resync + `restoredIds`); M3 deploy gate fixed (release checklist); M2 jitter done, TTL cache deliberately not (watch item, see Open items).
- Risk sign-off: per the user's conditional pre-approval 2026-11-22, recorded at commit time.

## Delivery Notes
Drift from the plan text:
- **`realtime.send` verified** (local Postgres 17.11, Realtime v2.154.0): signature `realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)` as planned; not SECURITY DEFINER, EXECUTE to PUBLIC; swallows its own errors as `RAISE WARNING`. It **appends an `id` key (the message uuid)** to the payload, so clients receive 6 keys; the Zod schema is non-strict and drops it. A rolled-back kudo write is never broadcast (resolves technical-spec §5.3 Q2). Private-channel auth reads `realtime.messages` RLS: authenticated and anon were both refused before the migration, authenticated joins after it, anon stays refused.
- **Policy tightened with the row topic:** `USING (realtime.topic() = 'spotlight' AND topic = 'spotlight' AND extension = 'broadcast')`. With only `realtime.topic()`, an authenticated role could set `realtime.topic = 'spotlight'` and read every other topic's rows (permissive policies OR together), which would have exposed phase 13 `notifications:*`. Found by the policy test.
- **Snapshot is 2 statements, not 3:** top names with the all-time total as `sum(count(*)) over ()` (computed before LIMIT), and the latest 5. **`recent` is oldest first** (orchestrator contract in `spotlight-views.ts`); the technical-spec text says newest first, the contract wins. EXPLAIN at 10k kudos / 500 recipients: names 2.7 ms, recent 0.05 ms, no new index; trigger about 74 µs per row.
- **Tier by distinct-count rank (BR-002 reading):** `tier = 4 − floor(rank·4/k)` over the distinct counts shown; top count → tier 4, equal counts share a tier, lowest → tier 1. Plain positional ranks would put the long tail of 1-Kudo names in the largest tier.
- **Phone: cap 24 names (plan said 30); a name with no free spot is dropped (no overlap); board 460 px tall.** 30 did not fit without overlap.
- **Network layer drawn at 106 % width:** Figma's 1100 px leaves a visible seam at about 95 % of the board.
- **Resync timing:** after `removed` / `restored`, one refetch 2000 + 0–999 ms after the **last** event of a burst (trailing debounce, no max wait); after every (re)join, a refetch after a random 0–1999 ms; tab visible → refetch at once. `added` schedules nothing (deduped by kudo id). Constants in `lib/spotlight-ui-config.ts`, logic in `lib/spotlight-resync-scheduler.ts`. This fixes reviewer M1 (a late `removed` after a snapshot that already reflects it).
- **`restoredIds` rule:** the snapshot's `recent` is the last 5 public kudos, so a REPLACE after `restored` would bring the restored line back. The reducer keeps `restoredIds` (kudos restored while the board is open) across `replace` and filters them out after slicing to 5 lines. A page reload still shows such a kudo at its original time.
- **Skeleton:** `SpotlightBoardSkeleton` is the slot's Suspense fallback (was `null`); same section and frame classes as the loaded board, boxes measured identical.
- **Browser Supabase client lives in the feature lib** (`lib/spotlight-browser-supabase.ts`, `@supabase/ssr`, `detectSessionInUrl: false`); `shared/` has no browser session client yet. **Move it to `shared/` when phase 13 needs one.**
- **Config split:** server-shared constants (`NAME_CLOUD_MAX`, topic, event, history size) in `spotlight-config.ts`; browser-only tuning in `lib/spotlight-ui-config.ts`.
- **API gate = session only** (`getSessionUser`, like the Secret Box endpoints); no department check, since the payload is a non-personal public aggregate.
- **Migration** registered with `drizzle-kit generate --custom` (journal idx 17 + `meta/0017_snapshot.json`); `postgres` may `CREATE POLICY` on `realtime.messages`. The down file needs a manual `__drizzle_migrations` row delete.
- **Deploy checklist:** `docs/system/architecture.md` → Deployment View → "Release checklist — Realtime (F008)": Allow public access off, `realtime` never in Data API exposed schemas, staging check of private channels.

## Open items
- **Staging check of private channels on hosted Supabase has not run anywhere** (checklist item 3); local Realtime still allows public channels (`private_only=false`). Record the result in `evidence/phase-11/` before the event opens.
- **e2e flake from hard deletes:** another worker's `kudoUsers` teardown hard-deletes public kudos; DELETE emits no event, so a spotlight total-vs-DB check can drift (1/15 in a `--repeat-each=3 --workers=2` run; the full run was green). Options: one worker for the two spotlight files, or soft-delete in the shared fixture.
- **Retry-click test needs a DOM environment:** the unit project has no jsdom/happy-dom and e2e cannot make the server loader return `null`; the rendered error state and the `GET /api/spotlight` contract are tested, the click wiring is not. Adding a DOM env is a dependency decision.
- **Snapshot cache at 100k+ kudos:** the names aggregate is O(public kudos) per call, uncached by decision; add a 1–2 s TTL cache if kudos reach 100k+ (reviewer M2; only the jitter was done).
- **`removed` events reveal moderation to signed-in clients:** kudoId + recipient of a moderated kudo reach every signed-in client. The kudo was public, so accepted.
- Also open: `/profile/{id}` is a 404 until phase 12 (D004, accepted); the trailing debounce has no max wait (YAGNI); a recipient outside the top 60 joins with count 1 on a live event until the next resync; fullscreen has no automated test; `docs/features/F008_SpotlightBoard/` and `docs/screens/SCR016_SpotlightBoardRegion/` are still the greenfield draft ("planned", TBD), so sync them via `rebuild-spec --features F008`.

## Scope Contract — **full test set required** (DB migration/trigger on kudos write path, RLS policy, public API)
- **Changed:** new migration (trigger on `kudos`, policy on `realtime.messages`), `GET /api/spotlight`, `features/spotlight-board/**`, Live board slot mount, i18n keys.
- **Impacted:** every `kudos` INSERT (phase 04 create) and status UPDATE (phase 08 Mark/Un Spam); phase 04 edit (UPDATE without status change must not fire); Live board page render; Realtime authorization for other topics (phase 13 `notifications:*` policy must stay independent).
- **Will verify:** unit — reducer DEC-001 incl. duplicates/unseen removes/clamp, layout stability, diacritic search; integration (local Supabase) — trigger branches (insert public/spam, public→spam, spam→public, body edit), payload key whitelist, fault-injection (replace `realtime.send` with raising stub inside rolled-back tx → insert still commits in test tx), policy SELECT allowed for authenticated / denied for anon, INSERT denied, snapshot counts exclude spam; full re-run of phase 04 + 08 integration suites; e2e — two-browser live update + spam/unspam + reconnect (offline/online) no double count.
- **Deliberately skipped:** pixel-exact cloud placement (non-deterministic visual; layout covered by unit stability test), Fullscreen API on all browsers (manual check in Chromium only), load testing beyond a scripted 50-subscriber smoke.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Trigger error blocks kudo writes (RISK-03) | M | High | Catch-all exception, `RAISE LOG`, fault-injection test; down migration ready |
| Sender leaks via payload (RISK-01) | L | High | Field-by-field `jsonb_build_object`, key-whitelist integration test, no `broadcast_changes` |
| `realtime.send`/policy semantics differ on hosted Supabase | M | M | Step 2 spike; staging check before prod; fallback = keep snapshot polling (60 s) behind same reducer |
| Missed events → counter drift (RISK-04) | M | L | Refetch + replace on reconnect and on tab visible |
| Live board page edited by phase 10 concurrently | M | L | Only mount line touched; sequence merge after 10 or coordinate |
| Dense cloud overlaps on mobile (RISK-02) | M | L | Cap names on small viewports (top 30), tiers shrink |

Rollback: down migration drops trigger/function/policy (kudos writes unaffected); UI region removable by unmounting slot.

## Security Considerations
- Session required for page, API (401) and channel (RLS on topic); public channels disabled.
- No client INSERT/UPDATE/DELETE policy on `realtime.messages` for `spotlight` → no forged events.
- Function `SECURITY DEFINER` with empty `search_path`, fully qualified names, EXECUTE revoked from client roles.
- Snapshot query and payload never select sender/anonymity columns; Zod validates inbound events client-side.
- Revoked access only takes effect at token expiry (documented limit).

## Next Steps
- Phase 12 must provide `/profile/{id}` route (name click target).
- Phase 13 adds its own `notifications:*` policy; keep the two policies independent.
- Promote D001/D006 defaults to final when BTC confirms; hard-delete branch only if a delete flow is ever added (spec §5.3 Q4).
- C-ids handled here: C-20 (system-table policy exception scoped; no business-table client policy), C-18 (read via route handler), C-10 (no self-kudo branch needed).
