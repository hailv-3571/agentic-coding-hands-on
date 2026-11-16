---
phase: 05
feature: F004
half: backend / data
agent: general-purpose (xhigh)
created: 2026-11-16
status: done
---

# Phase 05 backend report — Kudos feed & detail (data half)

## Progress log
- [x] Context read (phase file, decision log incl. 2026-11-15/16 sessions, phase-04 contracts § 1.1, Figma spec, Next 16 docs)
- [x] Enum check: `kudo_status` = ('public', 'spam') since 0006 → no blocker, no migration invented
- [x] Index migration 0009 (drizzle-generated from schema; migration test RED → GREEN; `drizzle-kit check` clean)
- [x] EXPLAIN ANALYZE on local Supabase with 10k seeded kudos (rolled back) — plans below
- [x] Unit tests RED (modules missing) → GREEN: cursor, row mask, markdown parser
- [x] Parser fuzz (scratch only): 20,000 random 0–1,000-char inputs, max 3.9 ms, whitelist node types only, every href http(s)
- [x] Integration tests RED (modules missing) → GREEN
- [x] Mutation checks (temporary, restored): dropping the anonymous guard, honouring includeOwnSpam for anyone,
      opening spam detail for anyone, a millisecond cursor, disabling the mask — each turns its test red
- [x] Routes; contracts note for the UI agent
- [x] typecheck / lint / test:unit / test:integration green; no rows, users or Storage objects left

## Scope contract (as delivered)
- Changed: `features/kudos-feed/{server,schemas,markdown}/**`, `app/api/kudos/route.ts`, `app/api/kudos/highlight/route.ts`,
  migration 0009 + snapshot + journal, three index declarations in `shared/db/schema/kudos.ts`.
- Impacted: phase 12 (`KudoPublicQuery.list`), phases 06/09 (seam files), the UI agent (contracts note), phase 10 (`publicKudoIdsSubquery`).
- Verified: unit (cursor, mask, parser), integration on local Supabase (query, highlight, detail, cursor, routes, migration), full suites.
- Skipped: UI, e2e, heart/Hero logic (seams only).

## EXPLAIN (local Supabase, PG 17.11, 10,000 kudos / 300 profiles / 1 hashtag each, rolled back)
SQL is the exact drizzle output (taken from `pg_stat_statements`), literals inlined.
```
Q1 Live board first page — status = 'public' ORDER BY created_at DESC, id DESC LIMIT 11
 Limit (actual rows=11)  ->  Nested Loop … ->  Index Scan using kudos_status_created_at_id_idx on kudos (actual rows=11)
       Index Cond: (status = 'public'::kudo_status)        joins: profiles_pkey / departments_pkey (Memoize)
 Execution Time: 0.156 ms
Q2 deep page (tuple cursor at ~row 5000)
 Index Scan using kudos_status_created_at_id_idx on kudos (actual rows=11)
       Index Cond: ((status = 'public'::kudo_status) AND (ROW(created_at, id) < ROW(…, 'ffffffff-…'::uuid)))
 Execution Time: 0.078 ms
Q3 recipient filter (phase 12 received)
 Index Scan using kudos_recipient_id_created_at_id_idx on kudos (actual rows=11)
       Index Cond: (recipient_id = …)   Filter: (status = 'public')
 Execution Time: 0.042 ms
Q4 sender filter + anonymous guard (viewer ≠ sender)
 Index Scan using kudos_sender_id_created_at_id_idx on kudos (actual rows=11)
       Index Cond: (sender_id = …)   Filter: (((NOT is_anonymous) OR (sender_id = …)) AND (status = 'public'))
 Execution Time: 0.041 ms
Q5 Highlight ranking (hashtag AND department, recency seam)
 Limit (actual rows=5) -> Nested Loop -> Index Scan using kudos_status_created_at_id_idx (rows=181)
   + profiles_pkey (Filter department_id) + Index Only Scan kudo_hashtags_kudo_id_hashtag_id_pk
 Execution Time: 0.321 ms
```
The tuple predicate is an Index Cond (Q2), so deep pages do not scan skipped rows. `kudos_after_rollback = 0`.

## Tests
- Unit (kudos-feed): 74 in 4 files — cursor 18, row mask 9, parser 47 (blocks/emphasis + links/ReDoS).
- Integration (kudos-feed): 35 in 6 files — public query 8, cursor/pagination + statement count 6, highlight 5,
  detail access 4, routes 10, migration 2.
- Full suites: `test:unit` 359 passed (26 files); `test:integration` 203 passed (27 files); typecheck and lint clean (0 warnings).

## Deviations / decisions (all inside owned files)
1. `list` and `findForViewer` take a `locale` (hashtag labels are localized server-side, like phase 04's `HashtagOption`):
   `list({ viewerId, locale, … })`, `findForViewer(id, viewerId, locale)`.
2. View shape: named sender carries `anonymous: false` + `tier`; anonymous sender is `{ anonymous: true, nickname }`
   (decision-log nickname). Department is `{ id, code }` (cards show the code). No email anywhere (never selected).
3. Cursor `c` keeps microseconds (`…05.123456Z`), selected with `to_char(... at time zone 'UTC')`; a JS Date would
   round to ms and re-serve rows inside one millisecond (covered by a test and a mutation check).
4. Image signer is a new feed module `kudo-image-read-urls.ts` (30-min read URLs, one Storage call per page). Phase
   04's helper in `kudo-edit-query.ts` is private and not my file. Follow-up: phase 04 could import this one.
5. Extra single-purpose server files beyond the phase list: `kudo-public-filters.ts` (filters + `publicKudoIdsSubquery`;
   keeps the heart seam free of an import cycle), `kudo-card-relations.ts`, `build-kudo-card-views.ts`,
   `kudo-image-read-urls.ts`. Parser split into 4 files under `markdown/`.
6. Highlight `total` = number of cards returned (≤ 5), the "n/N" pager per tech spec § 3.1.
7. Parser choices: bare autolinks only for lowercase `http(s)://`; `![x](url)` renders `!` + a plain link; nested
   quotes and list lazy-continuation lines stay literal; every newline inside a paragraph is a line break.
   No `plainTextExcerpt` (cards clamp with CSS per decision-log).
8. Routes: a present-but-empty param is 400 `invalid` (same rule as `/api/sunners/search`).
9. Rollback note sits in the 0009 SQL header (`DROP INDEX IF EXISTS …`); earlier migrations carry none and drizzle-kit
   keeps no down files.
10. Seams are typed consts (`EnrichHeartSummary`, `RankKudoIdsForHighlight`, `EnrichHeroTier`) so the defaults need no
    unused parameters and phases 06/09 keep the signatures.

## Next.js 16 docs (route handlers, `notFound`, async params)
Read `01-getting-started/15-route-handlers.md`, `03-file-conventions/route.md`, `04-functions/not-found.md`,
`03-file-conventions/page.md`. No deviation in the routes: GET handlers read the request + session, so they run per
request under `cacheComponents`. For the UI: `params` is a Promise; `notFound()` throws — never call it inside
`try/catch`. `RouteContext<'/…'>` exists but these routes have no dynamic segment.

## Unresolved questions / follow-ups
- Phase 10's plan counts sent/received via `publicKudoIdsSubquery({recipientId|senderId})`; the phase 05 contract
  only has `{hashtagId, departmentId}`. A `senderId` there would need the viewer guard; leave to phase 10/orchestrator.
- The phase 05 file still says "hashtags 1–3" (decision-log: 1–5). The read side has no count rule, so nothing changed.
- `kudo-edit-query.ts` (phase 04) could reuse `signKudoImageReadUrls` (would need a TTL parameter).
- Reviewer step not run (task forbade subagents); the orchestrator should route this diff to `reviewer`.
