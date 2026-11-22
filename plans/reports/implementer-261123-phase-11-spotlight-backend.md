# Phase 11 — Spotlight Board backend (F008) · implementer report

Date: 2026-11-23 · Role: implementer (RED-first) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-11-spotlight-board-realtime.md`

## Files

Created
- `db/migrations/0017_spotlight_realtime.sql` — trigger function `public.spotlight_publish_kudo_event()` (SECURITY DEFINER, `search_path = ''`, catch-all + `RAISE LOG`), trigger `spotlight_publish_kudo_event` AFTER INSERT OR UPDATE OF status ON `kudos` FOR EACH ROW, `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`, policy `spotlight_authenticated_read` on `realtime.messages`. Registered with `drizzle-kit generate --custom` (journal idx 17 + `meta/0017_snapshot.json`, same pattern as 0013–0016); `drizzle-kit check` passes.
- `db/migrations/0017_spotlight_realtime.down.sql` — drops policy, trigger, function.
- `features/spotlight-board/spotlight-config.ts` — server-shared constants only: `NAME_CLOUD_MAX`, `TICKER_HISTORY_ON_LOAD`, `SPOTLIGHT_TOPIC`, `SPOTLIGHT_EVENT` (UI agent already re-pointed its duplicates here; UI-only tuning stays in `lib/spotlight-ui-config.ts`).
- `features/spotlight-board/schemas/spotlight-event-schema.ts` — `SpotlightEventSchema`, `SpotlightSnapshotSchema` (Zod, non-strict → unknown keys stripped; `satisfies` the orchestrator contract types). `spotlight-views.ts` untouched.
- `features/spotlight-board/server/spotlight-snapshot-query.ts` — `SpotlightSnapshotQuery.load()`.
- `features/spotlight-board/server/load-spotlight-snapshot.ts` — slot loader: `requireSunner()` → snapshot, `null` on error.
- `app/api/spotlight/route.ts` — `GET`, 401 `{code:"unauthorized"}` before any read, 500 `{code:"unexpected"}`, `Cache-Control: private, no-store`.
- Tests: `tests/unit/spotlight-board/spotlight-event-schema.test.ts`; `tests/integration/spotlight-board/{spotlight-trigger, spotlight-trigger-fault-injection, spotlight-realtime-policy, spotlight-realtime-delivery, spotlight-snapshot-query, spotlight-route, spotlight-migration}.test.ts` + helpers `spotlight-message-fixtures.ts`, `spotlight-realtime-clients.ts`.

Modified
- `features/kudos-feed/components/live-board-spotlight-slot.tsx` — phase 05 seam now renders `<Suspense fallback={null}><SpotlightBoardRegion snapshot={await loadSpotlightSnapshot()} /></Suspense>` (the UI agent's region file existed by then).

## Realtime spike (plan step 2) — result

Local stack: Postgres `17.11.0.018`, Realtime `v2.154.0`.
- `realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void` exists — signature as planned. Not SECURITY DEFINER; owner `supabase_realtime_admin`; EXECUTE granted to PUBLIC. Body: `SET LOCAL realtime.topic`, INSERT into `realtime.messages` (extension `broadcast`), **appends `id` (the message uuid) to the payload when absent**, and swallows its own errors as `RAISE WARNING 'WarnSendingBroadcastMessage'`.
- Private-channel authorization reads `realtime.messages` RLS: Realtime calls `realtime.authorize(role, topic, claims, sub, headers, read_exts[], write_exts[])`, which inserts probe rows and SELECTs them as the client role with `realtime.topic` set. Empirical (real websocket clients, supabase-js 2.119):
  - before the migration: authenticated AND anon private join → `CHANNEL_ERROR "Unauthorized: You do not have permissions to read from this Channel topic: spotlight"`;
  - after: authenticated → `SUBSCRIBED`, anon → still refused;
  - a public (non-private) channel named `spotlight` joins fine (see below) but **never receives** the private messages;
  - a rolled-back kudo write is never broadcast (resolves technical-spec §5.3 Q2 `[UNVERIFIED]`);
  - the browser receives 6 keys: the 5 contract keys + `id`. `SpotlightEventSchema` drops `id`.
- `postgres` (not owner of `realtime.messages`) may `CREATE POLICY` on it (Supabase supautils) → the migration applies through `drizzle-kit migrate` as-is.
- "Allow public channels": local tenant `realtime-dev` has `_realtime.tenants.private_only = false` (public joins allowed). **Not changed locally** (infra state outside the repo; `config.toml` has no switch). Leakage does not depend on it (proved above), but it must be OFF per environment — **deploy checklist: Realtime → Settings → disable "Allow public access" (private channels only)**; also never add the `realtime` schema to the Data API exposed schemas (EXECUTE on `realtime.send` is PUBLIC, so exposing it would let clients forge events). Both noted in the migration header.

## Design notes
- Branches decided before the exception block (no subtransaction for no-op rows); lookup uses `SELECT … INTO STRICT` so a missing profile is logged and nothing is sent (never a null name).
- `occurredAt` = `to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` — same form as the snapshot's `toISOString()`.
- Policy USING `realtime.topic() = 'spotlight' AND topic = 'spotlight' AND extension = 'broadcast'`. The row-level `topic` check goes beyond the plan text: the RED/GREEN policy test showed that with only `realtime.topic()`, an authenticated role setting `realtime.topic='spotlight'` could read **every other topic's rows** (permissive policies OR together → phase 13 `notifications:*` rows would be exposed). Fixed.
- Snapshot = **2 statements** in parallel (NFR "≤ 2 queries"; step 6 said 3): top names with the all-time total as `sum(count(*)) over ()` (computed before LIMIT; no rows → 0), and the latest 5. `recent` is **oldest first** per the orchestrator contract (`spotlight-views.ts`); the technical-spec text says newest first — contract wins.
- EXPLAIN at 10k kudos / 500 recipients (rolled-back tx): names 2.7 ms (seq scan + hash agg + top-N), recent 0.05 ms (`kudos_status_created_at_id_idx`) → no new index. Trigger cost in the same run: 9,981 inserts in 741 ms (~74 µs/row incl. one `realtime.messages` row).
- API gate = session only (`getSessionUser`), like the Secret Box endpoints; no onboarding (department) check — data is a non-personal public aggregate and the page itself redirects.
- Fault injection: `realtime.send` cannot be replaced (`postgres` lacks CREATE on schema `realtime`). Instead, inside a rolled-back tx the real trigger function is re-owned by a throw-away role (BYPASSRLS, SELECT on profiles, no USAGE on `realtime`), so the `realtime.send(…)` call raises `permission denied for schema realtime`; INSERT and Mark Spam UPDATE still commit in the tx, 0 messages, 2 catch-all LOG lines captured (`client_min_messages = log`).

## RED → GREEN
- RED (migration file empty, modules absent): DB suites 5 files → 12 failed / 2 passed (the 2 = "INSERT refused", trivially true with RLS and no policy). Failures: function missing, journal row missing, down file missing, delivery `CHANNEL_ERROR`, no events, no policy; trigger suite failed on the missing config module. Spike pre-migration as above.
- First GREEN: 26/28 — policy test caught the cross-topic read (real defect → row `topic` check added; local DB re-synced by running down+up, stored drizzle hash updated to the final file); fault test counted the `log_statement=ddl` echo (test filter fixed).
- Final: spotlight integration 7 files / 28 tests pass; with phase 04 (`kudos-authoring`) + phase 08 (`admin-moderation`) suites re-run unchanged: 22 files / 141 tests pass.
- Honest gap: the unit schema test and the snapshot/route integration tests were written before their modules, but their RED was only "module not found" (not captured as a separate behavioral RED).

## Gate table
| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `npx tsc --noEmit -p .` | pass (0 errors, includes UI agent files) |
| Lint | `npx eslint` (whole repo) | pass (no output) |
| Unit | `npx vitest run --project unit` | 60 files / 754 tests pass |
| Integration (focused) | spotlight-board + kudos-authoring + admin-moderation | 22 files / 141 pass |
| Integration (full) | `npx vitest run --project integration` | 68 files / 434 tests pass, exit 0 |
| Migration check | `npx drizzle-kit check` | pass |
| E2E | not run (UI agent / tester) | — |

**Shared DB: backend work is done — e2e may start.** Migration 0017 is applied on the local DB.

## Concerns
1. Local Realtime allows public channels (`private_only=false`); production must disable it (deploy checklist above). Staging check of private-channel auth on hosted Supabase still advised (plan risk row).
2. Every committed kudo now emits a broadcast — including other suites' test kudos; open dev boards may briefly show test names. Harmless, but run e2e after integration bursts (as agreed).
3. `realtime.send`'s `SET LOCAL realtime.topic` persists to the end of the kudo transaction (only `realtime.messages` RLS reads it; no effect on server-role writes).
4. Revoked access takes effect only at token expiry (documented limit, unchanged).
5. Slot Suspense fallback is `null` (header appears when the snapshot resolves); a skeleton would be a UI-agent choice.
6. Docs to update (doc-writer): F008 technical-spec (§5.3 Q2 now verified, file names, policy row check, recent order), architecture §Realtime `[UNVERIFIED]` → verified, deploy checklist (public channels off, never expose `realtime` schema), changelog.
