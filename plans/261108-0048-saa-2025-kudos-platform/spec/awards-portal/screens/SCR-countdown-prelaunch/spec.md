---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-countdown-prelaunch — Screen Spec

**Screen**: SCR-countdown-prelaunch: Countdown Prelaunch
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /countdown (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho người dùng vào trước giờ mở hệ thống thấy còn bao lâu nữa và đi xem thông tin giải.
**Actors:** Khách chưa đăng nhập (xem D001), Sunner, Admin
**Entry Conditions:** Giờ máy chủ chưa tới giờ mở và người dùng mở một trang không nằm trong danh sách cho phép.
**Exit Conditions:** Đếm về 0 thì tự sang Homepage, hoặc người dùng bấm liên kết tới trang Hệ thống giải.

## 2. Screen Layout

### Layout Sketch

Nền tối toàn màn hình theo phong cách hero, ở giữa là ba ô đếm ngược Ngày, Giờ, Phút, bên dưới là liên kết tới thông tin giải. Nút đổi ngôn ngữ do khung chung cấp (F002_AppShell, D002 của F002). Chi tiết hình nền và vị trí liên kết chưa đối chiếu từ frame thiết kế `[UNVERIFIED]`.

```
┌───────────────────────────────────────┐
│ R1: Page Wrapper (hero background)    │
│   ┌─────────────────────────────────┐ │
│   │ R2: Countdown                   │ │
│   │ [DAYS] [HOURS] [MINUTES]        │ │
│   └─────────────────────────────────┘ │
│   R3: Award Links                     │
└───────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Wrapper | static | no | TBD (draft) |
| R2 | Countdown | static | no | TBD (draft) |
| R3 | Award Links | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề sắp diễn ra | message | — | — | Always | — | static | — | — | N/A |
| E02 | DAYS | display field | — | Giá trị từ máy chủ | Always | — | computed | số, ít nhất 2 chữ số | 00 | N/A |
| E03 | HOURS | display field | — | Giá trị từ máy chủ | Always | — | computed | 2 chữ số | 00 | N/A |
| E04 | MINUTES | display field | — | Giá trị từ máy chủ | Always | — | computed | 2 chữ số | 00 | N/A |
| E05 | Liên kết thông tin giải | link | — | Enabled | Conditional | Mở trang Hệ thống giải | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Xem thông tin giải | E05 | click | Chỉ khi trang Hệ thống giải được phép trước giờ mở (D002) | Rời màn đếm ngược | TBD (draft) |

### Happy Path

1. Người dùng vào hệ thống trước giờ mở và thấy ba ô đếm ngược ở R2.
2. Mỗi phút trôi qua, số phút ở E04 giảm một đơn vị mà trang không tải lại.
3. Khi cả ba ô về 00, trang tự rời sang Homepage.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Tab bị ẩn lâu | Khi quay lại, số cập nhật ngay theo giờ máy chủ | TBD (draft) |
| Bước 3 | Người dùng đang đọc dở khi về 0 | Vẫn tự chuyển, không hỏi lại | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong, JS chưa chạy | Ba ô hiện giá trị tính phía máy chủ | Bấm E05 | TBD (draft) |
| ticking | Mỗi phút | Ô số đổi (hiệu ứng lật, tôn trọng giảm chuyển động) | Bấm E05 | TBD (draft) |
| reached-zero | Còn lại bằng 0 | Chuyển sang Homepage | none | TBD (draft) |
| image-error | Ảnh nền lỗi tải | Nền đơn sắc, số vẫn đọc được | Bấm E05 | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Trang Hệ thống giải được phép xem trước giờ mở | configuration | E05 | Quyết định D002 giữ mặc định | D002 đổi thành chỉ Countdown | [NEEDS_DOMAIN_CONFIRMATION] |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR-login | Đăng nhập thành công | Trước giờ mở | TBD (draft) |
| external | Mở địa chỉ gốc hoặc bất kỳ trang ngoài danh sách cho phép | Trước giờ mở | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Xem thông tin giải | E05 | D002 giữ mặc định | TBD (draft) — SCR-awards-system | redirect | TBD (draft) |
| Đếm về 0 | E02, E03, E04 | Còn lại bằng 0 | TBD (draft) — SCR-homepage | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Mỗi ô có nhãn đọc được, ví dụ "còn N ngày" |
| Keyboard navigation | [EXPECTED] | E05 nhận focus bằng Tab, kích hoạt bằng Enter |
| Focus management | [EXPECTED] | Không có bẫy focus; chuyển trang tự động không cướp focus của người đang thao tác |
| Screen reader compatibility | [EXPECTED] | Chỉ đọc lại số khi người dùng hỏi, không đọc mỗi phút |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2 | Ba ô thu nhỏ vừa một hàng, không cuộn ngang | TBD (draft) |
