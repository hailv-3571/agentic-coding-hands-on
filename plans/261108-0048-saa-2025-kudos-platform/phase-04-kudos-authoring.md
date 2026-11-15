---
phase: 04
feature: F003
priority: P0
status: pending
depends_on: [02, 03]
file_ownership:
  - app/api/sunners/search/route.ts
  - app/api/hashtags/route.ts
  - app/api/kudos/images/sign/route.ts
  - app/api/kudos/[id]/edit/route.ts
  - features/kudos-authoring/**
  - features/sunner-search/**
  - shared/db/schema/kudos.ts            # + one export line in shared/db/schema/index.ts (serial edit)
  - db/migrations/*_kudos.sql
  - db/migrations/*_kudos_constraints.sql
  - tests/unit/kudos-authoring/**
  - tests/integration/kudos-authoring/**
  - tests/e2e/kudos-authoring/**
resolves: [C-01 (KudoCreated in-tx), C-06 (owner), C-07, C-10, C-17 (edit side)]
---

# Phase 04 — Kudos authoring (F003)

## Context Links
- Spec: `spec/kudos-authoring/functional-spec.md`, `spec/kudos-authoring/technical-spec.md` (A1–A6)
- Screen: `spec/kudos-authoring/screens/SCR-write-kudo-modal/spec.md`
- Figma `9ypp4enmFmdK3YAFJLIu6C` composer frames: `520:11602`, `828:13433`, `1612:5056`, `662:13035`, `1949:13746`, `1002:12917`, `828:10943`, `1002:13013` (create / edit / dropdowns / Add link / error / anonymous states — name each via `get_metadata` in step 2)
- Decisions: `spec/decision-log.md` § Luật viết Kudo (overrides spec D002/D003/D004/D007–D009/D013)
- Conflicts: `spec/system/architecture.md` § Consistency Check C-01, C-06, C-07, C-10, C-17
- Upstream: phase-01 (`env.EVENT_END_AT`, `isEventWritingOpen` from `shared/config/event-window.ts`, `DomainEventOutbox#add(tx,…)` with `KudoCreated{kudoId}`, `hashtags` seed, bucket `kudo-images` private 5 MB jpeg/png/webp, RLS convention, `DbTx`), phase-02 (`requireSunner()`, `getSessionUser()`, `profiles`), phase-03 (app shell, toast, `app-routes.ts`)

## Overview
- Priority: P0 · Status: pending
- Write side of Kudos: shared `KudoComposerModal` (create / edit), Sunner search, hashtag list, image upload to Storage, `createKudo` / `updateKudo` server actions, edit-load endpoint.
- **Creates the `kudos` table INCLUDING `status kudo_status NOT NULL DEFAULT 'public'`** (enum `'public' | 'spam'` created here) plus `kudo_hashtags`, `kudo_images`, `kudo_image_uploads`. Phase 08 adds ONLY moderation columns (`moderated_by`, `moderated_at`) and the public↔spam transitions; it never re-creates the enum or column. Phase 04 never writes `status` (always DB default).
- Owns the ONE Sunner search endpoint (C-06), reused by phases 05 (profile search), 08 (admin filters), 12.

## Key Insights
- Decisions applied: no self-send (Zod + DB `CHECK sender_id <> recipient_id`; search `excludeSelf=true` in composer); unlimited count, repeats to same recipient allowed (no unique, no rate limit); hashtags 1–5 from active seeded list (decision-log 2026-11-15: Figma "Tối đa 5"); title optional ≤ 50 (D006); body 1–1,000 chars after trim; mentions are plain-text `@Full Name` tokens (no mention table, no notification — D011); links are plain URL text inserted by "Add link" (renderer in 05 escapes + autolinks http/https only); anonymous flag; edit all fields except recipient; edit locked when `status='spam'`; no delete path anywhere; create + edit rejected when `now >= EVENT_END_AT`.
- C-10 dissolves: self-kudos cannot exist → counting phases need no exclusion.
- Phase 01 forbids sender id in object paths (anonymous leak). BR-003 "path under sender folder" is replaced by `kudo_image_uploads(storage_path pk, uploader_id, created_at)`: sign endpoint records the issued path; create/update accept only paths whose upload row has `uploader_id = sender` AND whose object exists in `storage.objects` (same Postgres, checked inside the tx). Path: `kudos/{uuid}.{ext}`.
- C-01: `KudoCreated{kudoId}` written via `DomainEventOutbox#add(tx, …)` inside the create transaction; edit emits no event (none in the phase-01 union; YAGNI).
- C-17 edit side: conditional `UPDATE … WHERE id=$1 AND sender_id=$2 AND status='public'` → race-safe against a concurrent Mark Spam (phase 08). 0 rows → re-read to classify 404 / 403 / 423-locked.
- C-18: mutations = Server Actions (tech spec A4/A5; phase 02 `signOut` precedent); reads = route handlers. Confirm against Next 16 docs in step 1.
- Double submit: client disables button (FR-403); no idempotency key in v1 (spec § 5.3, accepted).

## Requirements
- Functional: FR-001, FR-002, FR-101, FR-102, FR-201..210, FR-401..403; BR-001..005, DEC-001; US001..US004; decision-log rules above.
- Security: FR-601 (session via `requireSunner`), FR-602 (owner-only edit), FR-603 (server re-validates everything with the same Zod schema).
- Non-functional: create p95 < 300 ms excluding upload; files < 200 lines; vi/en via next-intl; modal keyboard/focus-trap + error announced (screen spec § 9).

## Architecture
```
KudoComposerLauncher (prompt box, placed by phase 05/12) ─► KudoComposerModal
  RecipientPicker ─► GET /api/sunners/search?q&excludeSelf=true      (C-06)
  MessageEditor "@" ─► same endpoint (excludeSelf=false) → inserts "@Full Name"
  HashtagPicker ─► GET /api/hashtags (active, sort_order, label by locale)
  ImagePicker ─► POST /api/kudos/images/sign → uploadToSignedUrl (browser → Storage)
  submit ─► createKudo | updateKudo (server action) ─► router.refresh() + toast
Edit entry (phase 05 card) ─► GET /api/kudos/{id}/edit ─► modal mode=edit prefilled
```
Create data flow: form → `KudoInputSchema` (client) → action → `requireSunner` → write-window check → Zod parse → tx { recipient exists in `profiles`; hashtags active; uploads owned + objects exist; insert `kudos`; insert `kudo_hashtags`; insert `kudo_images` (position 0..4); delete consumed `kudo_image_uploads` rows; `DomainEventOutbox#add(tx,'KudoCreated',{kudoId})` } → `{ ok: true, id }` | `{ ok: false, fieldErrors | code }`.
Update: same, minus recipient (immutable — field rejected if present), conditional update + replace hashtag/image sets, `updated_at = now()`; `created_at`, hearts untouched (FR-402).

Contracts exported:
```ts
// C-07 — consumed by phase 05 (Live board, card edit) and phase 12 (profile "Gửi Kudo")
type KudoComposerModalProps = { open: boolean; onOpenChange(o: boolean): void; onSaved?(id: string): void } & (
  | { mode: 'create'; recipient?: SunnerOption; lockRecipient?: boolean }   // lockRecipient requires recipient
  | { mode: 'edit'; kudoId: string } );                                     // recipient always locked
// C-06 — GET /api/sunners/search?q=<1..50>&limit=<1..20, default 10>&excludeSelf=<bool, default false>
type SunnerOption = { id: string; fullName: string; email: string; avatarUrl: string | null;
  department: { id: number; name: string } | null };
searchSunners(q, { viewerId, limit, excludeSelf }): Promise<SunnerOption[]>  // server fn, reused by 08/12 without HTTP
```
Search: diacritic-insensitive `unaccent(full_name) ILIKE unaccent('%q%') OR email ILIKE 'q%'` (LIKE metachars escaped), order by name, limit.

Data (migration `*_kudos.sql`, generated + RLS enable in same file):
- enum `kudo_status ('public','spam')`
- `kudos(id uuid pk default gen_random_uuid(), sender_id uuid not null → profiles.id on delete restrict, recipient_id uuid not null → profiles.id on delete restrict, title varchar(50) null, body text not null, is_anonymous boolean not null default false, status kudo_status not null default 'public', created_at timestamptz not null default now(), updated_at timestamptz not null default now())`
- `kudo_hashtags(kudo_id → kudos on delete cascade, hashtag_id → hashtags on delete restrict, pk(kudo_id, hashtag_id))`, index `(hashtag_id)`
- `kudo_images(id uuid pk, kudo_id → kudos cascade, storage_path text unique not null, position smallint not null, unique(kudo_id, position))`
- `kudo_image_uploads(storage_path text pk, uploader_id uuid not null → profiles.id, created_at timestamptz default now())`
- `*_kudos_constraints.sql` (custom): `CHECK (sender_id <> recipient_id)`, `CHECK (char_length(body) BETWEEN 1 AND 1000)`, `CHECK (position BETWEEN 0 AND 4)`, `create extension if not exists unaccent` + immutable wrapper `f_unaccent(text)`.
- Feed/sender/recipient indexes are phase 05's migration (not here). 1–5 hashtags and ≤ 5 images enforced in the tx (cross-row; no trigger — YAGNI).

## Related Code Files
Create:
- `shared/db/schema/kudos.ts` (enum + 4 tables); modify `shared/db/schema/index.ts` (one export line)
- `db/migrations/NNNN_kudos.sql`, `NNNN_kudos_constraints.sql`
- `features/sunner-search/server/sunner-search-query.ts`, `features/sunner-search/schemas/sunner-search-params-schema.ts`, `features/sunner-search/components/sunner-search-combobox.tsx` (shared combobox, reused by 05/12)
- `app/api/sunners/search/route.ts`, `app/api/hashtags/route.ts`, `app/api/kudos/images/sign/route.ts`, `app/api/kudos/[id]/edit/route.ts`
- `features/kudos-authoring/kudo-authoring-limits.ts` (BODY 1000, TITLE 50, HASHTAGS 1..3, IMAGES 5, IMAGE_BYTES 5 MB, mime list)
- `features/kudos-authoring/schemas/kudo-input-schema.ts` (create + update, shared client/server), `kudo-image-sign-schema.ts`
- `features/kudos-authoring/server/create-kudo-action.ts`, `update-kudo-action.ts`, `kudo-write-repository.ts` (tx helpers), `kudo-image-upload-service.ts` (sign + ownership/existence check), `kudo-edit-query.ts`, `hashtag-list-query.ts`, `kudo-write-errors.ts`
- `features/kudos-authoring/components/kudo-composer-modal.tsx`, `kudo-composer-launcher.tsx`, `kudo-composer-form.tsx`, `recipient-picker.tsx`, `kudo-message-editor.tsx` (`@` mention + Add link), `add-link-popover.tsx`, `hashtag-picker.tsx`, `kudo-image-picker.tsx`, `use-kudo-composer-submit.ts`
- `messages/vi.json`, `messages/en.json` — `kudosComposer.*`, `sunnerSearch.*` keys only
- Tests: `tests/unit/kudos-authoring/kudo-input-schema.test.ts`, `kudo-write-window.test.ts`; `tests/integration/kudos-authoring/create-kudo.test.ts`, `update-kudo.test.ts`, `kudo-image-ownership.test.ts`, `sunner-search.test.ts`, `kudos-migration.test.ts`; `tests/e2e/kudos-authoring/compose-and-edit.spec.ts`

Modify: `shared/db/schema/index.ts` (export only). Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/`: Server Actions (return shape, `useActionState`/`useTransition`), route handlers, async `params`; record any deviation here.
2. Figma MCP `create_session` → `get_metadata`/`get_design_context`/`get_screenshot` for the 8 frames; map states (create, edit "Sửa bài viết", recipient/hashtag dropdowns, Add link, DEC-001 error, anonymous, image thumbnails). Copy text verbatim. Never guess values.
3. Schema + migrations; `db:reset`; confirm `rls-baseline.test.ts` (phase 01) still green for the 4 new tables.
4. `kudo-authoring-limits.ts` + `kudo-input-schema.ts` (trim body, 1–1000; title ≤ 50 or empty→null; hashtagIds unique 1..3; imagePaths ≤ 5 unique, `^kudos/[0-9a-f-]{36}\.(jpg|png|webp)$`; update schema has no `recipientId`) — unit tests first.
5. `sunner-search-query.ts` + route (401 / 400 / 200); `hashtag-list-query.ts` + route.
6. `kudo-image-upload-service.ts`: validate mime/size → path `kudos/{uuid}.{ext}` → insert `kudo_image_uploads` → `createSignedUploadUrl` via service client → `{ path, token, signedUrl }`. `assertUploadsUsable(tx, senderId, paths)` checks upload rows + `storage.objects(bucket_id='kudo-images', name=path)`; on update, paths already attached to this kudo are accepted.
7. `create-kudo-action.ts`: `requireSunner` → window → Zod → tx per Architecture → `KudoCreated` via outbox in same tx. Errors mapped to codes: `VALIDATION` (field errors, DEC-001 message), `SELF_SEND`, `RECIPIENT_INVALID`, `HASHTAG_INVALID`, `IMAGE_INVALID`, `WRITING_CLOSED`.
8. `update-kudo-action.ts` + `kudo-edit-query.ts` / edit route: owner + `status='public'` conditional update; replace hashtag/image sets; `NOT_FOUND` 404, `FORBIDDEN` 403 (no content), `SPAM_LOCKED` 423, `WRITING_CLOSED`. Edit route returns spam kudo to owner with `locked: true` (modal read-only notice).
9. Components: modal (focus trap, Esc/Hủy confirm if dirty), launcher (disabled with notice when writing closed — server passes flag), recipient picker (locked render for C-07/edit), editor (counter, hard stop at 1000, `@` popover), hashtag picker (max 3), image picker (per-file error/retry/remove, max 5), submit hook (disable while pending, toast, `onSaved` → `router.refresh()`).
10. i18n keys vi/en; error messages from functional spec § 9 + DEC-001 verbatim.
11. Tests (Scope Contract), then reviewer.

## Todo List
- [ ] Read Next.js 16 docs (Server Actions, route handlers)
- [ ] Figma study of 8 frames
- [ ] `kudos` schema incl. `status` enum + child tables + constraints migration; RLS green
- [ ] Input schema + limits (+unit)
- [ ] Sunner search (C-06) + hashtags routes
- [ ] Image sign + ownership check (no sender id in path)
- [ ] `createKudo` with in-tx `KudoCreated` outbox (C-01)
- [ ] `updateKudo` + edit load, spam lock, owner check (C-17)
- [ ] Composer modal + launcher with prefilled/locked recipient (C-07)
- [ ] i18n keys
- [ ] Integration + e2e green

## Success Criteria
- New kudo row has `status='public'` (DB default), correct sender from session, 1–5 hashtags, ordered images; exactly one `KudoCreated{kudoId}` outbox row; forced failure after insert rolls back kudo + outbox together.
- Self-send rejected by action AND by DB CHECK (direct insert test). Second kudo to same recipient succeeds.
- 1,001-char body, 0 or 4 hashtags, inactive hashtag, 6 images, foreign/unknown upload path → rejected server-side with no rows written.
- Non-owner update → 403, row unchanged; spam kudo update by owner → 423, row unchanged; recipient change impossible; `created_at` unchanged after edit.
- After `EVENT_END_AT` (test env override) create + update → `WRITING_CLOSED`; launcher disabled.
- No route/action exists that deletes a kudo.
- Search: diacritic-insensitive, `excludeSelf` honoured, LIKE metachars inert, 401 without session.
- Phase 12 can open modal with locked recipient (e2e via test harness page or phase 05 entry).

## Scope Contract
- **Changed:** `kudos` + child tables, enum, constraints, RLS; `features/kudos-authoring/**`, `features/sunner-search/**`, 4 route handlers, 2 server actions, i18n keys.
- **Impacted:** phase 05 (reads `kudos`, renders launcher + edit entry), 06/09/10 (count over `kudos`), 08 (adds moderation columns, transitions), 12 (locked-recipient composer, search), 13 (consumes `KudoCreated`).
- **Will verify:** unit (schema, write window); integration on local Supabase (migration up from empty + down, CHECKs, RLS baseline, create tx + outbox atomicity, update owner/spam/race via conditional update, image ownership + existence, search); e2e (compose with image + hashtags + anonymous, DEC-001 error, edit prefilled + save, non-owner sees no edit button, double-click creates one kudo).
- **Deliberately skipped:** feed rendering/masking (05), hearts (06), spam transitions (08), outbox processing (13).
- **Safety-critical → full test set required:** database migration/schema + data mutations + outbox write + owner authorization.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Anonymous sender leaked via image path or outbox payload | M | H | Random uuid path, no sender id; outbox ids only; integration test asserts path regex |
| Edit races Mark Spam | M | M | Conditional UPDATE on `status='public'`; test interleaving |
| Orphan uploads (cancelled form) | H | L | Accepted (RISK-01); `kudo_image_uploads` enables later cleanup job |
| Foreign image reference | M | M | Upload-row ownership + `storage.objects` existence in tx |
| Phase 08 re-declares `status` / enum | L | H | Stated in Overview + phase 08 depends on this migration |
| Next 16 Server Action API drift | M | M | Step 1 docs read |

Rollback: down migration drops 4 tables + enum + extension wrapper (only valid before phase 05/08 data); revert feature folders. Data written is user content → after launch, roll forward only.

## Security Considerations
- `sender_id` only from session; `status` never accepted from client; recipient immutable on update.
- RLS on, no client policy (C-20); all DB via server; bucket private, signed upload URL short-lived, reads via server-signed URLs (phase 05).
- Body stored as plain text; never rendered as HTML; Add link accepts only `http(s)://` URLs (Zod `url()` + scheme check).
- 403 / 404 / 423 responses carry no kudo content.

## Next Steps
- Phase 05 places `KudoComposerLauncher` on Live board and wires card edit → `KudoComposerModal mode=edit`.
- Phase 08 adds `moderated_by`, `moderated_at` + transitions on existing `kudos.status` (sanctioned serial edit of `shared/db/schema/kudos.ts` + own migration; phase 08 runs after 04).
- Phase 12 uses `mode='create', recipient, lockRecipient: true`; phases 05/08/12 reuse `searchSunners` / `/api/sunners/search`.

## Open Questions
- Profiles have no "deactivated" flag → "người nhận bị vô hiệu" = profile missing only; revisit if phase 14 adds deactivation.
- Editing a kudo whose hashtag was later deactivated: v1 requires re-pick (active only).
