# Figma — Hero badge + tooltip (phase 09 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, frames 3241:14991 (New), 3241:14995 (Rising), 3241:14999 (Super), 3241:15003 (Legend); orchestrator 2026-11-22. Screenshot: `research/figma-frames/hero-tooltip-new-3241-14991.png`.

## Badge images (reuse, do not redraw)
The badge is a composite (photo texture + styled text, different colours per tier). Phase 07 already exported each tier from Figma at 2x: `public/images/awards-portal/hero-tag-{new,rising,super,legend}.webp` (≈255×47 px source; designed at ≈126×22). Reuse these files for every badge size (decision 2026-11-22, orchestrator default): `alt` = localized tier label ("New Hero", "Rising Hero", "Super Hero", "Legend Hero").
- On Kudo cards (phase 05 slot, Figma card 3127:21871 "danh hiệu"): 109×19, after the department code + 4px dot (gap 10). The dot shows only when a badge shows.
- In the tooltip: 218×38.

## Tooltip (hover/focus/tap on a badge)
- Panel: bg `#00070C`, rounded 16, p16; inner column gap 11; width ≈ 250–282 (content-driven; Figma frames ~282 wide incl. padding).
- Badge 218×38 (image above).
- Text block, Montserrat Bold 14/20, tracking .1:
  - line 1 white: tier rule — New "Có 1–4 người gửi Kudos cho bạn", Rising "Có 5-9 người gửi Kudos cho bạn", Super "Có 10–20 người gửi Kudos cho bạn", Legend "Có hơn 20 người gửi Kudos cho bạn" (use an en dash consistently: "1–4", "5–9", "10–20"; Figma mixes "5-9").
  - line 2 `#999`: New "Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu tiên đã tìm đến bạn." · Rising "Hình ảnh bạn đang lớn dần trong trái tim đồng đội bằng sự tử tế và cống hiến của mình." · Super "Bạn đã trở thành biểu tượng được tin tưởng và yêu quý, người luôn sẵn sàng hỗ trợ và được nhiều đồng đội nhớ đến." · Legend "Bạn đã trở thành huyền thoại – người để lại dấu ấn khó quên trong tập thể bằng trái tim và hành động của mình."
- The copy is the same text as the Thể lệ page (phase 07 `awardsPortal` rules keys) — reuse those message values or move them to the shared `hero.*` keys and point both at one place (DRY); English = the existing phase 07 translations.
- Note: the tooltip says "bạn" (you) even on someone else's badge — Figma copy, keep verbatim (orchestrator default; BTC may adjust).
