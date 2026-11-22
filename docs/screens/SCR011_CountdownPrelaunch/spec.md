---
status: draft
authored_by: takumi
fcode: F006
created: 2026-11-08
lang: vi
---

# SCR011_CountdownPrelaunch — Screen Spec

**Screen**: SCR011_CountdownPrelaunch: Countdown Prelaunch
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /countdown
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho người dùng vào trước giờ mở hệ thống thấy còn bao lâu nữa.
**Actors:** Khách chưa đăng nhập, Sunner (Admin vượt cổng nên chỉ thấy khi tự mở `/countdown`)
**Entry Conditions:** Giờ máy chủ chưa tới `LAUNCH_AT` và người dùng không phải Admin mở trang ngoài danh sách cho phép (`/login`, `/auth/callback`, `/countdown`, `/access-denied`) sau khi đã đăng nhập; trang công khai này khách xem được. Từ `LAUNCH_AT`, mở `/countdown` chuyển sang `/`.
**Exit Conditions:** Đếm về 0 thì trang gọi `router.replace("/")`; proxy quyết định `/` dẫn tới đâu (nếu proxy vẫn thấy trước giờ mở do lệch giờ thì quay lại `/countdown`).

## 2. Screen Layout

### Layout Sketch

Ảnh keyvisual mờ (opacity 50%) làm nền toàn màn hình, chạy dưới header trong suốt; ở giữa là tiêu đề "Sự kiện sẽ bắt đầu sau" và ba ô đếm ngược DAYS, HOURS, MINUTES. Không có liên kết nào (Figma 2268:35127 không vẽ; decision-log 2026-11-15). Nút đổi ngôn ngữ do khung chung cấp (F002_AppShell).

```
┌───────────────────────────────────────┐
│ R1: Page Wrapper (keyvisual mờ)       │
│   ┌─────────────────────────────────┐ │
│   │ R2: Countdown                   │ │
│   │ Sự kiện sẽ bắt đầu sau          │ │
│   │ [DAYS] [HOURS] [MINUTES]        │ │
│   └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Wrapper | static | no | `PortalKeyvisualBackground` (`/images/awards-portal/countdown-keyvisual.webp`) |
| R2 | Countdown | static | no | `CountdownTimer` (`features/awards-portal/components/countdown-timer.tsx`), `size="page"`, font số DSEG7 Classic |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề "Sự kiện sẽ bắt đầu sau" (`awardsPortal.countdown.title`) | message | — | — | Always | — | static | — | — | N/A |
| E02 | DAYS | display field | — | Giá trị từ máy chủ | Always | — | computed | số, ít nhất 2 chữ số | 00 | N/A |
| E03 | HOURS | display field | — | Giá trị từ máy chủ | Always | — | computed | 2 chữ số | 00 | N/A |
| E04 | MINUTES | display field | — | Giá trị từ máy chủ | Always | — | computed | 2 chữ số | 00 | N/A |

## 4. User Actions

### Available Actions

N/A — màn chỉ hiển thị, không có thao tác nào (không có liên kết sang thông tin giải).

### Happy Path

1. Người dùng vào hệ thống trước giờ mở và thấy ba ô đếm ngược ở R2.
2. Mỗi khi phút hiển thị đổi, số phút ở E04 giảm một đơn vị mà trang không tải lại.
3. Khi cả ba ô về 00, trang gọi `router.replace("/")`.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Tab bị ẩn lâu | Khi quay lại, số cập nhật ngay theo giờ máy chủ | TBD (draft) |
| Bước 3 | Người dùng đang đọc dở khi về 0 | Vẫn tự chuyển, không hỏi lại | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong, JS chưa chạy | Ba ô hiện giá trị tính phía máy chủ | none | TBD (draft) |
| ticking | Phút hiển thị đổi, hoặc tab hiện lại | Ô số đổi ngay, không có hiệu ứng chuyển động; tính lại từ giờ máy chủ + độ lệch đã lưu | none | TBD (draft) |
| reached-zero | Còn lại bằng 0 | Hiện 00 00 00 (không bao giờ âm) và chuyển tới `/` | none | TBD (draft) |
| image-error | Ảnh nền lỗi tải | Nền đơn sắc, số vẫn đọc được | none | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR001_Login | Đăng nhập thành công | Trước giờ mở | TBD (draft) |
| external | Mở địa chỉ gốc hoặc bất kỳ trang ngoài danh sách cho phép | Trước giờ mở | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đếm về 0 | E02, E03, E04 | Còn lại bằng 0 | TBD (draft) — SCR012_Homepage | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Mỗi ô có nhãn đọc được, ví dụ "5 ngày 3 giờ 7 phút" trong vùng `aria-live="polite"`, chỉ đổi chữ khi phút đổi |
| Keyboard navigation | [EXPECTED] | Không có phần tử tương tác |
| Focus management | [EXPECTED] | Không có bẫy focus; chuyển trang tự động không cướp focus của người đang thao tác |
| Screen reader compatibility | [EXPECTED] | Chỉ đọc lại số khi người dùng hỏi, không đọc mỗi phút |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2 | Ba ô thu nhỏ vừa một hàng, không cuộn ngang | TBD (draft) |
