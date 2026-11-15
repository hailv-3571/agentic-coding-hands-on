---
status: draft
authored_by: takumi
lang: vi
created: 2026-11-08
---

# Feature List

**Project**: SAA 2025 "ROOT FURTHER" — Cổng giải thưởng + Sun* Kudos + Admin
**Generated**: 2026-11-08
**Analysis Scope**: Toàn hệ thống (mode=system), web desktop + responsive (không có app native). Nguồn: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md`. Mã F### chỉ là tạm (PROVISIONAL), sẽ cấp lại khi promote.

**Code Format**: All codes MUST follow `F###_NameSlug` format (e.g., F001_Auth, F002_UserProfile)
**Screen Code Format**: All screen codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm)
**User Story Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login)
**Background Logic Code Format**: All BL codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport)
**Permission Code Format**: All PERM codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports)

**Feature Types**:
- `ui` - Feature has UI screens (SCR###)
- `background` - Feature only has background logic (BL###, no SCR###)
- `mixed` - Feature has both UI screens and background logic

## Feature Hierarchy

**Note**: Sắp theo ưu tiên P0 → P3, cũng là thứ tự build (nền tảng auth/shell/dữ liệu trước). Mức ưu tiên:
- **P0**: Nền tảng, chặn mọi feature khác
- **P1**: Tính năng chính, nên có ở bản đầu
- **P2**: Tính năng chuẩn, build sau khi lõi chạy
- **P3**: Có thì tốt

| Code | Name | Type | Language | Workspace | Priority |
|------|------|------|----------|-----------|----------|
| F001_Auth | Auth | mixed | TypeScript | my-app (Next.js) | P0 |
| F002_AppShell | AppShell | ui | TypeScript | my-app (Next.js) | P0 |
| F003_KudosAuthoring | KudosAuthoring | ui | TypeScript | my-app (Next.js) | P0 |
| F004_KudosFeed | KudosFeed | ui | TypeScript | my-app (Next.js) | P1 |
| F005_KudosHearts | KudosHearts | mixed | TypeScript | my-app (Next.js) | P1 |
| F006_AwardsPortal | AwardsPortal | ui | TypeScript | my-app (Next.js) | P1 |
| F007_AdminModeration | AdminModeration | mixed | TypeScript | my-app (Next.js) | P1 |
| F008_SpotlightBoard | SpotlightBoard | mixed | TypeScript | my-app (Next.js) | P2 |
| F009_HeroBadges | HeroBadges | mixed | TypeScript | my-app (Next.js) | P2 |
| F010_SecretBoxRewards | SecretBoxRewards | mixed | TypeScript | my-app (Next.js) | P2 |
| F011_AdminCampaigns | AdminCampaigns | ui | TypeScript | my-app (Next.js) | P2 |
| F012_Profile | Profile | ui | TypeScript | my-app (Next.js) | P2 |
| F013_Notifications | Notifications | mixed | TypeScript | my-app (Next.js) | P2 |
| F014_AdminUserManagement | AdminUserManagement | ui | TypeScript | my-app (Next.js) | P2 |
| F015_AdminOverview | AdminOverview | ui | TypeScript | my-app (Next.js) | P3 |

## Feature Details

### F001_Auth: Auth

**Type**: mixed
**Description**: Sunner đăng nhập bằng Google, chỉ nhận email `@sun-asterisk.com` (Supabase Auth). Lần đầu đăng nhập thì tạo hồ sơ Sunner (tên, avatar, phòng ban, role mặc định User). Quản lý session, chặn khách chưa đăng nhập, phân quyền User/Admin (trả 403 khi vào khu Admin trái quyền). Đây là nền dữ liệu người dùng cho mọi feature sau (profile, department, role).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — màn Login

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — hồ sơ Sunner, phòng ban, role

**Related Background Logic**:
- TBD (draft) — tạo hồ sơ khi đăng nhập lần đầu

**Related Permissions**:
- TBD (draft) — User / Admin

---

### F002_AppShell: AppShell

**Type**: ui
**Description**: Khung dùng chung sau đăng nhập: header (About SAA 2025, Award Information, Sun* Kudos, chuông thông báo, avatar + dropdown profile), footer, đổi ngôn ngữ VN/EN (next-intl), layout responsive desktop/mobile web, khung và menu riêng của khu Admin, trang lỗi 404 / 403. Không chứa nội dung nghiệp vụ của từng trang.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — header/footer, dropdown ngôn ngữ, dropdown profile, 404, 403, khung Admin

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft)

---

### F003_KudosAuthoring: KudosAuthoring

**Type**: ui
**Description**: Viết, sửa Kudo: chọn người nhận (tìm Sunner), lời nhắn (tối đa 1.000 ký tự, nhắc tên bằng "@"), hashtag chọn từ danh sách, danh hiệu, ảnh đính kèm (tối đa ~5, Supabase Storage), chèn link, tuỳ chọn gửi ẩn danh. Validate bằng Zod, báo lỗi khi thiếu Người nhận / Lời nhắn / Hashtag. Chủ bài được sửa sau khi đăng. Đầu ra là bản ghi Kudo, nguồn dữ liệu cho mọi feature Kudos khác.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — modal Viết Kudo, modal Sửa Kudo, ô "gửi lời cảm ơn" trên Live board

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — Kudo, hashtag, ảnh đính kèm

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft) — chỉ chủ bài được sửa

---

### F004_KudosFeed: KudosFeed

**Type**: ui
**Description**: Xem Kudos công khai: Highlight Kudos (carousel, lọc Hashtag + Phòng ban, phân trang), feed All Kudos, thẻ Kudo (cả biến thể ẩn danh), Xem chi tiết, Copy Link, ô tìm profile Sunner. Chỉ hiển thị bài ở trạng thái Public.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Live board (phần Highlight + All Kudos), chi tiết Kudo

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft)

---

### F005_KudosHearts: KudosHearts

**Type**: mixed
**Description**: Thả tim cho Kudo (bật/tắt, đếm tim). Khi chiến dịch "Ngày x2 tim" (F011) đang chạy thì tim nhận được nhân đôi; ngoài khung giờ hệ số là 1. Tim là đầu vào để người gửi tích luỹ Secret Box (F010).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — nút tim trên thẻ Kudo, vùng thống kê tim

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — tim (reaction)

**Related Background Logic**:
- TBD (draft) — áp hệ số x2 theo campaign đang hiệu lực

**Related Permissions**:
- TBD (draft)

---

### F006_AwardsPortal: AwardsPortal

**Type**: ui
**Description**: Cổng thông tin lễ trao giải: Countdown prelaunch (trước giờ mở chỉ hiện đếm ngược), Homepage (hero ROOT FURTHER, đếm ngược Days/Hours/Minutes, thời gian – địa điểm, bài về chủ đề, lưới 6 giải, banner Sun* Kudos), trang Hệ thống giải (6 hạng mục, menu neo theo cuộn), Thể lệ, Tiêu chuẩn cộng đồng. Nội dung chủ yếu tĩnh, hai ngôn ngữ.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Countdown prelaunch, Homepage, Hệ thống giải, Thể lệ, Tiêu chuẩn cộng đồng

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — có thể chỉ là nội dung tĩnh/i18n

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft)

---

### F007_AdminModeration: AdminModeration

**Type**: mixed
**Description**: Admin duyệt nội dung: bảng mọi Kudo (người gửi, người nhận, nội dung, hashtag, tim, trạng thái Public/Spam), lọc theo người gửi/người nhận/trạng thái/ngày, tìm theo nội dung, Mark Spam / Un Spam, Export, phân trang. Phía Sunner: Kudo bị spam bị ẩn khỏi feed và chủ bài thấy Alert Overlay "Cảnh báo vi phạm tiêu chuẩn cộng đồng".

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Admin Review content, Alert Overlay vi phạm

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — trạng thái moderation của Kudo

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft) — Admin

---

### F008_SpotlightBoard: SpotlightBoard

**Type**: mixed
**Description**: Spotlight Board thời gian thực: đám mây tên người nhận, tổng số Kudos, luồng sự kiện "X đã nhận được một Kudos mới" (Supabase Realtime), tìm kiếm, phóng to.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Spotlight Board (Live board)

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft) — đẩy sự kiện realtime khi có Kudo mới

**Related Permissions**:
- TBD (draft)

---

### F009_HeroBadges: HeroBadges

**Type**: mixed
**Description**: Tính huy hiệu Hero cho người nhận theo số người khác nhau đã gửi Kudos (New 1–4, Rising 5–9, Super 10–20, Legend >20) và hiện cạnh tên ở thẻ Kudo, profile, thẻ nhanh khi rê chuột. Phần lớn là logic nền, UI chỉ hiển thị.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — huy hiệu hiển thị trên thẻ Kudo / profile

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft) — tính lại cấp Hero khi có Kudo mới / bị Mark Spam

**Related Permissions**:
- TBD (draft)

---

### F010_SecretBoxRewards: SecretBoxRewards

**Type**: mixed
**Description**: Phần thưởng cho người gửi: cứ 5 tim nhận được = 1 Secret Box; mở hộp ra icon (bộ 6) hoặc quà hiện vật (kho quà, tỉ lệ ra quà cấu hình); gom đủ 6 icon nhận quà bí ẩn. Gồm panel thống kê cá nhân (Kudos nhận/gửi, tim, hộp đã/chưa mở, nút Mở Secret Box), danh sách 10 Sunner nhận quà mới nhất, và Kudos Quốc Dân (5 Kudo nhiều tim nhất nhận quà đặc biệt).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — panel thống kê cá nhân, màn mở hộp (nhiều trạng thái), danh sách nhận quà mới nhất

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — Secret Box, quà/icon, kho quà

**Related Background Logic**:
- TBD (draft) — cấp hộp khi đủ 5 tim, chốt Kudos Quốc Dân

**Related Permissions**:
- TBD (draft)

---

### F011_AdminCampaigns: AdminCampaigns

**Type**: ui
**Description**: Admin quản lý Campaign (tên, ngày giờ bắt đầu – kết thúc): thêm, sửa, xoá. Campaign đang hiệu lực là cấu hình "Ngày x2 tim" mà F005 đọc.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Admin Settings (Campaign)

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — Campaign

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft) — Admin

---

### F012_Profile: Profile

**Type**: ui
**Description**: Xem profile bản thân (thông tin, danh hiệu, thống kê, Kudo đã nhận/đã gửi có lọc) và profile người khác (thông tin + Kudos của họ), kèm thẻ thông tin nhanh khi rê chuột lên avatar.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — profile bản thân, profile người khác, hover card

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft)

---

### F013_Notifications: Notifications

**Type**: mixed
**Description**: Thông báo cho Sunner (nhận Kudo mới, lên cấp Hero, có Secret Box…): chuông ở header với số chưa đọc cập nhật realtime, danh sách tất cả thông báo, xem chi tiết, đánh dấu đã đọc.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — dropdown chuông, danh sách thông báo, chi tiết

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft) — Notification

**Related Background Logic**:
- TBD (draft) — sinh thông báo từ sự kiện Kudo/Hero/Secret Box

**Related Permissions**:
- TBD (draft)

---

### F014_AdminUserManagement: AdminUserManagement

**Type**: ui
**Description**: Admin xem và quản lý người dùng: bảng (Kudos gửi/nhận, tổng tim, Level, số Badges, thời điểm gom đủ 6 Badges, lần đăng nhập cuối, Role), lọc theo phòng ban / Level / Role, tìm kiếm, Export, menu thao tác từng dòng (đổi role).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Admin User

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft) — Admin

---

### F015_AdminOverview: AdminOverview

**Type**: ui
**Description**: Admin xem số liệu theo đơn vị (tổng thành viên, Kudos gửi, Kudos nhận, số người có ≥1 Kudos, số Secret Box nhận), lọc theo khoảng ngày, Export. Chỉ đọc, build sau cùng vì cần dữ liệu từ các feature trước.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- TBD (draft) — Admin Overview

**Related User Stories**:
- TBD (draft)

**Related APIs/Routes**:
- TBD (draft)

**Related Data Models**:
- TBD (draft)

**Related Background Logic**:
- TBD (draft)

**Related Permissions**:
- TBD (draft) — Admin

---

## Summary

- **Total Features**: 15
- **Total Screens**: TBD (draft)
- **Total User Stories**: TBD (draft)
- **Total Routes**: TBD (draft)
- **Total Data Models**: TBD (draft)
- **Total Background Logic**: TBD (draft)
- **Total Permissions**: TBD (draft)
- **Languages Detected**: TypeScript

## Cross-Reference Validation

- [x] All F### codes are unique
