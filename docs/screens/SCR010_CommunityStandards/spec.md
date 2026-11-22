---
status: draft
authored_by: takumi
fcode: F006
created: 2026-11-08
lang: vi
---

# SCR010_CommunityStandards — Screen Spec

**Screen**: SCR010_CommunityStandards: Tiêu chuẩn cộng đồng
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /community-standards
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho Sunner đọc tiêu chuẩn cộng đồng của SAA 2025, trong đó có Tiêu chuẩn bảo mật.
**Actors:** Sunner, Admin
**Entry Conditions:** Đã có phiên đăng nhập và giờ máy chủ đã qua giờ mở.
**Exit Conditions:** Người dùng rời qua header hoặc liên kết trong trang.

## 2. Screen Layout

### Layout Sketch

Hero hoặc tiêu đề ở đầu, rồi nội dung dạng bài viết dài chia mục, có mục "Tiêu chuẩn bảo mật". Header và footer do khung chung cấp (F002_AppShell). Dưới header trong suốt là keyvisual Live board và logo ROOT FURTHER (451×200), rồi nội dung chữ (Figma 1161:8944).

```
┌─────────────────────────────────────────┐
│ R1: Title                               │
├─────────────────────────────────────────┤
│ R2: Standards Content (scrollable)      │
│   ... · Tiêu chuẩn bảo mật              │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Title | static | no | TBD (draft) |
| R2 | Standards Content | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề Tiêu chuẩn cộng đồng | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Nội dung tiêu chuẩn cộng đồng | text | — | — | Always | — | static | — | hidden | N/A |
| E03 | Tiêu chuẩn bảo mật | text | — | — | Always | — | static | — | hidden | N/A |

Nội dung chữ đầy đủ chờ bản từ BTC (D007).

## 4. User Actions

### Available Actions

N/A — no elements carry a discrete user-triggered action.

### Happy Path

1. Người dùng mở trang và thấy tiêu đề ở R1.
2. Người dùng cuộn R2 để đọc, gồm mục Tiêu chuẩn bảo mật.

### Branches

N/A — single-action screen, no branches

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong | Toàn bộ chữ hiện sẵn, không chờ dữ liệu | Cuộn | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR006_WriteKudoModal | Liên kết tới tiêu chuẩn cộng đồng (nếu có, chưa chốt) | — | TBD (draft) |
| external | Mở thẳng địa chỉ | Sau giờ mở | TBD (draft) |

### Exits

N/A — this screen has no exits (terminal screen).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Tiêu đề phân cấp cho từng mục |
| Keyboard navigation | [EXPECTED] | Cuộn bằng bàn phím; không có điều khiển riêng |
| Focus management | [EXPECTED] | Không có bẫy focus |
| Screen reader compatibility | [EXPECTED] | Mục đọc theo thứ tự tiêu đề |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2 | Nội dung xếp một cột, không cuộn ngang | TBD (draft) |
