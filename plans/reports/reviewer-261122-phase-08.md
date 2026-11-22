# Review - Phase 08 (F007 Admin moderation + owner spam view)

Status: DONE_WITH_CONCERNS (no critical; 2 warnings, 4 suggestions). Depth: full phase 08 diff. I did not run suites (shared DB, tester running). Evidence = code reading + test names + 2 screenshot pairs.

## Critical
None. Hunt results:
- Non-admin read/write: page (page.tsx:41), both route handlers (requireAdminApi first, before param parsing), actions (requireAdmin before uuid parse); role read from DB each call; error bodies `{code}` only; admin responses `private, no-store`; no `use cache` / `unstable_cache` / tags anywhere in the repo.
- Real sender leak: real-sender joins exist only in `admin-kudo-row-select.ts`, reachable only after the guards. Public masking untouched (spam-visibility test).
- Transition: single conditional UPDATE, outbox in the same tx only when a row returned and to=spam; no-op path only re-reads, so `moderated_*` untouched. Race-safe under READ COMMITTED.
- SQL: values parameterized; LIKE escape of `\ % _` with `escape '\'`; f_unaccent both sides; `q` capped at 200.
- CSV: phase 01 serializer (BOM, quoting, `'` guard), 422 before any file, same builder/sort as table.
- Migration: nullable cols, FK SET NULL + one-way CHECK, down in reverse order with IF EXISTS, journal `when` monotonic.
- Markdown to text: whitelist parser, rendered as React text child; no HTML path.
- Files all < 200 lines; no temp specs; vi/en `adminModeration` 56/56 keys.

## Warning
W1. `features/kudos-feed/components/kudo-detail-view.tsx:32-41` (and `kudo-card.tsx:44-67`): overlay blocks pointer only. Image `<a target=_blank>` links (detail) and "Xem chi tiet" (card) stay Tab-reachable under the blur (focus on an obscured element, WCAG 2.4.11). Dong is correctly z-20 and reachable; text stays in DOM and role=note is first in DOM order (good). Fix: when `isSpam`, make images/links `inert` (or `tabIndex=-1`, e.g. `KudoCardImages interactive={false}`), keep Dong outside.
W2. `features/admin-moderation/components/review-content-screen.tsx:97`: pagination uses unclamped `view.page`; server clamps data to last page. `?page=99` with 3 pages: rows of p3, no highlighted page, Previous goes to 98. Fix: `page={Math.min(view.page, data.pageCount)}`.

## Suggestion
S1. `kudo-admin-query.ts:46-48`: count then listAll are separate statements, listAll unbounded; add `limit EXPORT_MAX_ROWS + 1` and 422 on overflow.
S2. `admin-kudo-where-builder.ts:17`: backslash escape untested (only `%`, `_`); add literal and trailing `\` cases.
S3. `spam-alert-overlay.tsx:5` docblock says "Live board card" though board never lists spam (`includeOwnSpam` has no caller, kudo-public-query.ts:33,51); `kudosFeed.card.spamLocked/spamTag` (messages/en.json:278-279, vi too) look dead now.
S4. `admin-kudo-filter-schema.ts:52-53`: zod 4 `z.uuid()` rejects non-RFC ids (hand-made fixtures) as invalid_params; fine for gen_random_uuid.
Note: `app/admin/review/loading.tsx` streams a skeleton before `requireAdmin`; 403 status relies on proxy 4b (present). Skeleton is data-free; acceptable.

## Done well
One where-builder shared by table/count/export; heart counts in one statement, hashtags batched (no N+1); `{code}`-only errors; in-band action results; tests hit real DB incl. concurrency + rollback; down migration verified in a rolled-back tx; review-content screenshot matches Figma frame (columns, chip, badges, pager, Export).

## Actions in order
1. W1 inert under overlay. 2. W2 clamp pager. 3. S1 limit+1. 4. S2 test. 5. S3/S4 cleanup.

## Numbers
Type/test coverage not measured by me (implementers: tsc 0, unit 649+23, integration 317, e2e 9/9). Lint not run. Findings: 0 critical, 2 warning, 4 suggestion.

## Unresolved
Mobile/en/popover screenshots not opened; no e2e of Live board with own spam read; sign-off (`humanSignedOff:false`) left to orchestrator after user approval.
