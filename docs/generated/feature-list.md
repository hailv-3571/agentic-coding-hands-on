# Feature List

## Feature Hierarchy

| # | Code | Feature | Priority | Type | Status |
|---|------|---------|----------|------|--------|
| 1 | F001 | Auth | P0 | mixed | implemented |
| 2 | F002 | AppShell | P0 | ui | implemented |
| 3 | F003 | KudosAuthoring | P0 | ui | implemented |
| 4 | F004 | KudosFeed | P1 | ui | implemented |
| 5 | F005 | KudosHearts | P1 | mixed | implemented |
| 6 | F006 | AwardsPortal | P1 | ui | implemented |
| 7 | F007 | AdminModeration | P1 | mixed | implemented |
| 8 | F008 | SpotlightBoard | P2 | mixed | implemented |
| 9 | F009 | HeroBadges | P2 | mixed | implemented |
| 10 | F010 | SecretBoxRewards | P2 | mixed | implemented |
| 11 | F011 | AdminCampaigns | P2 | ui | implemented |
| 12 | F012 | Profile | P2 | ui | implemented |
| 13 | F013 | Notifications | P2 | mixed | implemented |
| 14 | F014 | AdminUserManagement | P2 | ui | implemented |
| 15 | F015 | AdminOverview | P3 | ui | implemented |

## Feature Details

### F001 — Auth

**Priority:** P0 | **Type:** mixed | **Status:** implemented | **Slug:** F001_Auth

Sunner đăng nhập bằng Google, chỉ nhận email `@sun-asterisk.com` (Supabase Auth). Lần đầu đăng nhập thì tạo hồ sơ Sunner (tên, avatar, phòng ban, role mặc định User). Quản lý session, chặn khách chưa đăng nhập, phân quyền User/Admin (trả 403 khi vào khu Admin trái quyền). Đây là nền dữ liệu người dùng cho mọi feature sau (profile, department, role).

**Related:** screens: SCR001 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR001_Login

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

### F002 — AppShell

**Priority:** P0 | **Type:** ui | **Status:** implemented | **Slug:** F002_AppShell

Khung dùng chung sau đăng nhập: header (About SAA 2025, Award Information, Sun* Kudos, chuông thông báo, avatar + dropdown profile), footer, đổi ngôn ngữ VN/EN (next-intl), layout responsive desktop/mobile web, khung và menu riêng của khu Admin, trang lỗi 404 / 403. Không chứa nội dung nghiệp vụ của từng trang.

**Related:** screens: SCR002, SCR003, SCR004, SCR005 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR002_AdminLayout
- SCR003_AppLayout
- SCR004_Error403
- SCR005_Error404

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

### F003 — KudosAuthoring

**Priority:** P0 | **Type:** ui | **Status:** implemented | **Slug:** F003_KudosAuthoring

Viết, sửa Kudo: chọn người nhận (tìm Sunner), lời nhắn (tối đa 1.000 ký tự, nhắc tên bằng "@"), hashtag chọn từ danh sách, danh hiệu, ảnh đính kèm (tối đa ~5, Supabase Storage), chèn link, tuỳ chọn gửi ẩn danh. Validate bằng Zod, báo lỗi khi thiếu Người nhận / Lời nhắn / Hashtag. Chủ bài được sửa sau khi đăng. Đầu ra là bản ghi Kudo, nguồn dữ liệu cho mọi feature Kudos khác.

**Related:** screens: SCR006 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR006_WriteKudoModal

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

### F004 — KudosFeed

**Priority:** P1 | **Type:** ui | **Status:** implemented | **Slug:** F004_KudosFeed

Xem Kudos công khai: Highlight Kudos (carousel, lọc Hashtag + Phòng ban, phân trang), feed All Kudos, thẻ Kudo (cả biến thể ẩn danh), Xem chi tiết, Copy Link, ô tìm profile Sunner. Chỉ hiển thị bài ở trạng thái Public.

**Related:** screens: SCR007, SCR008 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR007_KudoDetail
- SCR008_KudosLiveBoardFeed

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

### F005 — KudosHearts

**Priority:** P1 | **Type:** mixed | **Status:** implemented | **Slug:** F005_KudosHearts

Thả tim cho Kudo (bật/tắt, đếm tim). Khi chiến dịch "Ngày x2 tim" (F011) đang chạy thì tim nhận được nhân đôi; ngoài khung giờ hệ số là 1. Tim là đầu vào để người gửi tích luỹ Secret Box (F010).

**Related:** screens: — | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- — (không có màn riêng)

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

### F006 — AwardsPortal

**Priority:** P1 | **Type:** ui | **Status:** implemented | **Slug:** F006_AwardsPortal

Cổng thông tin lễ trao giải: Countdown prelaunch (trước giờ mở chỉ hiện đếm ngược), Homepage (hero ROOT FURTHER, đếm ngược Days/Hours/Minutes, thời gian – địa điểm, bài về chủ đề, lưới 6 giải, banner Sun* Kudos), trang Hệ thống giải (6 hạng mục, menu neo theo cuộn), Thể lệ, Tiêu chuẩn cộng đồng. Nội dung chủ yếu tĩnh, hai ngôn ngữ.

**Related:** screens: SCR009, SCR010, SCR011, SCR012, SCR013 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR009_AwardsSystem
- SCR010_CommunityStandards
- SCR011_CountdownPrelaunch
- SCR012_Homepage
- SCR013_Rules

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

### F007 — AdminModeration

**Priority:** P1 | **Type:** mixed | **Status:** implemented | **Slug:** F007_AdminModeration

Admin duyệt nội dung: bảng mọi Kudo (người gửi, người nhận, nội dung, hashtag, tim, trạng thái Public/Spam), lọc theo người gửi/người nhận/trạng thái/ngày, tìm theo nội dung, Mark Spam / Un Spam, Export, phân trang. Phía Sunner: Kudo bị spam bị ẩn khỏi feed và chủ bài thấy Alert Overlay "Cảnh báo vi phạm tiêu chuẩn cộng đồng".

**Related:** screens: SCR014, SCR015 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR014_AdminReviewContent
- SCR015_SpamAlertOverlay

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

### F008 — SpotlightBoard

**Priority:** P2 | **Type:** mixed | **Status:** implemented | **Slug:** F008_SpotlightBoard

Spotlight Board thời gian thực: đám mây tên người nhận, tổng số Kudos, luồng sự kiện "X đã nhận được một Kudos mới" (Supabase Realtime), tìm kiếm, phóng to.

**Related:** screens: SCR016 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR016_SpotlightBoardRegion

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

### F009 — HeroBadges

**Priority:** P2 | **Type:** mixed | **Status:** implemented | **Slug:** F009_HeroBadges

Tính huy hiệu Hero cho người nhận theo số người khác nhau đã gửi Kudos (New 1–4, Rising 5–9, Super 10–20, Legend >20) và hiện cạnh tên ở thẻ Kudo, profile, thẻ nhanh khi rê chuột. Phần lớn là logic nền, UI chỉ hiển thị.

**Related:** screens: — | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- — (không có màn riêng)

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

### F010 — SecretBoxRewards

**Priority:** P2 | **Type:** mixed | **Status:** implemented | **Slug:** F010_SecretBoxRewards

Phần thưởng cho người gửi: cứ 5 tim nhận được = 1 Secret Box; mở hộp ra icon (bộ 6) hoặc quà hiện vật (kho quà, tỉ lệ ra quà cấu hình); gom đủ 6 icon nhận quà bí ẩn. Gồm panel thống kê cá nhân (Kudos nhận/gửi, tim, hộp đã/chưa mở, nút Mở Secret Box), danh sách 10 Sunner nhận quà mới nhất, và Kudos Quốc Dân (5 Kudo nhiều tim nhất nhận quà đặc biệt).

**Related:** screens: SCR017, SCR018 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR017_LiveBoardRewardsColumn
- SCR018_SecretBoxOpen

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

### F011 — AdminCampaigns

**Priority:** P2 | **Type:** ui | **Status:** implemented | **Slug:** F011_AdminCampaigns

Admin quản lý Campaign (tên, ngày giờ bắt đầu – kết thúc): thêm, sửa, xoá. Campaign đang hiệu lực là cấu hình "Ngày x2 tim" mà F005 đọc.

**Related:** screens: SCR019, SCR020 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR019_AdminCampaignSettings
- SCR020_CampaignFormModal

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

### F012 — Profile

**Priority:** P2 | **Type:** ui | **Status:** implemented | **Slug:** F012_Profile

Xem profile bản thân (thông tin, danh hiệu, thống kê, Kudo đã nhận/đã gửi có lọc) và profile người khác (thông tin + Kudos của họ), kèm thẻ thông tin nhanh khi rê chuột lên avatar.

**Related:** screens: SCR021, SCR022, SCR023 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR021_AvatarHoverCard
- SCR022_OtherProfile
- SCR023_OwnProfile

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

### F013 — Notifications

**Priority:** P2 | **Type:** mixed | **Status:** implemented | **Slug:** F013_Notifications

Thông báo cho Sunner (nhận Kudo mới, lên cấp Hero, có Secret Box…): chuông ở header với số chưa đọc cập nhật realtime, danh sách tất cả thông báo, xem chi tiết, đánh dấu đã đọc.

**Related:** screens: SCR024, SCR025 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR024_AllNotifications
- SCR025_NotificationDropdown

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

### F014 — AdminUserManagement

**Priority:** P2 | **Type:** ui | **Status:** implemented | **Slug:** F014_AdminUserManagement

Admin xem và quản lý người dùng: bảng (Kudos gửi/nhận, tổng tim, Level, số Badges, thời điểm gom đủ 6 Badges, lần đăng nhập cuối, Role), lọc theo phòng ban / Level / Role, tìm kiếm, Export, menu thao tác từng dòng (đổi role).

**Related:** screens: SCR026 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR026_AdminUser

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

### F015 — AdminOverview

**Priority:** P3 | **Type:** ui | **Status:** implemented | **Slug:** F015_AdminOverview

Admin xem số liệu theo đơn vị (tổng thành viên, Kudos gửi, Kudos nhận, số người có ≥1 Kudos, số Secret Box nhận), lọc theo khoảng ngày, Export. Chỉ đọc, build sau cùng vì cần dữ liệu từ các feature trước.

**Related:** screens: SCR027 | routes: — | models: —

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: TBD (draft)

**Related Screens**:
- SCR027_AdminOverview

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
