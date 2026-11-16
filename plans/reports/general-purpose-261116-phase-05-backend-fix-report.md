# Phase 05 backend: review fixes

Source: `plans/reports/reviewer-261116-phase-05-backend.md` (W1-W3, S3, edge case `\)`).
Nothing staged, committed or pushed.

## Scope Contract
- **Changed:** cursor decode validation; Markdown link/inline parser; parse length guard.
- **Impacted:** `GET /api/kudos?cursor=` (decode runs in `kudo-feed-params-schema.ts`, so a forged year-0000 cursor is now 400); card and detail body rendering via `parseKudoBody`.
- **Verified:** unit tests (pure functions), typecheck, lint.
- **Skipped:** integration, e2e, db:reset (the shared DB is busy; the tester runs them).

## Fixes (RED first: 4 new assertions failed on the old code for the intended reason)
| # | File | Change |
|---|------|--------|
| 1 | `features/kudos-feed/server/kudo-feed-cursor.ts` | `.refine(isPostgresYear)`: `c >= "0001-01-01"` (lexicographic order is safe for the fixed format). Test: `year 0000` rejected; year 0001 still round-trips. |
| 2 | `features/kudos-feed/markdown/parse-kudo-inline.ts` | `followsUnescapedBang` (parity of the backslash run before `!`). When `[…](http…)` follows an unescaped `!`, `linkAt` returns the span as **one literal text node**, not null. Returning null, as the review suggested, would let the scanner autolink the bare URL inside, so a link node would remain. Test asserts that `![x](https://…) và ![y](javascript:…)` is exactly one text node with no link, that `\![x](…)` gives `!` plus a link, and that `\\![x](…)` stays literal. |
| 3 | `features/kudos-feed/markdown/kudo-body-links.ts` | `safeHttpHref` rejects `url.username \|\| url.password` (covers inline links and autolinks). Test covers `[b](http://user:pw@host)`, `http://user:pw@host` and `https://user@host.example/x`, plus `[b](http://EXAMPLE.com\@evil.com)`: no evil.com host and no userinfo. That input now falls back to an autolink `http://example.com/@evil.com`, because WHATWG URL reads `\` as `/` for http. The host matches the visible text, so this is not a spoof. |
| 4 | `kudo-body-links.ts` (comment only) | Traced: the **code was already right**. With a real backslash, `[a](http://a.b/x\)y)` yields href `http://a.b/x)y`. The reviewer's probe used a non-raw JS string, where `"\)"` collapses to `")"`, which reproduces exactly `http://a.b/x` + `y) …`. Clarified the comment with an example and pinned the behaviour with a `String.raw` test. |
| 5 | `features/kudos-feed/markdown/parse-kudo-body.ts` | `PARSE_MAX_LENGTH = 5000` UTF-16 units, `raw.slice()` before parsing. The write limit is 1,000 code points, at most 2,000 units, so stored bodies are never cut. The body is truncated rather than refused, so its start still renders. Documented in a comment. Test: 6,000 chars parse to exactly 5,000. |

Also touched comments only: `kudo-body-ast.ts` (href has no credentials). Test import cleanup: removed the now-unused `plainText`.

## Results
- `npm run test:unit -- tests/unit/kudos-feed`: 5 files, **82/82 pass** (was 74 plus the new cases).
- `npm run typecheck`: clean. `npm run lint`: clean (whole repo, no errors).
- Timing probe: worst case `[a](` ×1250 (5k) takes ~36 ms; the same pattern at 1M chars now takes ~35 ms, because the guard bounds it.

## Notes / open
- The worst case at the 5k cap (~36 ms) comes from the per-link destination scan, which is capped at 2,048 chars. Real stored bodies (≤ 2k units) stay at ≤ ~5 ms. Acceptable; lower the cap if a client hot path ever needs it.
- Label spoofing such as `[https://good.com](https://evil.com)` is inherent to Markdown links and stays out of scope.
