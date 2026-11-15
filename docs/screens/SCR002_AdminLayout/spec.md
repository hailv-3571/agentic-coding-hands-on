---
status: draft
authored_by: takumi
fcode: F002
created: 2026-11-08
lang: vi
---

# SCR002_AdminLayout — Screen Spec

**Screen**: SCR002_AdminLayout: Admin Layout
**Feature**: F002_AppShell
**Type**: composite
**Route**: Áp dụng cho mọi trang dưới khu Admin (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Khung riêng của khu Admin để Admin chuyển giữa Overview, Review content, User và Settings.
**Actors:** Admin
**Entry Conditions:** Người dùng đã đăng nhập và được xác nhận có role Admin.
**Exit Conditions:** Admin quay về khu Sunner, đăng xuất hoặc rời khu Admin.

## 2. Screen Layout

### Layout Sketch

Khung gồm vùng menu Admin với bốn mục, vùng avatar kèm lối quay về khu Sunner và vùng nội dung của từng trang Admin. Vị trí menu (thanh bên hay thanh trên) chưa đối chiếu với frame thiết kế `[UNVERIFIED]`; sơ đồ dưới đây chỉ là phác thảo tạm.

```
┌──────────────────────────────────────────────────────┐
│ R1: Admin Menu (TBD (draft): thanh bên hoặc thanh trên)│
│ [Overview][Review content][User][Settings]  [Avatar] │
├──────────────────────────────────────────────────────┤
│ R2: Admin Page Content (scrollable)                  │
└──────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Admin Menu | TBD (draft) | no | TBD (draft) |
| R2 | Admin Page Content | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Overview | link | — | — | Always | Mở trang Overview | static | — | — | TBD (draft) |
| E02 | Review content | link | — | — | Always | Mở trang Review content | static | — | — | TBD (draft) |
| E03 | User | link | — | — | Always | Mở trang User (tên nhãn "User" hay "Role" chưa chốt) | static | — | — | TBD (draft) |
| E04 | Settings | link | — | — | Always | Mở trang Settings | static | — | — | TBD (draft) |
| E05 | Back to Sunner area | link | — | — | Always | Quay về khu Sunner | static | — | — | TBD (draft) |
| E06 | Avatar | button | — | Chữ cái đầu tên nếu chưa có ảnh | Always | Mở menu tài khoản | API field | ảnh tròn | placeholder text | TBD (draft) |
| E07 | Language switcher | button | — | Ngôn ngữ hiện tại | Always | Mở danh sách ngôn ngữ | store state | mã VN hoặc EN | — | TBD (draft) |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chuyển mục Admin | E01–E04 | click | — | Nội dung R2 đổi, mục đó được đánh dấu | TBD (draft) |
| Mở menu tài khoản | E06 | click | — | Hiện menu tài khoản như khung chung | TBD (draft) |
| Đổi ngôn ngữ | E07 | click | — | Chữ đổi ngay | TBD (draft) |

### Happy Path

1. Admin vào khu Admin và thấy menu bốn mục ở R1.
2. Admin bấm "Review content" — nội dung R2 chuyển sang trang đó, mục này được đánh dấu.
3. Admin bấm E05 để quay về khu Sunner.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Admin vừa bị hạ role | Hiện trang 403 thay cho nội dung | TBD (draft) |

### Interaction Notes

- **Mục của trang Admin đang mở được đánh dấu** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải thông tin Admin | Avatar hiện khung chờ | none | TBD (draft) |
| empty | Chưa có ảnh đại diện | Hiện chữ cái đầu | mở menu | TBD (draft) |
| error | Không tải được thông tin người dùng | Avatar hiện chữ cái đầu, menu Admin vẫn dùng được | tải lại trang | TBD (draft) |
| saving | Đang đổi ngôn ngữ | Nút E07 vô hiệu ngắn | none | TBD (draft) |
| success | Đổi ngôn ngữ xong | Chữ hiện bằng ngôn ngữ mới | dùng tiếp | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR003_AppLayout | Bấm Admin Dashboard trong menu avatar | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Chuyển mục Admin | E01–E04 | — | TBD (draft) — các trang Admin | redirect | TBD (draft) |
| Quay về khu Sunner | E05 | — | TBD (draft) — SCR003_AppLayout | redirect | TBD (draft) |
| Không đủ quyền | — | Guard từ chối | TBD (draft) — SCR004_Error403 | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Menu Admin có nhãn vùng điều hướng, mục đang chọn được đánh dấu |
| Keyboard navigation | [EXPECTED] | Tab qua các mục menu theo thứ tự hiển thị |
| Focus management | [EXPECTED] | Menu avatar trả focus về nút khi đóng |
| Screen reader compatibility | [EXPECTED] | Có vùng landmark cho menu và nội dung |
| Error announcement | [EXPECTED] | Lỗi được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
