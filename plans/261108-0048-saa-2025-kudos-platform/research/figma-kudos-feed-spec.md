# Figma — Live board feed & Kudo detail (phase 05 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`. The orchestrator ran `get_design_context` on 2026-11-16. Values are [EXTRACTED]; use them verbatim.

- Screenshots are in `research/figma-frames/`:
  - `kudos-live-board-2940-13431.png` (full page, scaled)
  - `kudos-live-board-top-2940-13435.png`
  - `kudo-post-card-3127-21871.png`
  - `kudo-post-anonymous-2099-9148.png`
  - `kudo-highlight-card-2940-13465.png`
  - `kudo-detail-520-18779.png`
  - `dropdown-hashtag-filter-721-5580.png`
  - `dropdown-department-filter-721-5684.png`
- Assets are in `research/figma-assets/kudos-feed/`. Copy what you use into `public/images/kudos-feed/`, and keep each SVG's root width/height.
  - Icons:
    - `ic-send.svg`: arrow between sender and recipient, 32px
    - `ic-heart.svg`: 32px
    - `ic-link.svg`: Copy Link, 24px
    - `ic-arrow-up-right.svg`: Xem chi tiết, 24px
    - `ic-pen-dark.svg`: owner edit, 32px
    - `ic-pen-light.svg`: launcher pill, 24px
    - `ic-search.svg`: 24px
    - `ic-chevron-down.svg`: filter buttons, 24px
    - `ic-carousel-left.svg` / `ic-carousel-right.svg`: carousel buttons, 80px button with 60px glyph
    - `ic-pager-left.svg` / `ic-pager-right.svg`: pager buttons, 48px
    - `ic-dot.svg`: 4px separator dot
  - `avatar-anonymous.png`: incognito avatar, 128px source rendered at 64px.
  - `kudos-logo.png`: the "KUDOS" logo, 593×104, exported as one image. `kudos-logo-part-*.svg` are its vector pieces. Prefer the PNG, because the wordmark uses the SVN-Gotham font, which the project does not have.
  - `keyvisual-export.png`: the page keyvisual, 1440×512. It sits behind the header and the top of the page and fades into `#00101A`.
  - `keyvisual-raw-2.png`: a small raw fill. It is probably not needed.

## Page `/kudos` (Live board, frame 2940:13431, 1440 wide, content column 1152 = px 144)
Page background: `#00101A`. The keyvisual is at the top, under the header.

The sections below run top to bottom, with a 64px gap between them.

1. **KV block** (h160):
   - "Hệ thống ghi nhận và cảm ơn": Bold 36/44, `#FFEA9E`.
   - Below it, the KUDOS logo image, 593×104, gap 10.
2. **Action row** (h72):
   - Launcher pill:
     - Size w738 h72, rounded 68.
     - bg `rgba(255,234,158,0.1)`, 1px border `#998C5F`, px16.
     - Contents: ic-pen-light 24 + gap16 + text "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" (Bold 16/24, white, tracking .15).
     - This is the phase 04 composer launcher, moved here.
   - At x=914 (gap 32), the search pill:
     - Size w381, same style.
     - Contents: ic-search + "Tìm kiếm profile Sunner".
3. **Highlight section** (gap 40 inside):
   - Header block (h129, gap 16):
     - "Sun* Annual Awards 2025": Bold 24/32, white.
     - Divider: 1px `#2E3940`.
     - A row with justify-between:
       - "HIGHLIGHT KUDOS": Bold 57/64, tracking −0.25, `#FFEA9E`.
       - Two filter buttons, gap 8:
         - "Hashtag" and "Phòng ban".
         - Each: p16, rounded 4, bg `rgba(255,234,158,0.1)`, border `#998C5F`, text Bold 16/24 white, then ic-chevron-down 24, gap 8.
   - Carousel (full 1440 width, h525):
     - Track: 528-wide highlight cards, gap 24. The active card is centred, with neighbours on each side.
     - Side fades are 400 wide: a linear-gradient from `#00101A` at 50% to transparent.
     - Prev/next buttons are 80×80, at x=80 on the left fade and x=1220 on the right.
   - Pager (h52, centred, gap 32):
     - Pager buttons are 48px.
     - Text "2" Bold 45/52 `#FFEA9E` + "/5" Bold 28/36 `#999`.
4. **Spotlight Board** (phase 11 slot):
   - Header block in the same style: "SPOTLIGHT BOARD".
   - In phase 05, render nothing; the slot returns null. Do NOT render the header without content.
5. **All Kudos**:
   - Header block in the same style: "ALL KUDOS", Bold 57/64.
   - Below it, two columns, gap 50:
     - Feed column: w680, cards gap 24.
     - Right column: w422, the phase 10 slot (stats + Secret Box + 10 Sunner nhận quà). It returns null in phase 05, but keep the 680 feed width and left alignment.
6. **Footer** (existing shell footer).

## Kudo post card (feed, 3127:21871; anonymous variant 2099:9148)
- **Container:**
  - Size w680, rounded 24, bg `#FFF8E1`.
  - Padding: pt40, px40, pb16. Vertical gap 16.
- **Info row** (justify-between, items-start). Sender column | send icon (py16, 32px) | recipient column.
  - Each column: flex-col, centred, gap 13.
  - Avatar: 64px, circular image.
  - Text block: w235, gap 2.
    - Name: Bold 16/24, tracking .15, `#00101A`, centred.
    - Below the name, a row (gap 10, centred):
      - department code: Bold 14/20, tracking .1, `#999`;
      - ic-dot 4px;
      - Hero badge 109×19, which is the phase 09 seam: render nothing in phase 05 and hide the dot too.
  - Name and avatar link to `/profile/{id}`. The anonymous sender gets no link.
- **Anonymous sender** (decision-log: show the nickname):
  - Avatar: `avatar-anonymous.png`.
  - Name line: the **anonymous nickname**, Bold **22/28**, `#00101A`.
  - Subtitle: "Người gửi ẩn danh", Bold 14/20, `#999`.
- **Divider:** 1px `#FFEA9E`.
- **Content** (gap 16):
  - Time "10:00 - 10/30/2025": Bold 16/24, tracking .5, `#999`.
  - Title row:
    - Kudo title (Danh hiệu): uppercase as shown, Bold 16/24, tracking .5, `#00101A`, centred, full width. Hide the row if there is no title, unless the owner pen must show.
    - The owner's edit pen (ic-pen-dark 32) sits at the right end of this row.
  - Body box:
    - bg `rgba(255,234,158,0.4)`, 1px border `#FFEA9E`, rounded 12, px24 py16.
    - Text Bold 20/32, `#00101A`, justified.
    - Fixed height 160 with clamp and ellipsis. On the anonymous frame the text is 24/32; use 20/32 everywhere on cards.
  - Images: 88×88 thumbnails, gap 16, white bg, border `#998C5F`, rounded 18. The inner image has a 1px border `#FFEA9E` and rounded 4. Up to 5.
  - Hashtags: Bold 16/24, tracking .5, `#D4271D`, "#Name" joined by spaces. Max 2 lines with ellipsis.
- **Divider:** 1px `#FFEA9E`.
- **Action row** (justify-between):
  - Left: hearts. Count Bold 24/32 `#00101A` (thousands separator "1.000" in vi) + ic-heart 32, gap 4. This is the phase 06 seam: a read-only count.
  - Right, buttons with p16, rounded 4, text Bold 16/24 `#00101A`, icon 24, gap 4:
    - "Copy Link" + ic-link;
    - per the spec, also "Xem chi tiết" + ic-arrow-up-right (the post card frame shows only Copy Link; the highlight card shows both).

## Highlight card (2940:13465)
The highlight card is the same anatomy at a smaller size:
- Size w528, rounded 16, **border 4px `#FFEA9E`**, bg `#FFF8E1`.
- Padding: pt24, px24, pb16.
- Body box: fixed h120, clamped.
- Hashtags: one line with ellipsis.
- Actions: hearts | Copy Link + Xem chi tiết.
- The non-active neighbour cards sit under the gradient fade.

## Filter dropdowns (721:5580 hashtag, 721:5684 department)
- **List:**
  - bg `#00070C`, 1px border `#998C5F`, rounded 8, p6, flex-col.
  - Scroll when tall; the department list is about 50 items.
- **Item:**
  - p16, rounded 4, text Bold 16/24 white, tracking .5.
  - The selected or hovered item gets bg `rgba(255,234,158,0.1)` and a text-shadow `0 0 6px #FAE287, 0 4px 4px rgba(0,0,0,.25)`.
- Hashtag items show "#Name"; department items show the code (CEVC2…).
- Add a first item "Tất cả" (spec default) to clear the filter. When a filter is active, the button label shows the selected value.

## Detail `/kudos/[id]` (View Kudo, 520:18779)
Figma draws the detail as a centred panel over the dimmed Live board:
- mask `rgba(0,16,26,0.8)`;
- panel w680, rounded 24, bg `#FFF8E1`, pt40, px40, pb24, gap 16.

Implement it as a real page at the fixed URL (D004) with that look: the keyvisual background, dimmed, and the centred panel.

Panel content, top to bottom:
1. Divider.
2. Info row, same as the card.
3. Time.
4. Title: centred, Bold 16/24.
5. Full body box: bg and border as on the card; text **Bold 24/32**, justified, no clamp.
6. All images at 88px, each opening the full image.
7. All hashtags (no clamp).
8. Divider.
9. Action row:
   - Left: hearts, gap 8.
   - Right: "Copy Link" + ic-link, then **"Đóng"**, text-only, which navigates back to `/kudos`.
   - Own-spam view: show the spam tag and the "edit locked" note per the phase file.
