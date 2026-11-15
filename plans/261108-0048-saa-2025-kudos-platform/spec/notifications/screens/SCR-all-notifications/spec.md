---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-all-notifications — Screen Spec

**Screen**: SCR-all-notifications: Tất cả thông báo (frame 589:9132)
**Feature**: F013_Notifications
**Type**: atomic
**Route**: TBD (draft) — trang riêng trong khu Sunner, mở từ liên kết "Xem tất cả" ở dropdown thông báo
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem lại toàn bộ thông báo của mình, kể cả những thông báo đã trôi khỏi dropdown, và đánh dấu đã đọc hàng loạt.
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập; bấm "Xem tất cả" ở `SCR-notification-dropdown`, hoặc mở thẳng trang.
**Exit Conditions:** Sunner bấm một thông báo để đi tới đối tượng liên quan, hoặc rời trang bằng menu của header.

## 2. Screen Layout

### Layout Sketch

Trong khung của header chung, giữa trang là một khung tối đặt trên nền hình minh hoạ của chiến dịch. Đầu khung có tiêu đề "Thông báo" và hành động "≡ Đánh dấu đọc tất cả"; bên dưới là danh sách dài các dòng thông báo cùng kiểu dòng với dropdown, cuối danh sách có nút "Tải thêm". Chiều rộng khung, độ mờ nền và việc khung có cuộn riêng hay cuộn theo trang theo ảnh chụp frame 589:9132, chưa đối chiếu chi tiết [UNVERIFIED].

```
┌────────────────────────────────────────────┐
│ R1: Header chung (F002)               [●]  │
├────────────────────────────────────────────┤
│        nền hình minh hoạ                   │
│   ┌────────────────────────────────────┐   │
│   │ R2: Đầu khung                      │   │
│   │  Thông báo     [≡ Đánh dấu đọc tất cả] │
│   ├────────────────────────────────────┤   │
│   │ R3: Danh sách thông báo            │   │
│   │  [icon] Nội dung ...          ●    │   │
│   │         15 phút trước              │   │
│   │  ...                               │   │
│   │        [ Tải thêm ]                │   │
│   └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header chung | fixed-top | no | SCR-app-layout (F002) |
| R2 | Đầu khung | static | no | TBD (draft) |
| R3 | Danh sách thông báo | static | yes | TBD (draft) |

## 3. UI Elements

Kiểu dòng thông báo (biểu tượng, nội dung, thời gian, chấm đỏ) và câu chữ theo loại dùng chung với `SCR-notification-dropdown` (§ 3 và § 7 của màn đó); bảng dưới chỉ ghi phần riêng của trang này.

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Thông báo | region label | — | — | Always | — | static | tiêu đề trang | — | N/A |
| E02 | ≡ Đánh dấu đọc tất cả | button | — | Enabled | Always | Đánh dấu mọi thông báo đã đọc | static | — | — | N/A |
| E03 | Dòng thông báo (biểu tượng, nội dung, thời gian tương đối, chấm đỏ chưa đọc) | list | — | — | Always | Mở đối tượng liên quan và đánh dấu dòng đã đọc | API field | giống dòng của dropdown | dash | TBD (draft) |
| E04 | Tải thêm | button | — | Enabled | Conditional | Nạp thêm 20 thông báo cũ hơn [INFERRED] | API field | — | — | N/A |
| E05 | Trạng thái trống | message | — | Ẩn | Conditional | — | static | "Bạn chưa có thông báo nào" [INFERRED] | — | N/A |
| E06 | Trạng thái lỗi kèm thử lại | message | — | Ẩn | Conditional | Thử lại | static | "Không tải được thông báo. Vui lòng thử lại." | — | N/A |
| E07 | Chấm đỏ trên chuông ở header | image | — | Ẩn | Conditional | — | API field | khớp số chưa đọc | hidden | TBD (draft) |

## 4. User Actions

> **Scope:** within-screen interactions only. Điều hướng sang màn khác nằm ở `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đánh dấu đọc tất cả | E02 | click | Còn thông báo chưa đọc | Mọi chấm đỏ ở E03 và E07 biến mất ngay | TBD (draft) |
| Mở thông báo | E03 | click dòng | — | Dòng thành đã đọc trong lúc đi tới đối tượng | TBD (draft) |
| Tải thêm | E04 | click | Còn thông báo cũ hơn | Nối thêm dòng ở cuối R3, không lặp dòng | TBD (draft) |
| Thử lại | E06 | click | Nạp lỗi | Nạp lại danh sách | TBD (draft) |

### Happy Path

1. Sunner bấm "Xem tất cả" ở dropdown và vào trang.
2. R3 hiện 20 thông báo mới nhất [INFERRED], dòng chưa đọc có chấm đỏ bên phải.
3. Sunner cuộn xuống, bấm "Tải thêm" để xem thông báo cũ hơn.
4. Sunner bấm "Đánh dấu đọc tất cả": mọi chấm đỏ biến mất, chuông ở header hết chấm đỏ.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| 2 | Chưa có thông báo nào | R3 hiện trạng thái trống E05; E02 mờ | TBD (draft) |
| 2 | Nạp danh sách lỗi | R3 hiện E06 kèm thử lại | TBD (draft) |
| 3 | Đã nạp hết | E04 ẩn | TBD (draft) |
| bất kỳ lúc nào | Có thông báo mới tới | Dòng mới hiện ở đầu R3, chuông cập nhật | TBD (draft) |

### Interaction Notes

- **Thông báo mới tới khi đang xem thì hiện ở đầu danh sách, vị trí đang cuộn không bị giật** — source: TBD (draft)
- **Nối trang bỏ các dòng đã có để không lặp khi thông báo tim nhảy lên đầu giữa hai lần nạp** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Vào trang, đang lấy trang đầu | khung chờ cho vài dòng | none | TBD (draft) |
| loading-more | Đang nạp thêm | E04 hiện vòng chờ và tạm khoá | none | TBD (draft) |
| empty | Không có thông báo | E05 | none | TBD (draft) |
| error | Lỗi mạng hoặc máy chủ | E06 | thử lại | TBD (draft) |
| saving | Đang đánh dấu đọc tất cả | chấm đỏ mất ngay (lạc quan), E02 tạm khoá | none | TBD (draft) |
| success | Đánh dấu xong | mọi dòng thành đã đọc | mở dòng, tải thêm | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected. Lỗi nạp và nạp thêm hiện ở E06; lỗi đánh dấu đọc tất cả không có thông báo riêng, chấm đỏ trở lại ở lần nạp kế.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Còn thông báo cũ hơn chưa nạp | configuration | E04 | còn dòng cũ hơn | đã nạp hết hoặc danh sách rỗng | Trang nạp từng đợt, không cuộn vô hạn [INFERRED] |
| Không có thông báo chưa đọc | configuration | E02 | còn dòng chưa đọc | không còn dòng chưa đọc | Khi hết chưa đọc, nút mờ không bấm được [INFERRED] |
| Biến thể câu chữ theo loại thông báo | configuration | E03 | mỗi dòng theo loại của nó | — | Dùng đúng bảng biến thể của `SCR-notification-dropdown` § 7, không định nghĩa lại ở đây |

## 8. Navigation

> `## 8. Navigation` là bản chiếu theo từng màn của `screen-flow.md § Screen Access Paths`; chưa có screen-flow nên mọi dòng dưới đây là dự kiến.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-notification-dropdown | Bấm "Xem tất cả" | Đã đăng nhập | TBD (draft) |
| external | Mở thẳng địa chỉ trang | Đã đăng nhập; chưa đăng nhập thì chuyển về màn đăng nhập (F001) | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở thông báo Kudo mới, tim hoặc Kudos Quốc Dân | E03 | thông báo loại tương ứng | SCR-kudo-detail (F004) | chuyển trang | TBD (draft) |
| Mở thông báo Secret Box | E03 | thông báo loại Secret Box | SCR-secret-box-open (F010) | mở modal | TBD (draft) |
| Mở thông báo lên cấp hoặc đủ bộ | E03 | thông báo loại tương ứng | profile của chính mình (F012, TBD (draft)) | chuyển trang | TBD (draft) |
| Mở thông báo Kudo bị tạm ẩn | E03 | thông báo loại tạm ẩn | SCR-community-standards (F006) | chuyển trang | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Danh sách là danh sách có tiêu đề "Thông báo"; dòng chưa đọc đọc ra là chưa đọc, không chỉ dựa vào màu chấm đỏ |
| Keyboard navigation | [EXPECTED] | Tab đi qua nút đọc tất cả, từng dòng và "Tải thêm"; Enter mở dòng |
| Focus management | [EXPECTED] | Sau "Tải thêm", tiêu điểm ở dòng đầu của đợt mới nạp |
| Screen reader compatibility | [EXPECTED] | Nội dung dòng đọc liền mạch: loại, câu chữ, thời gian |
| Error announcement | [EXPECTED] | Trạng thái lỗi E06 được đọc ra |

## 10. Responsive Behavior

N/A — no responsive behavior found in source. Bố cục trên màn hình nhỏ và máy tính bảng chưa quyết định (TBD (draft)).
