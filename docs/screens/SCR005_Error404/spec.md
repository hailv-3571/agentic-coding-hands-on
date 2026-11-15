---
status: draft
authored_by: takumi
fcode: F002
created: 2026-11-08
lang: vi
---

# SCR005_Error404 — Screen Spec

**Screen**: SCR005_Error404: Not Found Page
**Feature**: F002_AppShell
**Type**: atomic
**Route**: Mọi địa chỉ không khớp trang nào (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Báo cho người dùng biết địa chỉ vừa vào không tồn tại và đưa họ quay về trang chính.
**Actors:** Sunner, Admin, Khách chưa đăng nhập
**Entry Conditions:** Người dùng mở một địa chỉ không tồn tại.
**Exit Conditions:** Người dùng bấm nút quay về.

## 2. Screen Layout

### Layout Sketch

Một khối căn giữa gồm hình minh hoạ hoặc mã 404, tiêu đề, một dòng giải thích và nút quay về. Có hiện header/footer hay không phụ thuộc quyết định D005 ở functional-spec. Chi tiết hình ảnh chưa đọc từ frame thiết kế `[UNVERIFIED]`.

```
┌─────────────────────────────┐
│ R1: Page Wrapper            │
│   ┌───────────────────────┐ │
│   │ R2: Error Message     │ │
│   │ 404 / tiêu đề / giải  │ │
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
| E01 | Mã 404 / hình minh hoạ | image | — | — | Always | — | static | — | — | N/A |
| E02 | Tiêu đề lỗi | message | — | — | Always | — | static | — | — | N/A |
| E03 | Giải thích | message | — | — | Always | — | static | — | — | N/A |
| E04 | Về trang chủ | button | — | Enabled | Always | Quay về trang chính (khách thì tới đăng nhập, theo D005) | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Quay về | E04 | click | — | Rời trang lỗi | TBD (draft) |

### Happy Path

1. Người dùng thấy trang 404 ở R2.
2. Người dùng bấm E04 để quay về.

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
| external | Gõ hoặc theo một địa chỉ không tồn tại | — | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Quay về | E04 | Đã đăng nhập | TBD (draft) — trang chính | redirect | TBD (draft) |
| Quay về | E04 | Chưa đăng nhập | TBD (draft) — trang đăng nhập | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Tiêu đề lỗi là tiêu đề chính của trang |
| Keyboard navigation | [EXPECTED] | Nút quay về nhận focus bằng Tab |
| Focus management | [EXPECTED] | Focus đặt vào nội dung chính khi trang tải |
| Screen reader compatibility | [EXPECTED] | Nội dung lỗi đọc được theo thứ tự tiêu đề, giải thích, nút |
| Error announcement | [EXPECTED] | Không áp dụng cho form; nội dung lỗi là nội dung chính của trang |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
