---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-rules — Screen Spec

**Screen**: SCR-rules: Thể lệ
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /rules (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho Sunner đọc thể lệ: bậc huy hiệu Hero, luật Secret Box và Kudos Quốc Dân. Màn chỉ hiển thị chữ mô tả, luật do feature khác tính.
**Actors:** Sunner, Admin
**Entry Conditions:** Đã có phiên đăng nhập và giờ máy chủ đã qua giờ mở.
**Exit Conditions:** Người dùng rời qua header hoặc liên kết trong trang.

## 2. Screen Layout

### Layout Sketch

Hero ở đầu, rồi các mục nội dung xếp dọc: huy hiệu Hero theo bậc, luật Secret Box, Kudos Quốc Dân. Header và footer do khung chung cấp (F002_AppShell). Bố cục và hình huy hiệu chưa đối chiếu từ frame `[UNVERIFIED]`.

```
┌─────────────────────────────────────────┐
│ R1: Hero                                │
├─────────────────────────────────────────┤
│ R2: Rule Content (scrollable)           │
│   huy hiệu · Secret Box · Kudos Quốc Dân│
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Hero | static | no | TBD (draft) |
| R2 | Rule Content | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Hero và tiêu đề Thể lệ | image | — | — | Always | — | static | — | hidden | N/A |
| E02 | Huy hiệu Hero: 1–4 Kudos là New, 5–9 là Rising, 10–20 là Super, trên 20 là Legend | list | — | 4 bậc | Always | — | static | — | hidden | N/A |
| E03 | Luật Secret Box: 5 tim = 1 Secret Box, thu đủ 6 biểu tượng nhận quà bí ẩn | text | — | — | Always | — | static | — | hidden | N/A |
| E04 | Kudos Quốc Dân: 5 Kudos nhiều tim nhất | text | — | — | Always | — | static | — | hidden | N/A |

Nội dung đầy đủ của từng mục chờ bản chữ từ BTC (D007); bốn dòng trên là các điểm chính đã nắm được.

## 4. User Actions

### Available Actions

N/A — no elements carry a discrete user-triggered action.

### Happy Path

1. Người dùng mở trang và thấy hero ở R1.
2. Người dùng cuộn R2 để đọc ba nhóm luật.

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
| TBD (draft) — SCR-app-layout | Liên kết điều hướng tới Thể lệ (vị trí chưa chốt) | — | TBD (draft) |
| external | Mở thẳng địa chỉ | Sau giờ mở | TBD (draft) |

### Exits

N/A — this screen has no exits (terminal screen).

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
