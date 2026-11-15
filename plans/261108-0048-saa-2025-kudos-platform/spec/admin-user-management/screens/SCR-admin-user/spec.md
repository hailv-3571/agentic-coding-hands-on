---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-admin-user — Screen Spec

**Screen**: SCR-admin-user: Admin User
**Feature**: F014_AdminUserManagement
**Type**: composite
**Route**: TBD (draft) — trang "User" dưới khu Admin
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Admin xem toàn bộ Sunner cùng số liệu tham gia trong một bảng, lọc và tìm người cần xem, sắp theo cột số liệu, đổi role từng người và xuất danh sách đang lọc.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập, có role Admin và chọn mục "User" trên menu Admin.
**Exit Conditions:** Admin chuyển sang mục Admin khác hoặc quay về khu Sunner; hoặc đã tải xong tệp Export.

## 2. Screen Layout

### Layout Sketch

Trang nằm trong khung Admin của F002 (thanh trên có menu "Overview · Review content · User · Settings" với mục User đang chọn, cùng avatar và các nút chung — không thuộc màn này). Từ trên xuống: tiêu đề "User" với nút Export màu vàng ở góc phải; hàng bộ lọc gồm ba dropdown Unit / Level / Role và ô Search có biểu tượng kính lúp ở bên phải; bảng người dùng; phân trang. Danh sách dropdown dựng theo ba frame thiết kế riêng: danh sách phòng ban (1002:15708), Level (1002:15711), Role (1002:15714). Frame thiết kế của màn: 773:26403.

```
┌──────────────────────────────────────────────────────────────────────┐
│ (Khung Admin F002: menu Overview · Review content · [User] · Settings)│
├──────────────────────────────────────────────────────────────────────┤
│ R1: User                                                    [Export] │
├──────────────────────────────────────────────────────────────────────┤
│ R2: [Unit ▾] [Level ▾] [Role ▾]                    [Search      🔍] │
├──────────────────────────────────────────────────────────────────────┤
│ R3: ID|User|Email|Sent↕|Received↕|Heart↕|Level↕|Badges↕|6 Badges↕|   │
│     Last Logged in↕|Role|Actions(⋯)                                  │
│     ...mỗi dòng một người dùng...                                    │
├──────────────────────────────────────────────────────────────────────┤
│ R4: (phân trang — chưa thấy trên thiết kế)                           │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Header (tiêu đề, Export) | static | no | TBD (draft) |
| R2 | Filter Bar (Unit, Level, Role, Search) | static | no | TBD (draft) |
| R3 | User Table | static | yes | TBD (draft) |
| R4 | Pagination | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | User | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Export | button | — | Enabled | Always | Tải tệp CSV các người dùng đang lọc | static | — | — | N/A |
| E03 | Unit | select | no | "Chọn phòng ban" (tất cả) | Always | Chọn phòng ban | API field | tên phòng ban | placeholder text | TBD (draft) |
| E04 | Level | select | no | "Chọn Level" (tất cả) | Always | Chọn Level | API field | giá trị Level | placeholder text | TBD (draft) |
| E05 | Role | select | no | "Chọn Role" (tất cả) | Always | Chọn Admin / User | static | — | placeholder text | TBD (draft) |
| E06 | Search | text input | no | Trống | Always | Nhập từ khoá tên hoặc email | store state | raw | placeholder text "Search" | TBD (draft) |
| E07 | ID (cột) | table | — | — | Always | — | computed | mã rút gọn | dash | TBD (draft) |
| E08 | User (cột) | table | — | — | Always | — | API field | họ tên | dash | TBD (draft) |
| E09 | Email (cột) | table | — | — | Always | — | API field | email @sun-asterisk.com | dash | TBD (draft) |
| E10 | ∑ sent Kudos (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | số nguyên | dash | TBD (draft) |
| E11 | ∑ Received Kudos (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | số nguyên | dash | TBD (draft) |
| E12 | Total Heart (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | số nguyên, hiện màu đỏ | dash | TBD (draft) |
| E13 | Level (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | số 1–5 `[UNVERIFIED]` | dash | TBD (draft) |
| E14 | Number of Badges (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | số nguyên 0–6 | dash | TBD (draft) |
| E15 | Time to get 6 Badges (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | dd/mm/yyyy hh:mm | dash | TBD (draft) |
| E16 | Last Logged in (cột) | table | — | — | Always | Bấm đầu cột để sắp tăng/giảm | API field | dd/mm/yyyy hh:mm | dash | TBD (draft) |
| E17 | Role (cột) | table | — | — | Always | — | API field | chữ Admin / User | dash | TBD (draft) |
| E18 | Actions "⋯" | button | — | Enabled | Always | Mở menu thao tác của dòng | static | — | — | N/A |
| E19 | Set as Admin / Set as User | link | — | Enabled | Conditional | Đổi role của dòng `[INFERRED]` | static | — | — | N/A |
| E20 | Xác nhận đổi role | message | — | — | Conditional | Xác nhận hoặc huỷ đổi role | static | — | — | N/A |
| E21 | Pagination | list | — | Trang 1 | Always | Chuyển trang | computed | số trang | hidden khi chỉ có một trang | N/A |

Ghi chú: mẫu thiết kế có dòng Number of Badges = 7 trong khi tối đa 6 loại — dữ liệu mẫu chưa nhất quán, spec theo 0–6 (D002 ở functional-spec). Con số "(100)" cạnh các cột tổng là giá trị mẫu, không phải hàng tổng (D004). Menu thao tác dòng chưa được chụp nên E19 là suy luận.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn phòng ban | E03 | click, chọn | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Chọn Level | E04 | click, chọn | Có Level để chọn (D001) | Bảng lọc lại, về trang 1 | TBD (draft) |
| Chọn Role | E05 | click, chọn | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Tìm kiếm | E06 | gõ rồi dừng gõ / Enter | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Sắp xếp theo cột | E10–E16 | click đầu cột | — | Đảo thứ tự tăng/giảm, về trang 1 | TBD (draft) |
| Đổi trang | E21 | click | Có nhiều hơn một trang | Bảng hiện trang chọn | TBD (draft) |
| Mở menu thao tác | E18 | click | — | Hiện menu của dòng | TBD (draft) |
| Đổi role | E19 | click | Theo role của dòng; khoá ở dòng của chính mình khi hạ | Mở xác nhận (E20), xác nhận xong cột Role của dòng đổi | TBD (draft) |
| Export | E02 | click | — | Tải tệp CSV các người dùng đang lọc | TBD (draft) |

### Happy Path

1. Admin thấy bảng người dùng theo tên A–Z ở R3.
2. Admin chọn một phòng ban ở E03 và gõ tên ở E06 — R3 chỉ còn các dòng khớp.
3. Admin bấm đầu cột Number of Badges — R3 sắp lại theo cột đó.
4. Admin bấm "⋯" ở một dòng, chọn "Set as Admin" và xác nhận — cột Role của dòng đổi sang Admin.
5. Admin bấm "Export" ở R1 — trình duyệt tải về tệp các người dùng đang lọc.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 4 | Dòng của chính Admin đang xem | Lựa chọn hạ role bị khoá kèm lời giải thích | TBD (draft) |
| Bước 4 | Chỉ còn một Admin và Admin khác gọi hạ người đó | Dòng giữ nguyên, hiện lỗi "Không thể hạ Admin cuối cùng." | TBD (draft) |
| Bước 4 | Admin khác vừa đổi đúng người này | Dòng hiện role hiện tại, không báo lỗi | TBD (draft) |
| Bước 4 | Lưu thất bại | Dòng giữ role cũ, hiện lỗi và cho thử lại | TBD (draft) |
| Bước 5 | Số dòng quá trần Export | Không tải, hiện lỗi yêu cầu thu hẹp bộ lọc | TBD (draft) |

### Interaction Notes

- **Đổi bất kỳ bộ lọc, tìm kiếm hay sắp xếp nào thì bảng về trang 1** — source: TBD (draft)
- **Người chưa có giá trị ở cột đang sắp luôn nằm cuối, cả khi đảo chiều** — source: TBD (draft)
- **Nút "⋯" và menu của dòng bị khoá trong lúc đang lưu để không bấm đúp** — source: TBD (draft)
- **Nút Export bị khoá kèm trạng thái chờ trong lúc chuẩn bị tệp** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải trang bảng | Các dòng khung chờ trong R3, bộ lọc vẫn thao tác được | đổi bộ lọc | TBD (draft) |
| empty | Không có người dùng khớp | Thông báo "Không có người dùng nào phù hợp bộ lọc." thay các dòng | xoá bộ lọc | TBD (draft) |
| error | Tải bảng thất bại | Thông báo lỗi kèm nút thử lại ở R3 | thử lại | TBD (draft) |
| saving | Đang đổi role | Nút của dòng khoá, hiện vòng chờ | none | TBD (draft) |
| success | Đổi role xong | Cột Role của dòng đổi tại chỗ; thông báo ngắn | dùng tiếp | TBD (draft) |
| exporting | Đang chuẩn bị tệp | E02 khoá, hiện vòng chờ | none | TBD (draft) |
| export-error | Quá trần hoặc lỗi tải tệp | Thông báo "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." hoặc lỗi chung | thu hẹp bộ lọc, thử lại | TBD (draft) |
| filter-options-error | Tải danh sách phòng ban/Level thất bại | Dropdown báo lỗi nhẹ, bảng vẫn dùng được | tải lại trang | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E06 | Tối đa 100 ký tự | "Từ khoá tối đa 100 ký tự" | change |
| E19 | Không tự hạ role của chính mình | "Bạn không thể tự hạ role của mình." | click |
| E19 | Phải còn ít nhất một Admin | "Không thể hạ Admin cuối cùng." | server response |
| E19 | Lưu thất bại | "Không cập nhật được role. Vui lòng thử lại." | server response |
| E19 | Người đổi không còn quyền Admin | "Bạn không còn quyền Admin." | server response |
| E02 | Số dòng vượt trần Export | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Lựa chọn trong menu dòng theo role của dòng | hardcoded-id | E19 | "Set as Admin" khi dòng là User; "Set as User" khi dòng là Admin | ngược lại | Suy ra từ role của dòng; khoá ở dòng của chính mình |
| Xác nhận trước khi đổi role | configuration | E20 | Sau khi chọn E19 | Khi xác nhận hoặc huỷ | [NEEDS_DOMAIN_CONFIRMATION] D007: có bước xác nhận hay đổi ngay |
| Level chưa có nguồn | configuration | E04, E13 | E04 có lựa chọn và E13 có số khi đã có nguồn Level | E04 khoá, E13 hiện dấu gạch | [NEEDS_DOMAIN_CONFIRMATION] D001 |
| Phân trang | responsive | E21 | Có hơn một trang kết quả | Chỉ có một trang | D006: chưa thấy trên thiết kế `[INFERRED]` |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR-admin-layout | Bấm mục "User" trên menu Admin | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Chuyển mục Admin | Menu của khung Admin | — | TBD (draft) — SCR-admin-layout (các trang Admin khác) | redirect | TBD (draft) |
| Không đủ quyền | — | Guard từ chối | TBD (draft) — SCR-error-403 | redirect | TBD (draft) |
| Tải tệp | E02 | — | (stays on screen) | tệp CSV được tải về | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Bảng có tiêu đề cột, cột đang sắp báo hướng; nút "⋯" có nhãn "Thao tác cho {tên}"; role hiện bằng chữ, không chỉ bằng màu |
| Keyboard navigation | [EXPECTED] | Tab qua ba dropdown, ô Search, đầu cột, nút "⋯", phân trang theo thứ tự hiển thị; menu dòng mở bằng Enter và đóng bằng Esc |
| Focus management | [EXPECTED] | Menu và popover xác nhận giữ focus bên trong; đóng thì trả focus về nút "⋯" |
| Screen reader compatibility | [EXPECTED] | Có landmark cho bộ lọc và bảng; đổi role được đọc lên |
| Error announcement | [EXPECTED] | Lỗi chốt an toàn, lỗi lưu, lỗi Export được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
