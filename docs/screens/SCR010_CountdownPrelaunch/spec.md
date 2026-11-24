---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR010_CountdownPrelaunch — Screen Spec

**Screen**: SCR010_CountdownPrelaunch: CountdownPrelaunch
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /countdown
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Người vào hệ thống trước giờ mở (khách hoặc Sunner không phải admin) xem đồng hồ đếm ngược DAYS, HOURS, MINUTES tới giờ mở `LAUNCH_AT` và tự chuyển về trang chủ khi giờ mở tới.
**Actors:** Khách chưa đăng nhập; Sunner không phải admin (admin không bị chuyển tới trang này).
**Entry Conditions:** Trước `LAUNCH_AT` và mở một trang ngoài danh sách công khai (bị cổng prelaunch chuyển tới), hoặc mở thẳng `/countdown`. Trang công khai, không cần phiên.
**Exit Conditions:** Đồng hồ máy chủ về 0 thì trang tự thay URL bằng `/`; sau `LAUNCH_AT` bản thân `/countdown` cũng được proxy chuyển về `/` cho mọi người. Khách vẫn vào được `/login` trong lúc prelaunch.

## 2. Screen Layout

### Layout Sketch

Trang công khai dưới layout `(public)`: header chỉ có logo và nút đổi ngôn ngữ, footer tối giản chỉ có dòng bản quyền. Giữa khung nhìn (chiều cao tối thiểu một màn hình), trên keyvisual đếm ngược mờ phủ kín (độ mờ 50%, `-mt-20` chạy dưới header), là một cột gồm tiêu đề "Sự kiện sẽ bắt đầu sau" và ba ô đồng hồ DAYS, HOURS, MINUTES, mỗi ô là các chữ số bảy đoạn trong ô kính. (`app/(public)/layout.tsx:7-14`, `app/(public)/countdown/page.tsx:29-45`)

```
┌─────────────────────────────────────────────┐
│ R1: Header công khai: logo | ngôn ngữ (sticky)│
├─────────────────────────────────────────────┤
│ R2: Keyvisual đếm ngược mờ (absolute, nền)  │
│          R3: Tiêu đề + đồng hồ (giữa)       │
│     [DD] [HH] [MM]   DAYS HOURS MINUTES     │
├─────────────────────────────────────────────┤
│ R4: Footer tối giản: bản quyền (static)     │
└─────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header công khai | sticky | no | PublicHeader, BrandLogo, LanguageSwitcher |
| R2 | Nền keyvisual đếm ngược | static | no | PortalKeyvisualBackground |
| R3 | Tiêu đề và đồng hồ | static | no | h1, CountdownTimer, CountdownDigitTile |
| R4 | Footer tối giản | static | no | AppFooter (`minimal`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo Sun* Annual Awards 2025 | image | — | Visible | Always | — | static | cao 48 px | — | N/A |
| E02 | Ngôn ngữ (nút "VN" hoặc "EN" mở danh sách Tiếng Việt, English) | button | — | Enabled, ngôn ngữ hiện tại | Always | Mở danh sách và đổi ngôn ngữ | store state | mã hai chữ cái kèm cờ | — | N/A |
| E03 | Không thể đổi ngôn ngữ, vui lòng thử lại. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E04 | Sự kiện sẽ bắt đầu sau | region label | — | Visible | Always | — | static | `<h1>` căn giữa | — | N/A |
| E05 | DAYS (ô số ngày) | display field | — | Visible | Always | — | computed | ít nhất 2 chữ số, tối thiểu 00 | — | N/A |
| E06 | HOURS (ô số giờ) | display field | — | Visible | Always | — | computed | 2 chữ số, tối thiểu 00 | — | N/A |
| E07 | MINUTES (ô số phút) | display field | — | Visible | Always | — | computed | 2 chữ số, tối thiểu 00 | — | N/A |
| E08 | Bản quyền thuộc về Sun* © 2025 | display field | — | Visible | Always | — | static | raw | — | N/A |

Ghi chú: E05 đến E07 là phần còn lại làm tròn xuống tới `LAUNCH_AT`, không bao giờ âm (từ giờ mở trở đi hiện 00 00 00). Màn hình không có liên kết tới thông tin giải hay trang đăng nhập.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở danh sách ngôn ngữ | E02 | click | Không đang đổi ngôn ngữ | Danh sách Tiếng Việt và English hiện, ngôn ngữ hiện tại được đánh dấu | `features/app-shell/components/language-switcher.tsx:52-92` |
| Chọn ngôn ngữ | E02 | click một mục | Khác ngôn ngữ hiện tại | Danh sách đóng, nút bị khoá trong lúc đổi, thành công thì trang làm mới sang ngôn ngữ mới | `features/app-shell/components/language-switcher.tsx:33-48` |

### Happy Path

1. Người dùng bị chuyển tới `/countdown` hoặc mở thẳng trang; đồng hồ hiện số ngày, giờ, phút còn lại theo giờ máy chủ.
2. Đồng hồ tự cập nhật khi phút hiển thị đổi, và cập nhật ngay khi tab hiện lại sau khi bị nền.
3. Khi đồng hồ máy chủ về 0, ba ô hiện 00 và trang tự thay URL bằng trang chủ (rời màn hình).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Đồng hồ máy khách lệch | Đồng hồ thiết bị sai | Không ảnh hưởng: client chỉ cộng chênh lệch (giờ máy chủ trừ giờ thiết bị lúc mở trang) vào đồng hồ của mình | `features/awards-portal/components/use-server-clock-now.ts:9-22` |
| Tab bị đưa xuống nền | Tab hiện lại | Đồng hồ cập nhật ngay thay vì đợi bộ hẹn giờ bị làm chậm | `features/awards-portal/components/use-server-clock-now.ts:33-38` |
| Tới giờ mở | Đồng hồ máy chủ tới `LAUNCH_AT` | Hiện 00 00 00 rồi trang thay URL sang `/`; proxy vẫn quyết định `/` hiện gì | `features/awards-portal/components/countdown-timer.tsx:38-42` |
| Mở trang sau giờ mở | `LAUNCH_AT` đã qua | Proxy chuyển `/countdown` về `/` cho mọi người, kể cả khách, trước khi trang kịp hiện | `features/awards-portal/server/prelaunch-gate.ts:59-63` |
| Đổi ngôn ngữ thất bại | Server từ chối hoặc lỗi mạng | Hiện thông báo lỗi dưới nút, giữ nguyên ngôn ngữ cũ | `features/app-shell/components/language-switcher.tsx:39-46,93-100` |

### Interaction Notes

- **Đồng hồ chỉ vẽ lại khi phút còn lại đổi, không đếm từng giây** — source: `features/awards-portal/components/use-server-clock-now.ts:24-31` (hẹn giờ tới ranh giới phút kế, cộng 50 ms)
- **Bấm ra ngoài danh sách ngôn ngữ hoặc nhấn Esc đóng danh sách; Esc trả focus về nút** — source: `features/app-shell/hooks/use-dismissable.ts:6-27`
- **Đồng hồ ngừng hẹn giờ khi tới giờ mở** — source: `features/awards-portal/components/use-server-clock-now.ts:24-27`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang | Không có skeleton; route chặn (`instant = false`) tới khi đọc xong giờ máy chủ | none | `app/(public)/countdown/page.tsx:14-24` |
| counting | Trước `LAUNCH_AT` | Ba ô số, nhãn DAYS, HOURS, MINUTES; cập nhật mỗi phút | đổi ngôn ngữ | `features/awards-portal/components/countdown-timer.tsx:44-62` |
| done | Đồng hồ máy chủ tới `LAUNCH_AT` | Ba ô hiện 00, sau đó trang tự chuyển (rời màn hình) | none | `features/awards-portal/countdown-parts.ts:12-21`, `features/awards-portal/components/countdown-timer.tsx:40-42` |
| saving | Đang đổi ngôn ngữ | Nút ngôn ngữ bị khoá (`disabled`), mờ 60% | none | `features/app-shell/components/language-switcher.tsx:59,64` |
| error | Đổi ngôn ngữ thất bại | `role="alert"` "Không thể đổi ngôn ngữ, vui lòng thử lại." dưới nút | thử chọn lại | `features/app-shell/components/language-switcher.tsx:93-100` |

Màn hình không có danh sách hay dữ liệu người dùng nên không có trạng thái rỗng; giờ máy chủ và `LAUNCH_AT` đọc ngay lúc render nên không có lỗi tải riêng.

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02 | Đổi ngôn ngữ cần server chấp nhận và không lỗi mạng | Không thể đổi ngôn ngữ, vui lòng thử lại. | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Đổi ngôn ngữ thất bại | configuration | E03 | Lần đổi ngôn ngữ gần nhất thất bại | Bấm lại nút ngôn ngữ, hoặc chưa từng lỗi | Điều kiện theo kết quả thao tác, không phải cấu hình; dùng loại gần nhất vì bảng loại không có mục trạng thái |

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
| external | Cổng prelaunch chuyển người mở trang ngoài danh sách công khai | Trước `LAUNCH_AT`, không phải admin | `features/awards-portal/server/prelaunch-gate.ts:65-69` |
| external | Truy cập trực tiếp `/countdown` | Trước `LAUNCH_AT` (sau giờ mở bị chuyển về `/`) | `shared/auth/public-paths.ts:33-44` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đồng hồ máy chủ về 0 (`router.replace`) | E05, E06, E07 | Proxy cho `/` qua (sau `LAUNCH_AT`) | SCR011_Homepage | redirect | `features/awards-portal/components/countdown-timer.tsx:40-42` |
| Proxy đưa `/countdown` về `/` sau giờ mở | — | Tải trang sau `LAUNCH_AT` | SCR011_Homepage | redirect | `features/awards-portal/server/prelaunch-gate.ts:59-63` |
| Mở `/login` | — | Khách; `/login` luôn công khai; không có nút hay link trên trang, người dùng gõ URL | SCR001_Login | redirect | `docs/generated/screen-flow.md:196` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Vùng đồng hồ `aria-live="polite"` `aria-atomic="true"`; mỗi đơn vị có chữ `sr-only` đọc "n ngày", "n giờ", "n phút", còn ô số và nhãn tiếng Anh `aria-hidden`; nút ngôn ngữ có `aria-label` bắt đầu bằng chữ đang hiện ("VN, Ngôn ngữ: Tiếng Việt"), `aria-expanded`, `aria-controls`; mục ngôn ngữ `aria-pressed`, `lang` |
| Keyboard navigation | supported | Nút ngôn ngữ là phần tử gốc; Esc đóng danh sách và trả focus về nút |
| Focus management | managed | Esc trả focus về nút ngôn ngữ; không autofocus, không focus trap |
| Screen reader compatibility | unknown | Có `<h1>`, `<main>`, `<header>`, `<footer>`; nội dung vùng live đổi theo phút; chưa có kiểm thử thực tế với trình đọc màn hình |
| Error announcement | supported | Lỗi đổi ngôn ngữ `role="alert"`; đồng hồ không có hoạt ảnh nên không cần xử lý giảm chuyển động |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (dưới sm) | E05, E06, E07 | Ô số cao 64 px rộng 40 px, chữ 38 px để ba đơn vị vừa một hàng ở 375 px; từ `sm` 82×51 px, chữ 49 px; từ `md` 123×77 px, chữ 74 px | `features/awards-portal/components/countdown-digit-tile.tsx:29-38` |
| mobile (dưới sm) | R3 | Khoảng cách giữa các đơn vị 16 px, từ `sm` 40 px, từ `md` 60 px | `features/awards-portal/components/countdown-digit-tile.tsx:30-33` |
| mobile (dưới md) | E04 | Tiêu đề cỡ headline-small; từ `md` cỡ display-small | `app/(public)/countdown/page.tsx:37` |
| mọi cỡ | R2 | Keyvisual cắt `object-cover` neo 70% theo chiều ngang | `app/(public)/countdown/page.tsx:30-35` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| E05..E07 | handler | `CountdownPage` là Server Component chặn; đọc `readRequestTimeMs()` rồi truyền `targetIso` (từ `env.LAUNCH_AT`) và `serverNowIso` cho `CountdownTimer` | `app/(public)/countdown/page.tsx:23-44` |
| E05..E07 | helper | `readRequestTimeMs`: `await connection()` rồi `Date.now()`, không bao giờ vào shell tiền kết xuất | `features/awards-portal/request-time.ts:9-12` |
| E05..E07 | helper | `remainingParts(targetMs, nowMs)` trả ngày, giờ, phút làm tròn xuống và cờ `done`; `msUntilNextMinuteChange` tính hẹn giờ kế | `features/awards-portal/countdown-parts.ts:12-31` |
| E05..E07 | js | `useServerClockNow`: lưu `serverNow - Date.now()` một lần lúc mount, hẹn giờ tới ranh giới phút, nghe `visibilitychange` | `features/awards-portal/components/use-server-clock-now.ts:17-46` |
| § 1. | js | `router.replace("/")` khi `parts.done` và có `redirectOnZero` | `features/awards-portal/components/countdown-timer.tsx:40-42` |
| § 1. | guard | `decidePrelaunchRoute`: trước `LAUNCH_AT` chỉ đường công khai mở cho người không phải admin; sau `LAUNCH_AT` chỉ `/countdown` chuyển về `/`; yêu cầu không phải tải trang trả 403 JSON | `features/awards-portal/server/prelaunch-gate.ts:56-70` |
| § 1. | helper | `isPrelaunch(nowMs, launchAtMs) = nowMs < launchAtMs`; bản thân `LAUNCH_AT` đã là đã mở | `features/awards-portal/server/prelaunch-gate.ts:35-37` |
| E02 | endpoint | Server Action `setLocaleAction(locale)` (ROUTE036), thành công thì `router.refresh()` | `features/app-shell/components/language-switcher.tsx:37-47` |
| E05..E07 | component | `CountdownDigitTile` dùng phông DSEG7 Classic qua `next/font/local`, ô kính 50% độ mờ | `features/awards-portal/components/countdown-digit-tile.tsx:3-9,44-53` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| CountdownTimer / CountdownDigitTile | `size` | `page` (trang đếm ngược; trang chủ dùng `hero`) | `redirectOnZero` = `/`; không truyền `pendingLabel` | N/A |
| AppFooter | `variant` | `minimal` (chỉ dòng bản quyền) | — | N/A |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Danh sách đường công khai: `/countdown` nằm trong `PUBLIC_PATHS` | auth | Trang mở được không cần phiên; lộ mốc `LAUNCH_AT` (gửi xuống client dưới dạng chuỗi ISO, không gửi biến môi trường) và giờ máy chủ lúc render; cả hai không nhạy cảm |
| Cổng prelaunch ở proxy | role | Role đọc từ DB mỗi request (không từ cookie), lỗi đọc coi như không phải admin; bypass thì người không phải admin vào được các trang trước giờ mở |
| Quyết định chuyển hướng chỉ theo giờ máy chủ | permission | Client chỉ rời trang khi đồng hồ theo giờ máy chủ về 0, nên không có vòng `/countdown` và `/`; đồng hồ thiết bị lệch không đổi kết quả |

## Source References

1. Page/View: `app/(public)/countdown/page.tsx:9-47`
2. Layout công khai: `app/(public)/layout.tsx:7-14`, `features/app-shell/components/public-header.tsx:7-17`, `features/app-shell/components/language-switcher.tsx:15-103`
3. Đồng hồ: `features/awards-portal/components/countdown-timer.tsx:30-64`, `features/awards-portal/components/countdown-digit-tile.tsx:19-54`
4. Logic giờ: `features/awards-portal/components/use-server-clock-now.ts:17-46`, `features/awards-portal/countdown-parts.ts:5-31`, `features/awards-portal/request-time.ts:9-12`
5. Cổng prelaunch: `features/awards-portal/server/prelaunch-gate.ts:35-70`, `shared/auth/public-paths.ts:9-44`
6. Nền: `features/awards-portal/components/portal-keyvisual-background.tsx:17-30`
7. Footer tối giản: `features/app-shell/components/app-footer.tsx:15-25`
8. Nội dung chữ: `messages/vi.json:392-407`

## Source Walkthrough

1. **File:** `features/awards-portal/server/prelaunch-gate.ts:35-70` — bắt đầu từ cổng prelaunch: nó quyết định ai tới trang này và khi nào bị đẩy đi.
2. **File:** `app/(public)/countdown/page.tsx:9-47` — trang: đọc giờ máy chủ, mốc `LAUNCH_AT`, ghép tiêu đề và đồng hồ.
3. **File:** `features/awards-portal/components/countdown-timer.tsx:30-64` — đồng hồ client, vùng live và chuyển trang khi về 0.
4. **File:** `features/awards-portal/components/use-server-clock-now.ts:17-46` — vì sao đồng hồ thiết bị lệch không ảnh hưởng.
5. **File:** `features/awards-portal/countdown-parts.ts:12-31` — phép tính ngày, giờ, phút.
6. **File:** `app/(public)/layout.tsx:7-14` — header công khai và footer tối giản; màn hình này không có thực thể máy chủ trong `entities.md`.

### Call Hierarchy

```text
proxy -> decidePrelaunchRoute -> redirect /countdown (trước LAUNCH_AT) | redirect / (sau LAUNCH_AT)
CountdownPage -> readRequestTimeMs -> CountdownTimer -> useServerClockNow -> remainingParts -> CountdownDigitTile
CountdownTimer -> router.replace("/") khi parts.done
PublicLayout -> PublicHeader -> LanguageSwitcher -> setLocaleAction
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
env.LAUNCH_AT + Date.now() (server) -> targetIso, serverNowIso -> CountdownTimer
useServerClockNow: offset = serverNow - Date.now() -> mỗi phút nowMs = Date.now() + offset -> remainingParts -> ô số
parts.done -> router.replace("/") -> proxy quyết định trang hiển thị
```

Các hop trên suy ra từ Call Hierarchy ở trên và các trích dẫn trong `## Source References`.

## Unresolved Questions

1. Màn hình không có nút hay link tới `/login`, trong khi `screen-flow.md` ghi đường SCR010 tới SCR001_Login ("Mở `/login`"); đường này chỉ xảy ra khi người dùng tự gõ URL, không phải thao tác trên trang. Chưa rõ có cần coi đây là đường điều hướng của màn hình. (`docs/generated/screen-flow.md:196`)
2. Logo ở header công khai không phải link (`BrandLogo` không bọc `Link`) nên khách ở `/countdown` không có đường quay về nào ngoài việc gõ URL. Hành vi quan sát được, chưa rõ có chủ ý. (`features/app-shell/components/public-header.tsx:10-14`)
