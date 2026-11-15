---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-campaign-form-modal — Screen Spec

**Screen**: SCR-campaign-form-modal: Add / Edit Campaign
**Feature**: F011_AdminCampaigns
**Type**: atomic
**Route**: TBD (draft) — hộp thoại nổi trên SCR-admin-campaign-settings, không có route riêng
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Admin nhập tên và giờ bắt đầu, giờ kết thúc để thêm campaign mới (hộp "Add Campaign") hoặc đổi campaign hiện có (hộp "Edit Campaign").
**Actors:** Admin
**Entry Conditions:** Admin đang ở trang Setting và bấm "Add Campaign", hoặc chọn Edit ở một dòng campaign chưa kết thúc.
**Exit Conditions:** Lưu thành công, hoặc Admin bấm Cancel; hộp đóng và quay về trang Setting.

## 2. Screen Layout

### Layout Sketch

Hộp thoại nổi giữa màn trên lớp mờ, hai biến thể cùng bố cục: "Add Campaign" (frames 820:11445, 832:12113) và "Edit Campaign" (832:12299). Từ trên xuống: tiêu đề, ô Campaign Name, ô Start Date, ô End Date (đều có dấu * bắt buộc; hai ô ngày có biểu tượng lịch), rồi hàng nút: Cancel (viền tối) bên trái, nút lưu màu vàng rộng bên phải. Bấm vào ô ngày mở bộ chọn lịch (frame 1413:9045) có thêm giờ và AM/PM.

```
┌───────────────────────────────────────┐
│ R1: Title  "Add Campaign"/"Edit …"    │
├───────────────────────────────────────┤
│ R2: Form                              │
│  Campaign Name *  [ Campaign Name   ] │
│  Start Date *     [ dd/mm/yyyy  📅  ] │
│  End Date *       [ dd/mm/yyyy  📅  ] │
├───────────────────────────────────────┤
│ R3: Buttons   [Cancel]  [Add Campaign]│
└───────────────────────────────────────┘
  - - - R4: Date-time picker (nổi dưới ô ngày, khi mở) - - -
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Title | static | no | TBD (draft) |
| R2 | Form | static | no | TBD (draft) |
| R3 | Buttons | static | no | TBD (draft) |
| R4 | Date-time Picker | static (nổi dưới ô ngày, hiện khi mở) | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Add Campaign / Edit Campaign | region label | — | — | Always | — | static | tiêu đề theo chế độ | — | N/A |
| E02 | Campaign Name | text input | yes | Rỗng (Add) / tên hiện tại (Edit) | Always | — | API field | raw, tối đa 100 ký tự | placeholder text "Campaign Name" | TBD (draft) |
| E03 | Start Date | date input | yes | Rỗng (Add) / giờ bắt đầu hiện tại (Edit) | Always | Mở bộ chọn ngày giờ (E08) | API field | ngày kèm giờ, giờ Việt Nam | placeholder text | TBD (draft) |
| E04 | End Date | date input | yes | Rỗng (Add) / giờ kết thúc hiện tại (Edit) | Always | Mở bộ chọn ngày giờ (E08) | API field | ngày kèm giờ, giờ Việt Nam | placeholder text | TBD (draft) |
| E05 | Cancel | button | — | Enabled | Always | Đóng hộp, bỏ thay đổi | static | nút viền tối | — | N/A |
| E06 | Add Campaign (nút lưu) | button | — | Enabled | Conditional | Lưu campaign (chế độ Add) | static | nút vàng rộng | — | N/A |
| E07 | Save (nút lưu chế độ Edit) | button | — | Enabled | Conditional | Lưu thay đổi (chế độ Edit); nhãn TBD (draft) | static | nút vàng rộng | — | N/A |
| E08 | Date-time picker | list | — | Ngày hiện tại | Conditional | Chọn ngày, giờ, phút, AM/PM | computed | lịch tháng cùng ô giờ | — | N/A |
| E09 | Field error | message | — | — | Conditional | — | computed | chữ đỏ dưới ô lỗi | — | N/A |
| E10 | Overlap error | message | — | — | Conditional | — | computed | nêu tên và khoảng giờ campaign trùng | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Nhập tên | E02 | change | — | Cập nhật ô; xoá lỗi của ô khi gõ | TBD (draft) |
| Chọn ngày giờ | E03, E04 | click, chọn trong E08 | Ô không bị khoá | Điền giá trị vào ô, đóng bộ chọn | TBD (draft) |
| Lưu (Add) | E06 | click | Chế độ Add | Kiểm, lưu, đóng hộp | TBD (draft) |
| Lưu (Edit) | E07 | click | Chế độ Edit | Kiểm, lưu, đóng hộp | TBD (draft) |
| Huỷ | E05 | click | — | Đóng hộp, không lưu | TBD (draft) |

### Happy Path

1. Admin bấm Add Campaign ở trang Setting; hộp hiện với ba ô rỗng.
2. Admin nhập tên ở R2, chọn giờ bắt đầu và kết thúc bằng bộ chọn ở R4.
3. Admin bấm nút lưu ở R3; nút khoá kèm chỉ báo chờ.
4. Lưu xong, hộp đóng và Admin thấy dòng mới ở trang Setting.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 3 | Ô nhập không hợp lệ | Hộp vẫn mở, lỗi hiện dưới từng ô sai | TBD (draft) |
| Bước 3 | Khoảng giờ trùng campaign khác | Hộp vẫn mở, E10 nêu campaign trùng dưới ô End Date | TBD (draft) |
| Bước 1 (chế độ Edit) | Campaign đang chạy | Ô Start Date khoá, chỉ đọc | TBD (draft) |
| Bước 3 (chế độ Edit) | Campaign đã kết thúc trong lúc hộp mở | Hộp đóng, hiện "Chiến dịch đã kết thúc, không thể sửa" ở trang Setting | TBD (draft) |

### Interaction Notes

- **Bấm Cancel hoặc Esc khi đã nhập dở thì đóng hộp và bỏ dữ liệu, không hỏi lại** — source: TBD (draft) `[EXPECTED]`
- **Giờ chọn theo giờ Việt Nam; bộ chọn có AM/PM nên cần kiểm 12 giờ trưa và 12 giờ đêm** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở Edit và đang lấy dữ liệu dòng | Ô hiện khung chờ | Cancel | TBD (draft) |
| empty | Mở Add | Ba ô rỗng, hiện placeholder | Nhập, Cancel | TBD (draft) |
| error | Kiểm lỗi hoặc lưu lỗi | Lỗi đỏ dưới ô; lỗi lưu chung "Không lưu được, vui lòng thử lại" | Sửa rồi lưu lại, Cancel | TBD (draft) |
| saving | Đang lưu | Nút lưu khoá kèm chỉ báo chờ, ô bị khoá | none | TBD (draft) |
| success | Lưu xong | Hộp đóng, trang Setting hiện thông báo thành công | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02 | Bắt buộc, sau khi cắt khoảng trắng còn 1-100 ký tự | "Vui lòng nhập tên chiến dịch (tối đa 100 ký tự)" | blur, submit |
| E03 | Bắt buộc | "Vui lòng chọn ngày giờ bắt đầu" | submit |
| E04 | Bắt buộc | "Vui lòng chọn ngày giờ kết thúc" | submit |
| E04 | Phải sau giờ bắt đầu | "Giờ kết thúc phải sau giờ bắt đầu" | change, submit |
| E04 | Phải sau thời điểm hiện tại | "Giờ kết thúc phải sau thời điểm hiện tại" | submit |
| E10 | Không chồng giờ campaign khác | "Khoảng thời gian trùng với chiến dịch {tên} ({giờ bắt đầu} - {giờ kết thúc})" | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Hộp mở ở chế độ Add hay Edit | hardcoded-id | E01, E06, E07 | E06 và tiêu đề "Add Campaign" khi Add; E07 và tiêu đề "Edit Campaign" khi Edit | Ngược lại | Hai biến thể thiết kế cùng bố cục |
| Campaign đang chạy (chế độ Edit) | hardcoded-id | E03 | Khoá (chỉ đọc) khi campaign đang chạy | Mở khoá khi campaign chưa chạy | Gọi thẳng bỏ khoá vẫn bị từ chối ở máy chủ |
| Có lỗi trùng giờ | hardcoded-id | E10 | Sau khi lưu bị từ chối vì trùng giờ | Khi Admin đổi giờ hoặc đóng hộp | — |

## 8. Navigation

> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`; every row below must be derivable from it.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-admin-campaign-settings | Bấm "Add Campaign" | — | TBD (draft) |
| SCR-admin-campaign-settings | Chọn Edit trong menu dòng | Campaign chưa kết thúc | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Huỷ | E05 | — | SCR-admin-campaign-settings | modal đóng | TBD (draft) |
| Lưu | E06, E07 | Hợp lệ và không trùng giờ | SCR-admin-campaign-settings | modal đóng rồi toast | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Hộp là hộp thoại có tiêu đề; mỗi ô gắn nhãn, dấu * đọc là "bắt buộc" |
| Keyboard navigation | [EXPECTED] | Tab đi qua ô theo thứ tự trên xuống rồi tới Cancel và nút lưu; Esc đóng |
| Focus management | [EXPECTED] | Focus vào ô Campaign Name khi mở, giữ trong hộp, trả về nút đã mở hộp khi đóng |
| Screen reader compatibility | [EXPECTED] | Bộ chọn ngày giờ dùng được bằng bàn phím, đọc ngày đang chọn |
| Error announcement | [EXPECTED] | Lỗi dưới ô gắn với ô và được đọc ra khi xuất hiện |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
