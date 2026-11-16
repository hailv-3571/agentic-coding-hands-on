# Figma — Write Kudo composer (phase 04 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, `get_design_context` on `828:13433` (create, filled) by the orchestrator 2026-11-15. Values [EXTRACTED]; use verbatim.
Screenshots: `research/figma-frames/kudo-composer-*.png`, `kudo-composer-page-520-11602.png` (modal over page), `kudo-hashtag-dropdown-1002-13013.png`.
Icons (SVG, keep root width/height): `research/figma-assets/kudo-composer/` — ic-dropdown-caret, ic-title-input-trailing, ic-bold, ic-italic, ic-strikethrough, ic-numbered-list, ic-link, ic-quote, ic-close, ic-close-alt, ic-plus, ic-image-remove, ic-send.

## Frames
| Node | Content |
|---|---|
| 520:11602 | full page 1440×1024 with modal open |
| 828:13433 | create, filled (title "Gửi lời cám ơn và ghi nhận đến đồng đội") |
| 1949:13746 | edit "Chỉnh sửa bài viết của bạn" + DEC-001 error, button "Lưu" (save icon). This frame shows no Danh hiệu row, but decision-log 2026-11-15 keeps title editable |
| 1612:5056, 662:13035 | other create states (read the PNGs) |
| 1002:12917, 828:10943 | dropdown / Add link popovers (read the PNGs) |
| 1002:13013 | hashtag dropdown list |

## Modal
- Panel: bg `primary-hover` #FFF8E1, rounded 24px, padding 40px, width 752px, vertical gap 32px; centered over the page with an overlay.
- Title: Montserrat Bold 32/40, color `on-primary` #00101A, centered.
- Field labels: Bold 22/28 #00101A + red `*` (#CF1322, 16px bold) on required fields: Người nhận, Hashtag, Nickname ẩn danh. Danh hiệu shows `*` in Figma but is OPTIONAL per decision-log, so render it without `*`.
- Inputs: bg white, 1px border `border` #998C5F, rounded 8px, px 24, py 16, text Bold 16/24 tracking 0.15; placeholder color `text-muted` #999.
- Row layout: label + control in a row, gap 16px.

## Fields (top → bottom)
1. **Người nhận**: select-like combobox with ic-dropdown-caret on the right.
2. **Danh hiệu**: input placeholder "Dành tặng một danh hiệu cho đồng đội". Helper text below in #999 Bold 16/24, two lines: "Ví dụ: Người truyền động lực cho tôi." / "Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn."
3. **Message editor**:
   - Toolbar of 6 buttons. Each is h-40, px16 py10, 1px border #998C5F, transparent bg, with a 24px icon. Order: bold, italic, strikethrough, numbered list, link, quote. The first has rounded-tl 8; the last cell is the link "Tiêu chuẩn cộng đồng" (#E46060, Bold 16 underline), rounded-tr 8.
   - Textarea: white, border #998C5F, rounded-b 8, h 200, min-h 120, pl 24.
   - Below: left "Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác" (#00101A Bold 16/24); right counter "0/1.000" (#999).
4. **Hashtag**: wrap group, gap 8. Each chip is h48, white, border #998C5F, rounded 8, pl16 pr8 py8, text Bold 16/24 (14/20 for long ones) + ic-close. The add button is h48, px8 py4, ic-plus + "Hashtag" (Bold 16/24 #00101A) over "Tối đa 5" (Bold 11/16 #999 tracking 0.5).
5. **Image**: label "Image".
   - Thumbnails are 80×80: white, border #998C5F, rounded 18, inner image border 1px #FFEA9E, rounded 4.
   - Remove badge: red #D4271D circle at top-right (left 67, top −9), ic-image-remove 17px.
   - Add button "Image" / "Tối đa 5" uses the same style as the hashtag add button.
6. **Anonymous**: checkbox 24px (white, border #998C5F, rounded 4; checked = inner 16px square #998C5F, rounded 2) + label "Gửi lời cám ơn và ghi nhận ẩn danh" Bold 22/28. When checked, show the row "Nickname ẩn danh*" with an input h56.
7. **DEC-001 error** (frame 1949:13746): red #D4271D text, Bold 16: "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!"
8. **Buttons**: row, gap 24.
   - "Hủy" + ic-close: bg `secondary` rgba(255,234,158,0.1), border #998C5F, rounded 4, px40 py16, Bold 16/24.
   - "Gửi" + ic-send (edit mode: "Lưu" + save icon): bg `primary` #FFEA9E, flex-1, rounded 8, p16, Bold 22/28.

Hashtag display text in Figma "High-perorming" is a typo; the seed uses "#High-performing".
