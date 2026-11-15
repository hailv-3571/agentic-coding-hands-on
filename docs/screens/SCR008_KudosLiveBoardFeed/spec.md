---
status: draft
authored_by: takumi
fcode: F004
created: 2026-11-08
lang: vi
---

# SCR008_KudosLiveBoardFeed — Screen Spec

**Screen**: SCR008_KudosLiveBoardFeed: Live board — Highlight Kudos và All Kudos
**Feature**: F004_KudosFeed
**Type**: composite
**Route**: TBD (draft)
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem các Kudo công khai: carousel Highlight (lọc Hashtag, Phòng ban), feed All Kudos và ô tìm profile Sunner, khi vào mục "Sun* Kudos".
**Actors:** Sunner, Chủ Kudo
**Entry Conditions:** Đã đăng nhập bằng email công ty; mở mục "Sun* Kudos" trên header.
**Exit Conditions:** Sunner rời sang chi tiết Kudo, profile Sunner, luồng sửa Kudo, hoặc trang khác qua header.

## 2. Screen Layout

### Layout Sketch

Trang Live board gồm header chung, vùng Highlight (tiêu đề, hai dropdown lọc, carousel, chỉ số trang), ô tìm Sunner, vùng All Kudos (danh sách thẻ + nút "Tải thêm") và footer chung. Các vùng Spotlight Board, ô gửi lời cảm ơn, cột thống kê cá nhân / danh sách nhận quà thuộc feature khác, ở đây chỉ chừa chỗ (slot). Thứ tự và tỉ lệ các vùng [INFERRED] từ báo cáo phân tích Figma, cần đối chiếu frame Live board 2940:13431 khi triển khai; chưa chốt vị trí của ô tìm Sunner.

```
┌──────────────────────────────────────────────┐
│ R1: Header (F002, fixed-top)                 │
├──────────────────────────────┬───────────────┤
│ R2: Highlight Kudos          │ R6: Cột phải  │
│   [Hashtag ▾] [Phòng ban ▾]  │ (slot F010:   │
│   ‹ carousel ›   n/N         │ thống kê,     │
│ R3: Ô tìm Sunner             │ quà mới nhất) │
│ R4: Slot Spotlight (F008)    │               │
│ R5: All Kudos (feed + Tải    │               │
│     thêm)                    │               │
├──────────────────────────────┴───────────────┤
│ R7: Footer (F002)                            │
└──────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) — thuộc F002 |
| R2 | Highlight Kudos | static | no | TBD (draft) |
| R3 | Ô tìm Sunner | static | no | TBD (draft) |
| R4 | Slot Spotlight Board | static | no | TBD (draft) — thuộc F008 |
| R5 | All Kudos | static | yes | TBD (draft) |
| R6 | Cột phải (slot) | static | no | TBD (draft) — thuộc F010 |
| R7 | Footer | static | no | TBD (draft) — thuộc F002 |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Highlight Kudos (tiêu đề vùng) | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Hashtag | select | no | Tất cả | Always | Lọc Highlight theo hashtag | API field | — | "Tất cả" | TBD (draft) |
| E03 | Phòng ban | select | no | Tất cả | Always | Lọc Highlight theo phòng ban | API field | — | "Tất cả" | TBD (draft) |
| E04 | Carousel Highlight | list | — | Thẻ đầu ở giữa | Always | Chuyển thẻ | API field | — | thông báo trống | TBD (draft) |
| E05 | Nút trước | button | — | Enabled | Always | Về thẻ trước | — | — | — | N/A |
| E06 | Nút sau | button | — | Enabled | Always | Tới thẻ sau | — | — | — | N/A |
| E07 | Chỉ số trang | display field | — | 1/N | Always | — | computed | số hiện tại/tổng | hidden | N/A |
| E08 | Ô tìm Sunner | text input | no | Empty | Always | Gõ để gợi ý | — | raw | placeholder | TBD (draft) |
| E09 | Gợi ý kết quả tìm | list | — | Ẩn | Conditional | Chọn để mở profile | API field | tên, ảnh, phòng ban | thông báo "Không tìm thấy Sunner nào" | TBD (draft) |
| E10 | All Kudos (tiêu đề vùng) | region label | — | — | Always | — | static | — | — | N/A |
| E11 | Thẻ Kudo | list | — | — | Always | Xem trong feed | API field | mới nhất trước | thông báo trống | TBD (draft) |
| E12 | Người gửi (ảnh, tên, phòng ban, huy hiệu Hero) hoặc nhãn "Ẩn danh" | display field | — | — | Always | Bấm tên/ảnh mở profile (bài không ẩn danh) | API field | raw | nhãn "Ẩn danh" | TBD (draft) |
| E13 | Người nhận (ảnh, tên, phòng ban, huy hiệu Hero) | display field | — | — | Always | Bấm tên/ảnh mở profile | API field | raw | dash | TBD (draft) |
| E14 | Thời gian gửi | display field | — | — | Always | — | API field | ngày giờ theo ngôn ngữ đang chọn | dash | TBD (draft) |
| E15 | Danh hiệu | display field | — | — | Always | — | API field | raw | hidden | TBD (draft) |
| E16 | Nội dung lời nhắn | display field | — | — | Always | — | API field | cắt gọn trên thẻ | dash | TBD (draft) |
| E17 | Ảnh đính kèm | image | — | — | Conditional | — | API field | thu nhỏ | hidden | TBD (draft) |
| E18 | Hashtag | display field | — | — | Always | — | API field | dạng "#TÊN" | hidden | TBD (draft) |
| E19 | Số tim / nút tim | button | — | — | Always | Thả tim (hành vi thuộc F005) | API field | số | 0 | TBD (draft) |
| E20 | Copy Link | button | — | Enabled | Always | Sao chép liên kết Kudo | — | — | — | N/A |
| E21 | Xem chi tiết | link | — | Enabled | Always | Mở chi tiết Kudo | — | — | — | N/A |
| E22 | Nút sửa | button | — | Ẩn | Conditional | Mở luồng sửa Kudo (thuộc F003) | — | — | — | N/A |
| E23 | Tải thêm | button | — | Enabled | Conditional | Nạp thêm Kudo cũ hơn | — | — | — | N/A |
| E24 | Thông báo trống / lỗi (kèm thử lại) | message | — | Ẩn | Conditional | Thử lại | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Lọc theo Hashtag | E02 | chọn giá trị | — | Carousel nạp lại, về thẻ đầu | TBD (draft) |
| Lọc theo Phòng ban | E03 | chọn giá trị | — | Carousel nạp lại, về thẻ đầu | TBD (draft) |
| Chuyển thẻ Highlight | E05, E06 | bấm | còn thẻ theo hướng đó | Thẻ giữa đổi, chỉ số E07 cập nhật | TBD (draft) |
| Tìm Sunner | E08 | gõ | có ký tự | E09 hiện gợi ý | TBD (draft) |
| Tải thêm Kudo | E23 | bấm | còn Kudo cũ hơn | Thêm thẻ vào cuối E11 | TBD (draft) |
| Sao chép liên kết | E20 | bấm | — | Liên kết vào bộ nhớ tạm, hiện thông báo ngắn | TBD (draft) |
| Thử lại | E24 | bấm | đang ở trạng thái lỗi | Nạp lại vùng lỗi | TBD (draft) |

### Happy Path

1. Sunner mở Live board và thấy carousel Highlight (R2) với thẻ đầu ở giữa, cùng feed All Kudos (R5).
2. Sunner chọn một Hashtag ở E02; carousel lọc lại và về thẻ đầu.
3. Sunner cuộn tới R5, đọc thẻ, bấm "Tải thêm" (E23) để thấy Kudo cũ hơn.
4. Sunner bấm Copy Link (E20) và thấy thông báo đã sao chép.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Không Kudo nào khớp lọc | R2 hiện thông báo trống, bộ lọc vẫn đổi được | TBD (draft) |
| Bước 3 | Hết Kudo cũ hơn | Nút E23 biến mất | TBD (draft) |
| Bước 4 | Trình duyệt chặn bộ nhớ tạm | Thông báo lỗi kèm liên kết để sao chép tay | TBD (draft) |

### Interaction Notes

- **Đổi bộ lọc luôn đưa carousel về thẻ đầu** — source: TBD (draft)
- **Thẻ Kudo ẩn danh chỉ hiện nhãn "Ẩn danh", không có tên/ảnh người gửi** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang nạp Highlight hoặc feed | Khung chờ (skeleton) ở vùng đang nạp | none | TBD (draft) |
| empty | Không có Kudo (sau lọc hoặc feed trống) | Thông báo "Chưa có Kudo nào phù hợp." | Đổi/bỏ bộ lọc | TBD (draft) |
| error | Nạp thất bại | Thông báo "Không tải được Kudos. Vui lòng thử lại." chỉ ở vùng lỗi | Thử lại | TBD (draft) |
| saving | Đang sao chép liên kết | Không có trạng thái chờ đáng kể (thao tác tức thời) | none | TBD (draft) |
| success | Sao chép xong | Thông báo ngắn "Đã sao chép liên kết" | tự ẩn | TBD (draft) |
| loading-more | Đang nạp thêm feed | Nút "Tải thêm" vô hiệu kèm chỉ báo chờ | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E08 | Từ khoá tối đa 50 ký tự; không gửi tìm khi rỗng | "Không tìm thấy Sunner nào" khi không có kết quả | change |
| E20 | Trình duyệt phải cho ghi bộ nhớ tạm | "Không sao chép được liên kết, vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nút sửa chỉ hiện trên bài của chính người xem | auth | E22 | Người xem là người gửi Kudo | Người xem không phải người gửi | Che ở phía server; FE không tự suy |
| Nút "Tải thêm" chỉ hiện khi còn Kudo cũ hơn | hardcoded-id | E23 | Còn Kudo chưa nạp | Đã nạp hết | — |
| Ảnh đính kèm chỉ hiện khi Kudo có ảnh | hardcoded-id | E17 | Kudo có ảnh | Kudo không có ảnh | — |
| Gợi ý tìm chỉ hiện khi đang gõ | hardcoded-id | E09 | Ô tìm có ký tự | Ô tìm rỗng | — |
| Vùng thông báo trống/lỗi | hardcoded-id | E24 | Không có dữ liệu hoặc nạp lỗi | Có dữ liệu | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| Header chung (F002) | Bấm mục "Sun* Kudos" | Đã đăng nhập | TBD (draft) |
| Homepage (F006) | Bấm banner/nút About Kudos | Đã đăng nhập | TBD (draft) |
| Chi tiết Kudo (SCR007_KudoDetail) | Bấm quay lại Live board | — | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Xem chi tiết | E21 | — | SCR007_KudoDetail (TBD (draft)) | redirect | TBD (draft) |
| Mở profile người nhận/gửi | E12, E13 | Người gửi không ẩn danh | Profile (F012, TBD (draft)) | redirect | TBD (draft) |
| Chọn kết quả tìm | E09 | — | Profile (F012, TBD (draft)) | redirect | TBD (draft) |
| Sửa Kudo | E22 | Chủ Kudo | Luồng sửa Kudo (F003, TBD (draft)) | modal | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Carousel có vai trò và nhãn; nút trước/sau và chỉ số trang có nhãn đọc được |
| Keyboard navigation | [EXPECTED] | Dùng bàn phím cho dropdown, chuyển thẻ, Tải thêm, Copy Link |
| Focus management | [EXPECTED] | Giữ tiêu điểm sau khi đổi bộ lọc và sau khi nạp thêm |
| Screen reader compatibility | [EXPECTED] | Thẻ ẩn danh đọc là "Ẩn danh"; thẻ mờ hai bên không tranh tiêu điểm |
| Error announcement | [EXPECTED] | Thông báo trống, lỗi, sao chép được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.

[NEEDS_DOMAIN_CONFIRMATION] Web desktop + responsive đã quyết, nhưng điểm gãy và bố cục tablet/mobile chưa chốt (câu hỏi bố cục tablet đã có trong danh sách mở chung); cần đối chiếu Figma khi triển khai.
