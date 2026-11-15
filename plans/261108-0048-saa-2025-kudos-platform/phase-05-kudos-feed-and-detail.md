---
phase: 05
feature: F004
priority: P1
status: pending
depends_on: [04]
file_ownership:
  - app/(app)/kudos/page.tsx
  - app/(app)/kudos/[id]/**
  - app/api/kudos/route.ts
  - app/api/kudos/highlight/**
  - features/kudos-feed/**
  - db/migrations/*_kudos_feed_indexes.sql
  - tests/unit/kudos-feed/**
  - tests/integration/kudos-feed/**
  - tests/e2e/kudos-feed/**
resolves: [C-05, C-13 (public side), C-17 (detail view), C-19 (seam), C-06 (consumer)]
---

# Phase 05 — Kudos feed & detail (F004)

## Context Links
- Spec: `spec/kudos-feed/functional-spec.md`, `spec/kudos-feed/technical-spec.md`
- Screens: `spec/kudos-feed/screens/SCR-kudos-live-board-feed/spec.md` (Figma Live board `2940:13431`), `spec/kudos-feed/screens/SCR-kudo-detail/spec.md` (Figma View Kudo `520:18779`)
- Decisions: `spec/decision-log.md` (anonymous, spam, hashtags 1–3, edit rules)
- Conflicts: `spec/system/architecture.md` § Consistency Check C-05, C-13, C-17, C-19, C-06
- Figma study: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md` § 3.3
- Upstream: phase-01 (config, Drizzle, RLS), phase-02 (session proxy, `profiles`), phase-04 (`kudos` incl. `status kudo_status DEFAULT 'public'`, `kudo_hashtags`, `kudo_images`, `KudoComposerModal`, `GET /api/sunners/search`)

## Overview
- Priority: P1 · Status: pending
- Read-only Live board: Highlight carousel (Hashtag + Phòng ban filters), All Kudos feed with cursor "Tải thêm", Kudo card (anonymous variant), detail page with fixed URL `/kudos/{id}`, Copy Link, Sunner profile search.
- **Owns the Live board page** and exposes layout slots: Spotlight (phase 11), composer entry (phase 04 modal), rewards column (phase 10).
- Owns `KudoPublicQuery` — the ONE public read path for kudos (feed, detail, profile in phase 12).

## Key Insights
- Drizzle runs as server role and bypasses RLS (C-20) → masking MUST live in the query/mapper, never in UI.
- C-05: phase 12 needs recipient/sender filters + identical cursor. A `senderId` filter on someone else's kudos would leak anonymous authorship → query forces `is_anonymous = false OR sender_id = viewerId` whenever `senderId` is set.
- C-17: spam is 404 for everyone except its author; author gets a read-only spam view (tag, edit locked per decision log). Own-spam listing is the `includeOwnSpam` option of the same query (one cursor, one mapper) — phase 08 supplies only the `SpamAlertOverlay`/tag UI that wraps `KudoCard`. Same 404 response for bad uuid / missing / spam-non-author (no existence oracle).
- Hearts (phase 06) and Hero badges (phase 09) land later and in parallel → two seam files with neutral defaults (`heartCount 0`, `tier null`, recency ranking). Each later phase rewrites only its own seam file → no file collision between 06 ∥ 09.
- C-19: Highlight ranking comes from phase 06's heart ranking query via the heart seam; phase 05 never counts `kudo_hearts`.
- C-06: Sunner search endpoint is owned by phase 04; this phase only calls it (`excludeSelf=false`).
- No caching in v1 → Mark Spam takes effect on the next load (spec § 5.2).

## Requirements
- Functional: FR-001, FR-002, FR-101, FR-102, FR-201..206, FR-301..305, FR-401..404; BR-001..006, DEC-001; US001..US006; D001 (top 5 by hearts, tie newest), D002 (department = recipient's), D003 (load more, 10/page, newest first), D004 (separate page), D005 (no realtime feed), D006, D007 (name + email), D008 (truncate on card).
- Security: FR-601 (session required; pages redirect, data routes 401), FR-602 (anonymous sender never reaches browser, incl. RSC payload).
- Non-functional: feed page p95 < 300 ms at 10k kudos (index-backed); files < 200 lines; i18n vi/en via next-intl.

## Architecture
```
Live board page (RSC) ── first page + highlight via KudoPublicQuery ──► KudoCard list
  client: HighlightFilters → GET /api/kudos/highlight?hashtag&department
          AllKudosFeed "Tải thêm" → GET /api/kudos?cursor
  slots: <SpotlightSlot/> (11) · <RewardsColumnSlot/> (10) · composer button opens KudoComposerModal (04)
Detail page (RSC) /kudos/[id] → KudoPublicQuery.findForViewer(id, viewer) → view | notFound()
```
Data flow: params (Zod) → `KudoPublicQuery` (status filter, joins profiles/departments/hashtags/images, cursor) → `maskKudoRow` (drop sender fields if anonymous, compute `isOwner`) → `enrichKudoCards` (heart seam + hero seam) → `KudoCardView` JSON → `KudoCard`.

`KudoPublicQuery` contract (exported, used by phase 12):
```ts
list(opts: { viewerId: string; recipientId?: string; senderId?: string; hashtagId?: string;
  departmentId?: string; cursor?: string; limit?: number;
  includeOwnSpam?: boolean   // honoured ONLY when senderId === viewerId → own spam rows with isSpam=true (phase 12 "Đã gửi"; replaces a separate OwnSpamKudoQuery)
}): Promise<{ items: KudoCardView[]; nextCursor?: string }>
findForViewer(id: string, viewerId: string): Promise<KudoCardView & { isSpam: boolean } | null>
publicKudoIdsSubquery(filters: { hashtagId?; departmentId? })   // Drizzle subquery (id, created_at), status=public, AND filters
// consumed by phase 06 HeartRankingQuery (Highlight) and phase 10 (Kudos Quốc Dân, no filters)
```
- Cursor: base64url `{c: created_at ISO, i: id}`; order `(created_at DESC, id DESC)`; predicate `(created_at, id) < (c, i)`; invalid → 400.
- `KudoCardView.sender` = `{ anonymous: true }` or `{ id, name, avatarUrl, department }`; `isOwner` server-computed.
- Mutation style (C-18): reads via RSC + route handlers only; no mutations in this phase.

## Related Code Files
Create:
- `app/(app)/kudos/page.tsx` — Live board (RSC), slot layout
- `app/(app)/kudos/[id]/page.tsx`, `app/(app)/kudos/[id]/not-found.tsx`
- `app/api/kudos/route.ts` (GET list), `app/api/kudos/highlight/route.ts` (GET)
- `features/kudos-feed/server/kudo-public-query.ts` — list/findForViewer
- `features/kudos-feed/server/kudo-public-select.ts` — shared Drizzle select + joins
- `features/kudos-feed/server/kudo-row-mask.ts` — anonymous masking + `isOwner`
- `features/kudos-feed/server/kudo-feed-cursor.ts` — encode/decode
- `features/kudos-feed/server/kudo-highlight-query.ts` — filters → candidates → ranking seam → top `HIGHLIGHT_COUNT`
- `features/kudos-feed/server/kudo-card-enrichment.ts` — composes the two seams
- `features/kudos-feed/server/enrich-heart-summary.ts` — SEAM, rewritten by phase 06 (default: 0 / false; ranking = recency)
- `features/kudos-feed/server/enrich-hero-tier.ts` — SEAM, rewritten by phase 09 (default: null)
- `features/kudos-feed/schemas/kudo-feed-params-schema.ts`, `features/kudos-feed/schemas/kudo-card-view.ts`
- `features/kudos-feed/components/kudo-card-heart-slot.tsx` — SEAM, rewritten by phase 06 (default: read-only count); `kudo-card-hero-badge-slot.tsx` — SEAM, rewritten by phase 09 (default: `null`)
- `features/kudos-feed/components/kudo-card.tsx`, `kudo-card-sender.tsx`, `kudo-card-actions.tsx` (Copy Link, Xem chi tiết, edit → modal), `kudo-copy-link-button.tsx`
- `features/kudos-feed/components/highlight-carousel.tsx`, `highlight-filters.tsx`, `all-kudos-feed.tsx`, `sunner-profile-search.tsx`, `kudo-detail-view.tsx`, `live-board-spotlight-slot.tsx` (SEAM for phase 11), `live-board-rewards-column-slot.tsx` (SEAM for phase 10)
- `db/migrations/NNNN_kudos_feed_indexes.sql` — `(status, created_at DESC, id DESC)`, `(recipient_id, created_at DESC, id DESC)`, `(sender_id, created_at DESC, id DESC)`
- `messages/vi.json`, `messages/en.json` — add `kudosFeed.*` keys only
- Tests: `tests/unit/kudos-feed/kudo-row-mask.test.ts`, `kudo-feed-cursor.test.ts`; `tests/integration/kudos-feed/kudo-public-query.test.ts`, `kudo-detail-access.test.ts`; `tests/e2e/kudos-feed/live-board.spec.ts`

Modify: none outside ownership (messages keys namespaced). Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` guides for App Router route handlers, `notFound()`, dynamic params (async `params`), RSC data fetching, proxy redirect; note deviations in this file.
2. Add index migration; run against local Supabase; verify `EXPLAIN` uses index for feed + recipient/sender queries.
3. Zod schemas: params (`hashtag?`, `department?` uuid; `cursor?` ≤ 200 chars; `id` uuid); `KudoCardView`.
4. `kudo-feed-cursor.ts` encode/decode with strict validation (unit tests first).
5. `kudo-public-select.ts` + `kudo-public-query.ts`: `status='public'` base; filters AND; hashtag via `EXISTS kudo_hashtags`; department on recipient; `senderId` guard for anonymous; batch-load hashtags + images by id list (no N+1).
6. `kudo-row-mask.ts`: drop sender id/name/avatar/department when `is_anonymous`; `isOwner = senderId === viewerId`; never serialize raw row.
7. `findForViewer`: public → view; spam AND `sender_id = viewerId` → view with `isSpam: true`; else null (page calls `notFound()`).
8. Seams `enrich-heart-summary.ts` / `enrich-hero-tier.ts` with defaults + `kudo-card-enrichment.ts`; `kudo-highlight-query.ts` uses `rankKudoIdsForHighlight` from the heart seam.
9. Route handlers: session check (401), Zod parse (400), call query, JSON. Highlight returns `{ items, total }`.
10. Components: card (anonymous branch DEC-001; `isSpam` hides heart, Copy Link, edit per F007 FR-303/D006; edit button only if `isOwner && !isSpam`, opens `KudoComposerModal` mode=edit), carousel (center sharp, 2 blurred, prev/next, `n/N`, reset to first on filter change), feed with load more + inline retry, search (debounce 300 ms, calls `/api/sunners/search?excludeSelf=false`, select → `/profile/{id}`), copy link (clipboard API, fallback toast with manual link).
11. Live board page: compose regions R2–R6 per screen spec; render the two slot components (return `null` until phase 10/11 rewrite their own slot file).
12. Detail page: full body, all images, hashtags, heart seam slot, Copy Link, spam tag + "edit locked" note for author view.
13. i18n keys vi/en (Figma copy verbatim); empty/error messages from spec § 9.
14. Tests (see Scope Contract), then reviewer.

## Todo List
- [ ] Read Next.js 16 docs (route handlers, notFound, async params)
- [ ] Index migration + EXPLAIN check
- [ ] Schemas + cursor util (+unit)
- [ ] KudoPublicQuery list/findForViewer with C-05 filters + anonymous sender guard
- [ ] Row mask (+unit)
- [ ] Heart/hero seams + enrichment + highlight query
- [ ] Route handlers `/api/kudos`, `/api/kudos/highlight`
- [ ] KudoCard family, carousel, filters, feed, search, copy link
- [ ] Live board page with slots; detail page + not-found
- [ ] i18n keys
- [ ] Integration + e2e tests green

## Success Criteria
- SC-001..SC-006 from technical spec pass (spam absent; anonymous payload has no sender identifiers; highlight top N after AND filters; cursor pages 10/10/5 with no dup/gap; uniform 404; no session → redirect/401).
- Grep of RSC/JSON response for an anonymous kudo contains no sender id/name/email/avatar.
- `list({senderId: other})` never returns other's anonymous kudos; `list({senderId: self})` does.
- Author opening own spam kudo sees spam view; any other user gets 404.
- `includeOwnSpam` ignored unless `senderId === viewerId` (integration test with two users).
- Live board renders with empty slots and no layout break with < 3 highlight cards.

## Scope Contract
- **Changed:** `features/kudos-feed/**`, kudos routes/pages, index migration, i18n keys.
- **Impacted:** phase 12 (consumes `KudoPublicQuery`), phases 06/09 (rewrite seams), 10/11 (slots), 04 (composer edit entry).
- **Will verify:** unit (mask, cursor); integration on local Supabase (query filters, masking, spam visibility, cursor stability with equal timestamps, 404 uniformity, migration up/down); e2e (load more, filters reset carousel, copy link, anonymous card, login redirect).
- **Deliberately skipped:** heart counts/ranking correctness (phase 06), Hero tiers (09), Spotlight (11), composer internals (04).
- **Safety-critical → full test set required:** migration + anonymous-sender data exposure (permissions).

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Anonymous sender leaks via RSC payload / filter side-channel | M | H | Mask in server mapper; `senderId` guard; integration test scans payload |
| Cursor dup/skip on equal `created_at` | M | M | Tuple order with id tiebreak; test with identical timestamps |
| Highlight slow when ranked by hearts | M | M | Ranking delegated to phase 06 indexed query; candidate ids capped |
| Seam defaults shipped forever | L | M | Phase 06/09 todo lists include seam rewrite; e2e asserts real counts after 06 |
| Next 16 API drift | M | M | Step 1 docs read |

Rollback: revert phase files + drop indexes migration (down script); no data written.

## Security Considerations
- Session required on every page/route (phase 02 proxy + per-route check); 401 JSON for data.
- No client-side Supabase reads (C-20); all via server.
- Admin view of real anonymous senders lives ONLY in phase 08 `KudoAdminQuery` (C-13); this query never exposes it, even to admins.
- Uniform 404 for missing/spam/invalid ids; images served from phase 04 bucket URLs only.

## Next Steps
- Phase 06 rewrites `enrich-heart-summary.ts` + `kudo-card-heart-slot.tsx` (counts, heartedByMe, highlight ranking, heart button).
- Phase 09 rewrites `enrich-hero-tier.ts` + `kudo-card-hero-badge-slot.tsx`. Seam files: phase 05 creates, the named later phase owns afterwards; 06 ∥ 09 touch disjoint seams. Phase 10 rewrites `live-board-rewards-column-slot.tsx`, phase 11 rewrites `live-board-spotlight-slot.tsx` — separate files so 10 ∥ 11 never collide.
- Phase 12 consumes `KudoPublicQuery.list({recipientId|senderId})`.
