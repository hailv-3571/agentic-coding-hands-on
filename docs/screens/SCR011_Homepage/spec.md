---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR011_Homepage — Screen Spec

**Screen**: SCR011_Homepage: Homepage
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đã đăng nhập mở trang chủ SAA 2025 để xem đồng hồ đếm ngược tới lễ trao giải, thông tin sự kiện, chủ đề "Root Further", 6 giải thưởng và lời mời tham gia Sun* Kudos, rồi đi tiếp sang trang giải thưởng hoặc Kudos.
**Actors:** Sunner (đã đăng nhập, đã chọn phòng ban), Admin (vào được trước ngày mở cửa)
**Entry Conditions:** Có phiên đăng nhập và đã chọn phòng ban; nếu chưa có thì bị chuyển về đăng nhập hoặc onboarding. Trước thời điểm mở cửa, người không phải admin không tới được `/` (cổng prelaunch chuyển sang `/countdown`).
**Exit Conditions:** Người dùng bấm ABOUT AWARDS / thẻ giải để sang trang giải thưởng, hoặc ABOUT KUDOS / banner để sang Live board Kudos; hoặc đi tiếp qua header/footer (ngoài phạm vi trang này).

## 2. Screen Layout

### Layout Sketch

Trang là một `<main>` cuộn dọc, kéo lên dưới header trong suốt cao 80 px (`-mt-20`), keyvisual làm nền tuyệt đối ở đỉnh trang. Nội dung nằm trong một cột giữa: hero (logo, đồng hồ đếm ngược, thông tin sự kiện, hai nút CTA), bài chủ đề, lưới 6 thẻ giải, banner Sun* Kudos. Header và footer do khung ứng dụng (SCR003_AppLayout) cung cấp, không thuộc spec này. (`app/(app)/page.tsx:31-45`)

```
┌──────────────────────────────────────────────┐
│ (header SCR003_AppLayout, trong suốt, 80 px)  │
├──────────────────────────────────────────────┤
│ R1: Keyvisual (absolute, top, aria-hidden)   │
│  ┌────────────────────────────────────────┐  │
│  │ R2: Hero (static)                      │  │
│  │  logo • đồng hồ • sự kiện • 2 CTA      │  │
│  ├────────────────────────────────────────┤  │
│  │ R3: Theme Article (static)             │  │
│  ├────────────────────────────────────────┤  │
│  │ R4: Awards Section (static)            │  │
│  │  [thẻ][thẻ][thẻ] / [thẻ][thẻ][thẻ]     │  │
│  ├────────────────────────────────────────┤  │
│  │ R5: Kudos Banner (static)              │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ (footer SCR003_AppLayout)                    │
└──────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Keyvisual | absolute | no | PortalKeyvisualBackground |
| R2 | Hero | static | yes | HomepageHero, CountdownTimer, HomepageEventInfo |
| R3 | Theme Article | static | yes | HomepageThemeArticle |
| R4 | Awards Section | static | yes | HomepageAwardsSection, PortalSectionHeader, AwardCard |
| R5 | Kudos Banner | static | yes | KudosBanner |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo "Root Further" (`<h1>`) | image | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Sắp diễn ra | message | — | Visible | Conditional | — | static | raw | hidden | N/A |
| E03 | DAYS (ô số ngày) | display field | — | `00` | Always | — | computed | số nguyên, đệm 2 chữ số | — | binding: `parts.days` |
| E04 | HOURS (ô số giờ) | display field | — | `00` | Always | — | computed | số nguyên, đệm 2 chữ số | — | binding: `parts.hours` |
| E05 | MINUTES (ô số phút) | display field | — | `00` | Always | — | computed | số nguyên, đệm 2 chữ số | — | binding: `parts.minutes` |
| E06 | Thời gian: (ngày lễ) | display field | — | Visible | Always | — | computed | `dd/MM/yyyy` theo múi giờ sự kiện | — | binding: `eventAtMs` |
| E07 | Địa điểm: Âu Cơ Art Center | display field | — | Visible | Always | — | static | raw | — | N/A |
| E08 | Tường thuật trực tiếp qua sóng Livestream | message | — | Visible | Always | — | static | raw | — | N/A |
| E09 | ABOUT AWARDS | link | — | Enabled | Always | Mở trang giải thưởng | — | — | — | N/A |
| E10 | ABOUT KUDOS | link | — | Enabled | Always | Mở Live board Kudos | — | — | — | N/A |
| E11 | Logo "Root Further" (`<h2>` bài chủ đề) | image | — | Visible | Always | — | static | raw | — | N/A |
| E12 | Nội dung chủ đề (đoạn 1, trích dẫn, ghi chú trích dẫn, đoạn 2) | display field | — | Visible | Always | — | static | xuống dòng giữ nguyên, căn đều | — | binding: `awardsPortal.home.theme.*` |
| E13 | Tiêu đề "Hệ thống giải thưởng" (kèm caption) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E14 | Thẻ giải {slug_1..6} (ảnh, tên, mô tả ngắn) | list | — | 6 thẻ | Always | — | static | thứ tự cố định theo dữ liệu giải | — | binding: `AWARDS` |
| E15 | Chi tiết (trên mỗi thẻ giải) | link | — | Enabled | Always | Mở `/awards#<slug>` | — | — | — | N/A |
| E16 | Phong trào ghi nhận / Sun* Kudos / nội dung banner | display field | — | Visible | Always | — | static | căn đều | — | binding: `awardsPortal.kudosBanner.*` |
| E17 | Chi tiết (banner Sun* Kudos) | link | — | Enabled | Always | Mở Live board Kudos | — | — | — | N/A |
| E18 | Logo Sun* Kudos | image | — | Visible | Always | — | static | raw | — | N/A |

Ghi chú: nền keyvisual là ảnh trang trí `aria-hidden`, không tính là phần tử tương tác nên không có hàng riêng.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở trang giải thưởng | E09 | Bấm | — | Rời trang (xem mục 8) | `features/awards-portal/components/homepage-hero.tsx:45-48` |
| Mở Live board Kudos | E10 | Bấm | — | Rời trang (xem mục 8) | `features/awards-portal/components/homepage-hero.tsx:49-52` |
| Mở chi tiết một giải | E15 | Bấm | — | Rời trang tới đúng mốc `#<slug>` (xem mục 8) | `features/awards-portal/components/award-card.tsx:22-29` |
| Mở Live board Kudos từ banner | E17 | Bấm | — | Rời trang (xem mục 8) | `features/awards-portal/components/kudos-banner.tsx:38-42` |

### Happy Path

1. Sunner mở `/`; R2 hiện logo, "Sắp diễn ra", ba ô DAYS / HOURS / MINUTES và dòng thời gian, địa điểm.
2. Đồng hồ cập nhật khi phút hiển thị đổi, không cần tải lại trang.
3. Sunner cuộn qua bài chủ đề (R3) tới lưới 6 giải (R4) và banner Kudos (R5).
4. Sunner bấm một nút hoặc thẻ để sang trang đích (chi tiết ở mục 8).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 (đồng hồ) | Giờ máy chủ đã tới hoặc qua `EVENT_AT` | Ba ô hiện `00`, dòng "Sắp diễn ra" biến mất, đồng hồ dừng; không bị âm | `features/awards-portal/countdown-parts.ts:12-14`, `features/awards-portal/components/countdown-timer.tsx:46` |
| Bước 2 (tab ẩn) | Tab quay lại nhìn thấy sau khi bị ẩn | Đồng hồ tính lại ngay thay vì chờ đến phút kế | `features/awards-portal/components/use-server-clock-now.ts:33-35` |

### Interaction Notes

- **Đồng hồ chạy theo giờ máy chủ: lệch giờ thiết bị không làm đổi số đếm** — client lưu chênh lệch `giờ máy chủ − giờ máy` một lần khi mount rồi cộng vào mọi lần tính — source: `features/awards-portal/components/use-server-clock-now.ts:21-31`
- **Đồng hồ chỉ vẽ lại khi phút hiển thị đổi** — hẹn giờ gióng theo phần phút còn lại tới `EVENT_AT` cộng 50 ms đệm — source: `features/awards-portal/components/use-server-clock-now.ts:7,26`, `features/awards-portal/countdown-parts.ts:27-31`
- **Bấm thẻ giải nhảy thẳng tới khối giải tương ứng trên trang giải thưởng** — link `/awards#<slug>` — source: `features/awards-portal/components/award-card.tsx:23`

## 5. UI States

> Trang là RSC chặn (`instant = false`), không có `loading.tsx`, `error.tsx` hay lệnh gọi dữ liệu phía client; mọi dữ liệu (giờ máy chủ, `EVENT_AT`, 6 giải, nội dung dịch) có sẵn lúc render.

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| counting | Giờ máy chủ < `EVENT_AT` | "Sắp diễn ra" + ba nhóm ô số; vùng `aria-live="polite"` đọc "n ngày n giờ n phút" khi phút đổi | Bấm các CTA | `features/awards-portal/components/countdown-timer.tsx:46-47` |
| ended | Giờ máy chủ ≥ `EVENT_AT` | Ba ô `00`, ẩn dòng "Sắp diễn ra" | Bấm các CTA | `features/awards-portal/countdown-parts.ts:14` |
| loading | Chuyển trang tới `/` | Không có skeleton riêng; route chặn tới khi phiên và giờ máy chủ đọc xong | none | `app/(app)/page.tsx:19,27-28` |
| error | Không có nhánh lỗi dữ liệu trong trang | Không có UI lỗi riêng; lỗi đọc phiên nằm ở lớp khung (xem Unresolved Questions) | none | `app/(app)/page.tsx:26-29` |
| empty | Không áp dụng: danh sách giải là hằng số 6 mục | Không có nhánh rỗng | none | `features/awards-portal/data/awards-data.ts:42-52` |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Dòng "Sắp diễn ra" chỉ hiện khi còn đang đếm | configuration | E02 | Giờ máy chủ chưa tới `EVENT_AT` | Đã tới hoặc qua `EVENT_AT` | Mốc `EVENT_AT` đọc từ cấu hình môi trường, không phải cờ boolean |
| Người chưa đủ điều kiện không vào được trang | auth | E01–E18 (cả trang) | Có phiên đăng nhập và đã có phòng ban | Chưa đăng nhập (về đăng nhập), chưa có phòng ban (về onboarding) | Consequence if bypassed: redirect |
| Trước ngày mở cửa, non-admin bị chặn | auth | E01–E18 (cả trang) | Sau thời điểm mở cửa, hoặc là admin | Trước thời điểm mở cửa với non-admin | Consequence if bypassed: redirect sang `/countdown` (proxy); thực thi ở proxy nên static analysis không đọc hết đường đi |

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
| SCR001_Login | Hoàn tất OAuth tại `/auth/callback` | Đã có phòng ban và `next` rỗng | `docs/generated/screen-flow.md:192` |
| SCR020_OnboardingDepartment | Chọn phòng ban rồi gửi form | `departmentId` hợp lệ; `next` mặc định `/` | `docs/generated/screen-flow.md:194` |
| SCR010_CountdownPrelaunch | Đồng hồ máy chủ về 0 (`router.replace`) | Proxy cho `/` qua (sau `LAUNCH_AT`) | `docs/generated/screen-flow.md:195` |
| SCR003_AppLayout | Bấm logo hoặc mục Về SAA | — | `features/app-shell/components/app-header.tsx:22,32`, `features/app-shell/components/app-footer.tsx:27,37` |
| SCR002_AdminLayout | Bấm logo ADMIN | — | `features/app-shell/components/admin-top-bar.tsx:37` |
| SCR004_Error403 | Bấm "Về trang chủ" | — | `features/app-shell/components/forbidden-panel.tsx:17` |
| SCR005_Error404 | Bấm nút Home | Đã đăng nhập | `app/not-found.tsx:11` |
| SCR012_Rules | Bấm Đóng | Không có trang trước cùng origin | `features/awards-portal/components/rules-close-button.tsx:28-31` |
| external | Mở thẳng `/` | Đã đăng nhập, có phòng ban, đã qua `LAUNCH_AT` (hoặc là admin) | `docs/generated/screen-flow.md:188` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở trang giải thưởng | E09 | — | SCR008_AwardsSystem | redirect (`/awards`) | `features/awards-portal/components/homepage-hero.tsx:45` |
| Mở Live board Kudos | E10 | — | SCR007_KudosLiveBoardFeed | redirect (`/kudos`) | `features/awards-portal/components/homepage-hero.tsx:49` |
| Mở chi tiết một giải | E15 | — | SCR008_AwardsSystem | redirect (`/awards#<slug>`) | `features/awards-portal/components/award-card.tsx:23` |
| Mở Live board Kudos từ banner | E17 | — | SCR007_KudosLiveBoardFeed | redirect (`/kudos`) | `features/awards-portal/components/kudos-banner.tsx:38` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Logo `<h1>` có `alt`; vùng đếm ngược `aria-live="polite" aria-atomic="true"`; `aria-labelledby` cho khối giải và banner; link "Chi tiết" có chữ `sr-only` nêu tên giải; nền và icon `aria-hidden` (`countdown-timer.tsx:47`, `homepage-awards-section.tsx:14`, `kudos-banner.tsx:16`) |
| Keyboard navigation | supported | Chỉ có link/nút chuẩn của trình duyệt, vòng focus dùng chung `focusRing`; không có phím tắt riêng |
| Focus management | unmanaged | Trang không có modal hay điều khiển focus bằng mã |
| Screen reader compatibility | unknown | Có landmark `<main>`, `<section>`, `<article>`, tiêu đề h1/h2/h3 theo thứ tự; chưa có kết quả kiểm thử trình đọc màn hình trong mã |
| Error announcement | not implemented | Trang không có thông báo lỗi; chỉ có đồng hồ là vùng live, đổi chữ khi phút đổi (`countdown-timer.tsx:47`) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R1 | Khung keyvisual cao cố định 880 px; từ `md` đổi sang tỉ lệ 1512/1392 | `app/(app)/page.tsx:34` |
| mobile / desktop (`md`) | R2 | Đệm trên 36 rồi 46 đơn vị từ `md` | `app/(app)/page.tsx:31` |
| mobile (`<sm`) | E01 | Logo rộng 280 px, từ `sm` rộng 451 px | `features/awards-portal/components/homepage-hero.tsx:32` |
| mobile (`<sm`) | E03, E04, E05 | Ô số nhỏ hơn (40×64) và khoảng cách hẹp để ba nhóm nằm một hàng ở 375 px | `features/awards-portal/components/countdown-digit-tile.tsx:20-28` |
| mobile / desktop (`sm`) | E09, E10 | Hai nút xuống dòng khi hẹp, khoảng cách 16 → 40 từ `sm` | `features/awards-portal/components/homepage-hero.tsx:44` |
| mobile / tablet / desktop | E14 | 1 cột (mobile), 2 cột (`sm`), 3 cột (`lg`), 3 cột cố định 336 px (`xl`) | `features/awards-portal/components/homepage-awards-section.tsx:16-18` |
| desktop (`xl`) | E16, E17, E18 | Từ `xl` banner cao 500 px và logo Kudos đặt tuyệt đối bên phải; dưới `xl` các khối xếp dọc và thêm lớp phủ tối | `features/awards-portal/components/kudos-banner.tsx:19,27,48` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()`: không phiên → redirect `LOGIN_PATH`; thiếu `departmentId` → redirect `ONBOARDING_DEPARTMENT_PATH` | `app/(app)/page.tsx:27`, `shared/auth/current-user.ts:48-53` |
| § 1. | guard | Cổng prelaunch ở proxy: trước `LAUNCH_AT` chỉ admin vào các đường dẫn ngoài allowlist; cross-ref BL013_PrelaunchGate | `features/awards-portal/server/prelaunch-gate.ts:6-8` |
| E03, E04, E05 | helper | `readRequestTimeMs()` (`connection()` rồi `Date.now()`) truyền xuống `HomepageHero` dưới dạng `nowMs` | `features/awards-portal/request-time.ts:8-11`, `app/(app)/page.tsx:28,38` |
| E03, E04, E05 | js | `CountdownTimer` (client) nhận `targetIso`, `serverNowIso`; `useServerClockNow` + `remainingParts` | `features/awards-portal/components/countdown-timer.tsx:34-35` |
| E06 | helper | `formatEventDate` dùng `toAdminZone` (múi giờ admin, Asia/Ho_Chi_Minh) | `features/awards-portal/components/homepage-event-info.tsx:7-10` |
| E02 | js | `pendingLabel && !parts.done` | `features/awards-portal/components/countdown-timer.tsx:46` |
| E14 | component | `AWARDS.map` → `AwardCard`; chữ lấy từ khoá `awardsPortal.awards.<slug>.*` | `features/awards-portal/components/homepage-awards-section.tsx:16-22` |
| § 5. | handler | `export const instant = false` (route chặn, đọc phiên mỗi request) | `app/(app)/page.tsx:19` |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở trang và khung `(app)` | auth | Redirect về đăng nhập hoặc onboarding; không có dữ liệu nhạy cảm trên trang (nội dung tĩnh + giờ máy chủ) |
| Cổng prelaunch (proxy) | role | [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware; non-admin bị chuyển `/countdown` trước ngày mở cửa |

## Source References

1. Page/View: `app/(app)/page.tsx:26-47`
2. Hero: `features/awards-portal/components/homepage-hero.tsx:20-56`
3. Event info: `features/awards-portal/components/homepage-event-info.tsx:7-38`
4. Countdown: `features/awards-portal/components/countdown-timer.tsx:34-64`
5. Server clock hook: `features/awards-portal/components/use-server-clock-now.ts:17-46`
6. Countdown maths: `features/awards-portal/countdown-parts.ts:12-31`
7. Theme article: `features/awards-portal/components/homepage-theme-article.tsx:10-35`
8. Awards section + card + data: `features/awards-portal/components/homepage-awards-section.tsx:1-25`, `features/awards-portal/components/award-card.tsx:1-33`, `features/awards-portal/data/awards-data.ts:42-52`
9. Kudos banner: `features/awards-portal/components/kudos-banner.tsx:16-52`
10. Keyvisual: `features/awards-portal/components/portal-keyvisual-background.tsx:24-30`
11. UI copy: `messages/vi.json` (`awardsPortal.home`, `awardsPortal.kudosBanner`, `awardsPortal.countdownTimer`)
12. Parent frame: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/page.tsx:26-47` — trang gọi `requireSunner`, đọc giờ máy chủ rồi ghép các khối; bắt đầu từ đây để thấy thứ tự vùng.
2. **File:** `features/awards-portal/components/homepage-hero.tsx:20-56` — khối hero: logo, đồng hồ, thông tin sự kiện, hai CTA.
3. **File:** `features/awards-portal/components/countdown-timer.tsx:34-64` — thành phần client duy nhất có trạng thái.
4. **File:** `features/awards-portal/components/use-server-clock-now.ts:17-46` — cách tính "bây giờ" theo giờ máy chủ.
5. **File:** `features/awards-portal/countdown-parts.ts:12-31` — phép tính ngày/giờ/phút còn lại.
6. **File:** `features/awards-portal/data/awards-data.ts:42-52` — nguồn 6 giải dùng cho lưới thẻ.
7. **File:** `features/awards-portal/components/homepage-awards-section.tsx:1-25` — lưới thẻ giải và điểm gắn `AwardCard`.
8. **File:** `features/awards-portal/components/kudos-banner.tsx:16-52` — banner Kudos cuối trang.

### Call Hierarchy

```text
HomePage (RSC)
 ├─ requireSunner / readRequestTimeMs
 ├─ PortalKeyvisualBackground
 ├─ HomepageHero ─ CountdownTimer (client) ─ useServerClockNow ─ remainingParts
 │               └ HomepageEventInfo
 ├─ HomepageThemeArticle
 ├─ HomepageAwardsSection ─ AWARDS ─ AwardCard (6)
 └─ KudosBanner
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
EVENT_AT (env) + Date.now() (server) -> HomepageHero props -> CountdownTimer(targetIso, serverNowIso)
  -> useServerClockNow (offset = serverNow - clientNow) -> remainingParts -> ô số (re-render mỗi khi phút đổi)
```

## Unresolved Questions

- Lỗi đọc phiên hoặc lỗi dựng trang chưa có UI lỗi riêng ở cấp `/` (không có `error.tsx` dưới `app/(app)`); chưa xác định trang lỗi gốc nào sẽ hiện — needs runtime confirmation.
- Nút nổi "Viết Kudos" nằm ngoài phạm vi theo ghi chú trong mã (`app/(app)/page.tsx:24`); cần xác nhận với miền nghiệp vụ nếu thiết kế yêu cầu có.
