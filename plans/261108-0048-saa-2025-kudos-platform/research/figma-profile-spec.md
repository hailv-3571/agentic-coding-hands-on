# Figma — Profile pages + avatar hover card (phase 12 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C` — own profile 362:5037, other profile 362:5097, hover state 721:5827, hover card 2268:35101; orchestrator 2026-11-23. Screenshots in `research/figma-frames/profile-*`. Icons in `research/figma-assets/profile/` (`ic-button-down.svg` filter caret 24, `ic-pen-light.svg` 24); reuse existing `public/images/kudos-feed/ic-pen-light.svg` / `ic-chevron-down.svg` if identical.

Page background `#00101A`, Live board keyvisual on top (`LiveBoardKeyvisualBackground`), content column 680 centred (x=380 in 1440).

## Own profile `/profile` (362:5037)
1. Info block (centred, gap 32): avatar 200 circle (2px white border like other avatars; initial fallback) · name Bold 36/44 `#FFEA9E` · row (gap 10): department code Bold 22/28 white + 4px dot + Hero badge 109×19 (phase 09 `HeroBadgeTooltip`; dot only when a badge shows) · icon collection row: 6 circles 64 (gap 16) — phase 10 `IconCollection` (empty slot = `#323231` fill + 2px white border) · caption "Bộ sưu tập icon của tôi" Bold 22/28 white.
2. Stats panel (680 wide, p40, inner 600): phase 10 `PersonalStatsPanel` (same rows + "Mở Secret Box" button) — wrap in `<Suspense>` (it reads the URL query).
3. Kudos section: header (same section header component): "Sun* Annual Awards 2025" / divider / "KUDOS" Bold 57/64 `#FFEA9E` + filter button on the right: secondary button (bg `rgba(255,234,158,0.1)`, 1px `#998C5F`, rounded 4, px24 py16, Bold 16/24 white) "Đã gửi (5)" / "Đã nhận (n)" + caret 24 → dropdown with the two options (reuse the Live board filter dropdown style).
   - List: Kudo cards 680 (phase 05 `KudoCard`), gap 24; in "Đã gửi" the owner's spam kudos appear with the phase 08 spam overlay + orange tag (Figma shows "KUDO spam" cards first in that list).
4. Footer.

## Other profile `/profile/[userId]` (362:5097)
- Same info block, but the icon collection shows that user's icons (Figma draws 6 filled badges with labels 80×88–120 = owned) and the caption reads like "Bộ sưu tập icon của {tên}" (Figma text node 254 wide — orchestrator default: "Bộ sưu tập icon").
- Below: pill button (680×72, bg `rgba(255,234,158,0.1)`, 1px `#998C5F`, radius 68, px16 py24, gap 16): pen icon 24 + "Gửi lời cảm ơn và ghi nhận tới {fullName}" Bold 16/24 white → opens the Kudo composer with this recipient prefilled and locked (D008).
- No stats panel. Kudos header: "KUDOS" + right text "Đã nhận: 5 Kudos" Bold 24/32 white (no filter: other profiles show received kudos only).
- Visiting your own id → redirect to `/profile`.

## Avatar hover (721:5827) + hover card (2268:35101)
- Hover on a non-anonymous avatar on Kudo cards (and Spotlight? no — cards only, D005): avatar gains a 2px `#FFEA9E` border; after a short delay a card appears near it. Touch → navigate to the profile, no card (D007).
- Card: bg `#00070C`, rounded 16, p16, gap 16, width ≈ 344:
  - name Bold 22/28 `#FFEA9E`; "Tên đơn vị: {department full name}" Bold 14/20 `#999` (wraps, up to 3 lines); Hero badge (the larger tooltip-size badge 163.5×28.5 — reuse `HeroBadge` scaled).
  - divider `#2E3940`.
  - "Số Kudos nhận được: 25" and "Số Kudos đã gửi: 25": label Bold 16/24 white tracking .5 + value Bold 16/24 `#FFEA9E`.
  - Button full width: bg `#FFEA9E`, rounded 4, px16 py8, gap 8, pen icon (dark) + "Gửi KUDO" Bold 16/24 `#00101A` → composer prefilled with this person (hidden on your own card).
  - The name is a link to the profile.
