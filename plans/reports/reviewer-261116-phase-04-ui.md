# Review: Phase 04 (F003) Kudo composer UI

Score: 8.5/10. Status: DONE_WITH_CONCERNS (no critical; 3 warnings worth fixing before phase 05 reuses the modal).

## Scope
features/kudos-authoring/components/**, features/sunner-search/components/**, app/(app)/page.tsx, tests/e2e/kudos-authoring/*.ts, 4 screenshot pairs. Read-only. All files <= 167 lines (limit 200).

## Security checks (all pass)
- XSS: no dangerouslySetInnerHTML / innerHTML anywhere; every user string rendered as React text. Image `src` only blob: URLs or server-signed URLs.
- Upload client (kudo-image-upload-client.ts:19): anon key + signed-URL token only, persistSession false. Grep "service|SERVICE_ROLE" over components, sunner-search, public-env: zero hits.
- `/?editKudo`: page.tsx:14 validates uuid; real gate is server: kudo-edit-query.ts:49 `senderId !== viewerId` -> forbidden. Loader shows only the error code text, no content; e2e (edit-kudo.spec.ts:52-62) proves a non-owner sees the alert and no body.
- Double submit: use-kudo-composer-submit.ts:32,41,59 ref set synchronously before the transition, plus disabled button; e2e dblclick covers it.
- Error codes: all 13 KudoErrorCode keys and all 18 field keys exist in vi.json and en.json (checked by script). Upload client maps 401/WRITING_CLOSED/VALIDATION/other. Edit prefill narrows unknown codes to UNEXPECTED.
- Leaks: object URLs revoked on remove and unmount (use-kudo-image-uploads.ts:46-49,83); debounce timer + AbortController cleared (use-sunner-search.ts:339-342); hashtags/edit prefill abort on unmount; toast timer cleared; body overflow restored.
- Cache Components: page.tsx wraps the clock/searchParams read in Suspense with a same-size placeholder; root layout sets `instant = false` deliberately (cookie locale), so `await getTranslations` at page top is consistent.

## Critical
None.

## Warning
1. Mention listbox ARIA is incomplete. kudo-message-editor.tsx:111-120 puts `aria-controls`/`aria-activedescendant` on a plain `<textarea>` with no `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`. Screen readers will not announce the popup. Fix: add `role="combobox" aria-expanded={mentionOpen} aria-autocomplete="list" aria-haspopup="listbox"` to the textarea (keep the label).
2. Cancel / Esc stays live while a save is in flight. use-kudo-composer-submit.ts + kudo-composer-form.tsx:239 (Hủy not disabled when `pending`). User hits Hủy -> Discard on a dirty form, dialog closes, but the queued action still creates the kudo and the success toast fires, so "discarded" content is sent. Fix: pass `pending` up (controls.setBusy) and make requestClose a no-op, or disable Hủy while pending.
3. insertLink does not escape `(` `)` in the URL. kudo-markdown-format.ts:85-87: `new URL().href` leaves `)` raw, so `https://x.com/a)b` becomes `[t](https://x.com/a)b)` and splits when phase 05 renders it. Fix: `href.replace(/[()]/g, c => c === "(" ? "%28" : "%29")` before building the link (and a unit test).

## Suggestion
1. sunner-search-combobox.tsx:90 `aria-controls={listId}` always set; the listbox does not exist while closed (dangling id). Use `open ? listId : undefined`. Live region (:132) announces only the ready count; loading/error/noResults text is silent. Include `statusLine` in the polite region.
2. hashtag-picker.tsx:97: on desktop the list opens below the trigger and runs past the viewport (screenshot 05 cuts at "#GO FAST"; WASSHOI hidden). Overlay scrolls so it is reachable, but add `max-h-[min(24rem,60dvh)] overflow-y-auto` or `scrollIntoView({block:"nearest"})` on open.
3. kudo-composer-edit-loader.tsx:46: after prefill loads, focus stays on the dialog container (trap ran while only the "loading" paragraph existed). Add `data-autofocus` to the first editable control or re-focus on ready.
4. kudo-edit-deep-link.tsx:13: id captured once, so a soft navigation to a different `?editKudo` while mounted is ignored. Acceptable (placeholder, removed in phase 05); keep the removal TODO tracked.
5. use-kudo-image-uploads.ts:64-66 `room` derives from the render-time `images`, so two quick picks before re-render can exceed 5 (server still rejects with imagesTooMany). Use a ref or the functional setter. Uploads are not aborted on remove/unmount (orphans accepted as RISK-01).
6. JSON responses are cast, not parsed (`as KudoEditPrefill`, `as SunnerOption[]`, `as KudoImageUploadTicket`). Same-origin and server-typed; a Zod parse would make a contract drift fail loudly.
7. compose-kudo.spec.ts:129 `waitForTimeout(1_500)` is justified in the comment; `expect.poll(() => kudosSentBy(...)).toHaveLength(1)` held for a short window would be less sleepy.
8. Deviation 9: `#CF1322`, `#E46060` as arbitrary Tailwind values; move to tokens when globals.css is next opened.

## Deviations judged
1 (Danh hiệu no asterisk): accept, matches decision-log. 2: ignored per instruction. 3 (edit keeps title row + Tiêu chuẩn cộng đồng): accept; title editable per decision. 4 (locked recipient read-only, no caret): accept, better a11y (e2e asserts `readonly`). 5 (no red borders, aria-invalid only): accept for Figma fidelity; error text + role=alert carry the signal, but colour-only contrast is not the sole cue. 6 accept. 7 accept. 8 accept. 9 see Suggestion 8. 10 (mobile layout): accept; screenshot is usable. 11 accept (toast, discard confirm are needed behaviours; focus/Esc on confirm correct). 12 accept.

## Visual check
- 06 composer-filled-full vs 828:13433: match on panel (752, cream, radius 24), label column, toolbar, counter, chip style, remove badges, checkbox, buttons. Differences are data only (2 images vs 5, 3 chips). Figma red asterisk on Danh hiệu absent by decision.
- 08 edit-mode vs 1949:13746: structure matches; title row + community-standards cell extra (deviation 3); anonymous block collapses without nickname as designed.
- 05 hashtag dropdown vs 1002:13013: dark panel, check icons, selected-row highlight match. Clipped at viewport bottom (Suggestion 2). "#High-performing" vs Figma typo, correct.
- 02 mobile empty: single column, full-width sheet, Gửi above Hủy, nothing clipped, touch targets >= 44px. No horizontal scroll. Good.

## Done well
Focus trap with nested-dialog hand-off, focus restore, scroll lock; Esc layering (combobox -> list -> link dialog -> confirm -> dialog) consistently stopPropagation; same Zod schema client and server; ref-guard + disabled double-submit defence with e2e proof; owner check on server with content-free error UI; tidy small modules; role-based e2e selectors; Suspense fallback sized to avoid layout shift.

## Actions in order
1. Block close/discard while pending (Warning 2).
2. Escape `()` in link URLs + unit test (Warning 3).
3. Add combobox role/attrs to the mention textarea (Warning 1).
4. Combobox dangling aria-controls + live status; hashtag list max height (Suggestions 1-2).
5. Remaining suggestions opportunistically.

## Numbers
Type coverage / test coverage / lint counts not run (read-only, no build). 0 files over 200 lines. 0 `any`, 0 dangerouslySetInnerHTML, 0 service-key references.

## Still unresolved
- Did not run typecheck/lint/e2e; relied on reading plus existing screenshots.
- Not read: composer-field-row, recipient-picker, anonymous-sender-field, toolbar (outside priority list).
- Plan acceptance docs not re-walked beyond the implementer deviations list.

```json
{ "score": 8, "criticalCount": 0, "decision": "REWORK",
  "acceptanceCovered": ["XSS-safe rendering", "anon key + signed URL only", "owner-checked edit deep link", "double-submit guard", "error-code mapping complete", "files < 200 lines", "Suspense on home page", "Figma visual parity desktop/mobile"],
  "regressionChecked": ["Esc layering across combobox/hashtag/link/confirm/dialog", "object URL revocation", "abort/debounce cleanup", "edit-prefill forbidden path"],
  "contractStatus": "OK", "refuted": [], "unproven": ["typecheck/lint/e2e not executed by reviewer"], "reachableRegressions": ["Hủy+Discard while save pending still creates the kudo"],
  "findings": [
    { "severity": "Warning", "category": "Logic", "location": "features/kudos-authoring/components/kudo-composer-form.tsx:239", "summary": "Cancel/discard allowed while save is in flight; kudo still created", "disposition": "Accept" },
    { "severity": "Warning", "category": "Accessibility", "location": "features/kudos-authoring/components/kudo-message-editor.tsx:111-120", "summary": "mention popup lacks combobox role/aria-expanded on textarea", "disposition": "Accept" },
    { "severity": "Warning", "category": "Logic", "location": "features/kudos-authoring/components/kudo-markdown-format.ts:85-87", "summary": "parentheses in URL not escaped in generated markdown link", "disposition": "Accept" },
    { "severity": "Suggestion", "category": "Accessibility", "location": "features/sunner-search/components/sunner-search-combobox.tsx:90", "summary": "aria-controls dangling when closed; status not announced", "disposition": "Accept" },
    { "severity": "Suggestion", "category": "UX", "location": "features/kudos-authoring/components/hashtag-picker.tsx:97", "summary": "dropdown clipped at viewport bottom on desktop", "disposition": "Accept" }
  ] }
```
