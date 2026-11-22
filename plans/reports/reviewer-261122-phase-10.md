# Review: Phase 10 (F010 Secret Box rewards), uncommitted

## Review Summary

### Scope
- Files reviewed: `features/secret-box-rewards/**` (server, components, schemas), `app/api/secret-boxes/*`, `app/api/internal/secret-box/tick`, `db/migrations/0015*`, `0016*`, `meta/_journal.json`, `db/seeds/secret-box-prize-loader.ts`, `apply-all-seeds.ts`, `shared/auth/public-paths.ts`, `shared/config/env-schema.ts`, `.env.example`, `heart-ranking-query.ts`, `live-board-rewards-column-slot.tsx`, `messages/{en,vi}.json`, and `proxy.ts`, `session-proxy.ts`, `route-access-policy.ts`, `prelaunch-gate.ts`, `heart-stats-query.ts`, `domain-event-outbox.ts` for interplay.
- Lines: about 1.8k source (no new source file > 200 lines, largest 158); diff on existing files +90/-12.
- Depth: specific, full read of the server path and client state machine. Tests were NOT run (shared DB, per instruction); they exist for every criterion and were not re-run by me. Screenshots listed, not opened.

### Assessment
Ready to commit. No critical finding. The concurrency design is sound: every per-user write (grant, open) takes the same transaction-scoped advisory lock first, UNIQUE constraints sit behind it, and no pool read happens under a lock. Two warnings (cron migration portability, anonymous senderId in the national-kudos event) and a few suggestions; none blocks the commit.

### Critical
None.

### High
None.

### Medium
1. **0016 cron migration is not portable** (`db/migrations/0016_secret_box_tick_cron.sql:12-13`). `CREATE EXTENSION pg_cron` / `pg_net WITH SCHEMA extensions` plus `vault.decrypted_secrets` assume a Supabase DB with pg_cron preloaded. On a plain Postgres (CI, a dev DB) the migration aborts and blocks every later migration. Fix: wrap in a `DO $$ ... IF EXISTS (select 1 from pg_available_extensions where name='pg_cron') ... $$` that skips with a NOTICE, or move scheduling to an ops step. The `.down.sql` is safe (unschedule only).
2. **Anonymous sender id in `NationalKudosFinalized`** (`national-kudos-finalize-job.ts:58-60`). Payload carries real `senderId` for anonymous kudos (phase 13 needs it to notify the sender). Safe while the outbox is RLS-closed and unread by any API, but a hard constraint for phase 13: never place it in a recipient-visible notification or public feed. Record it in the phase 13 plan. Deferred.

### Low
- Tick has no overlap guard or per-tick cap (`app/api/internal/secret-box/tick/route.ts:30-33`): serial, unbounded sweep, 1-minute cron, so a slow tick overlaps the next and repeats work (idempotent, only wasteful). Add `pg_try_advisory_lock` or cap senders per tick.
- `openNext` reconciles (heart read + maybe a grant tx) before the replay lookup (`secret-box-open-service.ts:67-69`): each retried POST pays it. Look up the stored result first.
- Re-seed with `stock_total` below the issued count stores total < issued (`secret-box-prize-loader.ts:36-50`); later re-seeds under-count issued. BTC-driven edge.
- `national_kudos.kudo_id` ON DELETE CASCADE: if all winners were hard-deleted, the next tick finalizes again (second event). Very unlikely.
- Replay response differs from the first only by `replayed: true` (tests strip it); criterion "identical responses" holds for the prize.

### Hunt results (what I checked and found sound)
- **Over-grant / TOCTOU**: totals are read before the tx, but the insert range is `max(seq)+1 .. entitled` computed under the lock, so a stale total can only grant boxes once earned; 20 parallel reconciles serialise, second insert gives 0 rows, no event. Unheart-then-reheart cannot regrow (seq-based). A total that dropped after read still grants: matches BR-002 (no clawback).
- **Double open**: lock, then replay lookup by UNIQUE(user_id, open_request_id), then lowest unopened `FOR UPDATE`, conditional update `status='unopened'`. Different keys serialise; extras get 409. `countUnopened` reads through `tx` (no pool read under the lock).
- **Stock**: conditional decrement in the open tx, CHECK 0..total, at most one prize row lock per tx, redraw x3 then unlimited icon fallback. Rolled back with the open on any failure.
- **CSPRNG**: `crypto.randomInt(total)`, range-validated, weights validated. OK.
- **Mystery gift**: `ON CONFLICT (user_id) DO NOTHING RETURNING`, event only when new; replay recovers it through `completed_at = opened_at` (same `now()` in the tx).
- **National kudos**: not_due gate, rank read pre-tx at asOf FINALIZE_AT (oldest tie-break), lock + re-check + UNIQUE(rank)/(kudo_id); one event.
- **Outbox**: payloads ids + count / giftName only (except item 2); `domainEventSchema` strict; only INSERTs, no `consumed_at` write, no second consumer.
- **RLS**: ENABLE on all 5 tables, zero policies, so no client access; server uses the owner connection.
- **Migrations**: 0015 down in FK order with the roll-forward warning; journal entries present; 0016 upsert-by-name, secrets only in Vault, nothing sent until both exist.
- **PUBLIC_PATHS**: exact `includes()`; sub-paths and look-alikes stay protected. Prelaunch gate passes public paths, jobs are no-ops before launch. Secret: SHA-256 digests + `timingSafeEqual` (length-safe), 503 unset / 401 wrong, no secret logged (only the error object of a failed job).
- **Env**: optional via `withDefault` (blank `.env.example` line becomes unset, boot not blocked), min 32, zod message holds no value.
- **API auth**: `getSessionUser` first (401 before any DB), userId from session only, no body read, `private, no-store`, error body is `{code}` only.
- **Ranking param**: positional `asOf` became an options object; the only other caller passes none; default `newest` gives the same ORDER BY. Test updated.
- **UI state machine**: new key per click; pendingKey reused after network error / timeout / 5xx / 401 / unreadable body (server replays); freed on 409/400/success. Double click ignored (phase flips synchronously before await). Esc and X and mask locked while opening (bounded by the 15 s timeout). Deep link opens, replaceState strips, dismissed state avoids reopen. Focus trap reused, focus returns to opener. Reduced motion respected in the hook and the min opening delay.
- **A11y**: `aria-disabled` + tooltip described-by, `role=status` announcer, `aria-modal` dialog labelled, toast inside the dialog.
- **i18n**: en and vi `secretBox.*` key sets identical (script).
- **Size**: no new file over 200 lines.

### Edge Cases Turned Up
- Admin hearts before LAUNCH_AT (admins bypass the gate) can create boxes pre-launch and open them: harmless, noted in the decision log as "no gate".
- Tick outage over the 10-minute sweep window only delays `BoxGranted`; every read path reconciles.
- Open key whose first attempt returned 409 is not stored, so reusing it after a new grant opens a box (acceptable, client frees the key on 409).

### Done Well
Lock-first, no-pool-read-under-lock discipline documented in the code; DB constraints as the second line for every invariant; hash-then-`timingSafeEqual`; stock-safe re-seed; client state machine framework-free and unit-testable; down scripts verified by a rolled-back-transaction test.

### Actions In Order
1. Make 0016 degrade gracefully where pg_cron/vault are absent (or document it as Supabase-only and confirm CI/dev DB has them).
2. Record the phase 13 constraint on anonymous `senderId` in the plan.
3. Add a tick overlap guard / sender cap.
4. Replay lookup before reconcile (optional).

### Numbers
- Type coverage: not measured (no `any` seen in the reviewed sources).
- Test coverage: not measured; 13 integration, 3 unit, 2 e2e files exist for this phase, not re-run.
- Lint findings: not run.

### Still Unresolved
- Tests, typecheck, lint not run by me; the verdict rests on code reading.
- Screenshots in `evidence/screenshots/phase-10/` not opened.
- Mystery gift name and prize weights/stock are placeholders pending BTC (decision log).
- Sign-off: `riskGate` is `humanSignedOff: false`; auth/public path/migration/cron are sensitive, human sign-off required.

**Status:** DONE_WITH_CONCERNS
**Summary:** No critical or high issues; concurrency, idempotency, stock, auth and secret handling hold up under code reading. Verdict SEALED, score 8, human sign-off still required.
**Concerns:** 0016 pg_cron/vault portability; anonymous senderId in the national-kudos event (phase 13 constraint); tick overlap guard; tests not re-run by me.
