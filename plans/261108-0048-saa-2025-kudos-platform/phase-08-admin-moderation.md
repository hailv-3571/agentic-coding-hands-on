---
phase: 08
feature: F007
priority: P1
status: pending
depends_on: [04]
file_ownership:
  - app/admin/review/**
  - app/api/admin/kudos/**
  - features/admin-moderation/**
  - db/migrations/*_kudos_moderation_columns.sql
  - tests/unit/admin-moderation/**
  - tests/integration/admin-moderation/**
  - tests/e2e/admin-moderation/**
resolves: [C-01 (KudoMarkedSpam producer), C-08 (kudo_status naming), C-13 (admin side), C-14 (consumer), C-17 (spam tag/overlay UI)]
---

# Phase 08 — Admin moderation (F007)

## Context Links
- Spec: `spec/admin-moderation/functional-spec.md`, `spec/admin-moderation/technical-spec.md`
- Screens: `spec/admin-moderation/screens/SCR-admin-review-content/spec.md`, `spec/admin-moderation/screens/SCR-spam-alert-overlay/spec.md`
- Figma `9ypp4enmFmdK3YAFJLIu6C` nodes: `722:16251`, `832:13197`, `773:26295`, `773:26373`, `1002:15428`, `1002:15464`, `1002:15559`, `3127:24099`, `3127:24672` (Review content table, filter dropdowns, Public/Spam confirm popovers, "KUDO spam" card + Alert Overlay — map each via `get_metadata` in step 2; spec has no node ids)
- Decisions: `spec/decision-log.md` § Ẩn danh & spam (C-13, no clawback, manual-only), § sửa/xóa (spam locks edit), C-01/C-16, C-08, C-14
- Conflicts: `spec/system/architecture.md` § Consistency Check C-01, C-08, C-13, C-14, C-17
- Upstream: phase-01 (`DomainEventOutbox#add` + `KudoMarkedSpam` payload type, `shared/admin/{csv-serializer,date-range-filter,timezone,export-limit}`, `ADMIN_TIMEZONE`, `EXPORT_MAX_ROWS`), phase-02 (`requireAdmin()` in `shared/auth/admin-guard.ts`, `profiles`), phase-03 (`app/admin/layout.tsx` guard + top bar route `/admin/review`), phase-04 (`kudos` with `status kudo_status NOT NULL DEFAULT 'public'`, `kudo_hashtags`, `GET /api/sunners/search`)

## Overview
- Priority: P1 · Status: pending
- Admin › Review content: table of ALL kudos (public + spam), filters Sender / Receiver / Status / date range, content search (case + diacritic insensitive), Heart sort, numbered pagination (10/page, newest first), Mark Spam / Un Spam with confirm popover, CSV Export of the current filter.
- Owns the moderation write path (`public ↔ spam`) + `moderated_by` / `moderated_at` columns, and the owner-facing spam UI (orange "Spam" tag + Alert Overlay "Cảnh báo vi phạm tiêu chuẩn cộng đồng") consumed by phases 05/12.
- Out of scope: auto-flag, Reject/third state, moderation history table (D008), notification delivery (phase 13 consumes the outbox event).

## Key Insights
- Phase 04 already created `kudos.status` (`kudo_status` = `'public' | 'spam'`). This phase ADDS only `moderated_by`, `moderated_at` — never recreates the enum (C-08: one name, one enum; TS reads it from the Drizzle schema, no string literals duplicated).
- Transitions are ONE conditional `UPDATE ... WHERE id = $1 AND status = $from RETURNING` → idempotent and concurrent-safe without locks (BR-001, FR-406). 0 rows → re-read: missing → 404; already in target state → success with current state, `moderated_*` untouched.
- Spam = query-time exclusion everywhere (05 `KudoPublicQuery`, 06 `HeartStatsQuery`, 09, 10, 11 all filter `status='public'`). Un Spam needs no compensation; granted/opened Secret Boxes kept. This phase writes no counters.
- C-01: `KudoMarkedSpam{kudoId, ownerId, moderatedAt}` goes into `domain_event_outbox` in the SAME tx as the UPDATE, only when a row actually changed public→spam. Un Spam emits nothing (D005). Payload ids only.
- C-13: admins see the real sender of anonymous kudos + "Ẩn danh" label via a SEPARATE `KudoAdminQuery`; it never imports or reuses `KudoPublicQuery` masking, and `KudoPublicQuery` never exposes it even to admins. Drizzle bypasses RLS (C-20) → `requireAdmin()` is the only gate, called first in every page/handler/action (layout guard does not protect actions).
- C-17 / owner view: the author still sees own spam (via phase 05 `KudoPublicQuery` `includeOwnSpam` / `findForViewer`); others get 404. Phase 08 supplies only presentation: `KudoSpamTag`, `SpamAlertOverlay`, `SpamKudoCard` (wraps phase 05 `KudoCard` with `isSpam`). No `OwnSpamKudoQuery` (replaced by `includeOwnSpam`, see Unresolved).
- Diacritic-insensitive search: Postgres `unaccent` (maps `đ→d`) behind an IMMUTABLE wrapper, compared with `ILIKE` on `lower()`; user input escaped for `%`/`_`. 10k rows → no trigram index (YAGNI).
- Heart column/sort needs `kudo_hearts` (phase 06, which runs after 05). → seam `admin-kudo-heart-counts.ts` (default 0, sort still deterministic by id tiebreak) rewritten when 06 lands.
- Table and Export share ONE filter builder + ONE order (BR-002, DRY); dates are whole days in `ADMIN_TIMEZONE` via phase 01 `date-range-filter`.

## Requirements
- Functional: FR-001, FR-002, FR-101, FR-201..208, FR-301..304, FR-401..408; BR-001..005, DEC-001, DEC-002, SM-001, INT-001; US001..US006; D001 (real sender + "Ẩn danh"), D002 (no clawback), D004 (confirm popover, no reason), D005, D006 (spam locks edit — enforced in phase 04 edit path), D007 (CSV, BOM, ≤ `EXPORT_MAX_ROWS`, 422 above), D008, D009, D010 (10/page, newest first, raw heart count), D011 (8-char id), D012 (fixed overlay, no close), D013 ("Receiver"/"Người nhận"), D014 (manual only).
- Security: FR-601 (non-admin → 403 page / 403 JSON), FR-602 (status changes only via admin server actions; `kudos` has no UPDATE policy for `authenticated`), FR-603, FR-604 (CSV formula guard).
- Non-functional: list p95 < 300 ms at 10k kudos; export ≤ 10k rows < 3 s; files < 200 lines; i18n vi/en.

## Architecture
```
/admin/review (RSC, requireAdmin) ── searchParams → AdminKudoFilterSchema ─► KudoAdminQuery.list ─► ReviewTable
  client: ReviewFilters (Sender/Receiver via /api/sunners/search, Status, date range, search debounce 300 ms)
          → router.replace(?filters&page=1)   (any change resets page 1, FR-402)
          ModerationButton → confirm popover → markKudoSpam / unSpamKudo (server action) → row patched in place
          ExportButton → GET /api/admin/kudos/export?<same params>
GET /api/admin/kudos         (requireAdmin → 403) → JSON page (retry path for client error state)
GET /api/admin/kudos/export  (requireAdmin → count → assertWithinExportLimit → 422 | CSV stream)
```
Data flow (read): params (Zod) → `buildAdminKudoWhere` (date `[start,end)` UTC, sender, receiver, status, `immutable_unaccent(lower(title||' '||message)) ILIKE immutable_unaccent(lower(%q%))`) → `KudoAdminQuery` (join sender/receiver `profiles`, hashtags batch, heart seam) → `AdminKudoRow { id, shortId, sender{ id,name,email }, isAnonymous, receiver, title, message, hashtags[], heartCount, status, moderatedBy?, moderatedAt? }`.

Data flow (write):
```ts
// features/admin-moderation/server/kudo-moderation-service.ts
transition(kudoId, to: KudoStatus, adminId): Promise<{ status: KudoStatus; changed: boolean }>
// db.transaction(tx =>
//   UPDATE kudos SET status=:to, moderated_by=:adminId, moderated_at=now()
//     WHERE id=:kudoId AND status=:from RETURNING id, sender_id, moderated_at
//   if row && to==='spam' → DomainEventOutbox.add(tx, 'KudoMarkedSpam', {kudoId, ownerId: sender_id, moderatedAt})
//   if !row → SELECT status → null ? NotFound : { status, changed:false })
```
- Actions `markKudoSpam(kudoId)` / `unSpamKudo(kudoId)`: `requireAdmin()` → Zod uuid → `transition` → `revalidatePath('/admin/review')`; `adminId` from session only. Result `{ ok, status, changed }` | `{ ok:false, code:'not_found' }`.
- Pagination: numbered offset (`LIMIT 10 OFFSET (page-1)*10`) + `COUNT(*)` over the same where; order `created_at DESC, id DESC` or `heart_count {ASC|DESC}, id DESC`. Page beyond last → clamp to last.
- Export: same where/order, no paging; columns: ID, Ngày gửi (`formatInZone`), Người gửi, Email người gửi, Ẩn danh (Có/Không), Người nhận, Tiêu đề, Lời nhắn, Hashtag, Tim, Trạng thái, Kiểm duyệt bởi, Kiểm duyệt lúc; file `kudos-{yyyymmdd-hhmm}.csv`, `Content-Disposition: attachment`, `Cache-Control: no-store`.

## Related Code Files
Create:
- `db/migrations/NNNN_kudos_moderation_columns.sql` — `CREATE EXTENSION IF NOT EXISTS unaccent`; `immutable_unaccent(text)` IMMUTABLE wrapper; `ALTER TABLE kudos ADD moderated_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL, ADD moderated_at timestamptz NULL`; CHECK `moderated_by IS NULL OR moderated_at IS NOT NULL` (admin may later be deleted → `SET NULL`, timestamp kept); index `kudos (created_at DESC, id DESC)` IF NOT EXISTS; down script. Drizzle column declarations: see Unresolved #3
- `app/admin/review/page.tsx` (RSC), `app/admin/review/loading.tsx`, `app/admin/review/error.tsx`
- `app/api/admin/kudos/route.ts` (GET), `app/api/admin/kudos/export/route.ts` (GET)
- `features/admin-moderation/schemas/admin-kudo-filter-schema.ts` (page, sort, status, senderId, receiverId, from/to via `date-range-filter`, q ≤ 200 chars), `admin-kudo-row.ts`
- `features/admin-moderation/server/admin-kudo-where-builder.ts`, `kudo-admin-query.ts`, `admin-kudo-heart-counts.ts` (SEAM, default 0), `kudo-moderation-service.ts`, `kudo-moderation-actions.ts` (`'use server'`), `admin-kudo-export.ts` (rows → `csv-serializer`)
- `features/admin-moderation/components/review-filters.tsx`, `review-sunner-filter-select.tsx`, `review-date-range-filter.tsx`, `review-table.tsx`, `review-table-row.tsx`, `review-status-badge.tsx`, `review-moderation-button.tsx` (confirm popover, `useTransition`), `review-pagination.tsx`, `review-export-button.tsx`, `review-empty-error-state.tsx`
- `features/admin-moderation/components/kudo-spam-tag.tsx`, `spam-alert-overlay.tsx`, `spam-kudo-card.tsx` (exported for phases 05/12)
- `messages/vi.json`, `messages/en.json` — `adminModeration.*` keys only
- Tests: `tests/unit/admin-moderation/admin-kudo-filter-schema.test.ts`, `admin-kudo-export.test.ts`; `tests/integration/admin-moderation/kudo-moderation-service.test.ts`, `kudo-admin-query.test.ts`, `admin-access.test.ts`, `admin-kudo-export-route.test.ts`, `moderation-migration.test.ts`; `tests/e2e/admin-moderation/review-content.spec.ts`, `owner-spam-view.spec.ts`

Modify: none outside ownership. Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` for server actions (`'use server'`, `revalidatePath`), route handlers returning streams/files, `forbidden()`, async `searchParams`; note deviations here.
2. Figma pass (`create_session` on `9ypp4enmFmdK3YAFJLIu6C`; `get_metadata` to map the 9 node ids to table/filters/popovers/spam card/overlay; `get_design_context` per node). Phase 01 tokens only, no guessed values. Badge Public = green border, Spam = yellow border; owner tag = orange.
3. Migration + Drizzle columns; run on local Supabase from empty DB and on top of phase 04; verify down; `EXPLAIN` list query uses index.
4. Schemas (unit first): filter parsing, reversed date range → 400 "Khoảng ngày không hợp lệ", unknown status → 400, page ≥ 1, q trimmed.
5. `admin-kudo-where-builder.ts` (pure Drizzle SQL, shared by list + export) + `kudo-admin-query.ts` (count + page, hashtags batch-load, no N+1) + heart seam.
6. `kudo-moderation-service.ts` per Architecture (single tx, conditional UPDATE, outbox only on real public→spam); `kudo-moderation-actions.ts` with `requireAdmin()` FIRST.
7. Route handlers: `requireAdmin()` → 403 JSON before parsing; Zod 400; export: count → `assertWithinExportLimit` → 422 `{code:'export_too_large'}`; else serialize via phase 01 `csv-serializer` (BOM, formula guard). Never hand-roll CSV.
8. Components: filters (URL-driven, reset page 1), Sunner selects reuse `/api/sunners/search?excludeSelf=false`, table row shows shortId (8 chars), sender name + "Ẩn danh" chip when `isAnonymous`, hashtags truncated, heart, badge, button; popover confirm → action → patch row from returned `status` (covers "already spam" by other admin with toast "Kudo đã được cập nhật bởi Admin khác"); empty + error (retry) states.
9. Owner spam UI: `KudoSpamTag`, `SpamAlertOverlay` (fixed, no close, `role="alert"` text), `SpamKudoCard` wrapping phase 05 `KudoCard` (`isSpam` hides heart/Copy Link/edit).
10. i18n vi/en (Figma copy verbatim; "Receiver"/"Người nhận").
11. Tests (Scope Contract), then reviewer.

## Todo List
- [ ] Next 16 docs (server actions, file responses, forbidden)
- [ ] Figma node mapping + extraction
- [ ] Migration `moderated_by/moderated_at` + unaccent wrapper + down
- [ ] Filter schema + where builder (+unit)
- [ ] `KudoAdminQuery` + heart seam
- [ ] Moderation service + actions (conditional UPDATE + outbox in tx)
- [ ] `/api/admin/kudos` + export route (422 over limit)
- [ ] Review page, filters, table, popover, pagination, export button, states
- [ ] `KudoSpamTag`, `SpamAlertOverlay`, `SpamKudoCard`
- [ ] i18n keys
- [ ] Integration + e2e green (full safety-critical set)

## Success Criteria
- SC-001..SC-00x of technical spec § 5.1 pass.
- Mark Spam flips exactly one row public→spam, sets `moderated_by`=admin, `moderated_at`; Un Spam reverses; repeat call returns `changed:false`, `moderated_*` unchanged, no second outbox row.
- 10 concurrent Mark Spam on one kudo → 1 UPDATE, 1 `KudoMarkedSpam` outbox row, 0 errors.
- Outbox row rolls back when the tx fails (forced error after UPDATE leaves status public).
- After Mark Spam: kudo absent from `/api/kudos`, highlight, detail (404 for non-author); author sees it with Spam tag + overlay; `kudo_hearts` row count unchanged; after Un Spam it reappears.
- Non-admin: `/admin/review` → 403 page; `GET /api/admin/kudos[/export]` → 403; direct server-action call → forbidden, status unchanged.
- Anonymous kudo: admin row shows real sender + "Ẩn danh"; grep of every non-admin response (feed, detail, profile, 403 bodies) contains no sender id/name/email.
- Search "nguyen" matches "Nguyễn"; "DUOC" matches "được"; filters AND; `to` date includes 23:59 +07; table total == export row count for same params.
- Export of a cell `=HYPERLINK(...)` opens as text; > `EXPORT_MAX_ROWS` → 422, no file.

## Scope Contract
- **Changed:** `features/admin-moderation/**`, `/admin/review`, `/api/admin/kudos/**`, migration (`moderated_*`, `unaccent`), i18n keys.
- **Impacted:** every public read path that filters `status` (05, 06, 09, 10, 11 trigger on `UPDATE OF status`), phase 13 (consumes `KudoMarkedSpam`), phase 12 (spam card UI), phase 04 edit path (must refuse spam kudos), phase 14 overview counts.
- **Will verify:** unit (filter schema, CSV row mapping); integration on local Supabase (service: transitions, idempotency, concurrency via parallel tx, outbox same-tx + rollback; query: filters/AND/tz/diacritics/pagination/sort; access matrix: no session 401, user 403, demoted admin 403, admin 200 for page/list/export/actions; anonymous sender only in admin responses; export 422 + formula guard; migration up/down); e2e (filter → page 1, Mark Spam popover → row updates without reload, Un Spam, export download, user sees 403, owner spam card overlay, other user 404).
- **Deliberately skipped:** heart count correctness (phase 06 seam), notification delivery (13), Spotlight realtime reaction (11), Hero/Secret Box recomputation (09/10 own query-time filters).
- **Safety-critical → full test set required:** authorization (admin guard on page/handlers/actions), data mutation (`kudos.status`), migration, anonymous-sender exposure.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Server action callable by non-admin (layout guard bypassed) | M | H | `requireAdmin()` first line of each action/handler; integration test calls action as user |
| Anonymous sender leaks from admin DTO into public path | L | H | Separate module, no shared mapper; ESLint `no-restricted-imports` blocks `features/admin-moderation/server` from `features/kudos-feed`; payload grep test |
| Lost update / double outbox on concurrent clicks | M | M | Conditional UPDATE + outbox only when RETURNING row exists; concurrency test |
| `unaccent` not IMMUTABLE → unusable in expression / slow | M | L | IMMUTABLE wrapper with schema-qualified dictionary; 10k rows seq-scan acceptable |
| Export memory/time at 10k rows | L | M | Count guard first; stream rows in batches of 1000 |
| Heart seam left at 0 forever | M | M | Unresolved #1 assigns rewrite; e2e after 06 asserts real counts |
| Phase 04 edit path ignores spam lock (D006) | M | M | Integration test here asserts edit of spam kudo rejected (read-only check on 04 action) |

Rollback: revert phase files; down migration drops `moderated_by`, `moderated_at`, wrapper function (keeps `unaccent` extension, harmless); `status` values remain valid for phase 04/05. Spam rows restored with `UPDATE kudos SET status='public' WHERE status='spam'` only if product decides; no data deleted by this phase.

## Security Considerations
- `requireAdmin()` (DB role each call) on page, both handlers, both actions; `adminId` from session, never from client.
- No UPDATE policy for `authenticated` on `kudos`; RLS on, no client policy (C-20); phase 04 edit schema excludes `status`.
- Admin-only exposure of real anonymous sender (C-13); `Cache-Control: no-store` on admin JSON/CSV.
- CSV formula injection guarded by shared serializer (FR-604, C-14); outbox payload ids only (no kudo content).
- Search input length-capped + LIKE-escaped; all SQL parameterized via Drizzle.

## Next Steps
- Phase 06 (or whoever lands after 06) rewrites `admin-kudo-heart-counts.ts` to `HeartStatsQuery`-consistent raw counts (D010: no x2).
- Phase 11 trigger fires on `UPDATE OF status` — no-op transitions update 0 rows so no event.
- Phase 12 renders `SpamKudoCard`; phase 13 consumes `KudoMarkedSpam`; phase 14 overview reuses `admin-kudo-where-builder` status counts.

## Unresolved
1. Heart seam owner: phase 06 file ownership does not list `features/admin-moderation/server/admin-kudo-heart-counts.ts` — controller should add it to 06 (or 14).
2. Phase 12 still references `OwnSpamKudoQuery#listBySender` (08) + ALG-001 merge; phase 05 replaced it with `KudoPublicQuery.list({includeOwnSpam})`. This phase follows 05 and does NOT create `OwnSpamKudoQuery`; phase 12 needs reconciling. Also spec D003 (owner detail 404) vs phase 05 (owner sees read-only spam detail) — phase 05 / brief win.
3. Drizzle `kudos` table file is owned by phase 04; adding `moderated_by/moderated_at` columns to it needs either phase 04 to declare them (nullable, unused) or a coordinated one-line edit — controller to decide.
