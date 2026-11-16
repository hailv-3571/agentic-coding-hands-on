# Phase 04 (F003) final re-check

Score 9/10. Status: DONE. 0 critical, 0 warning, 4 low/suggestion. Read-only (one throwaway unit probe, deleted).
Ran: unit kudos-authoring 109/109 pass; integration sign-route + migration + edit-route 20/20 pass (real DB). e2e not run (relied on reading + earlier evidence).

## Old findings
| Finding | Status | Evidence |
|---|---|---|
| db W1 deadlock on FOR UPDATE | RESOLVED | kudo-image-upload-service.ts:88-89 orderBy(storagePath).for("update"); LockRows sits above Sort so locks are taken in path order. Loser re-read sees deleted row -> IMAGE_INVALID (:90) |
| db W2 quota/TTL | RESOLVED (cap) / cleanup job deferred by decision | service :40-51, index 0008:3 + schema kudos.ts:94, tests 20 ok / 21st 429 in burst, 25h row stops counting. Orphan-object sweep deferred in decision-log (accepted) |
| actions W1 reference defs | RESOLVED | link-policy.ts:25 REFERENCE_DEFINITION (superset: quote, list, indent, `\]`); 8 unit cases; entity/tab/quote/list forms all caught; `[a\]: x` flagged; mid-line `[mục 2]: ổn` allowed |
| actions W2 abuse limit | RESOLVED | same cap as db W2; 429 mapped in KUDO_ERROR_STATUS, vi/en strings, client maps UPLOAD_LIMIT, e2e covers message |
| actions S1 unbounded body/media type | RESOLVED | read-capped-json-body.ts: exact essence match; Content-Length precheck then streaming cap with reader.cancel(); route returns 413 before parse |
| actions S2 Cache-Control edit route | RESOLVED | edit/route.ts:16-20 wraps every answer (401/403/404/200/500); integration test asserts |
| ui W1 mention ARIA | RESOLVED (deviation accepted) | kudo-message-editor.tsx:134-137: textbox keeps role, aria-autocomplete/haspopup, controls/activedescendant only while open, live count. Rationale (no combobox on multiline textarea) is valid ARIA; e2e asserts |
| ui W2 cancel while pending | RESOLVED | dialog :49-53 requestClose no-op when busy, form :48 setBusy(pending), Hủy disabled :131, Esc goes via requestClose; e2e proves one kudo and no discard |
| ui W3 `()` in link URL | RESOLVED | markdown-format.ts:89 %28/%29 after URL normalization |
| ui S1/S2 (bonus) | RESOLVED | combobox aria-controls only when open (:90), live region includes statusLine (:133); hashtag panel scrollIntoView nearest (:47-49) |

## Specific checks
- Advisory lock: `pg_advisory_xact_lock(hashtext(ns), hashtext(uploaderId))` inside the same tx as count + insert; per-uploader only, released at commit, so a 21-burst yields exactly 20 x 200 + 1 x 429 (test proves). Count is rolling 24h, uses new (uploader_id, created_at) index; `count()` returns number. Signed-URL failure deletes the row (compensation). Claim path takes row locks only, never the advisory lock, so no lock-order cycle. Correct.
- Streaming cap: header absent/NaN/lying falls through to the byte counter; bytes counted per chunk before decode; cancel on overflow; text never exceeds maxBytes. Auth runs before body read. Not bypassable (integration test exercises the no-Content-Length path since `new Request(string)` sets none).
- ReDoS: benchmarked adversarial 1,000-char bodies (space runs, `> `x495, `- `x495, `1. `x330, 999-char label, `\a`x495, many `[a]` lines, nested quote/list lines): all < 3 ms for findDisallowedLinks. REFERENCE_DEFINITION alternatives are disjoint, anchored at line start, label bounded 999. No catastrophic backtracking.
- bodyTooLong ordering: verified by probe: body `[x](javascript:a)` + 1,100 chars returns only `bodyTooLong` (abort skips link/image scans); valid-length body gets both `linkScheme` and `imageNotAllowed`. Scan input is always <= 1,000 code points.
- Regressions: none found. Hashtag Esc layering, mention Esc, dialog nested/confirm handling unchanged; migration `when` 0008 > 0007; journal + snapshot present; 0006/0007 untouched.

## New findings
1. LOW, kudo-body-link-policy.ts:77-92 (+100-108): findMarkdownImages isEscaped/openingBracket is O(n^2) per `](` -> ~83 ms measured on a 1,000-char `\`x800 + `](`x100 body. Bounded by the 1,000 cap, runs only after bodyTooLong passes. Fix if touched: precompute escape flags once, or scan forward once. Not blocking.
2. LOW, 0008_kudos_review_fixes.sql:6 vs kudo-input-schema.ts:39: DB `[:space:]` is locale-dependent and may treat U+0085 (and similar) as space, which JS `trim()` keeps. A body of only such a char passes zod, fails the CHECK, surfaces as UNEXPECTED instead of `required`. Also ADD CONSTRAINT would fail on pre-existing whitespace-only dev rows. Fix: map `kudos_body_not_blank` violation to VALIDATION body/required, or zod `.refine(/[^\s\u0085]/)`. Edge only; unproven against the hosted collation.
3. SUGGESTION, use-kudo-image-uploads.ts:56-63 + service :48: removed or retried uploads still consume the 20/24h quota (rows are freed only on claim). A user who adds/removes images or retries failures ~20 times is locked out for up to 24h. Acceptable per decision; consider freeing rows on a client "discard" or raising the cap to 30. Product call.
4. SUGGESTION, kudo-composer-form.tsx:48: busy flag reaches the dialog via effect (one render later). Hủy is disabled immediately and Esc gap is ~1 frame; negligible, could setBusy inside the same handler.

## Done well
Cap serialized correctly with a tx advisory lock and proven by a 21-burst test; body reader checks header then stream; Cache-Control applied at one choke point; reference-definition regex is bounded and tested across nesting forms; ARIA decision documented with reason and asserted in e2e; pending/busy path tested end to end.

## Numbers
Unit 109/109 (kudos-authoring), integration 20/20 (3 files). Typecheck/lint/e2e not run by reviewer.

## Unresolved
- Orphan storage-object cleanup job (deferred by decision).
- Finding 2 depends on hosted DB locale.

```json
{ "score": 9, "criticalCount": 0, "decision": "SEALED",
  "acceptanceCovered": ["db W1 lock ordering", "db W2 + actions W2 pending-upload cap with advisory lock", "actions W1 reference-definition rejection", "actions S1 capped streaming JSON body + exact media type", "actions S2 no-store on edit route", "ui W1 mention ARIA", "ui W2 no close while busy", "ui W3 paren-escaped link URL", "bodyTooLong abort ordering", "no ReDoS in link/image policy"],
  "regressionChecked": ["claim-vs-sign lock order", "migration journal/snapshot order and 0006/0007 untouched", "Esc layering combobox/hashtag/dialog", "429/413 mapping in status map, i18n and upload client", "unit 109 and integration 20 green"],
  "contractStatus": "OK", "refuted": [], "unproven": [], "reachableRegressions": [],
  "findings": [
    { "severity": "Low", "category": "Performance", "location": "features/kudos-authoring/schemas/kudo-body-link-policy.ts:77-92", "summary": "findMarkdownImages escape scan quadratic per ](; ~83ms worst at 1000 chars, bounded by cap", "disposition": "Defer" },
    { "severity": "Low", "category": "Logic", "location": "db/migrations/0008_kudos_review_fixes.sql:6", "summary": "locale-dependent [:space:] CHECK can disagree with JS trim (U+0085); violation surfaces as UNEXPECTED", "disposition": "Defer" },
    { "severity": "Suggestion", "category": "UX", "location": "features/kudos-authoring/server/kudo-image-upload-service.ts:48", "summary": "removed/retried uploads still count toward 20 per 24h quota", "disposition": "Defer" },
    { "severity": "Suggestion", "category": "Logic", "location": "features/kudos-authoring/components/kudo-composer-form.tsx:48", "summary": "busy propagates via effect, one-frame lag before dialog refuses Esc", "disposition": "Defer" }
  ] }
```

**Status:** DONE
