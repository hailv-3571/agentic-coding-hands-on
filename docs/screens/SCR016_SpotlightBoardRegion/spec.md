---
status: draft
authored_by: takumi
fcode: F008
created: 2026-11-08
lang: vi
---

# SCR016_SpotlightBoardRegion — Screen Spec

**Screen**: SCR016_SpotlightBoardRegion: Spotlight Board — vùng nhúng trong Live board
**Feature**: F008_SpotlightBoard
**Type**: atomic
**Route**: — (không có route riêng; là vùng R4 "Slot Spotlight Board" của trang SCR008_KudosLiveBoardFeed do F004_KudosFeed sở hữu; route của trang: TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem nhanh ai đang được ghi nhận Kudos: đám mây tên người nhận, tổng số Kudos và các dòng sự kiện mới nhất cập nhật trực tiếp, khi cuộn tới giữa Highlight Kudos và All Kudos trên Live board.
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập bằng email công ty; đang ở trang Live board (vùng này không mở riêng).
**Exit Conditions:** Sunner cuộn đi chỗ khác, bấm một tên để sang profile, hoặc rời trang Live board.

> Đây là MỘT VÙNG của màn hình trang Live board (SCR008_KudosLiveBoardFeed, feature F004). Spec này chỉ mô tả vùng Spotlight Board; bố cục trang, Highlight Kudos và All Kudos được mô tả ở spec của F004 và không lặp lại ở đây.

## 2. Screen Layout

### Layout Sketch

Vùng gồm một dòng nhãn phía trên ("Sun* Annual Awards 2025" nhỏ, tiêu đề "SPOTLIGHT BOARD" màu vàng) và một khung tối bo góc rộng đặt trên nền hình ROOT FURTHER. Trong khung: ô tìm "Tìm kiếm" ở góc trên trái, bộ đếm "388 KUDOS" ở giữa trên, đám mây tên rải ở giữa (một số tên khác màu/cỡ), luồng sự kiện xếp chồng ở góc dưới trái (dòng cũ mờ dần) và nút phóng to ở góc dưới phải. Bản mobile của Figma có cùng các phần tử (tên, luồng sự kiện, "388 KUDOS"). Bố cục suy từ ảnh chụp frame Live board 2940:13431 do orchestrator quan sát [INFERRED]; không có số đo điểm ảnh.

```
  Sun* Annual Awards 2025
  SPOTLIGHT BOARD
┌──────────────────────────────────────────────────────┐
│ R2: [Tìm kiếm      ]        R3: 388 KUDOS            │
│                                                      │
│        R4: Đám mây tên (tên to/nhỏ, vài tên nổi)     │
│                                                      │
│ R5: 08:30PM … đã nhận được một Kudos mới   R6: [⤢]   │
│     (dòng cũ mờ dần)                                 │
└──────────────────────────────────────────────────────┘
R1 = dòng nhãn + tiêu đề phía trên khung
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Nhãn và tiêu đề vùng | static | no | TBD (draft) |
| R2 | Ô tìm kiếm | static | no | TBD (draft) |
| R3 | Bộ đếm tổng | static | no | TBD (draft) |
| R4 | Đám mây tên | static | no | TBD (draft) |
| R5 | Luồng sự kiện | static | no | TBD (draft) |
| R6 | Nút phóng to / thu nhỏ | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Sun* Annual Awards 2025 | region label | — | — | Always | — | static | — | — | N/A |
| E02 | SPOTLIGHT BOARD | region label | — | — | Always | — | static | chữ vàng | — | N/A |
| E03 | Tìm kiếm | text input | no | Empty | Always | Gõ để làm nổi tên khớp | — | raw | placeholder "Tìm kiếm" | N/A |
| E04 | Tổng số Kudos | display field | — | 0 | Always | — | API field | "{số} KUDOS" | "0 KUDOS" | TBD (draft) |
| E05 | Tên người nhận (một mục mỗi người) | list | — | — | Always | Bấm để mở profile | API field | cỡ chữ theo số Kudos; một số tên khác màu | thông báo trống (E10) | TBD (draft) |
| E06 | Luồng sự kiện | list | — | — | Always | — | API field | "{giờ} {tên} đã nhận được một Kudos mới"; dòng cũ mờ dần | ẩn | TBD (draft) |
| E07 | Giờ của dòng sự kiện | display field | — | — | Always | — | API field | giờ:phút kiểu 12 giờ, theo giờ trình duyệt (vd 08:30PM) | dash | N/A |
| E08 | Nút phóng to / thu nhỏ | button | — | Phóng to | Always | Vào / thoát toàn màn hình | — | — | — | N/A |
| E09 | Nhãn trạng thái kết nối | message | — | Ẩn | Conditional | Bấm "thử lại" khi lỗi | computed | "Đang kết nối lại…" | — | N/A |
| E10 | Thông báo trống / không tìm thấy / lỗi | message | — | Ẩn | Conditional | Thử lại (khi lỗi) | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Tìm tên | E03 | gõ | có ký tự | Tên khớp nổi lên, tên khác mờ đi; không khớp thì hiện E10 | TBD (draft) |
| Xoá tìm kiếm | E03 | xoá hết chữ | ô đang có chữ | Mọi tên về trạng thái bình thường | TBD (draft) |
| Mở profile | E05 | bấm vào tên | — | Rời vùng sang profile (xem § 8) | TBD (draft) |
| Phóng to | E08 | bấm | đang ở chế độ thường | Vùng chiếm toàn màn hình | TBD (draft) |
| Thu nhỏ | E08 | bấm, hoặc phím Esc | đang phóng to | Vùng về chế độ thường | TBD (draft) |
| Thử lại | E09, E10 | bấm | đang ở trạng thái lỗi | Nạp lại số liệu và nối lại kênh trực tiếp | TBD (draft) |

### Happy Path

1. Sunner cuộn tới vùng SPOTLIGHT BOARD (R1) và thấy bộ đếm (R3), đám mây tên (R4) và vài dòng sự kiện (R5).
2. Một Kudos mới được gửi — bộ đếm tăng 1, tên người nhận to lên hoặc xuất hiện và một dòng mới hiện ở R5.
3. Sunner gõ một tên vào ô "Tìm kiếm" (R2); tên khớp nổi lên, tên khác mờ đi.
4. Sunner bấm nút phóng to (R6) để xem toàn màn hình, rồi bấm Esc để thu lại.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Chưa có Kudo Public nào | "0 KUDOS" và thông báo trống ở R4 | TBD (draft) |
| Bước 2 | Kudo vừa gửi bị đánh dấu spam | Bộ đếm và số của người nhận giảm 1, dòng của nó rời R5 | TBD (draft) |
| Bước 3 | Không tên nào khớp | Đám mây mờ hết kèm "Không tìm thấy tên nào" | TBD (draft) |
| Bước 4 | Trình duyệt từ chối toàn màn hình | Thông báo ngắn "Không thể phóng to bảng.", vùng giữ nguyên | TBD (draft) |

### Interaction Notes

- **Số liệu tự cập nhật, không cần tải lại trang** — source: TBD (draft)
- **Dòng sự kiện chỉ nêu người nhận; không có tên người gửi, kể cả Kudo ẩn danh** — source: TBD (draft)
- **Tên đã đặt giữ nguyên vị trí khi chỉ số đếm đổi, để đám mây không nhảy lung tung** — source: TBD (draft)
- **Khi phóng to, mọi thứ (đếm, tìm, luồng sự kiện) vẫn hoạt động** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang nạp số liệu ban đầu | Khung tối với khung chờ (skeleton) cho bộ đếm, đám mây, luồng sự kiện | none | TBD (draft) |
| empty | Chưa có Kudo Public | "0 KUDOS" và thông báo "Chưa có Kudos nào để vinh danh." | none | TBD (draft) |
| error | Nạp ban đầu thất bại | Thông báo "Không tải được Spotlight Board. Vui lòng thử lại." chỉ trong vùng | Thử lại | TBD (draft) |
| reconnecting | Mất kết nối trực tiếp | Nhãn "Đang kết nối lại…" (E09); số liệu cũ vẫn hiện | none | TBD (draft) |
| live-failed | Nối lại thất bại nhiều lần | "Không cập nhật được trực tiếp. Bấm để thử lại."; số liệu cuối vẫn hiện | Thử lại | TBD (draft) |
| search-no-match | Gõ chữ không khớp tên nào | Đám mây mờ hết, "Không tìm thấy tên nào" | Xoá chữ | TBD (draft) |
| saving | Không có thao tác ghi dữ liệu trên vùng này | Không áp dụng | none | TBD (draft) |
| success | Không có thao tác ghi dữ liệu trên vùng này | Không áp dụng; phóng to/thu nhỏ thực hiện tức thì | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E03 | Tối đa 50 ký tự; so khớp không phân biệt hoa thường và dấu | "Không tìm thấy tên nào" khi không khớp | change |
| E08 | Trình duyệt phải cho vào toàn màn hình | "Không thể phóng to bảng." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nhãn trạng thái kết nối chỉ hiện khi kênh trực tiếp không ổn | hardcoded-id | E09 | Đang kết nối lại hoặc lỗi | Đang chạy bình thường | — |
| Thông báo trống/không tìm thấy/lỗi chỉ hiện khi cần | hardcoded-id | E10 | Không có Kudo, không khớp, hoặc nạp lỗi | Có dữ liệu và có khớp | — |
| Vài tên được tô màu nổi | hardcoded-id | E05 | Tên thuộc nhóm nổi bật theo quy tắc chờ xác nhận | Tên thường | [NEEDS_DOMAIN_CONFIRMATION] quy tắc cỡ và màu nổi chưa chốt |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR008_KudosLiveBoardFeed (F004), vùng R4 | Cuộn tới vùng (vùng nhúng, không phải bước điều hướng riêng) | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở profile | E05 | Sunner bấm một tên | Profile (F012, TBD (draft)) | redirect | TBD (draft) |
| Phóng to / thu nhỏ | E08 | — | (stays on screen) | toàn màn hình | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Vùng có nhãn "Spotlight Board"; bộ đếm, nút phóng to và ô tìm có nhãn đọc được |
| Keyboard navigation | [EXPECTED] | Tên trong đám mây tới được bằng Tab và mở bằng Enter; nút phóng to dùng được bằng bàn phím; Esc thoát toàn màn hình |
| Focus management | [EXPECTED] | Giữ tiêu điểm trên nút sau khi vào/ra toàn màn hình; không cướp tiêu điểm khi có sự kiện mới |
| Screen reader compatibility | [EXPECTED] | Luồng sự kiện là vùng thông báo lịch sự (không ngắt lời đang đọc); bộ đếm đọc kèm đơn vị "Kudos" |
| Error announcement | [EXPECTED] | Nhãn "Đang kết nối lại…", thông báo lỗi và "Không tìm thấy tên nào" được đọc tự động; tôn trọng tuỳ chọn giảm chuyển động của hệ điều hành cho hiệu ứng mờ dần/nhảy số |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2, R3, R4, R5 | Frame mobile [iOS] Sun*Kudos trong Figma có cùng tên, luồng sự kiện và "388 KUDOS"; cách sắp xếp chi tiết chưa rõ [INFERRED] | TBD (draft) |

[NEEDS_DOMAIN_CONFIRMATION] Điểm gãy và bố cục tablet/mobile của vùng chưa chốt (câu hỏi bố cục tablet đã có trong danh sách mở chung); cần đối chiếu Figma khi triển khai.
