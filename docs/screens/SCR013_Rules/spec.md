---
status: draft
authored_by: takumi
fcode: F006
created: 2026-11-08
lang: vi
---

# SCR013_Rules — Screen Spec

**Screen**: SCR013_Rules: Thể lệ
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /rules
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho Sunner đọc thể lệ: bậc huy hiệu Hero, luật Secret Box và Kudos Quốc Dân. Màn chỉ hiển thị chữ mô tả, luật do feature khác tính.
**Actors:** Sunner, Admin
**Entry Conditions:** Đã có phiên đăng nhập và giờ máy chủ đã qua `LAUNCH_AT` (Admin vào được trước đó).
**Exit Conditions:** Bấm "Đóng" (về trang trước cùng origin, không có thì về `/`), bấm "Viết KUDOS" (tới `/kudos`), hoặc rời qua header.

## 2. Screen Layout

### Layout Sketch

Khung bên phải rộng 553px (kín chiều ngang trên điện thoại) trên nền keyvisual Live board làm tối, giống trang chi tiết Kudo (Figma 3204:6051, quyết định 2026-11-17). Trong khung: tiêu đề "Thể lệ", bậc huy hiệu Hero, luật Secret Box, Kudos Quốc Dân, và hai nút "Đóng" / "Viết KUDOS" ở đáy. Header và footer do khung chung cấp (F002_AppShell).

```
┌──────────────────┬──────────────────────┐
│ R1: keyvisual    │ R2: Rules Panel 553px│
│ (làm tối)        │  Thể lệ              │
│                  │  huy hiệu · Secret   │
│                  │  Box · Kudos Quốc Dân│
│                  │  [Đóng] [Viết KUDOS] │
└──────────────────┴──────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Background | static | no | `LiveBoardKeyvisualBackground` (`dimmed`) |
| R2 | Rules Panel | static | no | `RulesPanel` (`features/awards-portal/components/rules-panel.tsx`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề Thể lệ | message | — | — | Always | — | static | — | hidden | N/A |
| E02 | Huy hiệu Hero: 1–4 Kudos là New, 5–9 là Rising, 10–20 là Super, trên 20 là Legend | list | — | 4 bậc | Always | — | static | — | hidden | N/A |
| E03 | Luật Secret Box: 5 tim = 1 Secret Box, thu đủ 6 biểu tượng nhận quà bí ẩn | text | — | — | Always | — | static | — | hidden | N/A |
| E04 | Kudos Quốc Dân: 5 Kudos nhiều tim nhất | text | — | — | Always | — | static | — | hidden | N/A |

Nội dung đầy đủ của từng mục chờ bản chữ từ BTC (D007); bốn dòng trên là các điểm chính đã nắm được.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đóng | nút "Đóng" | click | — | Về trang trước nếu có lịch sử cùng origin, không thì về `/` | decision-log 2026-11-17 |
| Viết KUDOS | nút "Viết KUDOS" | click | — | Tới Live board `/kudos` | decision-log 2026-11-17 |

### Happy Path

1. Người dùng mở trang và thấy khung Thể lệ ở R2.
2. Người dùng đọc ba nhóm luật rồi bấm "Đóng" hoặc "Viết KUDOS".

### Branches

N/A — single-action screen, no branches

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong | Toàn bộ chữ hiện sẵn, không chờ dữ liệu | Cuộn | TBD (draft) |
| image-error | Ảnh huy hiệu hoặc hero lỗi | Khung thay thế, chữ vẫn đọc được | Cuộn | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-app-layout (footer) | Mục "Thể lệ" trong footer | Đã đăng nhập, sau `LAUNCH_AT` (Admin mọi lúc) | `features/app-shell/components/app-footer.tsx` |
| external | Mở thẳng địa chỉ | Sau giờ mở | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đóng | nút "Đóng" | — | Trang trước, hoặc TBD (draft) — SCR012_Homepage | navigate | decision-log 2026-11-17 |
| Viết KUDOS | nút "Viết KUDOS" | — | TBD (draft) — SCR008_KudosLiveBoardFeed | navigate | decision-log 2026-11-17 |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Tiêu đề phân cấp cho từng nhóm luật; ảnh huy hiệu có chữ thay thế |
| Keyboard navigation | [EXPECTED] | Cuộn bằng bàn phím; không có điều khiển riêng |
| Focus management | [EXPECTED] | Không có bẫy focus |
| Screen reader compatibility | [EXPECTED] | Danh sách bậc huy hiệu đọc được theo thứ tự |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2 | Nội dung xếp một cột, không cuộn ngang | TBD (draft) |
