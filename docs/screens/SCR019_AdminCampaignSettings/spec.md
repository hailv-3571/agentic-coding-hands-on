---
status: draft
authored_by: takumi
fcode: F011
created: 2026-11-08
lang: vi
---

# SCR019_AdminCampaignSettings — Screen Spec

**Screen**: SCR019_AdminCampaignSettings: Admin Setting (Campaign)
**Feature**: F011_AdminCampaigns
**Type**: composite
**Route**: TBD (draft) — trang "Settings" dưới khu Admin (đường dẫn do F002 chốt)
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Admin xem mọi campaign "x2 heart" trong một bảng, mở menu từng dòng để sửa hoặc xoá, và bấm Add Campaign để tạo mới.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập, có role Admin và chọn mục "Settings" trên menu Admin.
**Exit Conditions:** Admin chuyển sang mục Admin khác hoặc quay về khu Sunner; hoặc đã thêm, sửa, xoá xong và vẫn ở trang.

## 2. Screen Layout

### Layout Sketch

Trang nằm trong khung Admin của F002 (thanh trên, menu, chân trang — không thuộc màn này). Frame thiết kế "Admin - Setting" (820:10492). Từ trên xuống: hàng tiêu đề "Setting" bên trái và nút "Add Campaign" màu vàng bên phải; bảng nền tối bốn cột ID, Name, Time, Actions. Menu thao tác (frame "Action - Campaign", 820:11429) nổi cạnh biểu tượng của dòng được bấm; hộp xác nhận "Delete Campaign" (frame 1760:8926) nổi giữa màn trên lớp mờ. Hộp Add / Edit là màn riêng, xem SCR020_CampaignFormModal.

```
┌────────────────────────────────────────────────────────────┐
│ R1: Page Header   "Setting"                [Add Campaign]  │
├────────────────────────────────────────────────────────────┤
│ R2: Campaign Table                                         │
│  ID │ Name                         │ Time              │ ⋯ │
│  1  │ Campaign x2 heart release…   │ 23/12/2025 - 10:00 …│ ⋯ │
│                                       ┌─────────────┐      │
│ - - - R3: Row Action Menu (khi mở)  - │ Edit        │      │
│                                       │ Delete      │      │
│                                       └─────────────┘      │
│ - - - R4: Delete Campaign dialog (khi mở, lớp mờ phủ) - - -│
└────────────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Header | static | no | TBD (draft) |
| R2 | Campaign Table | static | yes | TBD (draft) |
| R3 | Row Action Menu | static (nổi cạnh dòng, hiện khi mở) | no | TBD (draft) |
| R4 | Delete Campaign Dialog | fixed (giữa màn, hiện khi mở) | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Setting | region label | — | — | Always | — | static | tiêu đề trang | — | N/A |
| E02 | Add Campaign | button | — | Enabled | Always | Mở hộp thêm campaign | static | nút vàng | — | N/A |
| E03 | Campaign table | table | — | Đang tải | Always | — | API field | bốn cột ID, Name, Time, Actions | placeholder text | TBD (draft) |
| E04 | ID | display field | — | — | Conditional | — | API field | số nguyên | dash | TBD (draft) |
| E05 | Name | display field | — | — | Conditional | — | API field | cắt gọn khi dài | dash | TBD (draft) |
| E06 | Time | display field | — | — | Conditional | — | computed | `dd/MM/yyyy - HH:mm` giờ bắt đầu rồi giờ kết thúc, giờ Việt Nam | dash | TBD (draft) |
| E07 | Row actions | button | — | Enabled | Conditional | Mở menu Edit / Delete của dòng | static | biểu tượng ba chấm | — | N/A |
| E08 | Edit | link | — | — | Conditional | Mở hộp Edit Campaign cho dòng | static | mục menu | — | N/A |
| E09 | Delete | link | — | — | Conditional | Mở hộp xác nhận xoá cho dòng | static | mục menu | — | N/A |
| E10 | Delete Campaign title and message | message | — | — | Conditional | — | computed | tiêu đề "Delete Campaign", câu xác nhận nêu tên campaign (nội dung chữ TBD (draft)) | — | TBD (draft) |
| E11 | Confirm delete | button | — | Enabled | Conditional | Xoá campaign | static | nhãn TBD (draft) | — | N/A |
| E12 | Cancel delete | button | — | Enabled | Conditional | Đóng hộp, không xoá | static | nút viền tối | — | N/A |
| E13 | Empty message | message | — | — | Conditional | — | static | "Chưa có chiến dịch nào. Bấm Add Campaign để tạo." | — | N/A |
| E14 | Error message and retry | message | — | — | Conditional | Tải lại bảng | static | thông báo lỗi kèm nút thử lại | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Thêm campaign | E02 | click | — | Mở hộp Add Campaign | TBD (draft) |
| Mở menu dòng | E07 | click | Dòng chưa kết thúc | Hiện menu Edit / Delete cạnh dòng | TBD (draft) |
| Sửa campaign | E08 | click | Dòng chưa kết thúc | Mở hộp Edit Campaign điền sẵn giá trị | TBD (draft) |
| Xoá campaign | E09 | click | Dòng chưa kết thúc | Mở hộp "Delete Campaign" (R4) | TBD (draft) |
| Xác nhận xoá | E11 | click | Hộp xoá đang mở | Xoá dòng, đóng hộp, hiện thông báo thành công | TBD (draft) |
| Huỷ xoá | E12 | click | Hộp xoá đang mở | Đóng hộp, giữ nguyên bảng | TBD (draft) |
| Thử lại | E14 | click | Tải bảng lỗi | Tải lại bảng | TBD (draft) |

### Happy Path

1. Admin vào trang và thấy bảng ở R2, campaign bắt đầu muộn nhất nằm trên cùng.
2. Admin bấm biểu tượng ba chấm ở một dòng chưa kết thúc và thấy menu Edit / Delete ở R3.
3. Admin chọn Delete, hộp "Delete Campaign" hiện ở R4 nêu tên campaign.
4. Admin xác nhận; hộp đóng, dòng biến mất khỏi R2 và hiện thông báo thành công.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Dòng đã kết thúc | Không có biểu tượng thao tác (E07 ẩn); dòng chỉ để xem | TBD (draft) |
| Bước 4 | Campaign đã bị Admin khác xoá | Hiện "Chiến dịch không còn tồn tại" và tải lại bảng | TBD (draft) |
| Bước 4 | Campaign vừa kết thúc trong lúc hộp mở | Không xoá, hiện "Chiến dịch đã kết thúc, không thể sửa hoặc xoá" và tải lại bảng | TBD (draft) |

### Interaction Notes

- **Bấm ra ngoài menu dòng thì menu đóng** — source: TBD (draft) `[EXPECTED]`
- **Trong lúc xoá, nút xác nhận khoá kèm trạng thái chờ để không gửi hai lần** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải danh sách | Bảng hiện khung chờ (skeleton) | none | TBD (draft) |
| empty | Chưa có campaign | Bảng trống kèm E13 | Add Campaign | TBD (draft) |
| error | Tải danh sách lỗi | E14 thay bảng | Thử lại | TBD (draft) |
| saving | Đang xoá | Nút xác nhận khoá kèm chỉ báo chờ | none | TBD (draft) |
| success | Xoá xong | Thông báo thành công, dòng biến mất | đóng thông báo | TBD (draft) |
| error-delete | Xoá lỗi | Hộp vẫn mở, hiện "Không xoá được, vui lòng thử lại" | Xác nhận lại, Cancel | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected. Màn này không có ô nhập; luật kiểm tên và giờ nằm ở hộp Add / Edit (SCR020_CampaignFormModal).

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Giai đoạn campaign của dòng | hardcoded-id | E07, E08, E09 | Campaign đang chạy hoặc chưa chạy | Campaign đã kết thúc | Bypass bằng gọi thẳng vẫn bị từ chối ở máy chủ |
| Có campaign hay không | hardcoded-id | E04, E05, E06, E13 | E04-E06 khi có ít nhất một campaign; E13 khi chưa có | E13 khi đã có campaign | — |
| Người dùng là Admin | auth | toàn màn | Role Admin | Không phải Admin: trang 403 của F002 | Cổng thuộc F001 / F002 |

## 8. Navigation

> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`; every row below must be derivable from it.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR002_AdminLayout (F002) | Bấm mục "Settings" trên menu Admin | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Thêm campaign | E02 | — | SCR020_CampaignFormModal (chế độ Add) | modal | TBD (draft) |
| Sửa campaign | E08 | Dòng chưa kết thúc | SCR020_CampaignFormModal (chế độ Edit) | modal | TBD (draft) |
| Xác nhận / huỷ xoá | E11, E12 | Hộp xoá đang mở | (stays on screen) | toast rồi đóng hộp | TBD (draft) |
| Chọn mục khác trên menu Admin | menu F002 | — | TBD (draft) — màn Admin khác | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Bảng có tiêu đề cột; nút ba chấm có nhãn "Thao tác" kèm tên campaign |
| Keyboard navigation | [EXPECTED] | Tab tới nút ba chấm, Enter mở menu, mũi tên chọn mục, Esc đóng |
| Focus management | [EXPECTED] | Hộp xoá giữ focus trong hộp và trả focus về nút ba chấm khi đóng |
| Screen reader compatibility | [EXPECTED] | Hộp xoá là hộp thoại có tiêu đề; thông báo thành công đọc được |
| Error announcement | [EXPECTED] | Lỗi tải và lỗi xoá được đọc ra (vùng thông báo động) |

## 10. Responsive Behavior

N/A — no responsive behavior found in source. Bản web desktop; bố cục máy tính bảng chưa có trên thiết kế (câu hỏi chung của hệ thống).
