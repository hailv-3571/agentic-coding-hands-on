---
phase: 04
feature: F003
status: implemented (backend)
created: 2026-11-15
updated: 2026-11-16 (review fix round 1; UI fix round 1: no Markdown images in the body)
---

# Phase 04 backend contracts (for the composer UI)

Everything below is implemented and covered by `tests/unit/kudos-authoring/**` and
`tests/integration/kudos-authoring/**`. Rules applied: decision-log 2026-11-15 (hashtags 1–5,
title optional ≤ 50, restricted Markdown body, anonymous nickname, DEC-001 sentence verbatim).

## 1. Client-safe modules (no server imports; import them in client components)

| Import | Exports |
|---|---|
| `@/features/kudos-authoring/kudo-authoring-limits` | `KUDO_LIMITS` `{ BODY_MAX: 1000, TITLE_MAX: 50, NICKNAME_MAX: 30, HASHTAGS_MIN: 1, HASHTAGS_MAX: 5, IMAGES_MAX: 5, IMAGE_MAX_BYTES: 5 MB, PENDING_UPLOADS_MAX: 20, PENDING_UPLOADS_WINDOW_HOURS: 24, SIGN_BODY_MAX_BYTES: 4096 }`, `KUDO_IMAGE_BUCKET` (`"kudo-images"`), `KUDO_IMAGE_EXTENSIONS`, `KUDO_IMAGE_CONTENT_TYPES` (`image/jpeg`, `image/png`, `image/webp`), `KUDO_IMAGE_PATH_PATTERN`, `kudoTextLength(text)` |
| `@/features/kudos-authoring/schemas/kudo-input-schema` | `KudoInputSchema`, `KudoUpdateSchema`, types `KudoCreateInput`, `KudoUpdateInput` (what you send), `KudoCreateData`, `KudoUpdateData` (normalized), `parseKudoInput(schema, input)` → `{ ok: true, data } \| { ok: false, code: "MISSING_REQUIRED" \| "VALIDATION", fieldErrors }` |
| `@/features/kudos-authoring/schemas/kudo-body-link-policy` | `findDisallowedLinks(body)` → offending targets (empty = OK), `findMarkdownImages(body)` → each `![alt]` found (empty = OK) |
| `@/features/kudos-authoring/schemas/kudo-write-result` | `KudoWriteResult`, `KudoErrorCode`, `KUDO_ERROR_STATUS`, `KudoField`, `KudoFieldErrorKey`, `KUDO_FIELD_ERROR_KEYS`, `KudoFieldErrors` |
| `@/features/kudos-authoring/schemas/kudo-image-sign-schema` | `KudoImageSignSchema`, `KudoImageSignInput`, `KudoImageUploadTicket` |
| `@/features/kudos-authoring/schemas/kudo-edit-prefill` | `KudoEditPrefill`, `HashtagOption`, `KudoImagePrefill` |
| `@/features/sunner-search/schemas/sunner-option` | `SunnerOption = { id, fullName, email, avatarUrl: string \| null, department: { id: string; name: string } \| null }` |
| `@/features/sunner-search/schemas/sunner-search-params-schema` | `SUNNER_SEARCH_LIMITS` `{ Q_MAX: 50, LIMIT_MAX: 20, LIMIT_DEFAULT: 10 }` |

### Input shape (`KudoCreateInput`; `KudoUpdateInput` is the same without `recipientId`)

```ts
{
  recipientId: string;                 // uuid (create only; sending it on update → recipientImmutable)
  title?: string | null;               // optional; trimmed; "" → null; ≤ 50 chars
  body: string;                        // raw restricted Markdown; CRLF → LF, trimmed, 1..1000 chars
  hashtagIds: string[];                // 1..5 unique uuids of ACTIVE hashtags
  imagePaths?: string[];               // ≤ 5 unique paths from the sign endpoint, display order = position 0..4
  isAnonymous?: boolean;               // default false
  anonymousNickname?: string | null;   // required 1..30 chars when isAnonymous; must be empty otherwise
}
```

- Character counts are Unicode code points (`kudoTextLength`), the same unit as the DB CHECKs; an
  emoji counts as 1. Use `kudoTextLength` for the counter instead of `value.length`.
- Body links (`findDisallowedLinks`, field error `linkScheme`; see § 1.1 for the renderer):
  - allowed: inline links `[text](http(s)://…)` and bare `http(s)://…` URLs;
  - every `[text](url)` target must be an absolute `http(s)://` URL;
  - no bare `scheme://` other than http(s), and no `javascript:` / `vbscript:` / `data:` / `file:` / `blob:`;
  - no link reference definition `[label]: …` at the start of a line, whatever its target (also
    inside `>` quotes and list items). `[text][ref]` and `[text]` stay plain text.
  Plain text like `Lưu ý: 10:30` or `Xem [mục 2]: ổn` mid-line is fine. `@Full Name` stays plain text.
- No Markdown images (decision 2026-11-16; `findMarkdownImages`, field error `imageNotAllowed`):
  `![alt](…)` is rejected whatever its target (also glued to a word, inside a link or a quote, with
  nested brackets in the alt text). `\![x](https://…)` (escaped `!`) is a plain link and passes.
  Kudo images come only from `imagePaths`. A non-http(s) image target reports both `linkScheme`
  and `imageNotAllowed`.
- A body over 1,000 characters reports `bodyTooLong` only: the link scan is skipped for it.
- Unknown keys (e.g. `senderId`, `status`) are stripped; the sender always comes from the session.

### 1.1 Body syntax the phase 05 renderer must support (and nothing more)

Decision-log 2026-11-15 plus review round 1. The write check is a backstop; the renderer is the
real boundary, so it must be a whitelist renderer and treat everything else as escaped text:

- `**bold**`, `_italic_`, `~~strike~~`, ordered `1.` / unordered `-` lists, `> quote`, line breaks.
- Inline links `[text](http(s)://…)` and bare `http(s)://…` autolinks only, as
  `<a href rel="noopener noreferrer nofollow">`. Validate the href again at render time with
  `new URL()` and protocol `http:` / `https:`.
- Turn OFF: reference links and definitions, raw HTML, HTML entity decoding inside URLs, `<…>`
  autolinks of other schemes, and images (rejected at write time since 2026-11-16; any older or
  hand-inserted `![alt](url)` renders as text or a plain link, never an `<img>` — Kudo images come
  only from `kudo_images`).
- Owner of the test: phase 05 adds renderer unit cases for `[x][1]` + `[1]: java&#115;cript:…` and for
  `![x](https://…)` rendering no `<img>`.

## 2. Server Actions (call directly, e.g. inside `useTransition`)

```ts
import { createKudo } from "@/features/kudos-authoring/server/create-kudo-action";
import { updateKudo } from "@/features/kudos-authoring/server/update-kudo-action";
createKudo(input: KudoCreateInput): Promise<KudoWriteResult>
updateKudo(kudoId: string, input: KudoUpdateInput): Promise<KudoWriteResult>
// KudoWriteResult = { ok: true; id: string } | { ok: false; code: KudoErrorCode; fieldErrors?: KudoFieldErrors }
```

- No session → `redirect("/login")`; no department yet → `redirect("/onboarding/department")`
  (thrown by `requireSunner()`, Next follows it).
- Actions do not revalidate: call `router.refresh()` after `{ ok: true }`.
- No idempotency key: disable the submit button while pending (FR-403).
- There is no delete action or DELETE route.

## 3. Route handlers

All answer JSON. Error bodies are `{ code }` (+ `fieldErrors` for VALIDATION) and never contain Kudo
content. A guest is normally stopped earlier by the session proxy with `401 { code: "unauthorized" }`
(lowercase); treat ANY 401 as "session expired".

| Endpoint | Success | Errors |
|---|---|---|
| `GET /api/sunners/search?q&limit&excludeSelf` — `q` 1..50 after trim, `limit` 1..20 (default 10), `excludeSelf` `true\|false\|1\|0` (default false; recipient picker sends `true`) | `200 SunnerOption[]` ordered by name. Name match is diacritic/case-insensitive substring; email match is prefix. `%` `_` `\` are literal | 401, 403 ONBOARDING_REQUIRED, 400 VALIDATION `{ fieldErrors: { q \| limit \| excludeSelf: ["required" \| "invalid"] } }`, 500 |
| `GET /api/hashtags` | `200 [{ id, label }]`, active only, seed order, label by `NEXT_LOCALE` cookie → Accept-Language → vi | 401, 403 ONBOARDING_REQUIRED, 500 |
| `POST /api/kudos/images/sign` body `{ contentType, size }`; media type exactly `application/json` (parameters such as `; charset=utf-8` are fine, `application/jsonx` is not); body ≤ 4 KB | `200 { path, token, signedUrl }`; `path` = `kudos/{uuid}.{jpg\|png\|webp}` (never holds the sender id) | 401, 403 WRITING_CLOSED / ONBOARDING_REQUIRED, 400 VALIDATION `{ fieldErrors: { contentType \| size \| form: ["invalid"] } }` (`form` = other media type or malformed JSON), 413 PAYLOAD_TOO_LARGE (body > 4 KB, never parsed), 429 UPLOAD_LIMIT (20 pending uploads signed in the last 24 h), 500 |
| `GET /api/kudos/{id}/edit` | `200 KudoEditPrefill` (owner only) — `locked: true` when the Kudo is spam (show read-only notice) | 401, 403 FORBIDDEN / ONBOARDING_REQUIRED, 404 NOT_FOUND (unknown or malformed id), 500. Every answer carries `Cache-Control: private, no-store` |

Image upload flow (browser): `POST /api/kudos/images/sign` → browser Supabase client
`storage.from(KUDO_IMAGE_BUCKET).uploadToSignedUrl(path, token, file, { contentType })` (anon key is
enough; the token authorizes) → put `path` into `imagePaths`. The bucket enforces type and 5 MB on the
real upload. A write accepts a path only if the session user signed it AND the object exists; on edit,
paths already attached to that Kudo are accepted as-is. Dropped/abandoned uploads stay as orphans (RISK-01).
Pending cap: a Sunner may hold at most 20 signed-but-unattached uploads signed within the last 24 h;
the 21st sign answers 429 `UPLOAD_LIMIT` (older pending rows stop counting, so nobody is locked out
for good; orphan cleanup is still deferred). Attaching a path to a Kudo frees its slot.

`KudoEditPrefill = { id, recipient: SunnerOption, title, body, hashtags: HashtagOption[] (attached AND
still active — an inactive one must be re-picked), images: { path, position, previewUrl | null }[]
(signed read URL, 10 min), isAnonymous, anonymousNickname, locked }`.

## 4. Writing-open flag (for the launcher)

```ts
import { isKudoWritingOpen } from "@/features/kudos-authoring/server/kudo-write-window"; // server-only
const writingOpen = await isKudoWritingOpen(); // false from EVENT_END_AT; calls connection() first
```

Pass it as a prop from a server component; actions and the sign route re-check it on every call.

## 5. Error codes

i18n: `kudosComposer.errors.<CODE>` and `kudosComposer.errors.fields.<key>` in `messages/{vi,en}.json`.
Server Actions travel as HTTP 200 and carry the code in-band; the status column is what route handlers send.

| Code | HTTP | Where | Meaning / UI |
|---|---|---|---|
| `MISSING_REQUIRED` | 400 | actions | DEC-001 — show "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" (Figma frame 1949:13746, verbatim); `fieldErrors` marks which of recipientId/body/hashtagIds are `required` (plus any other field errors) |
| `VALIDATION` | 400 | actions, routes | other field errors (see keys below) |
| `UNAUTHENTICATED` | 401 | routes | no verified session/profile |
| `ONBOARDING_REQUIRED` | 403 | routes | department not chosen yet |
| `FORBIDDEN` | 403 | updateKudo, edit route | not the owner (no content) |
| `WRITING_CLOSED` | 403 | actions, sign route | now ≥ `EVENT_END_AT` |
| `NOT_FOUND` | 404 | updateKudo, edit route | unknown or malformed id |
| `PAYLOAD_TOO_LARGE` | 413 | sign route | request body over 4 KB (the composer never sends one) |
| `SELF_SEND` | 422 | createKudo | `fieldErrors.recipientId = ["selfSend"]` |
| `RECIPIENT_INVALID` | 422 | createKudo | recipient profile does not exist (`recipientInvalid`) |
| `HASHTAG_INVALID` | 422 | actions | unknown or inactive hashtag (`hashtagInactive`) |
| `IMAGE_INVALID` | 422 | actions | path not signed by the sender, object not uploaded, or already used (`imageNotOwned`) |
| `SPAM_LOCKED` | 423 | updateKudo | the Kudo is spam; editing locked |
| `UPLOAD_LIMIT` | 429 | sign route | 20 pending uploads signed in the last 24 h; show the message on the image slot |
| `UNEXPECTED` | 500 | all | logged server-side; retry |

Field error keys (`KUDO_FIELD_ERROR_KEYS`): `required`, `invalid`, `bodyTooLong`, `titleTooLong`,
`linkScheme`, `imageNotAllowed`, `nicknameRequired`, `nicknameTooLong`, `nicknameWithoutAnonymous`, `hashtagsTooMany`,
`hashtagsDuplicate`, `hashtagInactive`, `imagesTooMany`, `imagesDuplicate`, `imagePathInvalid`,
`imageNotOwned`, `recipientImmutable`, `recipientInvalid`, `selfSend`.

## 6. Data (for phases 05/08/12/13)

`kudos(id, sender_id, recipient_id, title varchar(50) null, body text, is_anonymous, anonymous_nickname
varchar(30) null, status kudo_status default 'public', created_at, updated_at)`, `kudo_hashtags`,
`kudo_images(storage_path unique, position 0..4)`, `kudo_image_uploads`; migrations `0006_kudos.sql`,
`0007_kudos_constraints.sql` (CHECKs `kudos_no_self_send`, `kudos_body_length`, `kudos_title_not_blank`,
`kudos_anonymous_nickname`, `kudo_images_position_range`, path-format CHECKs, `public.f_unaccent(text)`),
`0008_kudos_review_fixes.sql` (index `kudo_image_uploads_uploader_id_created_at_idx`, CHECK
`kudos_body_not_blank`: the body holds at least one non-whitespace character).
`KudoCreated { kudoId }` is written in the create transaction; edits emit nothing. In-process search:
`searchSunners(q, { viewerId, limit, excludeSelf, locale })` and `findSunnerOptionsByIds(ids, locale)`
from `@/features/sunner-search/server/sunner-search-query`.
