# Figma — Admin moderation & owner spam view (phase 08 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, `get_design_context` by the orchestrator on 2026-11-22. Values are [EXTRACTED]. Decisions: `spec/decision-log.md` § "Session 2026-11-22 — Phase 08".

- Screenshots (`research/figma-frames/`):
  - `admin-review-content-722-16251.png` (full page)
  - `admin-sender-dropdown-1002-15428.png`, `admin-receiver-dropdown-1002-15464.png`, `admin-status-dropdown-1002-15559.png`
  - `admin-action-mark-spam-773-26295.png`, `admin-action-un-spam-773-26373.png`
  - `kudo-spam-card-3127-24099.png`, `spam-alert-overlay-3127-24672.png`
- **Full reference code of the Review content page** (header, title, filters, date range, search, table header + rows, badges, row buttons, pagination, footer) with its temporary asset URLs: `research/figma-raw/admin-moderation/review-content-722-16251.txt`. Read it for exact sizes/colours; download the icons you use from the URLs in it with `curl -L` (valid until ~2026-11-29) into `public/images/admin-moderation/`, keeping each SVG's root width/height. Do NOT rebuild the admin header/footer — the existing admin frame (`app/admin/layout.tsx`) stays. Figma's grey page background `#999` is a canvas; keep the admin frame background (as phase 06 Settings did).
- Already downloaded to `research/figma-assets/admin-moderation/` (copy what you use to `public/images/admin-moderation/`):
  - `ic-mark-spam-warning.svg` (24, warning triangle for "Mark Spam")
  - `ic-un-spam.svg` (24, for "Un Spam")
  - `ic-dropdown-caret.svg` (24, filter selects)
  - `spam-overlay-warning-triangle.svg` (330.994×290.25, the big overlay triangle)

## Review content page (722:16251; content 1280 wide at x=80)
- Title "Review content" (Figma, Montserrat Regular 45/52) on the left; on the right the **date range** input ("Start date → End date" + calendar icon, white, rounded 8, h48) and the **Export** button (bg `#FFEA9E`, rounded 4, p16, Medium 16/24 `#00101A`). Use the same title treatment as `app/admin/settings` (phase 06) for consistency on the dark admin frame.
- Filter row: three labelled selects "Sender", "Receiver", "Status" (label Medium 14/20 white above; select 259×48, bg white, 1px border `#FFEA9E`, rounded 8, px24 py16, placeholder Medium 14/20 `#999` "Chọn Sender" / "Chọn Receiver" / "Chọn Status", caret 24) + on the right a search input w360 h48 white rounded 8 "Search by content" with a search icon.
  - Sender/Receiver dropdown (1002:15428 / 1002:15464): list bg `#00070C`, 1px `#998C5F`, rounded 8, p6, w378; item: avatar 40 (p10) + name Medium 16/24 white + department code Medium 14/20 `#999`; selected/hovered item bg `rgba(255,234,158,0.2)`, rounded 2. Use the existing Sunner search (`/api/sunners/search`, `features/sunner-search`) for the options (type-to-search).
  - Status dropdown (1002:15559): selected value shown in the select (Medium 14/20 `#00101A`); list bg `#00070C`, rounded 8, p6, gap 10, right-aligned under the select (w118); options are outlined chips "Public" / "Spam" (1px white border, rounded 4, px16 py8, Regular 14/20 white). Add an "all" option to clear (spec default "Tất cả").
- Table (full width 1280): header bg `#00101A`-ish dark with white Medium 14/20 labels and 1px `#2E3940` dividers (same family as the phase 06 campaigns table — reuse its header/row tokens). Columns and widths: ID 60 · Sender 120 · Receiver 120 ("Recreiver" typo in Figma → "Receiver"/"Người nhận", D013) · Content 532 · Hashtag 160 · Heart 88 (sortable: caret up/down icons) · Status 120 · Actions 80.
  - Row bg `#00070C` (zebra not drawn), border-b `#2E3940`, text Regular 14/20 white.
  - Content cell: title line Bold (e.g. "#NGƯỜI HÙNG CỦA LÒNG EM") then the message clamped to ~4 lines.
  - Hashtag cell: one hashtag per line, each truncated with ellipsis.
  - Heart: number with vi thousands separator ("1.000").
  - Status badge 72 wide: **Public** = 1px border + text `#3174C6`; **Spam** = 1px border + text yellow (`#FFEA9E`/gold per raw file); rounded 4, px16 py8, Regular 14/20.
  - Actions: small dark button "Mark Spam" (public rows) / "Un Spam" (spam rows). Clicking opens the popover below.
  - Anonymous Kudo: real sender name + an "Ẩn danh" chip (D001) — not drawn; style it like a small outlined chip.
- Popover (773:26295 / 773:26373): bg `#00070C`, 1px `#998C5F`, rounded 8, p6; one item w151: bg `rgba(255,234,158,0.1)`, rounded 4, p16, gap 4, icon 24 + label Medium 16/24 white with text-shadow `0 0 6px #FAE287, 0 4px 4px rgba(0,0,0,.25)` — "Mark Spam" with the warning icon, "Un Spam" with the un-spam icon. Clicking the item confirms (D004). Esc / outside click closes.
- Pagination: numbered square buttons (prev ‹, 1 2 3 4 5, next ›), white boxes with border, current page dark `#00101A` with white text; centered under the table (10 per page).
- Empty state / error state: not drawn — use spec text in the table body style (same approach as phase 06).

## Owner spam view (decision 2026-11-22: blur + overlay on Live board AND detail)
- Spam card (3127:24099): same anatomy as the phase 05 Kudo card. The "Spam" tag sits at the top-right of the info row: bg `#FF8104`, 1px border `#EAEAEA`, rounded 4, w72, px16 py8, Bold 16/24 white tracking .5. Hearts / Copy Link are not usable on a spam card (phase 05 already hides them; keep that).
- Alert overlay (3127:24672) covers the whole card:
  - The card underneath is blurred (`filter: blur(≈5px)`) with a grey veil `rgba(87,87,87,0.7)` on top.
  - Centered warning triangle (`spam-overlay-warning-triangle.svg`, ≈331×290 in a 683×722 frame → scale with the card, roughly 48% of card width) and below it the text "Cảnh báo vi phạm / tiêu chuẩn cộng đồng" Bold 32/40 white, centered, text-shadow `0 4px 4px rgba(0,0,0,.25)`.
  - No close button; pointer events on the card content disabled. Keep the card's text in the DOM (screen readers), and give the overlay `role="note"` (or `alert` only on first render) with the warning text; the Spam tag stays visible above the blur.
