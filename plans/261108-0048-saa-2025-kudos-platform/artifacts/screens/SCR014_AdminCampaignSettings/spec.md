---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR014_AdminCampaignSettings — Screen Spec

**Screen**: SCR014_AdminCampaignSettings: AdminCampaignSettings
**Feature**: F011_AdminCampaigns
**Type**: atomic
**Route**: /admin/settings
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Admin quản lý các campaign "x2 tim": xem danh sách, thêm campaign mới, sửa hoặc xoá campaign sắp diễn ra hoặc đang chạy ngay trong trang Settings.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập với vai trò admin; guest bị chuyển về đăng nhập, người không phải admin nhận trang 403.
**Exit Conditions:** Admin rời trang qua thanh điều hướng khu admin (do khung SCR002_AdminLayout cung cấp); trong trang, việc "xong" là campaign đã được thêm, lưu hoặc xoá và toast xác nhận hiện lên.

## 2. Screen Layout

### Layout Sketch

Nội dung nằm trong cột giữa của khung admin (thanh trên cùng và footer rút gọn do SCR002_AdminLayout cung cấp). Hàng tiêu đề "Setting" cùng nút Add Campaign nằm trên, dưới là bảng campaign (hoặc khối lỗi tải kèm link tải lại). Hộp thoại thêm/sửa/xoá là lớp phủ toàn màn hình mở theo trạng thái trong trang (URL không đổi), toast cố định ở đáy màn hình. Danh sách stream vào sau skeleton. (`app/admin/settings/page.tsx:40-47`, `features/admin-campaigns/components/campaign-settings-panel.tsx:49-76`, `app/admin/layout.tsx:15`)

```
┌─────────────────────────────────────────────────────┐
│ (admin top bar SCR002_AdminLayout)                  │
├─────────────────────────────────────────────────────┤
│ R1: Header Row (static)                             │
│  Setting                         [Add Campaign]     │
├─────────────────────────────────────────────────────┤
│ R2: Campaign Table (static)  hoặc  khối lỗi tải     │
│  ID | Name | Time (bắt đầu - kết thúc) | Actions(⋯)  │
└─────────────────────────────────────────────────────┘
  - - - - - - - - - - - - - - - - - - - - - - - - - - 
  R3: Modal Layer (fixed, chỉ khi mở hộp thoại)
  ┌──────────────────────────────┐
  │ Add / Edit Campaign hoặc     │
  │ Delete Campaign              │
  └──────────────────────────────┘
        ┌─ R4: Toast (fixed-bottom, tạm thời) ─┐
        └──────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header Row | static | no | CampaignSettingsPanel |
| R2 | Campaign Table | static | yes | CampaignTable, CampaignRowMenu, Load-failed block, CampaignSettingsSkeleton |
| R3 | Modal Layer | fixed | yes | CampaignFormModal, CampaignDeleteDialog, CampaignDialogFrame, CampaignFormField |
| R4 | Toast | fixed-bottom | no | CampaignSettingsToast |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Setting (`<h1>`) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Add Campaign | button | — | Enabled | Always | Mở hộp Add Campaign | — | — | — | N/A |
| E03 | ID | display field | — | Visible | Conditional | — | API field | số nguyên | — | MODEL009_Campaign.id (binding: `campaign.id`) |
| E04 | Name | display field | — | Visible | Conditional | — | API field | một dòng, cắt bằng dấu ba chấm, tên đầy đủ khi rê chuột | dash | MODEL009_Campaign.name (binding: `campaign.name`) |
| E05 | Time (giờ bắt đầu, giờ kết thúc) | display field | — | Visible | Conditional | — | API field | `dd/MM/yyyy - HH:mm` theo múi giờ admin | — | MODEL009_Campaign.starts_at, ends_at (binding: `campaign.startsAtDisplay`, `endsAtDisplay`) |
| E06 | Nút "⋯" Thao tác {tên campaign} | button | — | Enabled | Conditional | Mở menu Edit / Delete của dòng | — | — | — | N/A |
| E07 | Edit (trong menu dòng) | button | — | Enabled | Conditional | Mở hộp Edit Campaign đã điền sẵn | — | — | — | N/A |
| E08 | Delete (trong menu dòng) | button | — | Enabled | Conditional | Mở hộp xác nhận xoá | — | — | — | N/A |
| E09 | Chưa có chiến dịch nào. Bấm Add Campaign để tạo. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E10 | Không tải được danh sách chiến dịch. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E11 | Thử lại | link | — | Hidden | Conditional | Tải lại trang `/admin/settings` | — | — | — | N/A |
| E12 | Campaign Name | text input | yes | Empty (hoặc tên hiện có khi sửa) | Conditional | — | — | raw, tối đa 100 ký tự | placeholder "Campaign Name" | MODEL009_Campaign.name (binding: `values.name`) |
| E13 | Start Date | date input | yes | Empty (hoặc giờ hiện có khi sửa); chỉ đọc khi campaign đang chạy | Conditional | — | — | `yyyy-MM-ddTHH:mm` (giờ admin) | — | MODEL009_Campaign.starts_at (binding: `values.startsAt`) |
| E14 | End Date | date input | yes | Empty (hoặc giờ hiện có khi sửa) | Conditional | — | — | `yyyy-MM-ddTHH:mm` (giờ admin) | — | MODEL009_Campaign.ends_at (binding: `values.endsAt`) |
| E15 | Thông báo lỗi chung của biểu mẫu | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E16 | Cancel (hộp thêm/sửa) | button | — | Enabled | Conditional | Đóng hộp, không lưu | — | — | — | N/A |
| E17 | Add Campaign / Save Campaign (nút gửi) | button | — | Enabled | Conditional | Gửi biểu mẫu | — | — | — | N/A |
| E18 | Câu hỏi xác nhận xoá kèm tên campaign | message | — | Hidden | Conditional | — | store state | raw | hidden | MODEL009_Campaign.name |
| E19 | Delete (hộp xoá) | button | — | Enabled | Conditional | Xoá campaign | — | — | — | N/A |
| E20 | Cancel (hộp xoá) | button | — | Enabled | Conditional | Đóng hộp, không xoá | — | — | — | N/A |
| E21 | Không xoá được, vui lòng thử lại | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E22 | Toast kết quả | message | — | Hidden | Conditional | — | static | raw, tự tắt sau 5 giây | hidden | N/A |

Ghi chú: bảng không có cột trạng thái; trạng thái upcoming / active / ended chỉ quyết định việc dòng có nút "⋯" hay không và ô Start Date có bị khoá hay không.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`. Hộp thoại mở bằng trạng thái trong trang nên vẫn là tương tác trong màn hình.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở hộp thêm campaign | E02 | Bấm | — | Hiện hộp Add Campaign | `features/admin-campaigns/components/campaign-settings-panel.tsx:53` |
| Mở menu dòng | E06 | Bấm, hoặc phím mũi tên xuống | Dòng chưa kết thúc | Hiện menu Edit / Delete, focus vào mục đầu | `features/admin-campaigns/components/campaign-row-menu.tsx:40-44,79` |
| Sửa campaign | E07 | Chọn mục Edit | — | Đóng menu, hiện hộp Edit Campaign điền sẵn | `features/admin-campaigns/components/campaign-row-menu.tsx:64-68,94` |
| Xoá campaign | E08 | Chọn mục Delete | — | Đóng menu, hiện hộp xác nhận xoá | `features/admin-campaigns/components/campaign-row-menu.tsx:64-68,98` |
| Tải lại danh sách | E11 | Bấm | Đang ở trạng thái lỗi tải | Tải lại trang | `features/admin-campaigns/components/campaign-settings-panel.tsx:66-68` |
| Gửi biểu mẫu | E17 | Bấm hoặc Enter trong biểu mẫu | Không đang lưu | Kiểm tra phía client rồi gọi máy chủ; thành công thì đóng hộp và hiện toast | `features/admin-campaigns/components/use-campaign-form.ts:102-113` |
| Huỷ biểu mẫu | E16 | Bấm hoặc Esc | Không đang lưu | Đóng hộp, không lưu | `features/admin-campaigns/components/campaign-form-modal.tsx:85`, `features/admin-campaigns/components/campaign-dialog-frame.tsx:42-50` |
| Xác nhận xoá | E19 | Bấm | Không đang xoá | Gọi xoá; thành công thì đóng hộp và hiện toast | `features/admin-campaigns/components/campaign-delete-dialog.tsx:42-53` |
| Huỷ xoá | E20 | Bấm hoặc Esc | Không đang xoá | Đóng hộp, không xoá | `features/admin-campaigns/components/campaign-delete-dialog.tsx:77-85` |

### Happy Path

1. Admin mở `/admin/settings`; R2 hiện bảng campaign mới nhất lên đầu sau khi skeleton biến mất.
2. Admin bấm Add Campaign (R1); R3 hiện hộp với ba ô Campaign Name, Start Date, End Date, focus ở ô tên.
3. Admin nhập tên và hai mốc giờ rồi bấm Add Campaign; nút đổi thành "Đang lưu…", ô nhập chuyển chỉ đọc.
4. Hộp đóng, bảng tải lại có campaign mới, toast "Đã thêm chiến dịch" hiện ở R4 rồi tự tắt sau 5 giây.
5. Với một dòng chưa kết thúc, Admin mở "⋯", chọn Edit (sửa) hoặc Delete (xác nhận rồi xoá); kết thúc bằng toast "Đã lưu chiến dịch" hoặc "Đã xoá chiến dịch".

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (đọc danh sách) | Không có campaign | Một dòng "Chưa có chiến dịch nào. Bấm Add Campaign để tạo." | `features/admin-campaigns/components/campaign-table.tsx:61-66` |
| Bước 1 (đọc danh sách) | Đọc thất bại | Khối lỗi kèm link Thử lại thay cho bảng | `app/admin/settings/page.tsx:19-27`, `features/admin-campaigns/components/campaign-settings-panel.tsx:63-70` |
| Bước 3 (kiểm tra client) | Trường sai (thiếu, ngày giờ không hợp lệ, giờ kết thúc không sau giờ bắt đầu) | Lỗi hiện dưới từng ô, focus về ô lỗi đầu tiên, không gọi máy chủ | `features/admin-campaigns/components/use-campaign-form.ts:64-69,85-92,106-107` |
| Bước 3 (máy chủ) | Khoảng giờ chồng với campaign khác | Lỗi dưới End Date nêu tên và khoảng giờ campaign kia; hộp mở, dữ liệu giữ nguyên | `features/admin-campaigns/components/use-campaign-form.ts:97` |
| Bước 3 (máy chủ) | Giờ kết thúc đã qua | Lỗi dưới End Date "Giờ kết thúc phải sau thời điểm hiện tại" | `features/admin-campaigns/schemas/campaign-input-schema.ts:67-72` |
| Bước 3 (máy chủ) | Lỗi không lường trước | Dòng lỗi chung trong biểu mẫu, dữ liệu giữ nguyên | `features/admin-campaigns/components/use-campaign-form.ts:99` |
| Bước 5 (sửa) | Campaign đang chạy | Ô Start Date chỉ đọc kèm ghi chú; chỉ tên và giờ kết thúc được sửa | `features/admin-campaigns/components/use-campaign-form.ts:46,82`, `features/admin-campaigns/components/campaign-form-modal.tsx:55,62` |
| Bước 5 (sửa/xoá) | Campaign đã bị xoá (NOT_FOUND) hoặc đã kết thúc (ENDED) trong lúc mở hộp | Hộp đóng, toast lỗi, bảng tải lại | `features/admin-campaigns/components/use-campaign-form.ts:98`, `features/admin-campaigns/components/campaign-delete-dialog.tsx:49` |
| Bước 5 (xoá) | Lỗi khác khi xoá | Hộp giữ mở, hiện "Không xoá được, vui lòng thử lại" | `features/admin-campaigns/components/campaign-delete-dialog.tsx:50,68-72` |

### Interaction Notes

- **Đang lưu hoặc đang xoá thì nút bị khoá nhưng focus vẫn nằm trong hộp** — dùng `aria-disabled` thay vì `disabled`, ô nhập chuyển chỉ đọc, Esc không đóng — source: `features/admin-campaigns/components/campaign-dialog-frame.tsx:20-28,42-50`, `features/admin-campaigns/components/campaign-form-modal.tsx:45,85-88`
- **Bấm ra ngoài hộp không đóng hộp nên không mất biểu mẫu đang nhập dở** — source: `features/admin-campaigns/components/campaign-dialog-frame.tsx:25,53`
- **Gõ vào một ô thì lỗi của ô đó biến mất; đổi giờ bắt đầu cũng xoá lỗi giờ kết thúc** — source: `features/admin-campaigns/components/use-campaign-form.ts:58-62`
- **Khi có lỗi, focus nhảy tới ô lỗi đầu tiên theo thứ tự tên, bắt đầu, kết thúc** — source: `features/admin-campaigns/components/use-campaign-form.ts:22,64-69`
- **Đóng hộp xong mà nút "⋯" đã biến mất (dòng vừa xoá hoặc vừa kết thúc) thì focus chuyển sang Add Campaign** — source: `features/admin-campaigns/components/campaign-settings-panel.tsx:31-40`
- **Hộp xoá đặt focus sẵn ở nút Cancel (lựa chọn an toàn)** — source: `features/admin-campaigns/components/campaign-delete-dialog.tsx:77-79`
- **Menu dòng điều khiển được bằng bàn phím: Enter/Space/mũi tên xuống mở, mũi tên/Home/End di chuyển, Esc đóng về nút, Tab đóng và đi tiếp** — source: `features/admin-campaigns/components/campaign-row-menu.tsx:18-25,40-62`
- **Xoá một campaign đang chạy sẽ dừng nó sớm** — source: `features/admin-campaigns/server/campaign-admin-actions.ts:88-99`
- **Trang cuộn phía sau bị khoá khi hộp thoại mở** — source: `features/admin-campaigns/components/campaign-dialog-frame.tsx:34-40`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang, danh sách đang đọc | Skeleton: tiêu đề, nút giả, thanh tiêu đề bảng và 3 dòng nhấp nháy (`aria-busy`) | none | `app/admin/settings/page.tsx:43`, `features/admin-campaigns/components/campaign-settings-skeleton.tsx:5-22` |
| empty | Không có campaign | Dòng thông báo trong bảng | Add Campaign | `features/admin-campaigns/components/campaign-table.tsx:61-66` |
| error | Đọc danh sách thất bại | Khối `role="alert"` "Không tải được danh sách chiến dịch." kèm link Thử lại | Thử lại | `features/admin-campaigns/components/campaign-settings-panel.tsx:63-70` |
| saving | Đang gửi biểu mẫu | Nút gửi đổi thành "Đang lưu…", ô nhập chỉ đọc, biểu mẫu `aria-busy` | none | `features/admin-campaigns/components/campaign-form-modal.tsx:35,45,88-90` |
| deleting | Đang xoá | Nút Delete đổi thành "Đang xoá…" (`aria-busy`) | none | `features/admin-campaigns/components/campaign-delete-dialog.tsx:74-76` |
| validation error | Kiểm tra client hoặc máy chủ báo lỗi | Lỗi dưới ô, ô `aria-invalid`; lỗi chung nếu không gắn được vào ô | Sửa lại và gửi tiếp | `features/admin-campaigns/components/use-campaign-form.ts:71-79,94-100` |
| success | Thêm, sửa, xoá xong | Hộp đóng, toast thành công tự tắt sau 5 giây | none | `features/admin-campaigns/components/campaign-settings-panel.tsx:42-47`, `features/admin-campaigns/components/campaign-settings-toast.tsx:20-25` |
| gone / ended | Campaign đã mất hoặc đã kết thúc khi ghi | Hộp đóng, toast lỗi, bảng được làm mới | none | `features/admin-campaigns/components/campaign-settings-panel.tsx:44` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E12 | Bắt buộc, tối đa 100 ký tự | Vui lòng nhập tên chiến dịch (tối đa 100 ký tự) | submit |
| E13 | Bắt buộc | Vui lòng chọn giờ bắt đầu | submit |
| E13 | Phải là ngày giờ có thật, từ năm 2000 | Ngày giờ không hợp lệ | submit |
| E13 | Không đổi được giờ bắt đầu khi campaign đang chạy | Chiến dịch đang chạy, không thể đổi giờ bắt đầu | server response |
| E14 | Bắt buộc | Vui lòng chọn giờ kết thúc | submit |
| E14 | Phải là ngày giờ có thật, từ năm 2000 | Ngày giờ không hợp lệ | submit |
| E14 | Giờ kết thúc phải sau giờ bắt đầu | Giờ kết thúc phải sau giờ bắt đầu | submit |
| E14 | Giờ kết thúc phải sau thời điểm hiện tại | Giờ kết thúc phải sau thời điểm hiện tại | server response |
| E14 | Không chồng giờ với campaign khác | Khoảng thời gian trùng với chiến dịch {name} ({startsAt} - {endsAt}); không xác định được campaign kia thì "Khoảng thời gian trùng với một chiến dịch khác" | server response |
| E15 | Trường lỗi không gắn được vào ô | Vui lòng kiểm tra lại các trường được đánh dấu | server response |
| E15 | Lỗi không lường trước khi lưu | Không lưu được, vui lòng thử lại | server response |
| E21 | Lỗi không lường trước khi xoá | Không xoá được, vui lòng thử lại | server response |
| E22 | Campaign đã bị xoá khi sửa hoặc xoá | Chiến dịch không còn tồn tại | server response |
| E22 | Campaign đã kết thúc khi sửa hoặc xoá | Chiến dịch đã kết thúc, không thể sửa hoặc xoá | server response |
| E22 | Thêm thành công | Đã thêm chiến dịch | server response |
| E22 | Sửa thành công | Đã lưu chiến dịch | server response |
| E22 | Xoá thành công | Đã xoá chiến dịch | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Chỉ admin xem được trang | auth | E01–E22 (cả trang) | Người dùng có vai trò admin | Guest (chuyển về đăng nhập), người không phải admin (trang 403) | Consequence if bypassed: redirect hoặc 403 trước khi sinh markup admin; đọc danh sách cũng tự kiểm tra quyền |
| Bảng có dòng khi có campaign | configuration | E03, E04, E05 | Danh sách đọc được và không rỗng | Rỗng (hiện E09) hoặc đọc lỗi (hiện E10, E11) | — |
| Nút "⋯" chỉ cho campaign chưa kết thúc | configuration | E06, E07, E08 | Campaign đang ở pha upcoming hoặc active | Campaign đã kết thúc (dòng chỉ đọc) | Pha tính theo giờ máy chủ lúc đọc; máy chủ tính lại khi ghi nên nút còn hiện không đảm bảo ghi được |
| Trạng thái rỗng | configuration | E09 | Danh sách rỗng | Có ít nhất một campaign | — |
| Trạng thái lỗi tải | configuration | E10, E11 | Đọc danh sách thất bại | Đọc thành công | Khi lỗi, bảng bị thay hoàn toàn bằng khối lỗi |
| Hộp thêm/sửa mở | configuration | E12, E13, E14, E15, E16, E17 | Admin vừa bấm Add Campaign hoặc Edit | Chưa mở hoặc đã đóng | URL không đổi |
| Ô Start Date khoá khi campaign đang chạy | configuration | E13 | Chỉ đọc kèm ghi chú khi sửa campaign đang chạy | Sửa được khi thêm mới hoặc campaign sắp diễn ra | Máy chủ cũng từ chối nếu đổi |
| Hộp xoá mở | configuration | E18, E19, E20, E21 | Admin vừa chọn Delete | Chưa mở hoặc đã đóng; E21 chỉ khi xoá lỗi | — |
| Toast chỉ khi có kết quả | configuration | E22 | Vừa có kết quả mới (5 giây) | Hết giờ hoặc chưa có | — |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR002_AdminLayout | Bấm mục Settings | Admin | `features/app-shell/components/admin-top-bar.tsx:25`, `docs/generated/screen-flow.md:237` |

### Exits

N/A — this screen has no exits (terminal screen).

> Ghi chú: trang không có link rời riêng; điều hướng khu admin diễn ra qua thanh trên cùng của SCR002_AdminLayout (`docs/generated/screen-flow.md` mục SCR014_AdminCampaignSettings, Exit Points).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Bảng có `<caption>` ẩn và `scope="col"`; nút "⋯" có `aria-label` nêu tên campaign, `aria-haspopup`, `aria-expanded`; menu `role="menu"`; hộp thoại `role="dialog"` hoặc `alertdialog` với `aria-modal`, `aria-labelledby`, `aria-describedby` (hộp xoá); mỗi ô nhập `required`, `aria-invalid` và `aria-describedby` tới thông báo (`campaign-table.tsx:37,46-56`, `campaign-row-menu.tsx:75-78,89-90`, `campaign-dialog-frame.tsx:55-60`, `campaign-form-field.tsx:42`) |
| Keyboard navigation | supported | Menu dòng hỗ trợ Enter/Space/mũi tên/Home/End/Esc/Tab; Esc đóng hộp thoại (trừ khi đang ghi) (`campaign-row-menu.tsx:40-62`, `campaign-dialog-frame.tsx:42-50`) |
| Focus management | managed | Focus bị giữ trong hộp thoại, bắt đầu ở phần tử `data-autofocus` (ô tên hoặc nút Cancel), trả về nút mở; lỗi chuyển focus tới ô lỗi đầu tiên; focus về Add Campaign khi nút mở đã biến mất (`campaign-dialog-frame.tsx:32`, `use-campaign-form.ts:64-69`, `campaign-settings-panel.tsx:31-40`) |
| Screen reader compatibility | unknown | Có `<label>` liên kết `htmlFor`, dấu `*` ẩn khỏi trình đọc, chữ "đến" `sr-only` giữa hai mốc giờ; chưa có kết quả kiểm thử trình đọc màn hình trong mã (`campaign-form-field.tsx:36-41`, `campaign-table.tsx:79`) |
| Error announcement | supported | Lỗi ô gắn `aria-describedby` và `aria-invalid`; lỗi chung và khối lỗi tải là `role="alert"`; toast thành công `role="status"`, toast lỗi `role="alert"` (`campaign-form-modal.tsx:79-83`, `campaign-settings-toast.tsx:29-33`) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (`<md`) | R2 | Cột ID 36 px, cột Time 160 px, cột Actions 48 px; từ `md` ID 60, Name 480, Actions 80 | `features/admin-campaigns/components/campaign-table.tsx:39-42` |
| mobile (`<md`) | E05 | Giờ bắt đầu và giờ kết thúc xếp dọc; từ `md` xếp ngang, cách 40 | `features/admin-campaigns/components/campaign-table.tsx:77` |
| mobile (`<md`) | R2 | Chữ tiêu đề cột Actions chỉ còn cho trình đọc màn hình | `features/admin-campaigns/components/campaign-table.tsx:56` |
| mobile (`<sm`) | E13, E14 | Hai ô giờ xếp dọc; từ `sm` nằm cạnh nhau | `features/admin-campaigns/components/campaign-form-modal.tsx:50` |
| mobile / desktop (`md`) | R3 | Hộp thêm/sửa rộng tối đa 560 px, đệm 24 → 40 từ `md`; hộp xoá rộng tối đa 480 px, đệm ngang 24 → 32 từ `md` | `features/admin-campaigns/components/campaign-form-modal.tsx:33`, `features/admin-campaigns/components/campaign-delete-dialog.tsx:62` |
| mobile / desktop (`sm`) | R1 | Hàng tiêu đề tự xuống dòng khi hẹp | `features/admin-campaigns/components/campaign-settings-panel.tsx:51` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| R2 | handler | `CampaignAdminQuery.list()`: tự gọi `requireAdmin()`, sắp theo `starts_at DESC, id DESC`, không phân trang; tính pha `upcoming`/`active`/`ended` theo giờ máy chủ và định dạng giờ theo múi giờ admin | `features/admin-campaigns/server/campaign-admin-query.ts:16-34`, `features/admin-campaigns/server/campaign-phase.ts:8-12` |
| § 5. | handler | `loadCampaigns()` bắt lỗi đọc trả `null` (E10), nhưng `unstable_rethrow` để chuyển hướng đăng nhập và 403 đi qua; nội dung đọc dữ liệu nằm trong `Suspense` với skeleton | `app/admin/settings/page.tsx:19-32,43-45` |
| E17 | endpoint | Server action `createCampaign(input)` (ROUTE029): `requireAdmin` → `CampaignCreateSchema` → `campaignWindowErrors` → một giao dịch kiểm tra chồng giờ rồi `INSERT campaigns` → `revalidatePath("/admin/settings")`; request: `name`, `startsAt`, `endsAt` (chuỗi `yyyy-MM-ddTHH:mm` giờ admin, lưu UTC) | `features/admin-campaigns/server/campaign-admin-actions.ts:39-52` |
| E17 | endpoint | Server action `updateCampaign(input)` (ROUTE030): khoá dòng, tính lại pha theo giờ máy chủ; `ENDED` nếu đã kết thúc; pha active mà đổi phút bắt đầu thì lỗi `startLocked`; request: `id`, `name`, `endsAt`, `startsAt` (bỏ khi bị khoá) | `features/admin-campaigns/server/campaign-admin-actions.ts:58-86` |
| E19 | endpoint | Server action `removeCampaign(id)` (ROUTE031): khoá dòng, `ENDED` nếu đã kết thúc, ngược lại xoá cứng; id không phải số nguyên dương trả `NOT_FOUND` | `features/admin-campaigns/server/campaign-admin-actions.ts:89-99` |
| E14 | helper | Chồng giờ: kiểm tra `find` trước (nêu tên campaign kia) và ràng buộc `campaigns_no_overlap` (SQLSTATE 23P01) làm chốt chống tranh chấp; hai khoảng nửa mở nên đầu cuối chạm nhau không chồng | `features/admin-campaigns/server/campaign-overlap-check.ts:8-36`, `features/admin-campaigns/server/campaign-write-transaction.ts:38-51` |
| E15, E22 | helper | Kết quả hành động: `ok`, hoặc `VALIDATION` (kèm `fieldErrors`), `OVERLAP`, `NOT_FOUND`, `ENDED`, `UNEXPECTED`; làm mới `/admin/settings` cho mọi kết quả trừ `VALIDATION` và `UNEXPECTED` | `features/admin-campaigns/server/campaign-write-transaction.ts:53-61` |
| E12–E14 | js | Kiểm tra sớm phía client bằng cùng `CampaignCreateSchema`/`CampaignUpdateSchema` và thêm luật giờ kết thúc sau giờ bắt đầu; lỗi mạng hoặc action ném lỗi thành `UNEXPECTED` | `features/admin-campaigns/components/use-campaign-form.ts:24-33,85-92` |
| E19 | js | `removeSafely` bắt lỗi ném thành `UNEXPECTED`, chuyển 403/redirect đi tiếp | `features/admin-campaigns/components/campaign-delete-dialog.tsx:19-27` |
| E22 | js | `CampaignSettingsToast` tự tắt sau `durationMs` = 5000; vùng `status` luôn gắn sẵn cho trình đọc màn hình | `features/admin-campaigns/components/campaign-settings-toast.tsx:20-37` |
| R3 | js | `CampaignDialogFrame`: khoá cuộn thân trang, `useFocusTrap`, nghe Esc trên `document` | `features/admin-campaigns/components/campaign-dialog-frame.tsx:29-50` |
| § 2. | guard | Khung admin gọi `requireShellAdmin()` trước mọi markup admin | `app/admin/layout.tsx:11` |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireShellAdmin()` ở khung admin | role | Guest chuyển về đăng nhập, non-admin nhận 403; không có markup admin |
| `requireAdmin()` trong `CampaignAdminQuery.list` | role | Khung không bảo vệ dữ liệu; thiếu guard thì mọi người đăng nhập đọc được danh sách campaign |
| `requireAdmin()` đầu mỗi server action (`createCampaign`, `updateCampaign`, `removeCampaign`) | role | Action là điểm vào POST không tin cậy; thiếu guard thì người không phải admin tạo, sửa, xoá được campaign (ảnh hưởng nhân đôi tim) |
| Cổng prelaunch và session ở proxy cho `/admin/*` | role | [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware |
| Máy chủ tính lại pha khi ghi (khoá dòng) | permission | Nút "⋯" hiện sai (pha cũ) cũng không sửa được campaign đã kết thúc; trả `ENDED` |

## Source References

1. Page/View: `app/admin/settings/page.tsx:10-48`
2. Admin frame: `app/admin/layout.tsx:10-19`
3. Panel (thân màn hình): `features/admin-campaigns/components/campaign-settings-panel.tsx:22-78`
4. Table: `features/admin-campaigns/components/campaign-table.tsx:33-94`
5. Row menu: `features/admin-campaigns/components/campaign-row-menu.tsx:26-106`
6. Form modal: `features/admin-campaigns/components/campaign-form-modal.tsx:23-95`
7. Form hook: `features/admin-campaigns/components/use-campaign-form.ts:43-116`
8. Form field: `features/admin-campaigns/components/campaign-form-field.tsx:30-69`
9. Delete dialog: `features/admin-campaigns/components/campaign-delete-dialog.tsx:36-89`
10. Dialog frame: `features/admin-campaigns/components/campaign-dialog-frame.tsx:29-72`
11. Toast + skeleton: `features/admin-campaigns/components/campaign-settings-toast.tsx:20-39`, `features/admin-campaigns/components/campaign-settings-skeleton.tsx:5-23`
12. Input schema: `features/admin-campaigns/schemas/campaign-input-schema.ts:1-87`
13. Server actions: `features/admin-campaigns/server/campaign-admin-actions.ts:1-100`
14. Query, phase, overlap, write transaction: `features/admin-campaigns/server/campaign-admin-query.ts:16-36`, `features/admin-campaigns/server/campaign-phase.ts:8-12`, `features/admin-campaigns/server/campaign-overlap-check.ts:1-38`, `features/admin-campaigns/server/campaign-write-transaction.ts:20-61`
15. UI copy: `messages/vi.json` (`adminCampaigns`)

## Source Walkthrough

1. **File:** `app/admin/settings/page.tsx:10-48` — trang RSC: đọc danh sách trong Suspense và chuyển cho panel; bắt đầu từ đây.
2. **File:** `features/admin-campaigns/server/campaign-admin-query.ts:16-36` — nguồn dữ liệu bảng, kèm pha tính theo giờ máy chủ (entity: MODEL009_Campaign trong `entities.md`).
3. **File:** `features/admin-campaigns/components/campaign-settings-panel.tsx:22-78` — giữ trạng thái hộp thoại đang mở và toast; điểm ghép mọi thành phần.
4. **File:** `features/admin-campaigns/components/campaign-table.tsx:33-94` — bảng và điều kiện hiện nút "⋯".
5. **File:** `features/admin-campaigns/components/campaign-row-menu.tsx:26-106` — menu Edit / Delete và bàn phím.
6. **File:** `features/admin-campaigns/components/use-campaign-form.ts:43-116` — luồng kiểm tra và gửi biểu mẫu, ánh xạ mã lỗi sang chữ.
7. **File:** `features/admin-campaigns/components/campaign-form-modal.tsx:23-95` — hộp Add/Edit Campaign.
8. **File:** `features/admin-campaigns/components/campaign-delete-dialog.tsx:36-89` — hộp xác nhận xoá.
9. **File:** `features/admin-campaigns/server/campaign-admin-actions.ts:39-99` — ba server action và luật ghi (ngoài phạm vi UI nhưng cần để hiểu mã lỗi).

### Call Hierarchy

```text
AdminSettingsPage (RSC) ─ Suspense ─ CampaignSettingsContent ─ CampaignAdminQuery.list
 └─ CampaignSettingsPanel (client)
     ├─ CampaignTable ─ CampaignRowMenu ─ onEdit / onDelete
     ├─ Load-failed block (campaigns === null)
     ├─ CampaignFormModal ─ CampaignDialogFrame ─ useCampaignForm ─ createCampaign / updateCampaign
     ├─ CampaignDeleteDialog ─ CampaignDialogFrame ─ removeCampaign
     └─ CampaignSettingsToast
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Bấm Add / Edit / Delete -> setDialog(...) -> hộp thoại -> server action (requireAdmin -> validate -> transaction)
  -> CampaignActionResult -> onDone(outcome) -> đóng hộp + setNotice + revalidatePath -> bảng đọc lại -> vẽ lại
```

## Unresolved Questions

- `docs/generated/screen-list.md` (SCR014) mô tả bảng "trạng thái upcoming/running/ended tính khi đọc" như thể bảng hiển thị trạng thái; mã không có cột trạng thái, pha chỉ quyết định nút "⋯" và ô Start Date bị khoá, và tên pha trong mã là `active` chứ không phải "running" (`campaign-phase.ts:8-12`, `campaign-table.tsx:84`). Cần sửa tài liệu cho khớp mã.
- `docs/generated/screen-list.md` (SCR014) không nhắc ô Start Date chỉ đọc khi campaign đang chạy (`campaign-form-modal.tsx:55,62`); cần bổ sung.
- Trang `/admin/settings` không có `requireAdmin` trực tiếp trong `page.tsx`; việc chặn dựa vào khung admin và vào `CampaignAdminQuery.list` (`app/admin/settings/page.tsx:40-48`). Cần xác nhận đây là chủ ý.
- Toast kết quả của SCR013_AdminReviewContent dùng lại component của feature này (`CampaignSettingsToast`), phụ thuộc chéo giữa hai feature — needs domain confirmation.
- Khoá `adminCampaigns.toast.dismiss` có trong messages nhưng tôi không thấy nơi dùng trong các file đã đọc — needs runtime confirmation.
