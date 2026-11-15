---
status: draft
authored_by: takumi
fcode: F002
created: 2026-11-08
lang: vi
---

# SCR004_Error403 — Screen Spec

**Screen**: SCR004_Error403: Forbidden Page
**Feature**: F002_AppShell
**Type**: atomic
**Route**: Hiện khi người dùng đã đăng nhập nhưng không đủ quyền vào khu vừa mở (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Báo cho Sunner biết họ không có quyền vào khu vừa mở và đưa họ quay về trang chính.
**Actors:** Sunner
**Entry Conditions:** Người dùng đã đăng nhập nhưng không đủ quyền với khu vừa mở, ví dụ khu Admin.
**Exit Conditions:** Người dùng bấm nút quay về.

## 2. Screen Layout

### Layout Sketch

Một khối căn giữa gồm mã 403, tiêu đề, một dòng giải thích và nút quay về. Không hiện bất kỳ nội dung nào của khu bị chặn. Có dùng header/footer hay không theo D005 ở functional-spec; chi tiết hình ảnh chưa đọc từ frame thiết kế `[UNVERIFIED]`.

```
┌─────────────────────────────┐
│ R1: Page Wrapper            │
│   ┌───────────────────────┐ │
│   │ R2: Error Message     │ │
│   │ 403 / tiêu đề / giải  │ │
│   │ thích / [Về trang chủ]│ │
│   └───────────────────────┘ │
└─────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Wrapper | static | no | TBD (draft) |
| R2 | Error Message | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Mã 403 / hình minh hoạ | image | — | — | Always | — | static | — | — | N/A |
| E02 | Tiêu đề lỗi | message | — | — | Always | — | static | — | — | N/A |
| E03 | Giải thích: "Bạn không có quyền truy cập trang này." | message | — | — | Always | — | static | — | — | N/A |
| E04 | Về trang chủ | button | — | Enabled | Always | Quay về trang chính | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Quay về | E04 | click | — | Rời trang lỗi | TBD (draft) |

### Happy Path

1. Sunner thấy trang 403 ở R2, không có nội dung nào của khu Admin.
2. Sunner bấm E04 để quay về.

## 5. UI States

N/A — no async ops

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR002_AdminLayout | Mở một trang Admin | Không đủ quyền | TBD (draft) |
| external | Gõ địa chỉ khu Admin | Không đủ quyền | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Quay về | E04 | — | TBD (draft) — trang chính | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Tiêu đề lỗi là tiêu đề chính của trang |
| Keyboard navigation | [EXPECTED] | Nút quay về nhận focus bằng Tab |
| Focus management | [EXPECTED] | Focus đặt vào nội dung chính khi trang tải |
| Screen reader compatibility | [EXPECTED] | Nội dung đọc được theo thứ tự tiêu đề, giải thích, nút |
| Error announcement | [EXPECTED] | Không áp dụng cho form; nội dung lỗi là nội dung chính của trang |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
