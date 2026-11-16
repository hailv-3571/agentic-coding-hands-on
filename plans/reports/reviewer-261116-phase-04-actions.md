# Phase 04 actions review (F003 Kudos authoring)

Score 8/10. Status DONE_WITH_CONCERNS (0 critical, 3 warning, 6 suggestion). Read-only; no tests re-run.

## Critical
None.

## Warning
W1. Link policy does not validate reference-style definitions. `features/kudos-authoring/schemas/kudo-body-link-policy.ts:171-178`
- Only `](` destinations and bare `scheme://` / `javascript|vbscript|data|file|blob:` are checked.
- `[x][1]` plus `[1]: javascript:alert(1)` is caught, by the bare-scheme regex.
- These pass: `[1]: java&#115;cript:alert(1)`, `[1]: javascript&colon;alert(1)`, `[1]: <java<TAB>script:alert(1)>`. Inline forms of the same strings fail closed because `new URL` throws, but the reference form never reaches `isHttpUrl`.
- Exploitable only if the phase 05 renderer supports reference links and decodes entities. Nothing enforces that.
- Fix: reject reference definitions outright, since the subset only needs inline links.
  `const REFERENCE_DEF = /^ {0,3}\[[^\]]+\]:/m; if (REFERENCE_DEF.test(body)) offending.push("[ref]:")`.
  Also pin the phase 05 renderer to inline links plus http(s) autolinks, with a test.
- Add the missing unit cases: reference definition with an entity-encoded scheme, and reference definition with a tab.

W2. Image sign route has no abuse limit. `app/api/kudos/images/sign/route.ts:13-30`, `kudo-image-upload-service.ts:24`
- Each call inserts a `kudo_image_uploads` row and mints a signed URL, with no per-user cap and no rate limit. An authenticated Sunner can loop this to bloat the table and the bucket (5 MB per object, unbounded count).
- Unclaimed and dropped objects are never cleaned up: images removed on edit are deleted from `kudo_images` only. The implementer's own report notes edit-dropped images land in neither table.
- Fix: before inserting, `select count(*) from kudo_image_uploads where uploader_id=$1` and refuse above ~20 pending with 429. Add a TTL sweep for unclaimed upload rows and objects. Add an edge rate limit.

W3. `size` in the sign body is advisory only. `kudo-image-sign-schema.ts:11-15`
- A signed upload URL cannot bind size or mime to the object. The real guard is the bucket (`file_size_limit` 5 MB, `allowed_mime_types` jpeg/png/webp, `0003_storage_kudo_images_bucket.sql:6-17`). That is sufficient, and it is the correct mitigation.
- Residual: the bucket checks the declared Content-Type header, not magic bytes. An attacker can upload HTML labelled `image/png`. Safe only while the bucket stays private and previews are served as `image/*` from the signed URL.
- Fix: document the invariant, and never render uploaded files inline from a public bucket. Optionally verify magic bytes at claim time.

## Suggestion
S1. `app/api/kudos/images/sign/route.ts:18-19`: `request.json()` reads an unbounded body. Reject when `content-length` > 1 KB before parsing. `startsWith("application/json")` also accepts `application/jsonx`; exact-match the media type. The CSRF reasoning in the comment is right: a JSON content type forces a preflight, and no CORS headers are set.

S2. `app/api/kudos/[id]/edit/route.ts:23`: the response carries signed image URLs and the anonymous nickname. Add `Cache-Control: private, no-store`. The route does not check the write window; harmless, but it opens a form that cannot save after EVENT_END_AT.

S3. `kudo-write-repository.ts:81-83`: the re-read after a zero-row UPDATE returns FORBIDDEN for another user's existing kudo and NOT_FOUND for a missing one. That is a UUID existence oracle (practically unguessable, v4). Mapping both to NOT_FOUND removes it. The edit route does the same (`kudo-edit-query.ts:48-49`). This is a trade-off against the UX of a distinct 403, so it is optional.

S4. `sunner-search-query.ts:57-67`: `f_unaccent(full_name) ilike '%…%'` cannot use a btree index, so each search is a sequential scan. Fine at company scale. If needed, add a `pg_trgm` GIN index on `public.f_unaccent(full_name)`.
- Every authenticated Sunner can enumerate directory emails by prefix, up to 20 rows per call. This looks intentional for the recipient picker. Confirm that `email` in `SunnerOption` is a product decision.

S5. `kudo-write-repository.ts:57`, `assertRecipientExists`: the FK already covers it; a delete-race FK violation becomes UNEXPECTED rather than RECIPIENT_INVALID. Negligible.

S6. `create-kudo-action.ts:21` / `update-kudo-action.ts:20`: the window check runs before validation, which is correct. `isEventWritingOpen` reads `env`, and `new Date()` is request-time, so the window is not cached. No change needed.

## Checked and found sound
- Sender and status forgery: `createKudo` takes `senderId` from the session (`:20`, `:31`). Zod `z.object` strips unknown keys, and `status` is never in `values`. `KudoUpdateSchema` rejects any `recipientId`, including null.
- Non-owner edit: the UPDATE's WHERE holds id + sender + status (`kudo-write-repository.ts:78`). The classification re-read selects only `senderId`, so no content is exposed. The edit GET returns 403 / 404 with `{ code }` only. A spam Kudo gives a non-owner the same 403 as a public one, so spam status does not leak.
- Anonymous sender leak: no response carries `senderId`. The prefill omits it and the owner alone sees the nickname. Action results are `{ ok, id }` or a code.
- Conditional-UPDATE race: row lock plus READ COMMITTED re-check makes a concurrent Mark Spam either wait or match zero rows. Post-update failures (`assertHashtagsActive`, image claim) throw inside the transaction and roll back. Images are claimed with `FOR UPDATE`, and a loser sees IMAGE_INVALID. The path must exist in `storage.objects` and be owned by the sender.
- LIKE injection: `\`, `%` and `_` are escaped. `escape '\\'` in a cooked template yields one backslash. `||` binds tighter than ILIKE, so the pattern is `(pattern || '%')`. Parameters are bound. Length is capped at 50 and `limit` at 20.
- Inline link bypasses: case, leading or embedded whitespace, tab and newline in the scheme, entity-encoded scheme, `<javascript:…>` autolink, `<…>` destination, image `![](…)`, and nested or unbalanced parentheses all fail closed (`new URL` throws or the scheme is rejected).
- Server Actions: both call `requireSunner()` and the write-window check, re-validate with the shared schema, and validate the uuid. Redirects (NEXT_REDIRECT) sit outside the try/catch, so they are not swallowed.
- Error mapping: `kudoWriteFailureOf` maps known codes in-band and logs unexpected ones without leaking. `KUDO_ERROR_STATUS` is consistent with the route handlers. 403 / 404 / 423 carry no content.
- URLs are not built from Host. The signed URL comes from the configured Supabase URL.

## Acceptance (per brief)
- Hashtags 1-5, title optional ≤ 50, nickname rule, no self-send, recipient immutable, spam locked, no delete, window locked: met in code and schema.
- Link policy: met for inline, partial for reference-style (W1).

## Numbers
Not re-run. Implementer report: typecheck 0, lint 0, unit 218, integration 161, all green. Link-policy unit cases in `tests/unit/kudos-authoring/*link*` have no reference-definition case.

## Unresolved
- Phase 05 renderer support for reference links is unknown, and it decides W1's severity.
- Is `email` in `SunnerOption` intended for every Sunner?
- No rate-limit policy is defined anywhere for the sign route.
