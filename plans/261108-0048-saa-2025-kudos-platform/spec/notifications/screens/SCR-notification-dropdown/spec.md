---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-notification-dropdown — Screen Spec

**Screen**: SCR-notification-dropdown: View thông báo (frame 589:9152)
**Feature**: F013_Notifications
**Type**: composite
**Route**: — (không có route riêng; là bảng thả xuống mở từ chuông ở header của SCR-app-layout do F002_AppShell sở hữu; route của các trang chứa header: TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner bấm chuông ở header để xem nhanh các thông báo mới nhất và đi thẳng tới đối tượng liên quan mà không rời trang đang dùng.
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập; đang ở trang nào có header của ứng dụng; bấm chuông thông báo.
**Exit Conditions:** Sunner bấm một thông báo (đi tới đối tượng liên quan), bấm "Xem tất cả" (sang trang tất cả thông báo), hoặc đóng bảng bằng cách bấm ra ngoài hoặc nhấn Esc.

## 2. Screen Layout

### Layout Sketch

Bảng thả xuống bám dưới chuông, nằm trên nội dung trang. Phần đầu có tiêu đề "Thông báo" bên trái, liên kết "Xem tất cả" và biểu tượng ≡ bên phải; bên dưới là danh sách dòng thông báo mới nhất trước, mỗi dòng gồm biểu tượng theo loại, nội dung và thời gian tương đối, dòng chưa đọc có chấm đỏ ở bên phải, dòng đang trỏ chuột được làm nổi. Kích thước, vị trí mũi tên chỉ về chuông, và cách cuộn khi danh sách dài theo ảnh chụp frame 589:9152, chưa đối chiếu chi tiết [UNVERIFIED].

```
   [chuông ●]   <- slot chuông của header (F002)
 ┌──────────────────────────────────────┐
 │ R1: Đầu bảng                         │
 │  Thông báo        Xem tất cả   [≡]   │
 ├──────────────────────────────────────┤
 │ R2: Danh sách thông báo (scrollable) │
 │  [icon] Nội dung ...         ●       │
 │         15 phút trước                │
 │  [icon] Nội dung ...                 │
 │         1 giờ trước                  │
 │  ...                                 │
 └──────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Đầu bảng | static | no | TBD (draft) |
| R2 | Danh sách thông báo | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Chuông thông báo (chấm đỏ khi còn chưa đọc) | button | — | Enabled | Always | Mở hoặc đóng bảng thông báo | API field | chấm đỏ khi số chưa đọc lớn hơn 0 | hidden | TBD (draft) |
| E02 | Thông báo | region label | — | — | Always | — | static | — | — | N/A |
| E03 | Xem tất cả | link | — | Enabled | Always | Mở trang tất cả thông báo | static | — | — | N/A |
| E04 | Biểu tượng ≡ (đánh dấu đọc tất cả) | button | — | Enabled | Always | Đánh dấu mọi thông báo đã đọc | static | — | — | N/A |
| E05 | Dòng thông báo | list | — | — | Always | Mở đối tượng liên quan và đánh dấu dòng đã đọc | API field | xem E06 đến E09 | dash | TBD (draft) |
| E06 | Biểu tượng loại thông báo | image | — | — | Always | — | API field | theo loại, xem § 7 | hidden | TBD (draft) |
| E07 | Nội dung thông báo | display field | — | — | Always | — | API field | câu theo loại và ngôn ngữ đang chọn, xem § 7; phần nhấn mạnh in đậm [UNVERIFIED] | dash | TBD (draft) |
| E08 | Thời gian tương đối | display field | — | — | Always | — | computed | "15 phút trước", "1 giờ trước", "1 ngày trước", "1 tuần trước", "1 tháng trước"; dưới 1 phút là "Vừa xong" [INFERRED] | dash | TBD (draft) |
| E09 | Chấm đỏ chưa đọc | image | — | Ẩn | Conditional | — | API field | chấm đỏ ở bên phải dòng | hidden | TBD (draft) |
| E10 | Liên kết "Tiêu chuẩn cộng đồng" trong dòng Kudo bị tạm ẩn | link | — | Enabled | Conditional | Mở trang Tiêu chuẩn cộng đồng | static | — | — | N/A |
| E11 | Trạng thái trống | message | — | Ẩn | Conditional | — | static | "Bạn chưa có thông báo nào" [INFERRED] | — | N/A |
| E12 | Trạng thái lỗi kèm thử lại | message | — | Ẩn | Conditional | Thử lại | static | "Không tải được thông báo. Vui lòng thử lại." | — | N/A |

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở bảng thông báo | E01 | click chuông | — | Bảng hiện ra ở R1, R2 với 10 thông báo mới nhất [INFERRED] | TBD (draft) |
| Đóng bảng | E01 | click chuông, click ra ngoài, hoặc nhấn Esc | Bảng đang mở | Bảng đóng | TBD (draft) |
| Đánh dấu đọc tất cả | E04 | click | Còn thông báo chưa đọc | Mọi chấm đỏ ở E09 và trên E01 biến mất ngay | TBD (draft) |
| Mở thông báo | E05 | click dòng | — | Dòng thành đã đọc (E09 mất) trong lúc đi tới đối tượng | TBD (draft) |
| Thử lại | E12 | click | Nạp danh sách lỗi | Nạp lại danh sách | TBD (draft) |

### Happy Path

1. Sunner thấy chuông có chấm đỏ và bấm chuông.
2. Bảng mở ở R1, R2: dòng mới nhất ở trên cùng, dòng chưa đọc có chấm đỏ bên phải.
3. Sunner trỏ chuột qua một dòng, dòng được làm nổi.
4. Sunner bấm dòng: chấm đỏ của dòng mất và Sunner được đưa tới đối tượng liên quan.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| 2 | Chưa có thông báo nào | R2 hiện trạng thái trống E11 | TBD (draft) |
| 2 | Nạp danh sách lỗi | R2 hiện E12 kèm thử lại, chuông vẫn hoạt động | TBD (draft) |
| bất kỳ lúc nào bảng đang mở | Có thông báo mới tới | Dòng mới hiện ở đầu R2, chấm đỏ cập nhật | TBD (draft) |
| 4 | Dòng là Kudo bị tạm ẩn và Sunner bấm liên kết E10 | Mở trang Tiêu chuẩn cộng đồng, không phải đối tượng mặc định của dòng | TBD (draft) |

### Interaction Notes

- **Thông báo mới tới khi bảng đang mở thì hiện ngay ở đầu danh sách, không cần mở lại** — source: TBD (draft)
- **Thông báo tim gộp: số tim tăng thì dòng nhảy lên đầu** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở bảng, đang lấy danh sách | khung chờ cho vài dòng | none | TBD (draft) |
| empty | Không có thông báo | E11 | đóng bảng | TBD (draft) |
| error | Lỗi mạng hoặc máy chủ | E12 | thử lại | TBD (draft) |
| saving | Đang đánh dấu đọc tất cả | chấm đỏ mất ngay (lạc quan), E04 tạm khoá | none | TBD (draft) |
| success | Đánh dấu xong | mọi dòng thành đã đọc, chuông hết chấm đỏ | đóng bảng | TBD (draft) |
| live-update | Có thông báo mới khi bảng mở | dòng mới hiện đầu danh sách | click dòng | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected. Lỗi mạng khi đánh dấu đọc tất cả không có thông báo riêng: chấm đỏ trở lại ở lần nạp kế và Sunner bấm lại được.

## 7. Conditional UI

Biến thể nội dung theo loại thông báo, dùng chung cho cả `SCR-all-notifications`. Mỗi loại có biểu tượng, câu chữ tiếng Việt theo ảnh thiết kế và đích đến khi bấm; bản tiếng Anh dựng từ cùng loại và dữ kiện, câu chữ chưa có [NEEDS_DOMAIN_CONFIRMATION].

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nhận Kudo mới | configuration | E06, E07 | thông báo loại Kudo mới nhận | loại khác | Biểu tượng thư. "{Tên Sunner} vừa gửi đến bạn lời ghi nhận đầy yêu thương!" Đích: chi tiết Kudo |
| Nhận Kudo mới do người gửi ẩn danh | configuration | E07 | Kudo ẩn danh | Kudo có tên | Không bao giờ hiện tên người gửi; câu "Một Sunner ẩn danh vừa gửi đến bạn lời ghi nhận đầy yêu thương!" [INFERRED] |
| Kudo của mình được thả tim | configuration | E06, E07 | thông báo loại tim | loại khác | Biểu tượng tim kèm dấu cộng. "Wow! Lời nhắn gửi của bạn cho Sunner {tên người nhận} vừa nhận thêm lượt tim!" Đích: chi tiết Kudo |
| Tim đã gộp từ hai tim trở lên | configuration | E07 | số tim lớn hơn 1 | số tim bằng 1 | Câu có số tim, ví dụ "...vừa nhận thêm {số} lượt tim!" [INFERRED] |
| Có Secret Box mới | configuration | E06, E07 | thông báo loại Secret Box | loại khác | Biểu tượng quà. "Chúc mừng! Bạn vừa nhận được lượt mở Secret Box mới! Click vào đây để mở ngay nhé!" Đích: màn mở hộp |
| Lên cấp Hero | configuration | E06, E07 | thông báo loại lên cấp | loại khác | Biểu tượng sao. "Bạn nhận được {số} lời nhắn gửi từ đồng nghiệp và thăng hạng {tên cấp}! Tiếp tục lan tỏa năng lượng tích cực đến đồng nghiệp nhé!" Đích: profile của chính mình [NEEDS_DOMAIN_CONFIRMATION] |
| Kudo bị tạm ẩn | configuration | E06, E07, E10 | thông báo loại tạm ẩn | loại khác | Biểu tượng cảnh báo. "Tiếc quá! Bạn có một lời nhắn bị tạm ẩn vì "vướng" một số tiêu chuẩn! Hãy xem các tiêu chuẩn và gửi lại cho đồng đội nhé!" kèm liên kết "Tiêu chuẩn cộng đồng". Đích: trang Tiêu chuẩn cộng đồng |
| Gom đủ 6 icon | configuration | E06, E07 | thông báo loại đủ bộ | loại khác | Biểu tượng danh sách tick. "Chúc mừng bạn đã thu thập đủ 6 huy hiệu của SAA. Bạn đã nhận được phần quà từ BTC chính là {tên quà}. BTC sẽ liên hệ để gửi quà đến bạn vào cuối sự kiện." Đích: profile của chính mình [NEEDS_DOMAIN_CONFIRMATION] |
| Kudos Quốc Dân | configuration | E06, E07 | thông báo loại Kudos Quốc Dân | loại khác | Thiết kế chưa có biểu tượng và câu chữ [NEEDS_DOMAIN_CONFIRMATION]; đích: chi tiết Kudo xếp hạng cao nhất |
| Dòng chưa đọc | configuration | E09 | chưa đọc | đã đọc | Chấm đỏ bên phải; mất khi bấm dòng hoặc đọc tất cả |
| Chuông có thông báo chưa đọc | configuration | E01 | số chưa đọc lớn hơn 0 | bằng 0 | Chấm đỏ trên chuông (D002 mặc định: chấm, không hiện số) |

## 8. Navigation

> `## 8. Navigation` là bản chiếu theo từng màn của `screen-flow.md § Screen Access Paths`; chưa có screen-flow nên mọi dòng dưới đây là dự kiến và đích chưa có route là `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-app-layout (F002) | Bấm chuông ở header | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Xem tất cả | E03 | — | SCR-all-notifications | chuyển trang | TBD (draft) |
| Mở thông báo Kudo mới hoặc tim | E05 | thông báo loại Kudo mới nhận hoặc tim | SCR-kudo-detail (F004) | chuyển trang | TBD (draft) |
| Mở thông báo Secret Box | E05 | thông báo loại Secret Box | SCR-secret-box-open (F010) | mở modal | TBD (draft) |
| Mở thông báo lên cấp hoặc đủ bộ | E05 | thông báo loại lên cấp Hero hoặc đủ 6 icon | profile của chính mình (F012, TBD (draft)) | chuyển trang | TBD (draft) |
| Mở thông báo Kudo bị tạm ẩn hoặc bấm liên kết | E05, E10 | thông báo loại tạm ẩn | SCR-community-standards (F006) | chuyển trang | TBD (draft) |
| Mở thông báo Kudos Quốc Dân | E05 | thông báo loại Kudos Quốc Dân | SCR-kudo-detail (F004) | chuyển trang | TBD (draft) |
| Đóng bảng | E01 | — | (stays on screen) | bảng đóng | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Chuông có nhãn đọc được kèm trạng thái "có thông báo chưa đọc"; bảng là vùng có tiêu đề; dòng chưa đọc có thể đọc ra là chưa đọc, không chỉ dựa vào màu chấm đỏ |
| Keyboard navigation | [EXPECTED] | Mở bằng Enter hoặc Space trên chuông; Tab đi qua các dòng; Enter mở dòng; Esc đóng bảng |
| Focus management | [EXPECTED] | Mở bảng thì tiêu điểm vào bảng; đóng thì trả về chuông |
| Screen reader compatibility | [EXPECTED] | Dòng mới tới khi bảng mở được báo bằng vùng thông báo lịch sự, không ngắt lời |
| Error announcement | [EXPECTED] | Trạng thái lỗi E12 được đọc ra |

## 10. Responsive Behavior

N/A — no responsive behavior found in source. Kích thước và vị trí bảng trên màn hình nhỏ và máy tính bảng chưa quyết định (TBD (draft)).
