---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-app-layout — Screen Spec

**Screen**: SCR-app-layout: App Layout (Header & Footer)
**Feature**: F002_AppShell
**Type**: composite
**Route**: Áp dụng cho mọi trang sau đăng nhập (không có địa chỉ riêng; TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Khung bao quanh mọi trang sau đăng nhập, giúp Sunner đi tới các trang chính, đổi ngôn ngữ và mở menu tài khoản.
**Actors:** Sunner, Admin
**Entry Conditions:** Người dùng đã đăng nhập và đang xem một trang thuộc khu Sunner.
**Exit Conditions:** Người dùng chuyển sang trang khác, đổi ngôn ngữ hoặc đăng xuất.

## 2. Screen Layout

### Layout Sketch

Header cố định phía trên: logo bên trái, ba liên kết điều hướng, bên phải là chuông thông báo, nút đổi ngôn ngữ và avatar. Giữa là vùng nội dung của từng trang, dưới cùng là footer. Trên màn hình nhỏ ba liên kết gộp vào nút menu thu gọn. Thứ tự các nút bên phải và vị trí cố định/cuộn của header chưa đối chiếu với frame thiết kế `[UNVERIFIED]`.

```
┌──────────────────────────────────────────────────────┐
│ R1: Header (fixed-top)                               │
│ [Logo] [About] [Award] [Kudos]   [Bell][VN v][Avatar]│
├──────────────────────────────────────────────────────┤
│ R2: Page Content (scrollable, do từng feature cấp)   │
├──────────────────────────────────────────────────────┤
│ R3: Footer (static)                                  │
└──────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) |
| R2 | Page Content | static | yes | TBD (draft) |
| R3 | Footer | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo SAA | image | — | — | Always | Đi tới trang chính | static | — | — | TBD (draft) |
| E02 | About SAA 2025 | link | — | — | Always | Mở trang About SAA 2025 | static | — | — | TBD (draft) |
| E03 | Award Information | link | — | — | Always | Mở trang Hệ thống giải | static | — | — | TBD (draft) |
| E04 | Sun* Kudos | link | — | — | Always | Mở Live board | static | — | — | TBD (draft) |
| E05 | Notification bell | button | — | — | Always | Mở danh sách thông báo (nội dung do F013_Notifications) | store state | số chưa đọc | hidden | TBD (draft) |
| E06 | Language switcher | button | — | Ngôn ngữ hiện tại | Always | Mở danh sách ngôn ngữ | store state | mã VN hoặc EN | — | TBD (draft) |
| E07 | Language option Tiếng Việt | button | — | — | Conditional | Chọn Tiếng Việt | static | — | — | TBD (draft) |
| E08 | Language option English | button | — | — | Conditional | Chọn English | static | — | — | TBD (draft) |
| E09 | Avatar | button | — | Chữ cái đầu tên nếu chưa có ảnh | Always | Mở menu tài khoản | API field | ảnh tròn | placeholder text | TBD (draft) |
| E10 | Profile | link | — | — | Conditional | Mở trang Profile | static | — | — | TBD (draft) |
| E11 | Admin Dashboard | link | — | — | Conditional | Vào khu Admin | static | — | — | TBD (draft) |
| E12 | Logout | button | — | — | Conditional | Đăng xuất | static | — | — | TBD (draft) |
| E13 | Menu toggle | button | — | Đóng | Conditional | Mở/đóng menu thu gọn | static | — | — | TBD (draft) |
| E14 | Footer content | region label | — | — | Always | — | static | — | — | TBD (draft) — [NEEDS_DOMAIN_CONFIRMATION] nội dung footer |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn ngôn ngữ | E07, E08 | click | — | Chữ trên trang đổi ngay | TBD (draft) |
| Mở menu tài khoản | E09 | click | — | Hiện E10, E11 (nếu Admin), E12 | TBD (draft) |
| Đăng xuất | E12 | click | — | Phiên kết thúc | TBD (draft) |
| Mở menu thu gọn | E13 | click | Màn hình nhỏ | Hiện ba liên kết E02–E04 | TBD (draft) |

### Happy Path

1. Sunner thấy header ở R1 và footer ở R3 trên trang đang xem.
2. Sunner bấm E06 và chọn E08 — chữ trong R1, R2, R3 đổi sang tiếng Anh.
3. Sunner bấm E09 — menu tài khoản mở ra ngay dưới avatar.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 3 | Người dùng là Admin | Menu có thêm E11 | TBD (draft) |
| Đăng xuất | Mạng lỗi | Ở lại trang, hiện "Không thể đăng xuất, vui lòng thử lại." | TBD (draft) |

### Interaction Notes

- **Bấm ra ngoài menu đang mở thì menu đóng** — source: TBD (draft)
- **Liên kết của trang đang mở được đánh dấu** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải thông tin người dùng | Avatar hiện khung chờ | none | TBD (draft) |
| empty | Chưa có ảnh đại diện | Hiện chữ cái đầu của tên | mở menu | TBD (draft) |
| error | Không tải được thông tin người dùng | Avatar hiện chữ cái đầu mặc định, các liên kết vẫn dùng được | thử tải lại trang | TBD (draft) |
| saving | Đang đổi ngôn ngữ | Nút E06 vô hiệu ngắn | none | TBD (draft) |
| success | Đổi ngôn ngữ xong | Chữ hiện bằng ngôn ngữ mới | dùng tiếp | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E12 | Đăng xuất phải thành công | "Không thể đăng xuất, vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Người dùng có role Admin | auth | E11 | Role là Admin | Role khác | Ẩn chỉ để gọn giao diện; chặn truy cập thật ở phía máy chủ |
| Màn hình nhỏ | responsive | E13 | Màn hình nhỏ | Màn hình lớn | E02–E04 gộp vào menu |
| Menu ngôn ngữ đang mở | hardcoded-id | E07, E08 | Sau khi bấm E06 | Ngược lại | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — mọi trang khu Sunner | Mở trang | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở About SAA 2025 | E02 | — | TBD (draft) — trang Homepage | redirect | TBD (draft) |
| Mở Award Information | E03 | — | TBD (draft) — trang Hệ thống giải | redirect | TBD (draft) |
| Mở Sun* Kudos | E04 | — | TBD (draft) — Live board | redirect | TBD (draft) |
| Mở Profile | E10 | — | TBD (draft) — trang Profile | redirect | TBD (draft) |
| Vào khu Admin | E11 | Role Admin | TBD (draft) — SCR-admin-layout | redirect | TBD (draft) |
| Đăng xuất | E12 | — | TBD (draft) — trang đăng nhập | redirect | TBD (draft) |
| Đổi ngôn ngữ | E07, E08 | — | (stays on screen) | làm mới trang | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Nút chỉ có biểu tượng (chuông, avatar, menu) có nhãn đọc được |
| Keyboard navigation | [EXPECTED] | Tab qua mọi liên kết và nút; Esc đóng menu đang mở |
| Focus management | [EXPECTED] | Mở menu thì focus vào mục đầu, đóng thì trả focus về nút |
| Screen reader compatibility | [EXPECTED] | Header và footer có vùng landmark; mục đang chọn được đọc là đang chọn |
| Error announcement | [EXPECTED] | Thông báo đăng xuất lỗi được đọc tự động |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop (khung thiết kế 1440/1512) | R1 | Ba liên kết hiện ngang trong header | TBD (draft) |
| mobile (khung thiết kế 375) | R1, E13 | Ba liên kết gộp vào menu thu gọn | TBD (draft) |
| tablet | R1 | TBD (draft) — theo quyết định chung về tablet | TBD (draft) |
