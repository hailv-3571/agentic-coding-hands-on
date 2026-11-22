# Figma — Awards portal (phase 07 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, `get_design_context` by the orchestrator on 2026-11-17. Values are [EXTRACTED]; use them verbatim. Decisions: `spec/decision-log.md` § "Session 2026-11-17 — Phase 07".

- Screenshots in `research/figma-frames/`:
  - `countdown-2268-35127.png`
  - `homepage-full-2167-9026.png`, `homepage-hero-2167-9031.png`, `homepage-theme-article-3204-10152.png`, `homepage-awards-grid-2167-9068.png`, `kudos-banner-3390-10349.png`
  - `awards-anchor-menu-313-8459.png`, `awards-block-top-talent-313-8467.png`, `awards-block-signature-313-8471.png`
  - `rules-panel-3204-6052.png`, `community-standards-1041-9038.png`
- Assets are ready in `public/images/awards-portal/` (converted to WebP by the orchestrator; sources in `research/figma-assets/awards-portal/`). Keep SVG root width/height.

  | File | Size (CSS px) | Use |
  |------|---------------|-----|
  | `countdown-keyvisual.webp` | 1512×1077 (1x) | Countdown background; the file is at full opacity, Figma draws it at **opacity 50%** (apply in CSS) |
  | `homepage-keyvisual.webp` | 1512×1392 | Homepage keyvisual (top, behind header) |
  | `awards-keyvisual.webp` | 1440×547 | Awards page keyvisual (top 80, under header) |
  | `root-further-logo.webp` | 451×200 (2x file) | "ROOT FURTHER" logo: Homepage hero 451×200, Awards KV 338×150, Standards KV 451×200 |
  | `award-<slug>.webp` | 336×336 (2x file) | Award thumbnail = background + name already composited. Slugs: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp` |
  | `kudos-banner-bg.webp` | 1120×500 (2x file) | Sun* Kudos banner background (already flipped/cropped, base `#0f0f0f`) |
  | `hero-tag-{new,rising,super,legend}.webp` | ≈126×22 (2x file) | Hero tier tags in Thể lệ |
  | `badge-<name>.webp` | 80 wide (2x file; heights 88/104/120 incl. label) | Secret Box icons **with label baked in**: `revival`, `touch-of-light`, `stay-gold`, `flow-to-horizon`, `beyond-the-boundary`, `root-further` |
  | `ic-arrow-up-right-dark.svg` / `-light.svg` | 24 | "↗" on yellow buttons (dark) / on dark buttons and "Chi tiết" links (light) |
  | `ic-target.svg` (24) / `ic-target-active.svg` (32×34, glow) | | Anchor menu + award block title icon |
  | `ic-diamond.svg`, `ic-license.svg` | 24 | "Số lượng giải thưởng" / "Giá trị giải thưởng" rows |
  | `ic-close.svg`, `ic-pen-dark.svg` | 24 | Thể lệ "Đóng" / "Viết KUDOS" |
- Kudos logo in the banner: reuse `public/images/kudos-feed/kudos-logo.png` (same "S KUDOS" mark, 593×104; Figma draws it ≈ 364×64 at left 672, top 215 inside the 1120×500 banner).
- Community standards keyvisual = the existing Live board keyvisual (`LiveBoardKeyvisualBackground`, 1440×512) — verified same image.
- Countdown font: DSEG7 Classic (OFL) at `features/awards-portal/fonts/DSEG7Classic-Regular.woff2` (+ `DSEG-LICENSE.txt`); load with `next/font/local` inside the countdown component only.

Colour tokens used (map to existing `app/globals.css` tokens — do not add duplicates): background `#00101A`, container-2 `#00070C`, text-primary-1 `#FFEA9E`, text-primary-2 `#00101A`, white, border `#998C5F`, divider `#2E3940`, secondary-button bg `rgba(255,234,158,0.1)`, gold shadow `0 4px 4px rgba(0,0,0,.25), 0 0 6px #FAE287`.

## Shared: countdown digit tile (component 186:2619)
- A tile per digit; each unit (DAYS/HOURS/MINUTES) shows **2 tiles** (days > 99 → show all digits, still ≥ 2).
- Tile: rounded, border `#FFEA9E`, background `linear-gradient(to bottom, #FFFFFF, rgba(255,255,255,0.1))` at **opacity 50%**, `backdrop-blur`. The digit sits on top at full opacity, white, DSEG7.
- Sizes:
  - **Homepage**: tile 51.2×81.92, radius 8, border 0.5px, blur 16.64; digit 49.152px; tile gap 14; tiles→label gap 14; unit gap 40; label "DAYS/HOURS/MINUTES" Montserrat Bold 24/32 white.
  - **Countdown page**: tile 76.8×122.88, radius 12, border 0.75px, blur 24.96; digit 73.728px; tile gap 21; tiles→label gap 21; unit gap 60; label Bold 36/48 white.
- Unit labels stay "DAYS", "HOURS", "MINUTES" in both languages (Figma text); put them in messages anyway.

## Countdown page `/countdown` (2268:35127)
- Full-screen `#00101A`. Background image `countdown-keyvisual.webp` covering the viewport at **opacity 50%**, plus a cover gradient on top: `linear-gradient(13.29deg, #00101A 15.48%, rgba(0,18,29,0.46) 52.13%, rgba(0,19,32,0) 63.41%)`.
- Centred column (gap 24): title "Sự kiện sẽ bắt đầu sau" Montserrat Bold 36/48 white centred, then the 3 units.
- In the 1512-wide frame the block starts at top 218 + py 96 ≈ visually centred; centre it vertically in the viewport.
- **No link to award info** (decision 2026-11-15). Uses the public layout (no app header); language switcher comes from the `(public)` layout.
- Mobile: units shrink to fit one row, no horizontal scroll (scale tiles down, e.g. homepage size or smaller).

## Homepage `/` (2167:9026, frame 1512 wide, content column 1224 at x=144)
Background `#00101A`. `homepage-keyvisual.webp` (1512×1392) at the top behind the header, then a "Cover" gradient 1512×1480 (same style as countdown cover: dark at bottom-left to transparent) so it fades into `#00101A`. Reuse the Live board keyvisual approach (`features/kudos-feed/components/live-board-keyvisual.tsx`) for layering.

Sections top→bottom (container starts at y=88 + py 96):
1. **Hero** (2167:9031, flex-col gap 40):
   - `root-further-logo.webp` 451×200.
   - Block (gap 16):
     - "Coming soon" / "Sắp diễn ra" (D006 fix of Figma "Comming soon"): Montserrat Bold 24/32 white. **Hidden once `EVENT_AT` passed** (D005).
     - Countdown (homepage size) to `EVENT_AT`; after it: 00 00 00, no ticking needed.
     - Event info (w 637, gap 8):
       - Row (gap 60): "Thời gian:" Bold 16/24 tracking .15 white + value Bold 24/32 `#FFEA9E` (gap ≈ 4, baseline aligned: label sits 6px lower); "Địa điểm:" + "Âu Cơ Art Center" same style.
       - Date value is formatted from `EVENT_AT` in `Asia/Ho_Chi_Minh` as `dd/MM/yyyy` (Figma "26/12/2025").
       - "Tường thuật trực tiếp qua sóng Livestream": Bold 16/24 tracking .5 white (text only, D008).
   - CTA row (gap 40):
     - "ABOUT AWARDS" → `/awards`: bg `#FFEA9E`, rounded 8, px24 py16, gap 8, text Bold 22/28 `#00101A`, `ic-arrow-up-right-dark.svg` 24.
     - "ABOUT KUDOS" → `/kudos`: bg `rgba(255,234,158,0.1)`, 1px border `#998C5F`, rounded 8, px24 py16, text Bold 22/28 white, `ic-arrow-up-right-light.svg` 24.
     - Labels stay English in vi (Figma); messages for both.
2. **Theme article** (3204:10152): container w1152 (x=180), px104 py120, gap 32, centred.
   - "ROOT / FURTHER" stacked wordmark ≈ 290×134 — use `root-further-logo.webp` at 290 wide (aspect kept, ≈ 290×129).
   - Body: Bold 24/32 white, justified, three paragraphs, then the quote block centred: line 1 Bold 24/32, line 2 Bold 20/32, then two more paragraphs (copy below). Paragraph gap: Figma uses 0 margin between paragraphs in a block and 32px between blocks.
3. **Awards section** (2167:9068, gap 80):
   - Header (gap 16): "Sun* annual awards 2025" Bold 24/32 white; 1px divider `#2E3940`; "Hệ thống giải thưởng" Bold 57/64 tracking −0.25 `#FFEA9E`. (Same header style as phase 05 Live board section headers — reuse if a component exists.)
   - Grid 3 columns, 336-wide cards, `justify-between` in 1224, row gap 80.
   - Card (gap 24): thumbnail 336×336 (`award-<slug>.webp`) with 0.955px border `#FFEA9E`, radius 24, **gold shadow** and `mix-blend-mode: screen`; text block (gap 4): name Regular 24/32 `#FFEA9E`; short description Regular 16/24 tracking .5 white; "Chi tiết" link: py16, gap 4, Medium 16/24 tracking .15 white + `ic-arrow-up-right-light.svg` → `/awards#<slug>`.
   - Mobile: 1 column (spec), tablet 2.
4. **Sun* Kudos banner** (3390:10349) — shared component, also used at the bottom of `/awards`:
   - 1120×500 (Homepage container 1224 centred; Awards 1152), rounded 16, `kudos-banner-bg.webp`.
   - Content at left 64, vertically centred (gap 32):
     - Text block (gap 16): "Phong trào ghi nhận" Bold 24/32 white; "Sun* Kudos" Bold 57/64 tracking −0.25 `#FFEA9E`; body w457, Bold 16/24 tracking .5 white justified: line "ĐIỂM MỚI CỦA SAA 2025" then the paragraph (copy below).
     - "Chi tiết" button → `/kudos`: bg `#FFEA9E`, rounded 4, p16, gap 8, Bold 16/24 `#00101A` + `ic-arrow-up-right-dark.svg`.
   - Kudos logo on the right half (see asset note). Mobile: stack, logo hidden or below text; no horizontal scroll.
5. Footer (shell). The floating widget button 5022:15169 is **out of scope** (decision 2026-11-17).

## Awards page `/awards` (313:8436, frame 1440, content 1152 at x=144)
- Keyvisual `awards-keyvisual.webp` 1440×547 at top 80 (under the header), cover gradient 1440×627 fading to `#00101A`.
- KV (y 96): `root-further-logo.webp` 338×150, left aligned.
- Title block (y 366, gap 16, **centred**): "Sun* Annual Awards 2025" Bold 24/32 white centred; divider; "Hệ thống giải thưởng SAA 2025" Bold 57/64 tracking −0.25 `#FFEA9E` centred.
- Body (y 615): two columns — anchor menu w178 (x 0) and award list w853 (x 299).
- **Anchor menu** (313:8459, flex-col gap 16, sticky on desktop):
  - Item: p16, gap 4, `ic-target.svg` 24 + label Bold 14/20 tracking .25 white. Multi-line labels: "Top Project / Leader", "Signature 2025 / Creator" (break as Figma, or let it wrap within ~146px).
  - Active item: label `#FFEA9E` with text-shadow `0 0 6px #FAE287, 0 4px 4px rgba(0,0,0,.25)`, `ic-target-active.svg` (glowing, 32×34 asset drawn in a 24 box with negative inset), and a 1px bottom border `#FFEA9E`.
  - Hover: same as active styling but no border (assumption, not drawn) — keep subtle.
  - Mobile (<md): horizontal scrollable chip bar at the top (D009).
- **Award block** (×6, gap 80 between blocks; each ends with a 1px `#2E3940` divider w853 except the last):
  - Row gap 40: thumbnail 336×336 (same styling as the homepage card) + content w480.
  - **Alternating sides**: Top Talent, Top Project Leader, Signature = image left; Top Project, Best Manager, MVP = image right. Mobile: image on top, full width (max 336).
  - Content (flex-col gap 32, `backdrop-blur 32`, radius 16):
    - Title row (gap 16): `ic-target.svg` 24 + name Bold 24/32 `#FFEA9E`.
    - Long description (gap 24 below title): Bold 16/24 tracking .5 white, justified; may contain paragraph breaks (copy below).
    - Divider 1px `#2E3940`.
    - Quantity row (gap 16): `ic-diamond.svg` + "Số lượng giải thưởng:" Bold 24/32 `#FFEA9E` + number Bold 36/44 white (2 digits "10", "02", "03", "01") + unit Bold 14/20 tracking .1 white in a 60-wide column (wraps: "Cá nhân", "Tập thể", "Cá nhân hoặc tập thể").
    - Divider.
    - Value block (gap 16): `ic-license.svg` + "Giá trị giải thưởng:" Bold 24/32 `#FFEA9E`; amount Bold 36/44 white "7.000.000 VNĐ"; optional note Bold 14/20 tracking .1 white ("cho mỗi giải thưởng" / "cho giải cá nhân" / "cho giải tập thể"). **Best Manager and MVP have no note.**
    - Signature only: after the first value block, a row "Hoặc" Bold 14/20 tracking .1 colour `#2E3940` + a 1px line `#2E3940` filling the rest (gap 8), then the second value block.
  - `id=<slug>` on each block for the anchor; scroll-margin so the sticky header does not cover the title.
- Kudos banner at the bottom (y 5568), same component as Homepage.

### Award data (BR-003 — one module)
| slug | name | quantity | unit | values (VNĐ) | value note |
|------|------|----------|------|--------------|------------|
| top-talent | Top Talent | 10 | Cá nhân | 7.000.000 | cho mỗi giải thưởng |
| top-project | Top Project | 02 | Tập thể | 15.000.000 | cho mỗi giải thưởng |
| top-project-leader | Top Project Leader | 03 | Cá nhân | 7.000.000 | cho mỗi giải thưởng |
| best-manager | Best Manager | 01 | Cá nhân | 10.000.000 | — |
| signature-2025-creator | Signature 2025 - Creator | 01 | Cá nhân hoặc tập thể | 5.000.000 / 8.000.000 | cho giải cá nhân / cho giải tập thể |
| mvp | MVP (Most Valuable Person) | 01 | Cá nhân | 15.000.000 | — |

Quantity shows 2 digits (`padStart(2,'0')`). Amount formatted `Intl.NumberFormat('vi-VN')` + " VNĐ" (keep "VNĐ" in en too).

## Thể lệ `/rules` (3204:6051 → panel 3204:6052; decision 2026-11-17: page drawn as the panel)
- Page: dimmed keyvisual background (like `/kudos/[id]`), the panel **553 wide, aligned right**, full viewport height on desktop, scrollable content; mobile: full width.
- Panel: bg `#00070C`, pt24 px40 pb40, flex-col justify-between.
- Content (gap 24):
  - "Thể lệ" Bold 45/52 `#FFEA9E` (page `<h1>`).
  - Section (gap 16):
    - "NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC" Bold 22/28 `#FFEA9E`.
    - Intro Bold 16/24 tracking .5 white justified.
    - 4 tier rows (each: left padding 20; first line = hero tag image ≈126×22 + gap 8 + "Có 1-4 người gửi Kudos cho bạn" Bold 16/24 tracking .5 white; second line (top 28) description Bold 14/20 tracking .1 white justified, w ≈ 450).
  - "NGƯỜI GỬI KUDOS: " Bold 24/32 + "SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN" Bold 22/28, both `#FFEA9E`.
  - Paragraph Bold 16/24 tracking .5 white justified (contains "❤️" emoji as text).
  - Badge grid: px48 (24+24), 2 rows × 3, `justify-between`, row gap 16; each badge image 80 wide (labels baked in; alt = badge name).
  - "Những Sunner thu thập trọn bộ 6 icon sẽ nhận về một phần quà bí ẩn từ SAA 2025." Bold 16/24.
  - "KUDOS QUỐC DÂN" Bold 24/32 `#FFEA9E`.
  - Paragraph Bold 16/24 (contains "❤️").
- Button row (gap 16) at the bottom:
  - "Đóng": bg `rgba(255,234,158,0.1)`, 1px `#998C5F`, rounded 4, p16, gap 8, `ic-close.svg` + Bold 16/24 tracking .5 white → back (`router.back()` if same-origin history, else `/`).
  - "Viết KUDOS": flex-1, bg `#FFEA9E`, rounded 4, p16, gap 8, `ic-pen-dark.svg` + Bold 16/24 tracking .5 `#00101A` → `/kudos` (link).

## Tiêu chuẩn cộng đồng `/community-standards` (1161:8944)
- Live board keyvisual at the top, cover gradient; KV: `root-further-logo.webp` 451×200 (x 144, y 96 after header offset 88).
- Content (y 416, w 1152, p16, gap 32):
  - "Tiêu chuẩn cộng đồng" Bold 45/52 `#FFEA9E` (`<h1>`).
  - Lead paragraph Bold 16/24 tracking .15 `#FFEA9E`.
  - Paragraph Bold 16/24 white, blank line, then **ordered list 1–10**, items Bold 16/30 tracking .15 white.
  - Divider 1px `#2E3940`.
  - "Tiêu chuẩn bảo mật" Bold 45/52 `#FFEA9E` (`<h2>`).
  - Paragraph Bold 16/24 white, **bulleted list** (2 items, Bold 16/30).
  - Contact line Bold 16/24 tracking .15 `#FFEA9E`.

## Verbatim Vietnamese copy (English = temporary translation by us, D007)

### Homepage theme article (3204:10156 / 10161 / 10162)
Block 1:
1. Đứng trước bối cảnh thay đổi như vũ bão của thời đại AI và yêu cầu ngày càng cao từ khách hàng, Sun* lựa chọn chiến lược đa dạng hóa năng lực để không chỉ nỗ lực trở thành tinh anh trong lĩnh vực của mình, mà còn hướng đến một cái đích cao hơn, nơi mọi Sunner đều là “problem-solver” - chuyên gia trong việc giải quyết mọi vấn đề, tìm lời giải cho mọi bài toán của dự án, khách hàng và xã hội.
2. Lấy cảm hứng từ sự đa dạng năng lực, khả năng phát triển linh hoạt cùng tinh thần đào sâu để bứt phá trong kỷ nguyên AI, “Root Further” đã được chọn để trở thành chủ đề chính thức của Lễ trao giải Sun* Annual Awards 2025.
3. Vượt ra khỏi nét nghĩa bề mặt, “Root Further” chính là hành trình chúng ta không ngừng vươn xa hơn, cắm rễ mạnh hơn, chạm đến những tầng “địa chất” ẩn sâu để tiếp tục tồn tại, vươn lên và nuôi dưỡng đam mê kiến tạo giá trị luôn cháy bỏng của người Sun*. Mượn hình ảnh bộ rễ liên tục đâm sâu vào lòng đất, mạnh mẽ len lỏi qua từng lớp “trầm tích” để thẩm thấu những gì tinh tuý nhất, người Sun* cũng đang “hấp thụ” dưỡng chất từ thời đại và những thử thách của thị trường để làm mới mình mỗi ngày, mở rộng năng lực và mạnh mẽ “bén rễ” vào kỷ nguyên AI - một tầng “địa chất” hoàn toàn mới, phức tạp và khó đoán, nhưng cũng hội tụ vô vàn tiềm năng cùng cơ hội.

Quote (centred): “A tree with deep roots fears no storm” (24/32) — (Cây sâu bén rễ, bão giông chẳng nề - Ngạn ngữ Anh) (20/32)

Block 2:
1. Trước giông bão, chỉ những tán cây có bộ rễ đủ mạnh mới có thể trụ vững. Một tổ chức với những cá nhân tự tin vào năng lực đa dạng, sẵn sàng kiến tạo và đón nhận thử thách, làm chủ sự thay đổi là tổ chức không chỉ vững vàng trước biến động, mà còn khai thác được mọi lợi thế, chinh phục các thách thức của thời cuộc. Không đơn thuần là tên gọi của chương mới trên hành trình phát triển tổ chức, “Root Further” còn như một lời cổ vũ, động viên mỗi chúng ta hãy dám tin vào bản thân, dám đào sâu, khai mở mọi tiềm năng, dám phá bỏ giới hạn, dám trở thành phiên bản đa nhiệm và xuất sắc nhất của mình. Bởi trong thời đại AI, đa dạng năng lực và tận dụng sức mạnh thời cuộc chính là điều kiện tiên quyết để trường tồn.
2. Không ai biết trước ẩn sâu trong “lòng đất” của ngành công nghệ và thị trường hiện đại còn biết bao tầng “địa chất” bí ẩn. Chỉ biết rằng khi “Root Further” đã trở thành tinh thần cội rễ, chúng ta sẽ không sợ hãi, mà càng thấy háo hức trước bất cứ vùng vô định nào trên hành trình tiến về phía trước. Vì ta luôn tin rằng, trong chính những miền vô tận đó, là bao điều kỳ diệu và cơ hội vươn mình đang chờ ta.

### Award short descriptions (Homepage cards, verbatim incl. Figma duplicates and trailing comma)
- top-talent: Vinh danh top cá nhân xuất sắc trên mọi phương diện
- top-project: Vinh danh dự án xuất sắc trên mọi phương diện, dự án có doanh thu nổi bật
- top-project-leader: Vinh danh người quản lý truyền cảm hứng và dẫn dắt dự án bứt phá,
- best-manager: Vinh danh người quản lý có năng lực quản lý tốt, dẫn dắt đội nhóm
- signature-2025-creator: Vinh danh người quản lý có năng lực quản lý tốt, dẫn dắt đội nhóm
- mvp: Vinh danh người quản lý có năng lực quản lý tốt, dẫn dắt đội nhóm
(Drop the trailing comma on top-project-leader — obvious Figma typo. Keep the rest verbatim; BTC fixes via JSON.)

### Award long descriptions (Awards page)
- top-talent: Giải thưởng Top Talent vinh danh những cá nhân xuất sắc toàn diện – những người không ngừng khẳng định năng lực chuyên môn vững vàng, hiệu suất công việc vượt trội, luôn mang lại giá trị vượt kỳ vọng, được đánh giá cao bởi khách hàng và đồng đội. Với tinh thần sẵn sàng nhận mọi nhiệm vụ tổ chức giao phó, họ luôn là nguồn cảm hứng, thúc đẩy động lực và tạo ảnh hưởng tích cực đến cả tập thể.
- top-project: Giải thưởng Top Project vinh danh các tập thể dự án xuất sắc với kết quả kinh doanh vượt kỳ vọng, hiệu quả vận hành tối ưu và tinh thần làm việc tận tâm. Đây là các dự án có độ phức tạp kỹ thuật cao, hiệu quả tối ưu hóa nguồn lực và chi phí tốt, đề xuất các ý tưởng có giá trị cho khách hàng, đem lại lợi nhuận vượt trội và nhận được phản hồi tích cực từ khách hàng. Các thành viên tuân thủ nghiêm ngặt các tiêu chuẩn phát triển nội bộ trong phát triển dự án, tạo nên một hình mẫu về sự xuất sắc và chuyên nghiệp.
- top-project-leader: Giải thưởng Top Project Leader vinh danh những nhà quản lý dự án xuất sắc – những người hội tụ năng lực quản lý vững vàng, khả năng truyền cảm hứng mạnh mẽ, và tư duy “Aim High – Be Agile” trong mọi bài toán và bối cảnh. Dưới sự dẫn dắt của họ, các thành viên không chỉ cùng nhau vượt qua thử thách và đạt được mục tiêu đề ra, mà còn giữ vững ngọn lửa nhiệt huyết, tinh thần Wasshoi, và trưởng thành để trở thành phiên bản tinh hoa – hạnh phúc hơn của chính mình.
- best-manager: Giải thưởng Best Manager vinh danh những nhà lãnh đạo tiêu biểu – người đã dẫn dắt đội ngũ của mình tạo ra kết quả vượt kỳ vọng, tác động nổi bật đến hiệu quả kinh doanh và sự phát triển bền vững của tổ chức. Dưới sự lãnh đạo của họ, đội ngũ luôn chinh phục và làm chủ mọi mục tiêu bằng năng lực đa nhiệm, khả năng phối hợp hiệu quả, và tư duy ứng dụng công nghệ linh hoạt trong kỷ nguyên số. Họ truyền cảm hứng để tập thể trở nên tự tin tràn đầy năng lượng, sẵn sàng đón nhận, thậm chí dẫn dắt tạo ra những thay đổi có tính cách mạng.
- signature-2025-creator (2 paragraphs, blank line between):
  1. Giải thưởng Signature vinh danh cá nhân hoặc tập thể thể hiện tinh thần đặc trưng mà Sun* hướng tới trong từng thời kỳ.
  2. Trong năm 2025, giải thưởng Signature vinh danh Creator - cá nhân/tập thể mang tư duy chủ động và nhạy bén, luôn nhìn thấy cơ hội trong thách thức và tiên phong trong hành động. Họ là những người nhạy bén với vấn đề, nhanh chóng nhận diện và đưa ra những giải pháp thực tiễn, mang lại giá trị rõ rệt cho dự án, khách hàng hoặc tổ chức. Với tư duy kiến tạo và tinh thần “Creator” đặc trưng của Sun*, họ không chỉ phản ứng tích cực trước sự thay đổi mà còn chủ động tạo ra cải tiến, góp phần định hình chuẩn mực mới cho cách mà người Sun* tạo giá trị.
- mvp (line break after 1, blank line after 2, line break after 3):
  1. Giải thưởng MVP vinh danh cá nhân xuất sắc nhất năm – gương mặt tiêu biểu đại diện cho toàn bộ tập thể Sun*.
  2. Họ là người đã thể hiện năng lực vượt trội, tinh thần cống hiến bền bỉ, và tầm ảnh hưởng sâu rộng, để lại dấu ấn mạnh mẽ trong hành trình của Sun* suốt năm qua.
  3. Không chỉ nổi bật bởi hiệu suất và kết quả công việc, họ còn là nguồn cảm hứng lan tỏa – thông qua suy nghĩ, hành động và ảnh hưởng tích cực của mình đối với tập thể.
  4. MVP là người hội tụ đầy đủ phẩm chất của người Sun* ưu tú, đồng thời mang trên mình trọng trách lớn lao: trở thành hình mẫu đại diện cho con người và tinh thần Sun*, góp phần dẫn dắt tập thể vươn tới những đỉnh cao mới.

### Kudos banner
- Phong trào ghi nhận · Sun* Kudos · ĐIỂM MỚI CỦA SAA 2025
- Hoạt động ghi nhận và cảm ơn đồng nghiệp - lần đầu tiên được diễn ra dành cho tất cả Sunner. Hoạt động sẽ được triển khai vào tháng 11/2025, khuyến khích người Sun* chia sẻ những lời ghi nhận, cảm ơn đồng nghiệp trên hệ thống do BTC công bố. Đây sẽ là chất liệu để Hội đồng Heads tham khảo trong quá trình lựa chọn người đạt giải.
- Button: Chi tiết

### Thể lệ
- Thể lệ
- NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC
- Dựa trên số lượng đồng đội gửi trao Kudos, bạn sẽ sở hữu Huy hiệu Hero tương ứng, được hiển thị trực tiếp cạnh tên profile
- New Hero — Có 1-4 người gửi Kudos cho bạn — Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu tiên đã tìm đến bạn.
- Rising Hero — Có 5-9 người gửi Kudos cho bạn — Hình ảnh bạn đang lớn dần trong trái tim đồng đội bằng sự tử tế và cống hiến của mình.
- Super Hero — Có 10–20 người gửi Kudos cho bạn — Bạn đã trở thành biểu tượng được tin tưởng và yêu quý, người luôn sẵn sàng hỗ trợ và được nhiều đồng đội nhớ đến.
- Legend Hero — Có hơn 20 người gửi Kudos cho bạn — Bạn đã trở thành huyền thoại – người để lại dấu ấn khó quên trong tập thể bằng trái tim và hành động của mình.
- NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN
- Mỗi lời Kudos bạn gửi sẽ được đăng tải trên hệ thống và nhận về những lượt ❤️ từ cộng đồng Sunner. Cứ mỗi 5 lượt ❤️, bạn sẽ được mở 1 Secret Box, với cơ hội nhận về một trong 6 icon độc quyền của SAA.
- Badges: REVIVAL, TOUCH OF LIGHT, STAY GOLD, FLOW TO HORIZON, BEYOND THE BOUNDARY, ROOT FURTHER
- Những Sunner thu thập trọn bộ 6 icon sẽ nhận về một phần quà bí ẩn từ SAA 2025.
- KUDOS QUỐC DÂN
- 5 Kudos nhận về nhiều ❤️ nhất toàn Sun* sẽ chính thức trở thành Kudos Quốc Dân và được trao phần quà đặc biệt từ SAA 2025: Root Further.
- Buttons: Đóng · Viết KUDOS

### Tiêu chuẩn cộng đồng
- Tiêu chuẩn cộng đồng
- Lead: Tiêu chuẩn Cộng đồng (Community Standards) được xây dựng nhằm đảm bảo một môi trường văn minh, an toàn và tích cực cho tất cả thành viên tham gia phong trào ghi nhận, cảm ơn Sun* Kudos.
- Các nội dung phát hiện có một trong những tiêu chí vi phạm bên dưới sẽ được gắn nhãn Spam và được hệ thống chủ động ẩn.
- Ordered list:
  1. Sử dụng từ ngữ thô tục, chửi bậy, hay có nội dung xúc phạm, bôi nhọ.
  2. Đề cập đến các vấn đề chính trị, tôn giáo, phân biệt giới tính.
  3. Chứa số liệu cụ thể (doanh thu, hợp đồng, KPI, khách hàng, mã dự án, số tài khoản…).
  4. Đề cập tên đối tác, khách hàng, tổ chức bên ngoài.
  5. Chứa thông tin cá nhân (email, số điện thoại, địa chỉ, thông tin gia đình).
  6. Gửi lặp lại 3+ tin nhắn có nội dung tương tự nhau trong thời gian ngắn.
  7. Nội dung Kudos quá ngắn (dưới 30 kí tự), không có ngữ cảnh (“Cảm ơn nhiều”, “Thanks nhé”, “Good job!”).
  8. Gửi cho quá nhiều người/nhóm người trong thời gian ngắn (<3s/lời nhắn).
  9. Ngôn từ spam (chỉ chứa ký tự như ".", ",", "...", hay ký tự không có nội dung).
  10. Mức độ “tim” tăng đột biến bất thường (theo hành vi người dùng trung bình).
- Tiêu chuẩn bảo mật
- Sunner cam kết bảo vệ thông tin. Mọi thành viên có trách nhiệm bảo mật nội dung chia sẻ trên hệ thống.
- Bullets:
  - Bảo mật Thông tin: Toàn bộ thông tin Sunner chia sẻ sẽ được bảo mật trên hệ thống.
  - Phạm vi Chia sẻ: Toàn bộ thông tin nhân sự và dự án trong hệ thống được bảo mật. Sunner vui lòng chỉ chia sẻ trong nội bộ Sun*.
- Liên hệ Hỗ trợ: Mọi thắc mắc, Sunner vui lòng liên hệ đại diện BTC SAA: Slack duong.thi.thuy.an để được hỗ trợ.

### Countdown
- Sự kiện sẽ bắt đầu sau · DAYS · HOURS · MINUTES
