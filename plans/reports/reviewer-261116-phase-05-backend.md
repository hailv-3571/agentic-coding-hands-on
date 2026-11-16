# Review: Phase 05 (F004 Kudos feed) backend

Status: DONE_WITH_CONCERNS (no critical; 3 warnings, 4 suggestions). Score 8.5/10.

Verified: `npm run test:unit -- tests/unit/kudos-feed` 74/74 pass; `npm run typecheck` clean. Integration/e2e/db:reset not run (per instruction). All files < 200 lines.

## Critical
None. FR-602 holds on every path I traced.

- `maskKudoRow` builds an explicit whitelist; anonymous gives `{anonymous:true, nickname}` only (no id/name/avatar/dept/tier). `senderId`/`senderName` exist only in the raw `KudoPublicRow`, which is `server-only` and reaches only `maskKudoRow`.
- `senderId` filter: `senderId = X AND (is_anonymous = false OR senderId = viewer)` blocks the set-difference oracle (kudo-public-query.ts:47). Not reachable from routes anyway (routes accept only cursor / hashtag / department).
- `includeOwnSpam` honoured only when `senderId === viewerId` (:42-45). `isOwner = senderId === viewerId` is true only for the viewer themself.
- Highlight: `publicKudoIdsSubquery` carries no sender column; second statement re-checks `public` and goes through the mask. Ranking order cannot leak (newest-first; phase 06 raw hearts).
- Image paths are `kudos/{uuid}.{ext}`, no sender folder; signed URLs reveal nothing about the sender.
- `findForViewer`: bad uuid / missing / other's spam all return null (:88-93). Same null, no oracle.
- Routes: `requireApiSunner` gives 401/403 JSON, Zod params, `no-store` set on every response (including 4xx/5xx), 500 body is `{code}` only, stack goes to console.

## Warning
1. **Cursor year 0000 passes validation, Postgres rejects it, route answers 500.** `kudo-feed-cursor.ts:36-40`. `isRealInstant("0000-01-01T00:00:00.000Z")` round-trips in JS (I verified `decodeKudoFeedCursor` returns non-null), then `::timestamptz` raises `date/time field value out of range` -> `UNEXPECTED` 500 plus a console.error per forged request. Contract says a forged cursor is 400. Fix: add `.refine((c) => c >= "0001-01-01")` (lexicographic is fine for this fixed format), and a unit case for `0000-...`.
2. **`![alt](https://…)` renders `!` followed by a live link**, contradicting the doc comments (parse-kudo-inline.ts:3-7, parse-kudo-body.ts:6-8, ast "no image") and the phase-04 whitelist ("image syntax stays literal"). Probe: `[{"text":"!"},{"link","https://a.b/c.png"}]`. Not XSS (http(s) only, no `<img>`), but a spec deviation and a hidden-link vector. The unit test (links-and-redos.test.ts:56-59) only asserts "no image node", so it passes the bug. Fix: in `linkAt`, when `text[at-1] === "!"` and not escaped, return null for `[` (or emit literal); strengthen the test to assert no `link` node for `![x](https://a.b/c.png)`.
3. **Link userinfo / host-spoof.** `[b](http://EXAMPLE.com\@evil.com)` -> href `http://EXAMPLE.com@evil.com/` (host evil.com); label is free text, so a trusted-looking label or `[https://good.com](https://evil.com)` is allowed (probe confirms). Inherent to Markdown links, but `safeHttpHref` (kudo-body-links.ts:21-30) is the one place that can cheaply reject credentialed URLs: `if (url.username || url.password) return null`. Medium risk in an internal-staff app with `rel=noopener nofollow`; ship-blocking only if the product wants it.

## Suggestion
1. Migration 0009 (db/migrations/0009_kudos_feed_indexes.sql): safe on existing data (plain CREATE INDEX, small table, comment documents rollback). Journal idx 9 / `when` monotonic, snapshot `prevId` == 0008 id, three index names present in snapshot. `DESC NULLS FIRST` choice is correct for `ORDER BY ... DESC`. Note `kudos_sender_id_...` and `recipient_id_...` have no consumer until phase 12 (write cost for nothing now); acceptable, flagged in the SQL comment.
2. Cursor predicate (kudo-public-query.ts:52): row comparison is index-eligible (same direction both columns, `status =` prefix). Falls to a filter+sort when `includeOwnSpam` (`IN (public,spam)`); fine at current size, revisit in phase 12 with a UNION or per-status scan.
3. Quadratic probes on 1,000 chars: `[a](`x250 4.7 ms, `**a `x250 0.7 ms, `[`x1000 0.1 ms, `http://`x142 0.2 ms. Linear/near-linear, no ReDoS. The parser has no length cap of its own (relies on the write-time 1,000 limit); a cheap `raw.slice(0, 5000)` guard in `parseKudoBody` would make it self-defending for client use.
4. `kudo-image-read-urls.ts`: 30 min TTL, one batched `createSignedUrls` per page, failure degrades to placeholder, but the `error` branch throws then catches in the same function (works, slightly circuitous). `console.error(error)` may log the signed-URL error object; fine server-side.

## Edge cases turned up
- Destination escape inconsistency: `[a](http://a.b/x\)y)` produced href `http://a.b/x` then literal `y) ` (the `\)` did not extend the destination as the comment promises) while `\@` was decoded. Unverified root cause, cosmetic only; worth one unit test.
- Control chars in href (`\u0001`) are dropped by URL normalization (`https://a.b/`), safe. `http:///evil` normalizes to host `evil` (safe, odd).
- Entities (`&#115;`), `javascript:`, `data:`, `//x`, backslash schemes, `<…>` destinations, reference links: not links (covered by tests, re-confirmed by reading the code).
- `isOwner` on anonymous owner true for owner only; mask test + route payload test cover leakage substrings.

## Tests
- Fail-on-bug quality: good. senderId-guard test (public-query.test.ts:86) fails if the `or(is_anonymous=false …)` guard is removed; payload-substring tests (mask, route, detail) fail on any leak; statement-count test guards N+1; pagination test seeds 25 equal timestamps and a sub-ms case.
- Gaps: year-0000 cursor (warning 1); image syntax (warning 2, test is too weak); no test for credentialed URLs.
- Contracts note: accurate on hashtag 1-5, cursor, TTL, seam; it states images stay literal (see warning 2: code contradicts note).

## Done well
Single mask boundary with whitelist, typed `KudoSenderView` union so a leak is a compile error; microsecond cursor with strict one-spelling decode and size cap; batch relations (3 statements/page, asserted in test); filters as `IN (subquery)` on indexed columns (`kudo_hashtags_hashtag_id_idx`, `profiles_department_id_idx`); uniform null for detail; no-store on all responses; hand-written linear scanner instead of regex.

## Actions in order
1. Reject year < 0001 in the cursor schema + unit test (400 instead of 500).
2. Make `![..](..)` literal + tighten the test.
3. Decide on rejecting URL userinfo in `safeHttpHref`.
4. Optional: parser length guard; one test for `\)` in destinations.

## Numbers
- Unit: 74/74 pass. Typecheck: clean. Lint/coverage not run.

## Still unresolved
- Integration suite not run here (shared DB busy); the SQL/index behavior (EXPLAIN) was reasoned, not measured.

```json
{ "score": 8, "criticalCount": 0, "decision": "SEALED",
  "acceptanceCovered": ["FR-602 anonymous masking on list/highlight/detail/route JSON", "uniform null for bad/missing/foreign-spam detail", "includeOwnSpam self-only", "cursor tuple + microsecond", "no N+1", "401 JSON + no-store"],
  "regressionChecked": ["migration journal/snapshot consistency", "feed indexes vs ORDER BY", "highlight second-statement public recheck", "signed URL batching"],
  "contractStatus": "OK", "refuted": [], "unproven": [], "reachableRegressions": [],
  "findings": [
    { "severity": "Warning", "category": "Input validation", "location": "features/kudos-feed/server/kudo-feed-cursor.ts:36", "summary": "year-0000 cursor passes validation, Postgres errors, route returns 500 not 400", "disposition": "Accept" },
    { "severity": "Warning", "category": "Spec conformance", "location": "features/kudos-feed/markdown/parse-kudo-inline.ts:122", "summary": "image syntax renders '!' plus a live link; contract says literal; test too weak", "disposition": "Accept" },
    { "severity": "Warning", "category": "Security", "location": "features/kudos-feed/markdown/kudo-body-links.ts:21", "summary": "URLs with userinfo accepted (host spoof via text label)", "disposition": "Accept" }
  ] }
```
