# Figma — Spotlight Board (phase 11 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, Live board frame 2940:13431, region 2940:14170 (header 2940:13476 + board 2940:14174); orchestrator 2026-11-22. Screenshot: `research/figma-frames/spotlight-board-2940-14170.png`.

Assets in `public/images/spotlight/`: `board-texture.webp` (the ROOT FURTHER root texture, drawn 1819×583 at left −65 / top −1 inside the board, covered by `rgba(0,0,0,0.7)`), `board-network.webp` (1920×1080 network lines/triangles, drawn 1100×618 at −36/−36, `mix-blend-mode: screen`, opacity 30%), `ic-search.svg` (16.4), `ic-pan-zoom.svg` (30, fullscreen toggle).

## Section header (same component as other Live board sections)
"Sun* Annual Awards 2025" Bold 24/32 white · divider `#2E3940` · "SPOTLIGHT BOARD" Bold 57/64 tracking −0.25 `#FFEA9E` (ellipsis).

## Board (2940:14174)
- 1157×548 (content column 1152 wide), 1px border `#998C5F`, radius 47.14, overflow clip, bg `#00101A` under the texture layers above. Mobile: same elements, height scales (keep aspect ~2.1:1, min ~320 tall), names stay ≥ readable size.
- Total "388 KUDOS" ("{n} KUDOS"): Bold 36/44 white, centred at top 13.
- Search pill (top-left 24/25): 219×39, bg `rgba(255,234,158,0.1)`, 0.68px border `#998C5F`, radius 46.4, px10.9, gap 5.5; ic-search 16.4 + placeholder "Tìm kiếm" Medium 10.9/16.4 white. Filters visible names client-side (D003); matching names highlighted, others dimmed (not drawn — orchestrator default: non-matching names at 25% opacity).
- Name cloud: recipient names, Bold, centred text, tracking .208, white; sizes by kudo count in 4 tiers (D001): ≈ 6.7px, 7.9px, 10.2px, 11.3px in the 1157 board (scale with the board; on fullscreen they grow). Figma highlights one name in `#F17676` (≈ the newest/hovered recipient) — use it for the name of the most recent live event for a few seconds (orchestrator default). Top 60 names; positions: deterministic pseudo-random layout seeded by user id so names don't jump between renders; avoid overlaps where cheap. Click name → `/profile/{id}` (phase 12 route; until it exists the link may 404 — acceptable, D004).
- Live ticker (bottom-left, left 48, 6 lines stacked upward ending at top 504, line height ≈19): "08:30PM" Bold 14/20 tracking .1 `#999` + " Nguyễn Bá Chức" Bold 16/24 white + " đã nhận được một Kudos mới" Bold 14/20 white. Newest at the bottom; older lines fade: opacity 100, 100, 70, 50, 30, 10 (bottom→top). Spec D006 says 5 lines → show 5 at 100/100/70/50/30 (drop the 10% one) — orchestrator default. Time in locale format (vi "20:30", en "8:30 PM"; Figma "08:30PM").
- Pan-zoom icon (bottom-right 1088/470, 30): toggles browser fullscreen of the board (D005), Esc exits.
