---
phase: 13
feature: F013
priority: P2
status: pending
depends_on: [06, 08, 09, 10]
file_ownership:
  - features/notifications/**
  - shared/db/schema/notifications-schema.ts
  - db/migrations/*_notifications*.sql
  - app/api/notifications/**
  - app/api/internal/notifications/**
  - app/(app)/notifications/**
  - tests/unit/notifications/**
  - tests/integration/notifications/**
  - tests/e2e/notifications*.spec.ts
---

# Phase 13 — Notifications

## Context Links
- Spec: `spec/notifications/functional-spec.md`, `spec/notifications/technical-spec.md`, screens `spec/notifications/screens/{SCR-notification-dropdown,SCR-all-notifications}/spec.md`
- Decisions: `spec/decision-log.md` — Level/"thăng hạng" = Hero tier-up (C-12 → F013); auto-flag + admin "lời nhắn cần xem xét" out of scope; filler mock rows out of scope; spam stops counting, no revocation
- Architecture: `spec/system/architecture.md` § Realtime Design (`notifications:{recipient_id}`), § Concurrency-Critical Paths (Sinh thông báo), § Cross-Feature Contracts (outbox events, slot chuông), § Consistency Check C-01, C-03, C-04, C-16, C-18, C-20, C-21
- Figma `9ypp4enmFmdK3YAFJLIu6C`: dropdown `589:9152`, all-notifications page `589:9132`. Study: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md` §3.5
- Upstream: 01 (`domain_event_outbox`: id, event_type, payload, occurred_at, consumed_at, attempts, failed_at), 03 (header bell slot), 04 `KudoCreated`, 06 `HeartAdded`, 08 `KudoMarkedSpam`, 09 `tierFromCount` + distinct-sender count, 10 `BoxGranted`/`SetCompleted{userId,giftName}`/`NationalKudosFinalized`

## Overview
- Priority: P2 · Status: pending
- Outbox consumer turns domain events into per-user notifications (idempotent), a trigger pushes a content-free private Broadcast signal per user, the bell shows a red dot, dropdown (10 newest) + full page (20 per "Tải thêm"), mark-one / mark-all read.

## Key Insights
- Notification types = **7** (`new_kudo`, `heart_received`, `box_granted`, `hero_tier_up`, `kudo_hidden`, `set_completed`, `national_kudos`). Brief text said "6" but lists 7; spec FR-004 also 7 → implement 7.
- Idempotency is layered: `SKIP LOCKED` batch claim → per-event transaction writing notifications **and** `consumed_at` → `UNIQUE (event_id, recipient_id, type)` as final guard. Hearts aggregate via partial unique `(recipient_id, dedupe_key) WHERE type='heart_received' AND read_at IS NULL` (upsert `count+1`); tier-up once per tier via partial unique `(recipient_id, dedupe_key) WHERE type='hero_tier_up'`.
- C-04: tier-up = compare `tierFromCount(before)` vs `tierFromCount(after)` at the kudo's `(created_at, id)` position using **phase 09's** distinct-sender count; F013 writes no second counting query.
- Anonymous: `actor_id = NULL` when `is_anonymous`; params never carry sender id/name (BR-006). Realtime payload `{notificationId, type, occurredAt}` only.
- Copy is not stored (BR-010): rows hold `type` + `params` + `count`; text built client-side with next-intl, so locale switch re-renders old rows.
- Status re-check at processing time: kudo no longer public → skip `new_kudo`/`heart_received`/`hero_tier_up`, still mark consumed (FR-408). `kudo_hidden` always sent. Un Spam → no notification (D005); nothing is ever revoked (BR-008).
- Drain trigger (spec §5.3 Q2, hosting TBD): **`pg_cron` every 5 s → `pg_net` POST** to an internal drain endpoint guarded by a shared secret. One mechanism = kick + sweep, no change to source phases, meets "few seconds" (FR-402). Local/tests call the drain service directly.

## Requirements
- Functional: FR-001..FR-004, FR-101..FR-103, FR-201..FR-203, FR-301, FR-302, FR-401..FR-409, FR-601..FR-603; BR-001..BR-010; DEC-001..DEC-004; SM-001; ALG-001..ALG-003; INT-001..INT-003; US001..US006.
- Defaults adopted: D001 aggregate hearts while unread; D002 red dot only; D003 ≡ = mark all read; D004 no filler rows; D005 no Un Spam notice; D006 national_kudos placeholder copy (BTC to supply) linking to the sender's top-ranked kudo; D007 destinations per ALG-003; D008 count = distinct senders (F009); D009 no retention purge; D010 never revoke/edit; D011 dropdown 10 / page 20; D012 no detail page; D013 outbox; D014 anonymous copy "Một Sunner ẩn danh vừa gửi đến bạn lời ghi nhận đầy yêu thương!".
- Config: `NOTIFICATION_DROPDOWN_LIMIT=10`, `NOTIFICATION_PAGE_SIZE=20`, `NOTIFICATION_MAX_PAGE_SIZE=50`, `OUTBOX_BATCH_SIZE=50`, `OUTBOX_MAX_ATTEMPTS=5`, `NOTIFICATION_TOPIC_PREFIX="notifications"`, env `OUTBOX_DRAIN_SECRET`.

## Architecture
```
sources (04/06/08/10) ── tx: business rows + DomainEventOutbox#add ──► domain_event_outbox
pg_cron '5 seconds' → net.http_post(/api/internal/notifications/drain, header x-drain-secret)
  NotificationEventProcessor.drain():
    SELECT … WHERE consumed_at IS NULL AND failed_at IS NULL ORDER BY occurred_at LIMIT 50 FOR UPDATE SKIP LOCKED
    per event, own tx:
      Zod by event_type → mapEventToNotifications (ALG-001, pure + reads kudo/status/tier)
      write: heart → INSERT … ON CONFLICT (recipient_id,dedupe_key) WHERE unread-heart DO UPDATE count+1, occurred_at=now
             other → INSERT … ON CONFLICT DO NOTHING
      UPDATE outbox SET consumed_at=now()
    on error: rollback; separate UPDATE attempts+1 (failed_at=now when ≥ MAX); malformed/unknown → consumed + log
notifications AFTER INSERT (and UPDATE OF count) trigger notify_realtime()
  → realtime.send({notificationId,type,occurredAt}, 'notification', 'notifications:'||recipient_id, true)  (catch-all, RAISE LOG)
realtime.messages policy: SELECT to authenticated USING (realtime.topic() = 'notifications:' || auth.uid()::text)

Client: NotificationBell (header slot, initialUnread from layout) → private channel → on signal: unread=true, prepend if open
        reconnect / visibilitychange → GET /api/notifications/unread-count (+ list if dropdown open)
Reads (route handlers): GET /api/notifications/unread-count, GET /api/notifications?limit&cursor
Writes (server actions, C-18): markNotificationRead(id), markAllNotificationsRead()  — WHERE recipient_id=session AND read_at IS NULL
```
- Table `notifications`: `id uuid pk`, `recipient_id → profiles`, `type notification_type enum(7)`, `event_id → domain_event_outbox.id`, `actor_id → profiles null`, `dedupe_key text null`, `params jsonb`, `count int default 1`, `occurred_at`, `read_at null`, `created_at`. Indexes: unique `(event_id, recipient_id, type)`; partial uniques above; `(recipient_id, occurred_at DESC, id DESC)`; partial `(recipient_id) WHERE read_at IS NULL`. RLS enabled, **no client policy** (C-20).
- List cursor `(occurred_at, id)`; client de-dupes by `id` when aggregated hearts move up (spec §5.3 Q6 — accept).
- List joins `profiles` only for non-null `actor_id` (new_kudo sender name) and kudo recipient name for `heart_received` (spec copy needs `{recipient}`); never for anonymous.

## Related Code Files
Create:
- `db/migrations/NNNN_notifications.sql` — enum, table, indexes, RLS on, `notify_realtime` fn + trigger, `realtime.messages` policy, `pg_cron` job + `pg_net` call (secret via Vault), down script
- `shared/db/schema/notifications-schema.ts` — Drizzle table def
- `features/notifications/notification-config.ts`
- `features/notifications/schemas/outbox-event-payload-schemas.ts` — Zod per event type (C-03 `SetCompleted.giftName` required)
- `features/notifications/server/map-event-to-notifications.ts` — ALG-001
- `features/notifications/server/detect-hero-tier-up.ts` — ALG-002 via phase 09 count + `tierFromCount`
- `features/notifications/server/notification-writer.ts` — insert / heart upsert SQL
- `features/notifications/server/notification-event-processor.ts` — drain loop, attempts/failed_at
- `features/notifications/server/notification-query.ts` — `unreadCount`, `list`
- `features/notifications/server/notification-read-actions.ts` — server actions
- `app/api/internal/notifications/drain/route.ts` — POST, constant-time secret compare, 401 otherwise
- `app/api/notifications/unread-count/route.ts`, `app/api/notifications/route.ts`
- `app/(app)/notifications/page.tsx` — "Tất cả thông báo"
- `features/notifications/lib/notification-destination.ts` — ALG-003
- `features/notifications/hooks/use-notification-channel.ts`
- `features/notifications/components/notification-bell.tsx`, `notification-dropdown.tsx`, `notification-row.tsx`, `notification-list-page-client.tsx`, `notification-type-icon.tsx`
- Tests: `tests/unit/notifications/{map-event-to-notifications,detect-hero-tier-up,notification-destination}.test.ts`, `tests/integration/notifications/{notification-event-processor,notification-realtime-trigger,notification-read-actions,notification-routes,drain-route-auth}.test.ts`, `tests/e2e/notifications.spec.ts`

Modify:
- Phase 03 header bell slot — mount `<NotificationBell initialUnread={…} />` (single line + server unread fetch)
- `messages/vi.json`, `messages/en.json` — `notifications.*` keys (7 types + anonymous variant, empty state, actions)
- `.env.example` — `OUTBOX_DRAIN_SECRET`
- Phase 09 hero module **only if** it lacks a distinct-sender-count-at-position export — add it there (C-04), not here

Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` — Route Handlers, Server Actions (origin checks, `revalidatePath`), layouts passing data to client slots.
2. Spike on local Supabase: `realtime.send` from trigger + policy using `auth.uid()` in topic; `pg_cron` sub-minute schedule + `pg_net` availability (fallback: 1-minute Vercel/host cron hitting the same endpoint + optional `after()` kick — record choice).
3. Verify upstream: outbox columns (phase 01), event payloads emitted by 04/06/08/10 match `outbox-event-payload-schemas.ts`; phase 09 exports distinct-sender count at `(created_at,id)` and `tierFromCount`. Confirm phase 10 does **not** also consume via `consumed_at` (single-consumer column) — if it does, stop and raise to controller (needs per-consumer tracking in phase 01).
4. Migration + Drizzle schema (step order: enum → table → indexes → RLS → trigger fn → trigger → policy → cron job).
5. Pure ALG-001 / ALG-002 / ALG-003 with unit tests first (self-action skip, anonymous actor null, non-public skip, national_kudos grouped by sender, tier boundaries incl. same sender twice).
6. Writer + processor (per-event tx, attempts/failed_at, malformed → consumed), drain route with secret.
7. Query + routes (401 no session, limit clamp ≤ 50, bad cursor 400) and read actions (0 rows = success, 404-equivalent silent for foreign ids).
8. Client: channel hook (setAuth, private topic, reconnect/visibility refetch), bell red dot, dropdown (10, "Xem tất cả", mark all), rows (icon, ICU copy, relative time, unread dot, hover), all page with "Tải thêm" + id de-dupe, empty states, optimistic read.
9. Mount bell in phase 03 slot; i18n keys; env example.
10. Tests per Scope Contract; run phase 04/06/08/10 suites that emit outbox events.

## Todo List
- [ ] Read Next 16 docs
- [ ] Spike realtime.send + topic policy + pg_cron/pg_net
- [ ] Verify outbox schema, event payloads, phase 09 count export, single-consumer assumption
- [ ] Migration + Drizzle schema
- [ ] ALG-001/002/003 + unit tests
- [ ] Writer, processor, drain route
- [ ] Queries, routes, read actions
- [ ] Bell, dropdown, rows, all-notifications page
- [ ] Mount in header slot, i18n, env
- [ ] Integration + e2e tests; re-run event-source suites

## Success Criteria
- Draining the same event twice (sequential and two concurrent drainers) yields exactly one notification per (event, recipient, type); heart count not double-incremented.
- 3 hearts on one kudo while unread → one row `count=3`; read it, 4th heart → new unread row.
- Tier-up notified once per tier even when kudos processed out of order; no tier-up from a spam kudo.
- Anonymous `new_kudo`: DB row `actor_id` null, API JSON and Broadcast payload contain no sender data.
- Realtime row on topic `notifications:{A}` not readable by user B (policy test); bell updates ≤ 5 s in e2e.
- Mark one / mark all idempotent; foreign id changes nothing; red dot clears.
- Drain endpoint rejects missing/wrong secret (401); malformed event consumed without notification; transient failure retried up to 5 then `failed_at` set.

## Scope Contract — **full test set required** (migration + triggers + RLS policy, outbox idempotency, cross-feature event contracts, privacy of anonymous sender, internal secret-guarded endpoint)
- **Changed:** notifications migration (table, triggers, policy, cron), Drizzle schema, processor/drain endpoint, read APIs/actions, bell/dropdown/page, header slot mount, i18n, env.
- **Impacted:** `domain_event_outbox` consumption (any other consumer), event payload contracts of phases 04/06/08/10, header render on every page, Realtime authorization (phase 11 `spotlight` policy must remain independent), phase 09 count export if added.
- **Will verify:** unit — ALG-001/002/003 branches; integration (local Supabase, real Postgres) — processor idempotency (re-run, concurrent drainers), heart aggregation race (two parallel upserts), read/unread race with heart, tier-up out-of-order, status re-check, malformed/unknown events, attempts/failed_at, trigger payload whitelist + fault-injection (raising `realtime.send` does not abort insert), policy own-topic vs other-topic, drain auth, routes 401/400/limit clamp, actions recipient scoping; full re-run of phase 04/06/08/10 integration suites (emit side); e2e — two users: send kudo → recipient bell dot, open dropdown, click → kudo detail + read, mark all, all page "Tải thêm".
- **Deliberately skipped:** pg_cron timing precision in CI (processor invoked directly; cron job presence asserted by SQL), final national_kudos copy (BTC pending), visual pixel checks beyond the two Figma frames.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Second outbox consumer (phase 10) clobbers single `consumed_at` | M | High | Step 3 check; escalate for per-consumer receipts table in phase 01 |
| Duplicate notifications under concurrency | L | M | SKIP LOCKED + same-tx consumed_at + unique indexes; concurrent-drainer test |
| Anonymous sender leak (params/join/realtime) | L | High | actor null at write, no join for null actor, payload whitelist tests |
| pg_cron/pg_net unavailable on target plan | M | M | Fallback host cron 1 min + `after()` kick; endpoint identical |
| Poison event blocks queue | L | M | Per-event tx, attempts cap → failed_at, malformed → consumed + log |
| Trigger on notifications aborts inserts | L | M | Catch-all exception, fault-injection test |
| Payload drift from sources (C-03) | M | M | Zod per type; contract tests on emit side re-run |

Rollback: down migration unschedules cron, drops policy/trigger/table/enum; outbox rows stay unconsumed (safe, replayable); bell unmount restores header.

## Security Considerations
- `userId` always from session; every query/update filters `recipient_id = userId`; RLS on with no client policy (C-20).
- Realtime topic policy compares against `auth.uid()`; no INSERT policy → no forged signals; public channels disabled (phase 11 setting).
- Drain endpoint: secret header, constant-time compare, never exposed to browser; runs with server DB role; secret stored in Supabase Vault for pg_net.
- Notification rows/payloads carry no kudo body or anonymous sender identity (FR-603).
- Trigger functions `SECURITY DEFINER`, empty `search_path`, EXECUTE revoked from client roles.

## Next Steps
- BTC copy for `national_kudos` (D006) and final English strings.
- Reuse the drain mechanism for phase 10 national-kudos job if it lacks one (single scheduler pattern).
- C-ids resolved (consumer side): **C-01** (consume only from outbox, no in-process hooks), **C-03** (`SetCompleted.giftName` required in Zod; outbox `id/attempts/failed_at` used), **C-16** (consumer of phase 01 outbox), **C-04** (tier via phase 09 count + `tierFromCount`), C-12 (thăng hạng = Hero tier), C-18 (reads route handlers, read-state server actions), C-20, C-21 (`profiles`).

## Constraint from phase 10 review (2026-11-22)
- `NationalKudosFinalized.items[].senderId` is the REAL sender, anonymous kudos included. Phase 13 must never expose it — or anything derived from it (name, avatar, profile link) — in a recipient-visible notification, a public feed, or any API response to other users. Notify the kudo's recipient/sender by id internally only; render anonymous senders with the nickname rule of phase 05.
