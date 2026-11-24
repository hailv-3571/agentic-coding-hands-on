---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR008_AwardsSystem — Screen Spec

**Screen**: SCR008_AwardsSystem: AwardsSystem
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /awards
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner xem hệ thống sáu giải thưởng của Sun* Annual Awards 2025 (mô tả, số lượng, giá trị) và nhảy nhanh tới từng giải bằng menu neo, khi vào mục Award Information hoặc bấm một thẻ giải ở trang chủ.
**Actors:** Sunner (người đã đăng nhập, có phòng ban); admin (vào được trước giờ mở hệ thống).
**Entry Conditions:** Đã đăng nhập và đã có phòng ban; trước `LAUNCH_AT` thì phải là admin (cổng prelaunch).
**Exit Conditions:** Sunner bấm nút trong banner Sun* Kudos để sang Live board, hoặc rời đi bằng header và footer.

## 2. Screen Layout

### Layout Sketch

Một `<main>` chạy dưới header (`pt-4`), keyvisual giải thưởng ở đầu trang mờ dần vào nền. Cột nội dung rộng tối đa theo `portalColumn`: logo ROOT FURTHER và tiêu đề `<h1>` căn giữa ở trên; ở giữa là lưới hai cột từ `md` (menu neo 178 px bên trái, sáu khối giải bên phải, 853 px từ `xl`), mỗi khối gồm ảnh 336 px xen kẽ trái và phải cạnh nội dung 480 px; cuối trang là banner Sun* Kudos. Dưới `md` menu neo thành thanh chip ngang dính dưới header. (`app/(app)/awards/page.tsx:32-69`)

```
┌─────────────────────────────────────────────────┐
│ R1: Keyvisual giải thưởng (absolute, nền)       │
│   R2: Logo ROOT FURTHER + tiêu đề h1 (static)   │
├────────────┬────────────────────────────────────┤
│ R3: Menu   │ R4: 6 khối giải (static)           │
│ neo 178    │  [ảnh 336][tên · mô tả · số lượng  │
│ (sticky)   │   · giá trị] ... xen kẽ trái/phải  │
├────────────┴────────────────────────────────────┤
│ R5: Banner Sun* Kudos (static)                  │
└─────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Nền keyvisual | static | no | PortalKeyvisualBackground |
| R2 | Logo và tiêu đề | static | no | Image (ROOT FURTHER), PortalSectionHeader (`h1`) |
| R3 | Menu neo | sticky | yes | AwardsAnchorMenu |
| R4 | Khối giải thưởng | static | yes | AwardDetailBlock x6, AwardThumbnail, AwardPrizeFacts |
| R5 | Banner Sun* Kudos | static | no | KudosBanner |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Root Further (logo) | image | — | Visible | Always | — | static | 338×150 (225 trên điện thoại) | — | N/A |
| E02 | Sun* Annual Awards 2025 | display field | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Hệ thống giải thưởng SAA 2025 | region label | — | Visible | Always | — | static | `<h1>` căn giữa | — | N/A |
| E04 | Danh sách giải thưởng (menu neo, 6 mục) | link | — | Mục đầu được đánh dấu | Always | Cuộn tới khối giải tương ứng | static | nhãn ngắn của từng giải | — | N/A |
| E05 | Ảnh giải thưởng | image | — | Visible | Always | — | static | 336×336, xen kẽ trái và phải | — | N/A |
| E06 | Tên giải | display field | — | Visible | Always | — | static | `<h2>` vàng | — | N/A |
| E07 | Mô tả giải | display field | — | Visible | Always | — | static | canh đều, giữ xuống dòng trong thông điệp | — | N/A |
| E08 | Số lượng giải thưởng | display field | — | Visible | Always | — | static | 2 chữ số tối thiểu ("02") kèm đơn vị Cá nhân, Tập thể hoặc Cá nhân hoặc tập thể | — | N/A |
| E09 | Giá trị giải thưởng | display field | — | Visible | Always | — | static | `7.000.000 VNĐ` (nhóm số kiểu Việt, mọi ngôn ngữ), kèm ghi chú "cho mỗi giải thưởng" hoặc "cho giải cá nhân/tập thể" | — | N/A |
| E10 | Sun* Kudos (banner: caption, tiêu đề, giới thiệu) | display field | — | Visible | Always | — | static | raw | — | N/A |
| E11 | Chi tiết (về Sun* Kudos) | link | — | Enabled | Always | Về Live board | static | — | — | N/A |

Ghi chú: sáu giải theo thứ tự Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP; E05 đến E09 lặp cho từng giải (`{award_1..6}`). Signature có hai mức giá trị ngăn bằng chữ "Hoặc" (5.000.000 cho giải cá nhân, 8.000.000 cho giải tập thể). Số liệu cố định nằm trong module giải, nội dung chữ nằm trong messages (`messages/vi.json:448-485`).

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Cuộn tới khối giải | E04 | click một mục menu | Click trái không kèm phím bổ trợ | Trang cuộn mượt (tức thì nếu bật giảm chuyển động) tới khối giải, focus vào khối, hash `#slug` được ghi vào URL, mục menu thành đang đọc | `features/awards-portal/components/awards-anchor-menu.tsx:71-80` |
| Về Live board | E11 | click | — | Rời màn hình (xem § 8) | `features/awards-portal/components/kudos-banner.tsx:38-42` |

### Happy Path

1. Sunner mở `/awards`; keyvisual, logo và tiêu đề hiện ở R2.
2. Sunner cuộn qua R4; mục menu ở R3 tự đổi theo khối đang đọc.
3. Sunner bấm một mục ở R3: trang cuộn tới khối giải và đưa focus vào khối.
4. Sunner đọc mô tả, số lượng và giá trị rồi xuống banner R5.
5. Sunner bấm "Chi tiết" ở banner để sang Live board.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở bằng `/awards#<slug>` | Hash khớp id của một khối giải | Trình duyệt cuộn thẳng tới khối đó (các id là `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`) | `features/awards-portal/components/award-detail-block.tsx:26-31` |
| Mở bằng hash lạ | Hash không khớp id nào | Trang đứng ở đầu, không báo lỗi | `app/(app)/awards/page.tsx:21-26` |
| Click menu kèm Ctrl, Cmd, Shift, Alt hoặc chuột khác trái | Có phím bổ trợ | Giữ hành vi mặc định của link (mở tab mới), không chặn | `features/awards-portal/components/awards-anchor-menu.tsx:72` |
| Cuộn trang | Khối nào có đỉnh đã qua 25% chiều cao khung nhìn | Mục menu tương ứng thành đang đọc; trên mọi khối thì mục đầu | `features/awards-portal/components/awards-anchor-menu.tsx:9-21` |
| Người dùng bật giảm chuyển động | `prefers-reduced-motion: reduce` | Cuộn tức thì thay vì mượt | `features/awards-portal/components/awards-anchor-menu.tsx:23-24` |

### Interaction Notes

- **Mục menu đánh dấu khối đang đọc theo vị trí cuộn, không theo lần bấm cuối** — source: `features/awards-portal/components/awards-anchor-menu.tsx:42-61` (đọc vị trí mỗi khung hình, nên Home hoặc "về đầu trang" vẫn cập nhật đúng)
- **Trên điện thoại thanh chip tự cuộn ngang để giữ chip đang đọc trong tầm nhìn** — source: `features/awards-portal/components/awards-anchor-menu.tsx:63-69`
- **Link menu vẫn là link `#slug` thật nên chạy cả khi chưa có JavaScript** — source: `features/awards-portal/components/awards-anchor-menu.tsx:92-96`
- **Bấm một mục menu không thêm mục vào lịch sử trình duyệt, chỉ thay hash** — source: `features/awards-portal/components/awards-anchor-menu.tsx:78` (`history.replaceState`)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang | Không có skeleton riêng; route chặn (`instant = false`) tới khi session xác nhận | none | `app/(app)/awards/page.tsx:19-28` |
| reading | Cuộn qua từng khối | Mục menu đang đọc có biểu tượng `target-active`, viền và chữ vàng, `aria-current="true"` | bấm mục khác | `features/awards-portal/components/awards-anchor-menu.tsx:89-108` |
| landing | Vào bằng hash hợp lệ | Trang dừng ở khối giải; hash lạ thì dừng ở đầu trang | none | `features/awards-portal/components/award-detail-block.tsx:26-31` |

Dữ liệu giải là hằng số trong code và nội dung nằm trong messages nên màn hình không có lệnh gọi dữ liệu, không có trạng thái rỗng hay lỗi riêng.

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Điện thoại so với màn hình từ `md` | responsive | E04 | Dưới `md`: thanh chip ngang dính dưới header; từ `md`: cột dọc dính bên trái | — | Xem § 10 |
| Mức giá trị thứ hai của giải Signature | configuration | E09 | Giải có hai mức giá trị: hiện dòng "Hoặc" và mức thứ hai | Giải chỉ có một mức | Điều kiện theo dữ liệu giải (hằng số trong code), không phải cấu hình; dùng loại gần nhất vì bảng loại không có mục dữ liệu |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR003_AppLayout | Bấm mục Award Information ở header hoặc footer | — | `docs/generated/screen-flow.md:203` |
| SCR011_Homepage | Bấm ABOUT AWARDS hoặc thẻ giải `/awards#<slug>` | — | `docs/generated/screen-flow.md:197` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bấm nút trong KudosBanner | E11 | — | SCR007_KudosLiveBoardFeed | redirect | `features/awards-portal/components/kudos-banner.tsx:38-42` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | `<nav aria-label="Danh sách giải thưởng">`; mục đang đọc `aria-current="true"`; mỗi khối giải là `<section aria-labelledby>` với `<h2>`; banner `aria-labelledby`; hình trang trí `aria-hidden` hoặc `alt=""`; `<dl>` cho số lượng và giá trị; nút banner có chữ ẩn "về Sun* Kudos" |
| Keyboard navigation | supported | Link menu là phần tử gốc trong thứ tự DOM; khối giải `tabIndex=-1` để nhận focus bằng code; không có phím tắt riêng |
| Focus management | managed | Chọn mục menu thì cuộn và `focus({ preventScroll: true })` vào khối; không có focus trap |
| Screen reader compatibility | unknown | Có `<h1>` rồi `<h2>`, landmark `<nav>`, `<main>`; chưa có kiểm thử thực tế với trình đọc màn hình |
| Error announcement | not implemented | Màn hình không có thông báo lỗi hay vùng `aria-live`; chưa cần vì không có thao tác gửi |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (dưới md) | R3 | Menu là thanh chip bo tròn nằm ngang, dính dưới header (`top-20`), nền mờ; từ `md` là cột dọc dính (`top-24`) | `features/awards-portal/components/awards-anchor-menu.tsx:26-29,83-87` |
| md | R3, R4 | Lưới hai cột 178 px và phần còn lại; từ `xl` cột phải cố định 853 px | `app/(app)/awards/page.tsx:49` |
| xl | R4 | Ảnh 336 và nội dung 480 cạnh nhau, ảnh xen kẽ trái phải; dưới `xl` ảnh nằm trên nội dung | `features/awards-portal/components/award-detail-block.tsx:32-34` |
| mobile (dưới md) | R4 | Khoảng cách cuộn đầu khối lớn hơn (`scroll-mt-40`, từ `md` còn `scroll-mt-28`) để tránh thanh chip | `features/awards-portal/components/award-detail-block.tsx:30` |
| mobile (dưới md) | R1, R2 | Keyvisual cao cố định 100 đơn vị, từ `md` giữ tỉ lệ 1440:547; logo 225 px so với 338 px | `app/(app)/awards/page.tsx:35,45` |
| xl | R5 | Banner cao 500 px, chữ bên trái, logo KUDOS bên phải; dưới `xl` chữ, nút, logo xếp dọc trên nền phủ mờ | `features/awards-portal/components/kudos-banner.tsx:18,27,48` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()` đầu `AwardsPage`; route chặn (`instant = false`) | `app/(app)/awards/page.tsx:19,27-28` |
| R4 | helper | `AWARDS` là mảng đóng băng 6 giải; mỗi phần tử có `slug`, `imageSrc`, `quantity`, `unitKey`, `values` | `features/awards-portal/data/awards-data.ts:33-52` |
| E08, E09 | helper | `formatAwardQuantity` đệm tới 2 chữ số; `formatAwardAmount` dùng `Intl.NumberFormat("vi-VN")` thêm " VNĐ" cho mọi ngôn ngữ | `features/awards-portal/data/awards-data.ts:55-64` |
| E04 | js | Vị trí đọc: `READING_LINE = 0.25` của chiều cao khung nhìn; lắng nghe `scroll` và `resize`, một lần đọc mỗi `requestAnimationFrame` | `features/awards-portal/components/awards-anchor-menu.tsx:9-21,44-61` |
| E04 | js | `block.scrollIntoView`, `block.focus({ preventScroll: true })`, `window.history.replaceState(null, "", "#slug")` | `features/awards-portal/components/awards-anchor-menu.tsx:71-80` |
| E06..E09 | component | `AwardDetailBlock` và `AwardPrizeFacts` là Server Component dùng `getTranslations("awardsPortal")` | `features/awards-portal/components/award-detail-block.tsx:21-49`, `features/awards-portal/components/award-prize-facts.tsx:15-54` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| PortalSectionHeader | `as` | `h1` căn giữa (trang này; trang chủ dùng `h2`) | `caption`, `title`, `centered` | N/A |
| AwardDetailBlock | `imageSide` | `left` (Top Talent, Top Project Leader, Signature), `right` (các giải còn lại) | `award`, `last` | N/A |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở route và ở layout `(app)` | auth | Khách bị chuyển tới `/login`, người chưa có phòng ban tới onboarding; nội dung giải là công khai trong tài liệu nên rủi ro lộ dữ liệu thấp; [UNVERIFIED] server enforcement — proxy session là lớp thứ hai |
| Cổng prelaunch ở proxy | role | Trước `LAUNCH_AT`, người không phải admin bị chuyển tới `/countdown` |

## Source References

1. Page/View: `app/(app)/awards/page.tsx:13-70`
2. Dữ liệu giải: `features/awards-portal/data/awards-data.ts:7-64`
3. Khối giải: `features/awards-portal/components/award-detail-block.tsx:21-49`, `features/awards-portal/components/award-prize-facts.tsx:15-54`
4. Menu neo: `features/awards-portal/components/awards-anchor-menu.tsx:37-114`
5. Banner Kudos: `features/awards-portal/components/kudos-banner.tsx:13-52`
6. Tiêu đề và nền: `features/awards-portal/components/portal-section-header.tsx:16-26`, `features/awards-portal/components/portal-keyvisual-background.tsx:17-30`
7. Nội dung chữ: `messages/vi.json:429-491`
8. Parent shell context: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/awards/page.tsx:13-70` — bắt đầu từ trang để thấy bố cục năm vùng và nơi gọi module giải.
2. **File:** `features/awards-portal/data/awards-data.ts:7-64` — dữ liệu sáu giải và cách định dạng; đối chiếu `entities.md`: màn hình này không có thực thể máy chủ.
3. **File:** `features/awards-portal/components/award-detail-block.tsx:21-49` — một khối giải và id làm đích neo.
4. **File:** `features/awards-portal/components/award-prize-facts.tsx:15-54` — hàng số lượng và giá trị, kể cả mức "Hoặc".
5. **File:** `features/awards-portal/components/awards-anchor-menu.tsx:37-114` — logic cuộn, đánh dấu mục đang đọc, focus.
6. **File:** `features/awards-portal/components/kudos-banner.tsx:13-52` — banner dùng chung với trang chủ.

### Call Hierarchy

```text
AwardsPage -> requireSunner
AwardsPage -> PortalKeyvisualBackground | Image | PortalSectionHeader
AwardsPage -> AwardsAnchorMenu (client, window scroll, history.replaceState)
AwardsPage -> AWARDS.map -> AwardDetailBlock -> AwardThumbnail | AwardPrizeFacts
AwardsPage -> KudosBanner -> Link /kudos
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
AWARDS (hằng số) + messages awardsPortal -> AwardDetailBlock -> HTML tĩnh có id=slug
Cuộn trang -> blockAtReadingLine -> setActive -> đánh dấu mục menu
Bấm mục menu -> scrollIntoView + focus + replaceState -> setActive
```

Các hop trên suy ra từ Call Hierarchy ở trên và các trích dẫn trong `## Source References`.

## Unresolved Questions

1. Thông điệp mô tả ngắn (`short`) của giải Signature 2025 - Creator và MVP trùng nguyên văn với câu của Best Manager ("Vinh danh người quản lý có năng lực quản lý tốt, dẫn dắt đội nhóm"); trang này chỉ hiện mô tả dài nên không ảnh hưởng, nhưng thẻ giải ở trang chủ có thể hiện câu này. Chưa rõ có phải lỗi chép nội dung. (`messages/vi.json:448-485`)
