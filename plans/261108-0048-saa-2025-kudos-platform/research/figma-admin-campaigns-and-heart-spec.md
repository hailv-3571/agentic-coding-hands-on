# Figma — Admin campaign settings & heart button (phase 06 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, `get_design_context` by the orchestrator on 2026-11-16. Values are [EXTRACTED]; use them verbatim.

- Screenshots are in `research/figma-frames/`:
  - `admin-setting-820-10492.png` (list page)
  - `admin-campaign-row-menu-820-11429.png`
  - `admin-campaign-delete-1760-8926.png`
  - `admin-campaign-add-820-11445.png` (empty add modal)
  - `admin-campaign-add-filled-832-12113.png`
  - `admin-campaign-edit-832-12299.png`
  - `admin-campaign-datepicker-1413-9045.png`
- Icons are in `research/figma-assets/admin-campaigns/`. All are 24px; copy what you use into `public/images/admin-campaigns/` and keep each SVG's root width/height.
  - `ic-more.svg`: the row "⋯" in a circle
  - `ic-edit.svg`: the pencil in the menu
  - `ic-delete-x.svg`: the X in the menu
  - `ic-calendar.svg`: the trailing icon in the date inputs
- Heart: `research/figma-assets/kudos-feed/ic-heart-figma.svg` is identical to the existing `public/images/kudos-feed/ic-heart.svg`, a 32px filled heart in `#D4271D`.

## Admin › Settings page (820:10492)
The page uses the existing admin frame (`app/admin/layout.tsx`, AdminTopBar + minimal footer). Do NOT rebuild the header. The Figma header shows "Settings" as the active nav item; check that the admin nav links to `/admin/settings`.

The content column is 1280 wide (left 80 inside 1440), with a vertical gap of 16. Figma's page background is `#999`, a mock canvas; keep the existing admin frame background.

1. **Title row** (justify-between):
   - "Setting": Montserrat Regular 45/52, `#00101A`. On our dark admin background, use the existing admin page-title token or colour. Check how `app/admin/overview` handles it and stay consistent.
   - "Add Campaign" button: bg `#FFEA9E`, rounded 4, p16, text Medium 16/24 tracking .15, `#00101A`.
2. **Table** (w1280, columns: ID w60 | Name w480 | Time flex | Actions w80):
   - Header cell: bg `#00101A`, border-b 1px `#2E3940`, pt12 pb13 px12. Text Medium 14/20 tracking .1, white. A 22px vertical divider `#2E3940` sits at the left edge of each cell except the first.
   - Row: bg `#00070C`, border-b 1px `#2E3940`, pt12 pb13 px12. Text Regular 14/20 tracking .25, white.
     - ID is centred.
     - Name wraps and is clamped to a single line with ellipsis on overflow; the spec says "cắt gọn khi dài".
     - Time shows two groups with gap 40. Each group is `dd/MM/yyyy`, `-`, `HH:mm` with gap 8, for start then end, in `ADMIN_TIMEZONE`.
   - Actions: a 40px icon button, rounded 4, transparent bg, ic-more 24, centred.
   - Empty state and error state are not drawn. Use the spec E13/E14 text in the same row style.

## Row action menu (820:11429)
- Popover: bg `#00070C`, 1px border `#998C5F`, rounded 8, p6, flex-col. Item width 151.
- Item: p16, rounded 4, gap 4, icon 24 + text Medium 16/24 tracking .15, white.
- Hovered or focused item: bg `rgba(255,234,158,0.1)` and text-shadow `0 0 6px #FAE287, 0 4px 4px rgba(0,0,0,.25)`. Figma draws it on "Edit".
- Items: "Edit" (ic-edit) and "Delete" (ic-delete-x).

## Delete dialog (1760:8926)
- Panel: bg `#00070C`, rounded 16, px32 py40, vertical gap 40, width about 480.
- Mask: `rgba(0,16,26,0.8)`, the same as the add modal.
- Title "Delete Campaign": Regular 24/32, white, centred.
- Body (gap 16):
  - "Bạn có chắc chắn muốn xoá campaign": Medium 14/20 tracking .1, white.
  - The campaign name below it: Regular 22/28, `#FFEA9E`.
- Buttons: a row with gap 24, each flex-1 and h52.
  - "Delete": bg `#D4271D`, rounded 4, text Medium 16/24 white.
  - "Cancel": bg `rgba(255,234,158,0.1)`, 1px border `#998C5F`, rounded 4, text white.

## Add / Edit campaign modal (820:11445, 832:12113, 832:12299)
- Mask: `rgba(0,16,26,0.8)`, full screen.
- Panel: bg `#00070C`, rounded 16, p40, w560, vertical gap 24, centred.
- Title: "Add Campaign" or "Edit Campaign", Regular 24/32, white, centred.
- Field label: Medium 16/24 tracking .15, white, followed by a red `*` (Bold 16/20, `#CF1322`, gap 2). All three fields are required.
- Input:
  - bg white, 1px border `#2E3940`, rounded 8, h48, pl16 pr8 py8.
  - Text Medium 14/20 tracking .1, `#00101A`. Placeholder `#999`.
  - Placeholders: "Campaign Name", "Start Date", "End Date".
- Field layout:
  - "Campaign Name" spans the full width.
  - Below it, "Start Date" | "End Date" share a row (gap 16, flex-1 each).
  - The label sits above its input with gap 2.
  - Date inputs have the trailing ic-calendar 24.
- Filled value format in Figma: `23/12/2025 - 00:00`.
- Buttons (row, gap 24):
  - "Cancel": auto width, h52, bg `rgba(255,234,158,0.1)`, border `#998C5F`, rounded 4, p16, white.
  - Submit: flex-1, h52, bg `#FFEA9E`, rounded 4, text Medium 16/24 `#00101A`. The label is "Add Campaign", or "Save Campaign" when editing.
- **Date picker (user decision 2026-11-16):**
  - Use the native `<input type="datetime-local">`, styled as the input above. Do not build the Figma calendar (1413:9045).
  - The value is interpreted in `ADMIN_TIMEZONE`.
- Validation and error messages come from the F011 spec (DEC-001/DEC-002, name 1–100, end > start, end > now, overlap). Show field errors under the input in `#D4271D`, Medium 14/20.

## Heart button (card 3127:21871, node `mms_C.4.1_Hearts`)
- Layout: count + icon, gap 4.
  - Count: Bold 24/32 `#00101A`, with the thousands separator "1.000" in vi.
  - Icon: 32px.
- Hearted: the filled `#D4271D` heart (existing `ic-heart.svg`).
- **Not hearted (user decision 2026-11-16):** the same path drawn as an outline, stroke `#D4271D` about 2px, fill transparent. Render it inline as SVG so `currentColor` and stroke work.
- Disabled cases:
  - the viewer's own Kudo (tooltip "Bạn không thể thả tim cho Kudo của mình");
  - after `EVENT_END_AT`.

  In both cases, show the button with reduced opacity and keep the count visible.
- The whole count+icon group is one button with `aria-pressed`.
