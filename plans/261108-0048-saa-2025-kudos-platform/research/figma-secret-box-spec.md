# Figma — Secret Box (phase 10 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, orchestrator 2026-11-22. Decisions: `spec/decision-log.md` § "Session 2026-11-22 — Phase 10".

Screenshots (`research/figma-frames/`): `live-board-rewards-column-2940-13488.png`, `secret-box-page-unopened-1466-7069.png`, `secret-box-modal-unopened-1466-7676.png`, `secret-box-modal-opening-1466-7024.png`, `secret-box-page-standby-icon-1466-7614.png`, `secret-box-gift-unopened-2995-15708.png`, `secret-box-gift-result-2995-15754.png`.

Assets ready in `public/images/secret-box/`: `box-unopened.webp` (557², closed box with gold sparkle trail — idle "click to open"), `box-opening.webp` (557², plain closed box — the "pressed/opening" frame), `box-opened-standby.webp` (557², open glowing box — result backdrop; the won icon/gift is layered on top), `x2-flame.webp` (flame behind the "x2" label; drawn 34×40, mirrored horizontally, label "x2" Bold 17.5/23.4 white on top), `ic-close.svg` (19), `ic-open-gift.svg` (24). Secret Box icon images = phase 07 `public/images/awards-portal/badge-*.webp` (circle + label baked in) — reuse; sources in `research/figma-assets/awards-portal/`.

## Live board right column (2940:13488; w422, gap 24) — phase 05 seam `live-board-rewards-column-slot.tsx`
1. **Stats panel** (2940:13489): bg `#00070C`, 1px `#998C5F`, rounded 17, p24; inner column w374 gap 16.
   - Rows (justify-between): label Bold 22/28 white + value Bold 32/40 `#FFEA9E` right-aligned:
     "Số Kudos bạn nhận được:", "Số Kudos bạn đã gửi:", "Số tim bạn nhận được:" (with the x2 flame badge between label and value only while a campaign is active), divider 1px `#2E3940`, "Số Secret Box bạn đã mở:", "Số Secret Box chưa mở:".
   - Button "Mở Secret Box" + ic-open-gift 24: full width, bg `#FFEA9E`, rounded 8, p16, gap 8, Bold 22/28 `#00101A`. Disabled (0 unopened) per DEC-001 with a tooltip (not drawn; use the spec copy).
2. **"10 SUNNER NHẬN QUÀ MỚI NHẤT"** (2940:13510): same panel style, pl24 pr16 py24; title Bold 22/28 `#FFEA9E` centred on 2 lines; list (gap 16) of rows: avatar 64 circle + name Bold 22/28 `#FFEA9E` + "Nhận được 1 áo phông SAA" Bold 16/24 white (= "Nhận được {giftName}"); a 2px `#999` rounded scrollbar track on the right (custom scrollbar, list scrolls when > ~5 rows). Empty state not drawn → spec copy.
   - The hidden variant "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (2940:13498, hidden in Figma) is out of scope.

## Open Secret Box modal (1466:7676 / 1466:7024 / 1466:7614 / 2995:15708 / 2995:15754)
- Backdrop: page darkened (Figma shows the Live board at 20% under black) → use the app's modal mask (`rgba(0,16,26,0.8)` like other dialogs) — orchestrator default.
- Panel ≈ 652×823 (scale down on small screens), bg `#00101A` (idle) / `#00070C` (opening/standby), rounded 12.7, px12.7 py23.9, gap 22.3, centred.
- Header: title Bold 25.5/31.8 `#FFEA9E` centred "KHÁM PHÁ SECRET BOX CỦA BẠN"; close icon 19 at the right; divider 1px `#2E3940` under it.
- Hint "Click vào box để mở" Bold 12.7/19.1 white tracking .4.
- Box area 557×557: idle = `box-unopened.webp` (clickable; whole image is the button, keyboard Enter/Space); opening (request in flight, button locked) = `box-opening.webp` (+ subtle shake/scale unless `prefers-reduced-motion`); result = `box-opened-standby.webp` with the won item centred near the top: icon → the badge image (~185 px circle area, Figma 185.361 at top 44) with a soft glow; gift → see below.
- Footer: divider + "Secretbox chưa mở" Bold 12.7 white + count Bold 28.6/35 `#FFEA9E` (2 digits, "05"). After a result the user can click again to open the next box while count > 0 (D010 lowest seq first).
- Gift result (2995:15754): title changes to "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" (2 lines), hint hidden, item name under the box Bold 28.6/35 `#FFEA9E` (e.g. "1 Áo phông SAA" = prize name). Figma uses a branded T-shirt photo — **not shipped** (orchestrator default): gifts show `box-opened-standby.webp` with a gold glow and the prize name; a prize-specific image may be added later via the prize catalog.
- 2995:15708 (gift intro, "Chúc mừng…" with the unopened box) = the mystery-gift (6 icons complete) announcement state.
- Close (X / Esc / mask click) returns to the Live board and refreshes the stats panel. Deep link `/kudos?secretBox=open` opens the modal.
