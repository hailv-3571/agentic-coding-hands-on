# User Stories

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Analysis Scope**: 20 SCR trong `screen-list.md` (kèm 7 REG), đối chiếu `permissions-matrix.md` (ba vai người dùng `admin`, `guest`, `sunner`), `route-list.md` (ROUTE001–ROUTE036) và mã nguồn `app/**`, `features/*/components`. Vai `scheduler` (pg_cron, không phải người) không có user story; hành vi của nó nằm ở `behavior-logic.md`.

**Code Format**: All US codes MUST follow `US###_NameSlug` format (số ba chữ số lấy đúng từ User Story Index bên dưới, không tự đặt mã mới)

**US Types**:
- `ui` - User-facing stories (require Screen mapping)
- `system` - System stories: hook, event, observer, bg-job, trigger, etc. (no Screen mapping needed)

**Note**: Feature mapping is managed in FeatureList.md only. This document contains user stories without direct feature references. UI US require Screen mapping; system/bg-job US do not. `ui`-typed stories may map to `SCR###` or `SCR###/REG###`; non-`ui` types map to `SCR###` only (or omit). Toàn bộ story ở đây là `ui` vì mọi hành vi nền đã thuộc vai `scheduler`.

## Interaction Inventory

> Complete this table BEFORE writing any US. One row per interactive element per screen.
> Source of truth for US count — every row maps to ≥1 US below (unless merge exception applies).
> See: references/user-stories-ipe-protocol.md for enumeration rules and merge exception.

| Screen | Element | Type | Action | Endpoint |
|--------|---------|------|--------|---------|
| SCR001_Login | GoogleSignInButton trong GoogleSignInForm | primary-action | Gửi form, chuyển sang Google OAuth rồi về `/auth/callback`, giữ `next` đã làm sạch (story SignInWithGoogle) | POST /login (server action, ROUTE021) |
| SCR001_Login | LanguageSwitcher trong PublicHeader | secondary-action | Đổi vi/en, ghi cookie `NEXT_LOCALE` (story SwitchLanguage) | POST server action setLocaleAction (ROUTE036) |
| SCR002_AdminLayout | AdminTopBar: logo ADMIN, 4 NavLinks, MobileNavMenu | navigation | Chuyển giữa Overview, Review content, User, Settings; logo đưa về `/` (story NavigateAdminSections) | N/A |
| SCR002_AdminLayout | LanguageSwitcher | secondary-action | Đổi vi/en (story SwitchLanguage) | POST server action setLocaleAction (ROUTE036) |
| SCR002_AdminLayout | AccountMenu: link Profile | navigation | Mở `/profile` (story NavigateSunnerPages, admin dùng chung) | N/A |
| SCR002_AdminLayout | AccountMenu: link Dashboard | navigation | Mở `/admin/overview` (story OpenAdminDashboard) | N/A |
| SCR002_AdminLayout | AccountMenu: nút Logout | secondary-action | `signOut` phạm vi thiết bị rồi về `/login` (story SignOut) | POST server action signOut (ROUTE035) |
| SCR003_AppLayout | AppHeader: logo, 3 NavLinks, MobileNavMenu | navigation | Về SAA, Thông tin giải, Sun* Kudos (story NavigateSunnerPages) | N/A |
| SCR003_AppLayout | AppFooter: logo và 5 link | navigation | Về SAA, Thông tin giải, Sun* Kudos, Thể lệ, Tiêu chuẩn cộng đồng (story NavigateSunnerPages) | N/A |
| SCR003_AppLayout | LanguageSwitcher | secondary-action | Đổi vi/en (story SwitchLanguage) | POST server action setLocaleAction (ROUTE036) |
| SCR003_AppLayout | AccountMenu: link Profile | navigation | Mở `/profile` (story NavigateSunnerPages) | N/A |
| SCR003_AppLayout | AccountMenu: link Dashboard (chỉ admin) | navigation | Mở `/admin/overview` (story OpenAdminDashboard) | N/A |
| SCR003_AppLayout | AccountMenu: nút Logout | secondary-action | Kết thúc phiên thiết bị này (story SignOut) | POST server action signOut (ROUTE035) |
| SCR003_AppLayout/REG001_NotificationBell | NotificationBell: nút chuông | secondary-action | Mở hoặc đóng dropdown, nạp 10 thông báo mới nhất (story BrowseNotifications) | GET /api/notifications (ROUTE011) |
| SCR003_AppLayout/REG001_NotificationBell | NotificationPanel: nút thử lại khi lỗi | secondary-action | Nạp lại danh sách, cùng endpoint (story BrowseNotifications) | GET /api/notifications (ROUTE011) |
| SCR003_AppLayout/REG001_NotificationBell | NotificationPanel: link "Xem tất cả" | navigation | Mở `/notifications` (story NavigateSunnerPages) | N/A |
| SCR003_AppLayout/REG001_NotificationBell | NotificationPanel: nút "Đánh dấu đọc tất cả" | secondary-action | Đánh dấu mọi thông báo của mình đã đọc (story MarkAllNotificationsRead) | POST server action markAllNotificationsRead (ROUTE034) |
| SCR003_AppLayout/REG001_NotificationBell | NotificationRow | primary-action | Đánh dấu dòng đã đọc (optimistic) rồi đi tới đối tượng liên quan (story OpenNotification) | POST server action markNotificationRead (ROUTE033) |
| SCR004_Error403 | ForbiddenPanel: CTA "Về trang chủ" | navigation | Về `/` (story ReturnHomeFromErrorPage) | N/A |
| SCR005_Error404 | ErrorPanel: CTA Home (đã đăng nhập) | navigation | Về `/` (story ReturnHomeFromErrorPage) | N/A |
| SCR005_Error404 | ErrorPanel: CTA Login (khách) | navigation | Về `/login` (story ReturnToLoginFromNotFound) | N/A |
| SCR006_KudoDetail | KudoCardPeople: tên và avatar người có tên | navigation | Mở hồ sơ người đó, chính mình thì `/profile` (story OpenSunnerProfile) | N/A |
| SCR006_KudoDetail | AvatarHoverCard: rê hoặc focus avatar | secondary-action | Hiện thẻ tóm tắt Sunner (story PreviewSunnerCard) | GET /api/sunners/:userId/card (ROUTE019) |
| SCR006_KudoDetail | AvatarHoverCard: nút "Send Kudo" | primary-action | Mở composer, người nhận đã điền và khoá (story SendKudoToSunner) | POST server action createKudo (ROUTE023) |
| SCR006_KudoDetail | KudoCardImages: ảnh | navigation | Mở tệp ảnh đầy đủ ở tab mới (story ViewKudoImage) | signed URL Storage (BL009) |
| SCR006_KudoDetail | KudoHeartButton khi chưa tim | primary-action | Thả tim optimistic (story GiveHeartToKudo) | POST server action addHeartAction (ROUTE025) |
| SCR006_KudoDetail | KudoHeartButton khi đã tim | secondary-action | Bỏ tim optimistic (story WithdrawHeartFromKudo) | POST server action removeHeartAction (ROUTE026) |
| SCR006_KudoDetail | KudoCopyLinkButton | secondary-action | Copy `/kudos/{id}` vào clipboard kèm toast (story CopyKudoLink) | N/A |
| SCR006_KudoDetail | Nút Đóng | navigation | Về Live board `/kudos` (story OpenKudosBoard) | N/A |
| SCR006_KudoDetail | KudoNotFound: nút về Live board | navigation | Về `/kudos` (story OpenKudosBoard) | N/A |
| SCR006_KudoDetail | Khối lỗi tải: link thử lại | navigation | Mở lại đúng URL chi tiết (story OpenKudoDetail) | N/A |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | KudoComposerLauncher | primary-action | Mở KudoComposerModal tạo mới, khoá khi hết cửa sổ ghi (gộp vào story CreateKudo) | N/A |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | RecipientPicker (SunnerSearchCombobox) | secondary-action | Tìm và chọn người nhận (gộp vào story CreateKudo) | GET /api/sunners/search (ROUTE018) |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | KudoTitleField, KudoMessageEditor, toolbar định dạng, AddLinkPopover, KudoMentionPopover | secondary-action | Nhập tiêu đề và nội dung, định dạng, chèn link, gắn mention (gộp vào story CreateKudo) | N/A |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | HashtagPicker | secondary-action | Chọn hashtag cho Kudo (gộp vào story CreateKudo) | GET /api/hashtags (ROUTE013) |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | AnonymousSenderField: công tắc và biệt danh | secondary-action | Gửi ẩn danh kèm biệt danh (gộp vào story CreateKudo) | N/A |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | KudoImagePicker: nút thêm ảnh | secondary-action | Chọn ảnh, xin URL ký rồi tải lên Storage từ trình duyệt (story AttachKudoImage) | POST /api/kudos/images/sign (ROUTE010) |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | KudoImageThumbnail: gỡ ảnh và thử lại | secondary-action | Gỡ ảnh nháp hoặc tải lại ảnh lỗi (gộp vào story AttachKudoImage) | POST /api/kudos/images/sign (ROUTE010) |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | Nút Gửi của KudoComposerForm | primary-action | Tạo Kudo cùng hashtag, ảnh, dòng outbox trong một giao dịch (story CreateKudo) | POST server action createKudo (ROUTE023) |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | Nút Hủy và DiscardChangesConfirm | secondary-action | Đóng composer, hỏi bỏ nội dung chưa lưu (gộp vào story CreateKudo) | N/A |
| SCR007_KudosLiveBoardFeed/REG002_SunnerProfileSearch | SunnerProfileSearch (combobox) | secondary-action | Gõ (debounce 250 ms), chọn kết quả để mở `/profile/{id}` (story SearchSunnerProfile) | GET /api/sunners/search (ROUTE018) |
| SCR007_KudosLiveBoardFeed/REG003_HighlightKudos | HighlightFilterDropdown: hashtag | secondary-action | Lọc 5 Kudo nhiều tim nhất theo hashtag (story BrowseHighlightKudos) | GET /api/kudos/highlight (ROUTE008) |
| SCR007_KudosLiveBoardFeed/REG003_HighlightKudos | HighlightFilterDropdown: phòng ban | secondary-action | Lọc theo phòng ban (story BrowseHighlightKudos) | GET /api/kudos/highlight (ROUTE008) |
| SCR007_KudosLiveBoardFeed/REG003_HighlightKudos | HighlightCarousel: mũi tên, pager, phím mũi tên | secondary-action | Chuyển giữa các Kudo đã nạp, phía client (story BrowseHighlightKudos) | N/A |
| SCR007_KudosLiveBoardFeed/REG003_HighlightKudos | KudoCard trong carousel: cùng bộ điều khiển thẻ như dòng REG005 | secondary-action | Xem chi tiết, tên và avatar, hover card, tim, Copy Link, bút sửa, hero badge (stories ở dòng REG005) | xem dòng REG005 |
| SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard | SpotlightSearchInput | secondary-action | Lọc đám mây tên người nhận theo chữ gõ, phía client (story SearchSpotlightNames) | N/A |
| SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard | SpotlightFullscreenButton | secondary-action | Vào hoặc thoát chế độ toàn màn hình (story ToggleSpotlightFullscreen) | N/A |
| SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard | SpotlightNameCloud: tên người nhận | navigation | Mở hồ sơ người nhận (story OpenSunnerProfile) | N/A |
| SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard | SpotlightConnectionBanner và SpotlightLoadError: nút thử lại | secondary-action | Nối lại kênh `spotlight` hoặc nạp lại snapshot (gộp vào story SearchSpotlightNames, cùng vùng và cùng nguồn dữ liệu) | GET /api/spotlight (ROUTE017) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | AllKudosFeed: nút "Tải thêm" | secondary-action | Nối trang Kudo cũ hơn theo cursor (story LoadMoreKudos) | GET /api/kudos (ROUTE007) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoFeedStatusMessage: nút thử lại | secondary-action | Nạp lại trang lỗi, cùng endpoint (story LoadMoreKudos) | GET /api/kudos (ROUTE007) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoCard: nút "Xem chi tiết" | navigation | Mở `/kudos/{id}` (story OpenKudoDetail) | N/A |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoCardSender, KudoCardPeople: tên và avatar | navigation | Mở hồ sơ người đó (story OpenSunnerProfile) | N/A |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | AvatarHoverCard: rê hoặc focus avatar | secondary-action | Hiện thẻ tóm tắt Sunner (story PreviewSunnerCard) | GET /api/sunners/:userId/card (ROUTE019) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | AvatarHoverCard: nút "Send Kudo" | primary-action | Mở composer, người nhận đã điền và khoá (story SendKudoToSunner) | POST server action createKudo (ROUTE023) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoHeartButton khi chưa tim | primary-action | Thả tim (story GiveHeartToKudo) | POST server action addHeartAction (ROUTE025) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoHeartButton khi đã tim | secondary-action | Bỏ tim (story WithdrawHeartFromKudo) | POST server action removeHeartAction (ROUTE026) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoCopyLinkButton | secondary-action | Copy link Kudo kèm toast (story CopyKudoLink) | N/A |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoOwnerEditButton (bút sửa, chỉ chủ Kudo công khai trong cửa sổ ghi) | primary-action | Mở composer chế độ sửa, nạp dữ liệu hiện có, gửi bản sửa (story EditKudo) | GET /api/kudos/:id/edit (ROUTE009); POST server action updateKudo (ROUTE024) |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | KudoCardHeroBadgeSlot: HeroBadge | secondary-action | Hiện tooltip giải thích bậc Hero khi rê, focus hoặc chạm (story ViewHeroBadgeTooltip) | N/A |
| SCR007_KudosLiveBoardFeed/REG006_RewardsColumn | SecretBoxLauncher, OpenSecretBoxButton (và deep link `?secretBox=open`) | primary-action | Mở SecretBoxModal, nạp số hộp chưa mở (gộp vào story OpenSecretBox) | GET /api/secret-boxes/me (ROUTE015) |
| SCR007_KudosLiveBoardFeed/REG006_RewardsColumn | SecretBoxModal: ô hộp để mở | primary-action | Mở một hộp kèm Idempotency-Key, hiện phần thưởng (story OpenSecretBox) | POST /api/secret-boxes/open (ROUTE016) |
| SCR007_KudosLiveBoardFeed/REG006_RewardsColumn | SecretBoxModal: đóng và tải lại khi lỗi; RewardsStatusMessage: thử lại | secondary-action | Đóng modal, nạp lại trạng thái hộp hoặc làm mới cột phần thưởng (gộp vào story OpenSecretBox) | GET /api/secret-boxes/me (ROUTE015) |
| SCR008_AwardsSystem | AwardsAnchorMenu: 6 mục | navigation | Cuộn tới khối giải, đặt focus, cập nhật hash `#<slug>` (story JumpToAwardSection) | N/A |
| SCR008_AwardsSystem | KudosBanner: nút CTA | navigation | Mở `/kudos` (story OpenKudosBoard) | N/A |
| SCR010_CountdownPrelaunch | LanguageSwitcher trong PublicHeader | secondary-action | Đổi vi/en (story SwitchLanguage) | POST server action setLocaleAction (ROUTE036) |
| SCR011_Homepage | HomepageHero: nút ABOUT AWARDS | navigation | Mở `/awards` (story OpenAwardsFromHomepage) | N/A |
| SCR011_Homepage | HomepageHero: nút ABOUT KUDOS | navigation | Mở `/kudos` (story OpenKudosBoard) | N/A |
| SCR011_Homepage | HomepageAwardsSection: 6 AwardCard | navigation | Mở `/awards#<slug>` (story OpenAwardsFromHomepage) | N/A |
| SCR011_Homepage | KudosBanner: nút CTA | navigation | Mở `/kudos` (story OpenKudosBoard) | N/A |
| SCR012_Rules | RulesCloseButton | navigation | `router.back()` khi có trang trước cùng origin, ngược lại về `/` (story CloseRulesPage) | N/A |
| SCR012_Rules | Link "Viết KUDOS" | navigation | Mở `/kudos` (story OpenKudosBoard) | N/A |
| SCR013_AdminReviewContent | ReviewPersonFilter: người gửi | secondary-action | Chọn người gửi, cập nhật URL (story BrowseKudosForReview) | GET /admin/review?sender (RSC, đối ứng ROUTE001); GET /api/sunners/search (ROUTE018) |
| SCR013_AdminReviewContent | ReviewPersonFilter: người nhận | secondary-action | Chọn người nhận, cập nhật URL (story BrowseKudosForReview) | GET /admin/review?receiver (RSC, đối ứng ROUTE001); GET /api/sunners/search (ROUTE018) |
| SCR013_AdminReviewContent | ReviewStatusFilter | secondary-action | Lọc public hoặc spam (story BrowseKudosForReview) | GET /admin/review?status (RSC) |
| SCR013_AdminReviewContent | ReviewDateRangeFilter | secondary-action | Chọn khoảng ngày, từ chối khoảng ngược (story BrowseKudosForReview) | GET /admin/review?from&to (RSC) |
| SCR013_AdminReviewContent | ReviewSearchInput | secondary-action | Tìm theo nội dung, debounce 300 ms (story BrowseKudosForReview) | GET /admin/review?q (RSC) |
| SCR013_AdminReviewContent | HeartSortButton ở cột Tim | secondary-action | Đổi chiều sắp xếp theo tim (story BrowseKudosForReview) | GET /admin/review?sort (RSC) |
| SCR013_AdminReviewContent | ReviewPagination | secondary-action | Chuyển trang, 10 dòng mỗi trang (story BrowseKudosForReview) | GET /admin/review?page (RSC) |
| SCR013_AdminReviewContent | Nút xoá bộ lọc, AdminLoadErrorPanel: thử lại | secondary-action | Về bảng chưa lọc hoặc nạp lại khi lỗi đọc (story BrowseKudosForReview) | GET /admin/review (RSC) |
| SCR013_AdminReviewContent | ReviewModerationButton: Mark Spam (popover xác nhận) | destructive-action | Chuyển Kudo `public` sang `spam`, ghi outbox `KudoMarkedSpam` (story MarkKudoSpam) | POST server action markKudoSpam (ROUTE027) |
| SCR013_AdminReviewContent | ReviewModerationButton: Un Spam | secondary-action | Trả Kudo `spam` về `public` (story RestoreSpamKudo) | POST server action unSpamKudo (ROUTE028) |
| SCR013_AdminReviewContent | ReviewExportButton | secondary-action | Tải CSV theo bộ lọc đang chọn (story ExportKudoReviewCsv) | GET /api/admin/kudos/export (ROUTE002) |
| SCR014_AdminCampaignSettings | Nút Add Campaign và CampaignFormModal (nhập tên, giờ bắt đầu, giờ kết thúc, gửi) | primary-action | Tạo campaign x2 tim, từ chối chồng giờ (story CreateCampaign) | POST server action createCampaign (ROUTE029) |
| SCR014_AdminCampaignSettings | CampaignRowMenu: Edit và CampaignFormModal | primary-action | Sửa campaign chưa kết thúc (story EditCampaign) | POST server action updateCampaign (ROUTE030) |
| SCR014_AdminCampaignSettings | CampaignRowMenu: Delete và CampaignDeleteDialog | destructive-action | Xác nhận xoá campaign chưa kết thúc (story DeleteCampaign) | POST server action removeCampaign (ROUTE031) |
| SCR014_AdminCampaignSettings | Khối lỗi tải: link tải lại | navigation | Mở lại `/admin/settings` (story NavigateAdminSections) | N/A |
| SCR015_OtherProfile | ProfileSendKudoButton | primary-action | Mở LockedRecipientComposer, người nhận bị khoá (story SendKudoToSunner) | POST server action createKudo (ROUTE023) |
| SCR015_OtherProfile | ProfileKudosSection: "Tải thêm" và thử lại | secondary-action | Nối trang Kudo đã nhận (story BrowseProfileKudos) | GET /api/profile/:userId/kudos (ROUTE014) |
| SCR015_OtherProfile | ProfileHeader: HeroBadge | secondary-action | Hiện tooltip bậc Hero (story ViewHeroBadgeTooltip) | N/A |
| SCR015_OtherProfile | KudoCard: cùng bộ điều khiển thẻ như dòng REG005 của SCR007 (không có bút sửa) | secondary-action | Xem chi tiết, tên và avatar, hover card, tim, Copy Link, hero badge (stories ở dòng REG005) | xem dòng REG005 |
| SCR015_OtherProfile | SunnerNotFound: nút về Live board | navigation | Về `/kudos` (story OpenKudosBoard) | N/A |
| SCR016_OwnProfile | ProfileKudosDirectionDropdown: Đã gửi, Đã nhận | secondary-action | Đổi hướng danh sách Kudo (story BrowseProfileKudos) | GET /api/profile/:userId/kudos?direction (ROUTE014) |
| SCR016_OwnProfile | ProfileKudosSection: "Tải thêm" và thử lại | secondary-action | Nối trang Kudo theo hướng đang chọn (story BrowseProfileKudos) | GET /api/profile/:userId/kudos (ROUTE014) |
| SCR016_OwnProfile | PersonalStatsPanel: nút Mở Secret Box | primary-action | Mở SecretBoxModal rồi mở hộp (story OpenSecretBox) | GET /api/secret-boxes/me (ROUTE015); POST /api/secret-boxes/open (ROUTE016) |
| SCR016_OwnProfile | KudoOwnerEditButton trên thẻ của mình | primary-action | Mở composer chế độ sửa (story EditKudo) | GET /api/kudos/:id/edit (ROUTE009); POST server action updateKudo (ROUTE024) |
| SCR016_OwnProfile | ProfileHeader: HeroBadge | secondary-action | Hiện tooltip bậc Hero (story ViewHeroBadgeTooltip) | N/A |
| SCR016_OwnProfile | KudoCard: cùng bộ điều khiển thẻ như dòng REG005 của SCR007 | secondary-action | Xem chi tiết, tên và avatar, hover card, tim, Copy Link, hero badge (stories ở dòng REG005) | xem dòng REG005 |
| SCR017_AllNotifications | NotificationListPageClient: nút "Đánh dấu đọc tất cả" | secondary-action | Đánh dấu mọi thông báo đã đọc (story MarkAllNotificationsRead) | POST server action markAllNotificationsRead (ROUTE034) |
| SCR017_AllNotifications | NotificationRow | primary-action | Đánh dấu đã đọc rồi đi tới đối tượng liên quan (story OpenNotification) | POST server action markNotificationRead (ROUTE033) |
| SCR017_AllNotifications | NotificationList: "Tải thêm", cuộn vô hạn, thử lại | secondary-action | Nối 20 dòng tiếp theo theo cursor (story BrowseNotifications) | GET /api/notifications (ROUTE011) |
| SCR017_AllNotifications | NotificationRow: link "Tiêu chuẩn cộng đồng" của dòng Kudo bị ẩn | navigation | Mở `/community-standards` (story NavigateSunnerPages) | N/A |
| SCR018_AdminUser | AdminUserFilters: Unit, Level, Role | secondary-action | Lọc bảng Sunner theo ba dropdown (story BrowseUsers) | GET /admin/users?unit&level&role (RSC) |
| SCR018_AdminUser | AdminUserFilters: ô tìm theo tên hoặc email | secondary-action | Tìm, tối đa 100 ký tự (story BrowseUsers) | GET /admin/users?q (RSC) |
| SCR018_AdminUser | AdminUserSortableHeader | secondary-action | Sắp theo cột số liệu (story BrowseUsers) | GET /admin/users?sort&dir (RSC) |
| SCR018_AdminUser | ReviewPagination | secondary-action | Chuyển trang, 20 dòng mỗi trang (story BrowseUsers) | GET /admin/users?page (RSC) |
| SCR018_AdminUser | Nút xoá bộ lọc, AdminLoadErrorPanel: thử lại | secondary-action | Về bảng chưa lọc hoặc nạp lại khi lỗi đọc (story BrowseUsers) | GET /admin/users (RSC) |
| SCR018_AdminUser | AdminUserRoleMenu: "Set as Admin" và AdminUserRoleDialog | primary-action | Nâng một Sunner lên admin sau khi xác nhận (story PromoteUserToAdmin) | POST server action setUserRoleAction (ROUTE032) |
| SCR018_AdminUser | AdminUserRoleMenu: "Set as User" và AdminUserRoleDialog | destructive-action | Hạ admin xuống user, bị từ chối với tự hạ, `ADMIN_EMAILS`, admin cuối (story DemoteAdminToUser) | POST server action setUserRoleAction (ROUTE032) |
| SCR018_AdminUser | ReviewExportButton | secondary-action | Tải CSV danh sách Sunner theo bộ lọc (story ExportUsersCsv) | GET /api/admin/users/export (ROUTE004) |
| SCR019_AdminOverview | ReviewDateRangeFilter | secondary-action | Chọn khoảng ngày, bảng số liệu theo đơn vị thu hẹp giai đoạn (story FilterOverviewByDateRange) | GET /admin/overview?from&to (RSC) |
| SCR019_AdminOverview | AdminLoadErrorPanel: thử lại | secondary-action | Nạp lại bảng khi lỗi đọc (story FilterOverviewByDateRange) | GET /admin/overview (RSC) |
| SCR019_AdminOverview | ReviewExportButton | secondary-action | Tải CSV bảng Overview theo khoảng ngày (story ExportOverviewCsv) | GET /api/admin/overview/export (ROUTE003) |
| SCR020_OnboardingDepartment | DepartmentPickerForm: nhóm radio và nút gửi | primary-action | Đặt phòng ban một lần khi còn trống, rồi tới `next` đã làm sạch (story ChooseDepartment) | POST server action chooseDepartment (ROUTE022) |

> **Quy tắc gộp áp dụng (đều khớp merge exception của giao thức IPE):**
> - Điều khiển mở modal gộp vào story của hành động chính trong modal; nút mở không có kết quả độc lập.
> - Link thuần của cùng một vai (header, footer, menu tài khoản, dropdown chuông, link trong dòng thông báo) là một story điều hướng cho mỗi khung giao diện: không endpoint, không rẽ nhánh dữ liệu. Các CTA cùng đích (`/kudos`, `/awards`) gộp theo đích.
> - Ô nhập trong một form (người nhận, tiêu đề, nội dung, hashtag, ẩn danh) là đầu vào của lần gửi form đó; chỉ điều khiển có endpoint ghi hoặc tải lên riêng (ký và tải ảnh) mới có story riêng.
> - Bộ lọc, ô tìm, sắp xếp, phân trang của cùng một bảng dùng chung trạng thái URL và cùng một lần đọc nên là một story duyệt; xuất CSV, đổi role, đánh dấu spam có endpoint và luật riêng nên tách.
> - Nút thử lại ở trạng thái lỗi gộp vào story của lần đọc nó chạy lại; vùng không có story đọc thì gộp vào story gần nhất cùng vùng và cùng nguồn dữ liệu (`[IPE_FOLDED]`).
> - Vai `admin` dùng chung điều khiển với `sunner` ở menu tài khoản và công tắc ngôn ngữ (hàng `admin` của quyền đổi ngôn ngữ và đăng xuất ghi "như sunner"), nên không tách story thứ hai cho cùng điều khiển; `guest` cũng dùng chung công tắc ngôn ngữ ở `/login` và `/countdown`.
> - `[IPE_ZERO]` SCR009_CommunityStandards: trang tĩnh, không có điều khiển trong trang; chỉ vào được qua link footer, link trong dòng thông báo và thanh công cụ composer, nên được gán cho story điều hướng của footer. `[IPE_ZERO]` SCR010_CountdownPrelaunch: ngoài công tắc ngôn ngữ chỉ có đồng hồ tự chạy và tự chuyển trang khi về 0, không phải thao tác người dùng.
> - Hạn chế đã biết: proxy chuyển khách khỏi mọi path ngoài danh sách công khai nên nhánh khách của trang 404 gần như không với tới trong thực tế; story giữ lại vì mã nguồn có nhánh đó (quyết định D005) và researcher phải ghi rõ điều kiện này.

## User Story Index

| Code | Title | Type | Priority | Screens |
|------|-------|------|----------|---------|
| US001_NavigateAdminSections | Navigate Admin Sections | ui | P1 | SCR002, SCR014 |
| US002_OpenAdminDashboard | Open Admin Dashboard | ui | P1 | SCR002, SCR003, SCR019 |
| US003_FilterOverviewByDateRange | Filter Overview By Date Range | ui | P3 | SCR019 |
| US004_ExportOverviewCsv | Export Overview Csv | ui | P3 | SCR019 |
| US005_BrowseKudosForReview | Browse Kudos For Review | ui | P1 | SCR013 |
| US006_MarkKudoSpam | Mark Kudo Spam | ui | P1 | SCR013 |
| US007_RestoreSpamKudo | Restore Spam Kudo | ui | P1 | SCR013 |
| US008_ExportKudoReviewCsv | Export Kudo Review Csv | ui | P1 | SCR013 |
| US009_BrowseUsers | Browse Users | ui | P2 | SCR018 |
| US010_PromoteUserToAdmin | Promote User To Admin | ui | P2 | SCR018 |
| US011_DemoteAdminToUser | Demote Admin To User | ui | P2 | SCR018 |
| US012_ExportUsersCsv | Export Users Csv | ui | P2 | SCR018 |
| US013_CreateCampaign | Create Campaign | ui | P2 | SCR014 |
| US014_EditCampaign | Edit Campaign | ui | P2 | SCR014 |
| US015_DeleteCampaign | Delete Campaign | ui | P2 | SCR014 |
| US016_SignInWithGoogle | Sign In With Google | ui | P0 | SCR001 |
| US017_ReturnToLoginFromNotFound | Return To Login From Not Found | ui | P2 | SCR005 |
| US018_ChooseDepartment | Choose Department | ui | P0 | SCR020 |
| US019_SignOut | Sign Out | ui | P0 | SCR003, SCR002 |
| US020_SwitchLanguage | Switch Language | ui | P1 | SCR003, SCR002, SCR001, SCR010 |
| US021_NavigateSunnerPages | Navigate Sunner Pages | ui | P1 | SCR003, SCR003/REG001, SCR009, SCR017 |
| US022_ReturnHomeFromErrorPage | Return Home From Error Page | ui | P1 | SCR004, SCR005 |
| US023_BrowseNotifications | Browse Notifications | ui | P2 | SCR003/REG001, SCR017 |
| US024_OpenNotification | Open Notification | ui | P2 | SCR003/REG001, SCR017 |
| US025_MarkAllNotificationsRead | Mark All Notifications Read | ui | P2 | SCR003/REG001, SCR017 |
| US026_CreateKudo | Create Kudo | ui | P0 | SCR007/REG001 |
| US027_AttachKudoImage | Attach Kudo Image | ui | P1 | SCR007/REG001, SCR015, SCR016 |
| US028_EditKudo | Edit Kudo | ui | P1 | SCR007/REG003, SCR007/REG005, SCR016 |
| US029_SendKudoToSunner | Send Kudo To Sunner | ui | P1 | SCR015, SCR006, SCR007/REG005, SCR016 |
| US030_SearchSunnerProfile | Search Sunner Profile | ui | P1 | SCR007/REG002 |
| US031_BrowseHighlightKudos | Browse Highlight Kudos | ui | P1 | SCR007/REG003 |
| US032_LoadMoreKudos | Load More Kudos | ui | P1 | SCR007/REG005 |
| US033_OpenKudoDetail | Open Kudo Detail | ui | P1 | SCR007/REG003, SCR007/REG005, SCR015, SCR016, SCR006 |
| US034_OpenSunnerProfile | Open Sunner Profile | ui | P2 | SCR006, SCR007/REG004, SCR007/REG005, SCR015, SCR016 |
| US035_PreviewSunnerCard | Preview Sunner Card | ui | P2 | SCR006, SCR007/REG003, SCR007/REG005, SCR015, SCR016 |
| US036_ViewKudoImage | View Kudo Image | ui | P2 | SCR006 |
| US037_GiveHeartToKudo | Give Heart To Kudo | ui | P1 | SCR006, SCR007/REG003, SCR007/REG005, SCR015, SCR016 |
| US038_WithdrawHeartFromKudo | Withdraw Heart From Kudo | ui | P1 | SCR006, SCR007/REG003, SCR007/REG005, SCR015, SCR016 |
| US039_CopyKudoLink | Copy Kudo Link | ui | P2 | SCR006, SCR007/REG003, SCR007/REG005, SCR015, SCR016 |
| US040_ViewHeroBadgeTooltip | View Hero Badge Tooltip | ui | P2 | SCR007/REG003, SCR007/REG005, SCR015, SCR016 |
| US041_BrowseProfileKudos | Browse Profile Kudos | ui | P2 | SCR015, SCR016 |
| US042_SearchSpotlightNames | Search Spotlight Names | ui | P2 | SCR007/REG004 |
| US043_ToggleSpotlightFullscreen | Toggle Spotlight Fullscreen | ui | P2 | SCR007/REG004 |
| US044_OpenSecretBox | Open Secret Box | ui | P2 | SCR007/REG006, SCR016 |
| US045_OpenAwardsFromHomepage | Open Awards From Homepage | ui | P1 | SCR011, SCR008 |
| US046_OpenKudosBoard | Open Kudos Board | ui | P1 | SCR011, SCR008, SCR012, SCR006, SCR015 |
| US047_JumpToAwardSection | Jump To Award Section | ui | P1 | SCR008 |
| US048_CloseRulesPage | Close Rules Page | ui | P2 | SCR012 |

---

## US001_NavigateAdminSections: Navigate Admin Sections

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là Admin, tôi muốn chuyển giữa các mục của khu Admin để vào đúng trang cần làm việc mà không phải gõ địa chỉ.

### Acceptance Criteria

- [ ] Criterion 1: Thanh trên của khu Admin có bốn mục Overview, Review content, User, Settings; mục khớp đường dẫn hiện tại (kể cả trang con) được đánh dấu `aria-current="page"`.
- [ ] Criterion 2: Bấm một mục mở đúng `/admin/overview`, `/admin/review`, `/admin/users`, `/admin/settings`; `/admin` chỉ chuyển hướng về `/admin/overview`.
- [ ] Criterion 3: Dưới breakpoint `md`, bốn mục thu vào nút menu (MobileNavMenu); chọn một mục thì menu đóng và trang mở; Esc hoặc bấm ra ngoài cũng đóng menu.
- [ ] Criterion 4: Logo kèm nhãn ADMIN đưa về `/` (khu Sunner); tên truy cập của link nói rõ đích đến ("quay về ứng dụng").
- [ ] Criterion 5: Khi bảng campaign ở `/admin/settings` đọc lỗi, khối lỗi có link tải lại mở lại đúng `/admin/settings`.
- [ ] Criterion 6: Khung Admin không hiện chuông thông báo; người không phải admin không nhận markup của khung này.

### Technical Notes

- **Endpoint**: N/A (điều hướng `next/link`). Đích: GET `/admin/overview`, `/admin/review`, `/admin/users`, `/admin/settings` (RSC); `/admin` chuyển hướng ở `app/admin/page.tsx`.
- **Data Required**: Danh sách mục dựng từ `ADMIN_ROUTES` (`shared/ui/app-routes.ts`); trạng thái active theo `isRouteActive(pathname, href)`; `ShellUser` (tên, avatar, cờ admin) từ `requireShellAdmin()` (`features/app-shell/server/shell-session.ts`).
- **Dependencies**: `app/admin/layout.tsx` chạy `requireShellAdmin()` trước khi dựng `AdminTopBar` (`features/app-shell/components/admin-top-bar.tsx`, `app-header-nav-links.tsx`, `mobile-nav-menu.tsx`); cổng proxy bước 4b (PERM003_AdminAreaProxyGate) và PERM014_AdminPageAndActionGuard chặn người không phải admin.
- **Notes**: `[IPE_FOLDED]` link tải lại của khối lỗi SCR014 (`features/admin-campaigns/components/campaign-settings-panel.tsx`, thẻ `<a href>` tải lại cả trang) gộp vào story này vì cùng vùng điều hướng Admin và không có endpoint riêng.

### Screens

- SCR002: AdminLayout
- SCR014: AdminCampaignSettings

### Background Logic

- Không có BL riêng (điều hướng phía client; chặn truy cập nằm ở Permissions).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Admin đang ở `/admin/overview` | Bấm mục "Review content" | Mở `/admin/review`; mục này được đánh dấu active, mục Overview hết active |
| Mobile | Màn hình dưới `md` | Mở menu rồi chọn "User" | Menu đóng, mở `/admin/users` |
| Logo | Admin đang ở trang Admin bất kỳ | Bấm logo ADMIN | Về `/` (khu Sunner) |
| Error Case | Người dùng role `user` đã đăng nhập | Gõ `/admin/users` | Nhận trang 403, không có thanh Admin nào trong HTML |
| Load Failed | Đọc danh sách campaign lỗi | Bấm link tải lại | Mở lại `/admin/settings` và đọc lại danh sách |

---

## US002_OpenAdminDashboard: Open Admin Dashboard

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là Admin, tôi muốn mở Dashboard từ menu tài khoản để vào thẳng trang Overview của khu Admin.

### Acceptance Criteria

- [ ] Criterion 1: Menu tài khoản (nút avatar) của admin có mục "Dashboard"; Sunner thường không thấy mục này (`isAdmin` suy từ `profiles.role`).
- [ ] Criterion 2: Mục "Dashboard" có ở cả header Sunner và thanh trên của khu Admin vì hai nơi dùng chung `AccountMenu`.
- [ ] Criterion 3: Bấm "Dashboard" mở `/admin/overview` và đóng menu.
- [ ] Criterion 4: Trang đích chạy `requireAdmin()` trước khi đọc số liệu, nên mục ẩn chỉ là phần giao diện, không phải lớp bảo vệ.

### Technical Notes

- **Endpoint**: N/A (link `next/link`). Đích: GET `/admin/overview` (RSC, `app/admin/overview/page.tsx`).
- **Data Required**: `ShellUser.isAdmin = profile.role === "admin"` (`features/app-shell/server/shell-session.ts`); điều kiện hiển thị `user.isAdmin` ở `features/app-shell/components/account-menu.tsx`.
- **Dependencies**: PERM016_AdminMenuVisibility (chỉ ẩn giao diện); chặn thật nằm ở PERM003_AdminAreaProxyGate và PERM014_AdminPageAndActionGuard; `HeaderActions` (`features/app-shell/components/header-actions.tsx`) gom `AccountMenu`.
- **Notes**: Link Profile của cùng menu thuộc story điều hướng của Sunner, không tách thêm story cho admin (admin dùng chung điều khiển).

### Screens

- SCR002: AdminLayout
- SCR003: AppLayout
- SCR019: AdminOverview

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Admin đang ở trang chủ Sunner | Mở menu avatar rồi bấm "Dashboard" | Mở `/admin/overview`, hiện bảng số liệu theo đơn vị |
| Hidden For Sunner | Người dùng role `user` | Mở menu avatar | Chỉ có Profile và Logout, không có "Dashboard" |
| Error Case | Người dùng role `user` | Gõ thẳng `/admin/overview` | Nhận trang 403 do proxy chặn, không có markup Admin |

---

## US003_FilterOverviewByDateRange: Filter Overview By Date Range

**Type**: ui
**Interaction**: secondary-action
**Priority**: P3
**Estimate**: M

### User Story

Là Admin, tôi muốn lọc bảng Overview theo khoảng ngày để so sánh số liệu Kudo và Secret Box của từng đơn vị trong một giai đoạn.

### Acceptance Criteria

- [ ] Criterion 1: Hai ô ngày "Ngày bắt đầu" và "Ngày kết thúc"; mỗi lần thay đổi hợp lệ cập nhật URL `/admin/overview?from=yyyy-MM-dd&to=yyyy-MM-dd` bằng `router.replace` trong transition; bảng mờ (`aria-busy`) tới khi server trả lời.
- [ ] Criterion 2: Bỏ trống một đầu thì đầu đó không giới hạn; xoá cả hai thì về bảng toàn thời gian.
- [ ] Criterion 3: Ngày là cả ngày theo `ADMIN_TIMEZONE` (mặc định `Asia/Ho_Chi_Minh`): `from` tính từ 00:00, `to` gồm trọn ngày `to`.
- [ ] Criterion 4: Khoảng ngược (`from` sau `to`) bị từ chối ngay trong ô chọn bằng thông báo `role="alert"`; bảng và URL giữ nguyên.
- [ ] Criterion 5: URL sai (ngày không có thật như `2026-02-30`, tham số lặp, khoảng ngược) hiện lỗi lọc (`invalid_params` hoặc `invalid_date_range`) phía trên bảng toàn thời gian.
- [ ] Criterion 6: Số liệu chỉ đếm Kudo `public` tại lúc đọc: gửi tính theo đơn vị người gửi, nhận và số người có ít nhất một Kudo tính theo đơn vị người nhận (gồm Kudo ẩn danh); Secret Box tính theo `granted_at`; "Total member" không phụ thuộc khoảng ngày.
- [ ] Criterion 7: Bảng có dòng "All" và một dòng "Chưa gán đơn vị" khi còn Sunner chưa chọn phòng ban; đơn vị không có hoạt động vẫn hiện với số 0.
- [ ] Criterion 8: Đọc lỗi thì hiện `AdminLoadErrorPanel` với nút thử lại (`router.refresh()`); ô chọn ngày vẫn dùng được.

### Technical Notes

- **Endpoint**: GET `/admin/overview?from&to` (RSC, `app/admin/overview/page.tsx`). Không có Route Handler JSON cho bảng; phần tải CSV nằm ở story ExportOverviewCsv.
- **Data Required**: `AdminDateRange` từ `adminDateRangeSchema` (`shared/admin/date-range-filter.ts`); `UnitStatsTable` từ `UnitStatsQuery.forRange` (`features/admin-overview/server/unit-stats-query.ts`, một câu lệnh, `departments FULL JOIN` thành viên, gộp theo `department_id`); bảng `departments`, `profiles`, `kudos`, `secret_boxes`.
- **Dependencies**: `requireAdmin()` gọi đầu trang; `parseOverviewParams` (`features/admin-overview/schemas/overview-params-schema.ts`); `ReviewDateRangeFilter` dùng chung với trang Review (`features/admin-moderation/components/review-date-range-filter.tsx`); PERM014_AdminPageAndActionGuard.
- **Notes**: `[IPE_FOLDED]` nút thử lại của `AdminLoadErrorPanel` gộp vào story vì chạy lại đúng lần đọc này.

### Screens

- SCR019: AdminOverview

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có Kudo public rải trong tháng ở nhiều đơn vị | Chọn `from=2026-11-01`, `to=2026-11-15` | URL đổi theo, bảng chỉ đếm Kudo public trong khoảng, "Total member" không đổi |
| Reversed Range | Admin đang ở bảng toàn thời gian | Chọn From sau To trong ô chọn | Báo khoảng ngược ngay trong ô, bảng và URL giữ nguyên |
| Bad URL | Admin mở `/admin/overview?from=2026-02-30` | Trang tải | Hiện lỗi lọc phía trên bảng toàn thời gian |
| Read Failure | Đọc bảng thống kê lỗi | Bấm nút thử lại | Trang đọc lại trên server; thành công thì bảng hiện |

---

## US004_ExportOverviewCsv: Export Overview Csv

**Type**: ui
**Interaction**: secondary-action
**Priority**: P3
**Estimate**: M

### User Story

Là Admin, tôi muốn xuất bảng Overview ra tệp CSV để xử lý tiếp số liệu ngoài hệ thống.

### Acceptance Criteria

- [ ] Criterion 1: Nút Export tải `GET /api/admin/overview/export` với đúng `from`, `to` của bảng đang hiện; khi URL đang có lỗi lọc (bảng hiện toàn thời gian) thì xuất toàn thời gian.
- [ ] Criterion 2: Tệp tên `overview-yyyyMMdd-HHmm.csv` (giờ `ADMIN_TIMEZONE`), UTF-8 có BOM, ô có ký tự đầu công thức được vô hiệu hoá (formula guard).
- [ ] Criterion 3: Bảy cột `No`, `Unit`, `Total member`, `Total sent kudos`, `Total received kudos`, `Total users with at least 1 kudo`, `Total received secret box`; dòng "All" đứng đầu rồi tới các đơn vị đánh số 1..n, đơn vị chưa gán ở cuối.
- [ ] Criterion 4: Tệp và bảng lấy từ cùng `UnitStatsQuery.forRange` nên không lệch; mỗi đơn vị một dòng nên không áp giới hạn số dòng; tên đơn vị luôn theo tiếng Việt.
- [ ] Criterion 5: Trong lúc chuẩn bị tệp nút bị khoá kèm spinner (không bấm đôi); lỗi bất kỳ hiện toast lỗi và không tải tệp.
- [ ] Criterion 6: Mọi câu trả lời của endpoint mang `Cache-Control: private, no-store`.

### Technical Notes

- **Endpoint**: GET `/api/admin/overview/export?from&to` (ROUTE003, `app/api/admin/overview/export/route.ts`). Trả 200 `text/csv` đính kèm; 401 `unauthorized` (khách), 403 `forbidden` (không phải admin), 400 `invalid_date_range` hoặc `invalid_params`, 500 `unexpected`.
- **Data Required**: Cùng `parseOverviewParams`; `serializeOverviewCsv` (`features/admin-overview/server/overview-export-columns.ts`); tên tệp từ `adminCsvFilename` (`shared/admin/admin-csv-filename.ts`); bộ ghi CSV `shared/admin/csv-serializer.ts`.
- **Dependencies**: `requireAdminApi()` chạy trước khi đọc tham số (`features/admin-moderation/server/admin-api-guard.ts`, PERM015_AdminApiGate); nút `ReviewExportButton` dùng `fetch` rồi lưu blob (`features/admin-moderation/components/review-export-button.tsx`), dùng chung với hai trang Admin còn lại.
- **Notes**: Chưa có BL mô tả luồng xuất tệp vì Route Handler này không nằm trong inventory nền; lược đồ cột nằm ở hằng `OVERVIEW_CSV_HEADER`.

### Screens

- SCR019: AdminOverview

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Bảng đang lọc `from` và `to` hợp lệ | Bấm Export | Tải `overview-yyyyMMdd-HHmm.csv`, dòng đầu là "All", số liệu khớp bảng |
| Bad URL | URL có lỗi lọc, bảng hiện toàn thời gian | Bấm Export | Tệp là bảng toàn thời gian |
| Session Expired | Phiên hết hạn trong lúc đang mở trang | Bấm Export | Endpoint trả 401, hiện toast lỗi, không có tệp |
| Not Admin | Role bị hạ trong lúc đang mở trang | Bấm Export | Endpoint trả 403, hiện toast lỗi, không có tệp |

---

## US005_BrowseKudosForReview: Browse Kudos For Review

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: L

### User Story

Là Admin, tôi muốn duyệt bảng mọi Kudo để rà soát nội dung cần kiểm duyệt (lọc, tìm, sắp xếp, chuyển trang là các cách thu hẹp cùng một lần đọc).

### Acceptance Criteria

- [ ] Criterion 1: Bảng 10 dòng mỗi trang, mới nhất trước, gồm Kudo `public` lẫn `spam`; cột ID (8 ký tự đầu), Người gửi, Người nhận, Nội dung (tiêu đề đậm, lời nhắn rút gọn 4 dòng), Hashtag, Tim, Trạng thái, Thao tác.
- [ ] Criterion 2: Kudo ẩn danh hiện người gửi thật kèm chip "Ẩn danh" (tooltip có biệt danh); chỉ admin thấy người gửi thật.
- [ ] Criterion 3: Các bộ lọc ghép bằng AND: người gửi và người nhận (combobox tìm Sunner), trạng thái public hoặc spam, khoảng ngày gửi (khoảng ngược bị từ chối ngay trong ô), tìm theo nội dung trên tiêu đề cộng lời nhắn, không phân biệt hoa thường và dấu.
- [ ] Criterion 4: Ô tìm gửi sau khi ngừng gõ 300 ms hoặc khi nhấn Enter, không gửi lại cùng một từ khoá; ô nhập tối đa 100 ký tự (server chấp nhận tới 200).
- [ ] Criterion 5: Bấm tiêu đề cột Tim đổi vòng: mới nhất, nhiều tim nhất, ít tim nhất, rồi lại mới nhất; `aria-sort` phản ánh trạng thái.
- [ ] Criterion 6: Mọi thay đổi trừ đổi trang đều về trang 1; `?page` vượt cuối bị kẹp về trang cuối và bộ phân trang theo đó.
- [ ] Criterion 7: URL giữ toàn bộ trạng thái (`page`, `sort`, `status`, `sender`, `receiver`, `from`, `to`, `q`), giá trị mặc định bị bỏ khỏi URL; tải lại hay chia sẻ link ra cùng kết quả.
- [ ] Criterion 8: Tham số sai (lặp khoá, uuid, ngày, status hoặc sort sai, `page` nhỏ hơn 1, `q` dài hơn 200 ký tự, khoảng ngược) hiện lỗi lọc trên trang 1 chưa lọc.
- [ ] Criterion 9: Không có dòng nào thì hiện thông báo rỗng, kèm nút "Xoá bộ lọc" khi đang lọc; đọc lỗi hiện `AdminLoadErrorPanel` với nút thử lại.

### Technical Notes

- **Endpoint**: GET `/admin/review?page&sort&status&sender&receiver&from&to&q` (RSC, `app/admin/review/page.tsx`); đối ứng JSON `GET /api/admin/kudos` (ROUTE001) dùng chung bộ lọc; ô chọn người gọi `GET /api/sunners/search` (ROUTE018).
- **Data Required**: `AdminKudoFilterValues` từ `parseAdminKudoFilter` (`features/admin-moderation/schemas/admin-kudo-filter-schema.ts`); `AdminKudoPage { rows, total, page, pageCount }` với `AdminKudoRow` mang người gửi thật, `isAnonymous`, `anonymousNickname`, hashtag, số tim, trạng thái, người và giờ kiểm duyệt; bảng `kudos`, `kudo_hashtags`, `kudo_hearts`, `profiles`.
- **Dependencies**: `requireAdmin()` đầu trang; `KudoAdminQuery.list` với `ADMIN_KUDO_PAGE_SIZE = 10` (`features/admin-moderation/server/kudo-admin-query.ts`, không tái dùng DTO công khai); `buildAdminKudoWhere` (tìm nội dung qua `public.f_unaccent`, migration `0007`); `resolveSelectedPeople` lấy nhãn người đã chọn; PERM021_AdminRealSenderView.
- **Notes**: `[IPE_FOLDED]` bộ lọc, ô tìm, sắp xếp, phân trang và nút thử lại cùng dùng trạng thái URL và một lần đọc nên gộp một story duyệt; xuất CSV, đánh dấu spam và trả về công khai có endpoint riêng nên tách.

### Screens

- SCR013: AdminReviewContent

### Background Logic

- Không có BL riêng (đọc trong RSC, không có logic nền).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có Kudo public và spam | Chọn trạng thái spam rồi gõ một từ khoá | URL có `status=spam&q=...`, bảng chỉ còn Kudo spam khớp từ khoá, về trang 1 |
| Sort | Bảng đang sắp mới nhất | Bấm cột Tim hai lần | Lần một nhiều tim nhất, lần hai ít tim nhất; `sort` trên URL đổi theo |
| Page Clamp | Chỉ có 3 trang | Mở `?page=99` | Hiện trang 3 và bộ phân trang cũng ở trang 3 |
| Bad Params | Admin mở `?from=2026-11-10&to=2026-11-01` | Trang tải | Hiện lỗi khoảng ngày ngược trên bảng chưa lọc trang 1 |
| Empty | Bộ lọc không khớp dòng nào | Bảng hiện | Thông báo rỗng kèm "Xoá bộ lọc"; bấm thì về bảng chưa lọc |

---

## US006_MarkKudoSpam: Mark Kudo Spam

**Type**: ui
**Interaction**: destructive-action
**Priority**: P1
**Estimate**: M

### User Story

Là Admin, tôi muốn đánh dấu một Kudo công khai là spam để Kudo đó biến mất khỏi các bề mặt công khai.

### Acceptance Criteria

- [ ] Criterion 1: Dòng `public` có nút "Mark Spam"; bấm mở popover một mục "Mark Spam", chọn mục là xác nhận (không có bước nhập lý do); Esc, bấm ra ngoài hoặc Tab thì huỷ và trả focus về nút.
- [ ] Criterion 2: Trong lúc server xử lý nút bị khoá kèm spinner; dòng đổi trạng thái sang `spam` ngay từ kết quả của action, không tải lại trang, kèm toast thành công.
- [ ] Criterion 3: Server chuyển `public` sang `spam` trong một transaction: cập nhật `status`, `moderated_by`, `moderated_at`; chỉ khi đổi thật mới ghi sự kiện `KudoMarkedSpam` (chỉ chứa id) vào outbox trong cùng transaction.
- [ ] Criterion 4: Kudo đã là spam (admin khác làm trước) trả `changed: false`, hiện toast "đã đổi từ trước", không ghi đè `moderated_*` và không thêm sự kiện.
- [ ] Criterion 5: Kudo không còn thì toast "không tìm thấy"; id không phải uuid hoặc lỗi khác thì toast lỗi chung.
- [ ] Criterion 6: Kudo spam bị loại khỏi truy vấn công khai ở thời điểm đọc (bộ đếm không bị ghi); chủ Kudo nhận thông báo `kudo_hidden_spam`; Spotlight nhận tín hiệu `removed`.

### Technical Notes

- **Endpoint**: POST Server Action `markKudoSpam(kudoId)` trên `/admin/review` (ROUTE027, `features/admin-moderation/server/kudo-moderation-actions.ts`).
- **Data Required**: `kudoId` (uuid, kiểm bằng `z.uuid()`); `adminId` lấy từ phiên, không nhận từ client; kết quả `KudoModerationResult` gồm trạng thái mới và cờ `changed`, hoặc mã `invalid`, `not_found`, `unexpected`.
- **Dependencies**: `requireAdmin()` chạy đầu tiên (khách chuyển `/login`, không phải admin nhận 403; layout không bảo vệ action); `KudoModerationService.transition` (`features/admin-moderation/server/kudo-moderation-service.ts`, UPDATE có điều kiện `status = :from` nên an toàn khi hai admin cùng bấm); `DomainEventOutbox.add` (`shared/events/domain-event-outbox`); `revalidatePath("/admin/review")`; PERM019_AdminKudoModeration.
- **Notes**: Popover xác nhận là một mục trong cùng dòng, không phải modal riêng nên gộp vào story này.

### Screens

- SCR013: AdminReviewContent

### Background Logic

- BL023_SpotlightPublishKudoEvent: trigger `AFTER UPDATE OF status` đẩy tín hiệu `removed` lên kênh `spotlight`.
- BL016_EventToNotificationMapping: `KudoMarkedSpam` ánh xạ thành thông báo `kudo_hidden_spam` cho chủ Kudo.
- BL026_NotificationOutboxDrain: bộ xả outbox xử lý sự kiện `KudoMarkedSpam`.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Dòng Kudo đang `public` | Bấm "Mark Spam" rồi chọn mục xác nhận | Dòng đổi sang `spam`, toast thành công, outbox có `KudoMarkedSpam` |
| Cancel | Popover đang mở | Nhấn Esc | Popover đóng, focus về nút, không gọi server |
| Race | Admin khác đã đánh dấu spam dòng này | Bấm xác nhận | `changed: false`, toast "đã đổi từ trước", không có sự kiện thứ hai |
| Not Found | Kudo đã bị xoá khỏi DB | Bấm xác nhận | Toast "không tìm thấy" |
| Not Admin | Role bị hạ trong lúc đang mở trang | Bấm xác nhận | Server trả 403 từ `requireAdmin()`, không đổi gì |

---

## US007_RestoreSpamKudo: Restore Spam Kudo

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

Là Admin, tôi muốn trả một Kudo spam về công khai để Kudo bị đánh dấu nhầm hiện lại cho mọi người.

### Acceptance Criteria

- [ ] Criterion 1: Dòng `spam` có nút "Un Spam"; bấm mở popover một mục "Un Spam" và chọn mục là xác nhận, cùng cách huỷ như Mark Spam.
- [ ] Criterion 2: Server chuyển `spam` sang `public` trong một transaction và ghi `moderated_by`, `moderated_at`; không ghi sự kiện outbox nên chủ Kudo không nhận thông báo mới.
- [ ] Criterion 3: Dòng đổi trạng thái sang `public` ngay từ kết quả của action kèm toast; Kudo đã là public thì `changed: false` và toast "đã đổi từ trước".
- [ ] Criterion 4: Kudo hiện lại ở các bề mặt công khai từ lần đọc sau; Spotlight nhận tín hiệu `restored` (chỉ chỉnh bộ đếm, không thêm dòng ticker).
- [ ] Criterion 5: Thông báo `kudo_hidden_spam` đã gửi trước đó vẫn còn nguyên; Un Spam không gửi gì.

### Technical Notes

- **Endpoint**: POST Server Action `unSpamKudo(kudoId)` trên `/admin/review` (ROUTE028, `features/admin-moderation/server/kudo-moderation-actions.ts`).
- **Data Required**: Như MarkKudoSpam: `kudoId` uuid, `adminId` từ phiên; trả `KudoModerationResult`.
- **Dependencies**: `requireAdmin()` đầu tiên; `KudoModerationService.transition` với đích `public`; `revalidatePath("/admin/review")`; PERM019_AdminKudoModeration.
- **Notes**: Dùng chung `ReviewModerationButton` (`features/admin-moderation/components/review-moderation-button.tsx`) nhưng hướng chuyển ngược, endpoint riêng và không phát sự kiện nên tách thành story riêng.

### Screens

- SCR013: AdminReviewContent

### Background Logic

- BL023_SpotlightPublishKudoEvent: chuyển `spam` sang `public` đẩy tín hiệu `restored` lên kênh `spotlight`.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Dòng Kudo đang `spam` | Bấm "Un Spam" rồi chọn mục xác nhận | Dòng đổi sang `public`, toast thành công, outbox không thêm dòng nào |
| Race | Admin khác đã trả Kudo về public | Bấm xác nhận | `changed: false`, toast "đã đổi từ trước" |
| Error Case | Server lỗi bất ngờ | Bấm xác nhận | Toast lỗi chung, dòng giữ trạng thái `spam` |

---

## US008_ExportKudoReviewCsv: Export Kudo Review Csv

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: M

### User Story

Là Admin, tôi muốn xuất CSV các Kudo theo bộ lọc đang chọn để đối soát nội dung kiểm duyệt ngoài hệ thống.

### Acceptance Criteria

- [ ] Criterion 1: Nút Export dùng bộ lọc và thứ tự đang hiện trên trang nhưng bỏ `page`: tệp chứa mọi dòng khớp, không chỉ trang hiện tại; tham số lấy từ bộ lọc server đã xác nhận, không phải giá trị đang chờ cập nhật.
- [ ] Criterion 2: Tối đa `EXPORT_MAX_ROWS` dòng (mặc định 10000): server đọc một lần `EXPORT_MAX_ROWS + 1` dòng, thừa dòng thì trả 422 `export_too_large` và không có tệp; giao diện hiện toast "quá lớn".
- [ ] Criterion 3: Tệp `kudos-yyyyMMdd-HHmm.csv` (giờ `ADMIN_TIMEZONE`), UTF-8 có BOM, formula guard.
- [ ] Criterion 4: Mười ba cột `ID` (uuid đầy đủ), `Ngày gửi`, `Người gửi`, `Email người gửi`, `Ẩn danh`, `Người nhận`, `Tiêu đề`, `Lời nhắn`, `Hashtag`, `Tim`, `Trạng thái`, `Kiểm duyệt bởi`, `Kiểm duyệt lúc`; Kudo ẩn danh mang người gửi thật và cột `Ẩn danh` là "Có".
- [ ] Criterion 5: Nút khoá kèm spinner trong lúc chuẩn bị tệp; lỗi khác hiện toast lỗi; mọi câu trả lời mang `Cache-Control: private, no-store`.

### Technical Notes

- **Endpoint**: GET `/api/admin/kudos/export?<cùng tham số với bảng>` (ROUTE002, `app/api/admin/kudos/export/route.ts`). Trả 200 `text/csv`; 401 `unauthorized`; 403 `forbidden`; 400 như bảng (`invalid_params`, `invalid_date_range`); 422 `export_too_large`; 500 `unexpected`.
- **Data Required**: `parseAdminKudoFilter`; `KudoAdminQuery.listForExport(filter, "vi", EXPORT_MAX_ROWS + 1)`; `serializeAdminKudoCsv` và `adminKudoExportFilename` (`features/admin-moderation/server/admin-kudo-export.ts`).
- **Dependencies**: `requireAdminApi()` chạy trước khi đọc tham số (PERM015_AdminApiGate); `assertWithinExportLimit` (`shared/admin/export-limit.ts`); PERM021_AdminRealSenderView cho cột người gửi thật; nút `ReviewExportButton` dùng chung.
- **Notes**: Bộ lọc dùng chung `buildAdminKudoWhere` với bảng nên tệp và bảng khớp nhau.

### Screens

- SCR013: AdminReviewContent

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Bảng đang lọc `status=spam` với 25 dòng trên 3 trang | Bấm Export | Tệp có đủ 25 dòng spam, thứ tự như bảng, trạng thái cột là "Spam" |
| Anonymous | Có Kudo ẩn danh trong kết quả | Mở tệp | Dòng đó có người gửi thật và cột `Ẩn danh` là "Có" |
| Too Large | Số dòng khớp lớn hơn `EXPORT_MAX_ROWS` | Bấm Export | Server trả 422, giao diện hiện toast "quá lớn", không có tệp |
| Not Admin | Role bị hạ trong lúc đang mở trang | Bấm Export | Server trả 403, hiện toast lỗi, không có tệp |

---

## US009_BrowseUsers: Browse Users

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: L

### User Story

Là Admin, tôi muốn duyệt bảng Sunner kèm số liệu tham gia để theo dõi mức hoạt động và vai trò của từng người.

### Acceptance Criteria

- [ ] Criterion 1: Bảng 20 dòng mỗi trang, mặc định theo tên A tới Z rồi theo id; cột User, Email, ∑ sent Kudos, ∑ Received Kudos, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role, Actions; giờ hiển thị `dd/MM/yyyy HH:mm` theo `ADMIN_TIMEZONE`.
- [ ] Criterion 2: Ba dropdown lọc Unit (kèm lựa chọn "chưa gán"), Level (các bậc Hero kèm "chưa có bậc"), Role; mỗi danh sách bắt đầu bằng "Tất cả".
- [ ] Criterion 3: Ô tìm theo tên hoặc email gửi sau khi ngừng gõ 300 ms hoặc khi nhấn Enter; tối đa 100 ký tự, dài hơn thì báo lỗi `query_too_long`.
- [ ] Criterion 4: Sắp xếp theo bảy cột số liệu (`sent`, `received`, `hearts`, `level`, `badges`, `six_badges_at`, `last_login_at`); cột mới bắt đầu giảm dần, bấm lại thì đảo chiều.
- [ ] Criterion 5: Mọi thay đổi trừ đổi trang đều về trang 1; `?page` vượt cuối bị kẹp về trang cuối.
- [ ] Criterion 6: URL giữ trạng thái (`page`, `unit`, `level`, `role`, `q`, `sort`, `dir`); tham số sai hiện lỗi lọc (`invalid_params` hoặc `query_too_long`) trên trang 1 chưa lọc.
- [ ] Criterion 7: Đọc danh sách Unit lỗi chỉ làm trống dropdown Unit, bảng vẫn dùng được; đọc bảng lỗi hiện `AdminLoadErrorPanel` với nút thử lại.
- [ ] Criterion 8: Không có dòng nào thì hiện thông báo rỗng kèm "Xoá bộ lọc" khi đang lọc.

### Technical Notes

- **Endpoint**: GET `/admin/users?page&unit&level&role&q&sort&dir` (RSC, `app/admin/users/page.tsx`).
- **Data Required**: `AdminUserFilterValues` từ `parseUserListParams` (`features/admin-users/schemas/user-list-params-schema.ts`, mọi giá trị đi qua whitelist); `AdminUserPage` với tổng cột Sent và Received; tuỳ chọn Unit từ `UserFilterOptionsQuery`; bảng `profiles`, `departments`, `kudos`, `kudo_hearts`, `user_icons`.
- **Dependencies**: `requireAdmin()` đầu trang; `UserAdminQuery.listPage` với `ADMIN_USER_PAGE_SIZE = 20` (`features/admin-users/server/user-admin-query.ts`, đặt `enable_nestloop = off` trong transaction báo cáo để các phép tổng hợp chỉ tính một lần); PERM014_AdminPageAndActionGuard.
- **Notes**: `[IPE_FOLDED]` bộ lọc, ô tìm, sắp xếp, phân trang và nút thử lại cùng một lần đọc và một trạng thái URL; đổi role và xuất CSV có endpoint riêng nên tách.

### Screens

- SCR018: AdminUser

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có Sunner ở nhiều đơn vị | Chọn Unit và gõ một phần email | URL có `unit` và `q`, bảng chỉ còn người khớp cả hai, về trang 1 |
| Sort | Bảng đang theo tên | Bấm tiêu đề Sent Kudos | Sắp giảm dần theo `sent`; bấm lại thì tăng dần |
| Query Too Long | Admin mở `?q=` dài hơn 100 ký tự | Trang tải | Hiện lỗi lọc trên bảng chưa lọc |
| Unit Options Fail | Đọc danh sách Unit lỗi | Trang tải | Dropdown Unit trống, bảng vẫn hiện và lọc được theo Level, Role |
| Table Read Fail | Đọc bảng lỗi | Bấm thử lại | Trang đọc lại trên server; thành công thì bảng hiện |

---

## US010_PromoteUserToAdmin: Promote User To Admin

**Type**: ui
**Interaction**: primary-action
**Priority**: P2
**Estimate**: M

### User Story

Là Admin, tôi muốn nâng một Sunner lên admin để người đó dùng được khu Admin.

### Acceptance Criteria

- [ ] Criterion 1: Hàng có role `user` (không phải hàng của mình) có nút "⋯" mở menu một mục "Set as Admin"; chọn mục mở hộp xác nhận hiện tên và email người đó, có nút Confirm và Cancel, Cancel giữ focus ban đầu.
- [ ] Criterion 2: Esc hoặc Cancel đóng hộp mà không ghi gì; trong lúc lưu cả hai nút bị khoá kèm spinner và Esc không đóng hộp.
- [ ] Criterion 3: Confirm gọi action với role `admin`; thành công thì đóng hộp, ô Role của hàng đổi sang Admin ngay và hiện toast; action làm mới `/admin/users` nên số liệu và bộ lọc Role khớp lại.
- [ ] Criterion 4: Server ghi `profiles.role`, `role_updated_by`, `role_updated_at` trong một transaction khoá các hàng admin theo `id`; người đã là admin thì trả trạng thái hiện tại và không ghi.
- [ ] Criterion 5: Không thấy người dùng thì `NOT_FOUND`; actor đã bị hạ trong lúc chờ khoá thì `FORBIDDEN`; lỗi hiện inline trong hộp và hộp mở để thử lại.
- [ ] Criterion 6: Role mới có hiệu lực từ request kế tiếp của người được nâng vì role luôn đọc từ DB.

### Technical Notes

- **Endpoint**: POST Server Action `setUserRoleAction({ userId, role })` trên `/admin/users` (ROUTE032, `features/admin-users/server/set-user-role-action.ts`).
- **Data Required**: `userId` (uuid) và `role` (`admin` hoặc `user`) qua `setUserRoleInputSchema` (sai thì `INVALID`); `actorId` lấy từ phiên; kết quả `SetUserRoleResult`; cột `profiles.role`, `role_updated_by`, `role_updated_at`.
- **Dependencies**: `requireAdmin()` đầu tiên; `UserRoleService.setRole` là nơi duy nhất ghi `profiles.role` từ giao diện (`features/admin-users/server/user-role-service.ts`); `roleMenuState` quyết định mục menu (`features/admin-users/lib/admin-user-role-menu-state.ts`); hộp `AdminUserRoleDialog`; PERM017_AdminUserRoleChange, PERM018_AdminRoleMenuState.
- **Notes**: Hộp xác nhận là một phần của hành động đổi role nên gộp vào story, không tách story mở hộp.

### Screens

- SCR018: AdminUser

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Hàng của một Sunner role `user` | Chọn "Set as Admin" rồi Confirm | Hộp đóng, hàng hiện Admin, toast thành công, DB có `role_updated_by` là admin vừa bấm |
| Cancel | Hộp xác nhận đang mở | Bấm Cancel | Hộp đóng, role không đổi, không gọi server |
| Already Admin | Người đó vừa được admin khác nâng | Confirm | Trả trạng thái hiện tại, không ghi lần hai, hàng hiện Admin |
| Actor Demoted | Actor bị hạ trong lúc chờ khoá | Confirm | `FORBIDDEN`, hộp mở và hiện lỗi inline |
| Not Found | Người đó đã bị xoá | Confirm | `NOT_FOUND`, hiện lỗi inline |

---

## US011_DemoteAdminToUser: Demote Admin To User

**Type**: ui
**Interaction**: destructive-action
**Priority**: P2
**Estimate**: M

### User Story

Là Admin, tôi muốn hạ một admin khác xuống user để thu hồi quyền vào khu Admin của người đó.

### Acceptance Criteria

- [ ] Criterion 1: Hàng admin khác có menu một mục "Set as User"; chọn mục mở hộp xác nhận giống Promote, Cancel giữ focus ban đầu.
- [ ] Criterion 2: Hàng của chính mình: nút "⋯" bị khoá kèm chú thích, không có menu nào.
- [ ] Criterion 3: Hàng admin thuộc `ADMIN_EMAILS`: mục "Set as User" hiện nhưng bị khoá kèm chú thích (mỗi lần đăng nhập tài khoản này lại được đặt về admin), chọn không mở hộp.
- [ ] Criterion 4: Server luôn từ chối theo thứ tự: tự hạ mình `SELF_DEMOTE` (kể cả khi còn admin khác), tài khoản `ADMIN_EMAILS` là `ENV_ADMIN`, chỉ còn một admin là `LAST_ADMIN`, actor đã bị hạ trong lúc chờ là `FORBIDDEN`; lỗi hiện inline trong hộp và hộp ở lại.
- [ ] Criterion 5: Hai admin hạ nhau cùng lúc: người thứ hai nhận `LAST_ADMIN`, hệ thống không bao giờ về 0 admin.
- [ ] Criterion 6: Thành công thì hàng đổi sang User kèm toast; người bị hạ mất quyền vào `/admin/*` từ request kế tiếp (nhận 403).

### Technical Notes

- **Endpoint**: POST Server Action `setUserRoleAction({ userId, role: "user" })` trên `/admin/users` (ROUTE032, `features/admin-users/server/set-user-role-action.ts`).
- **Data Required**: Như PromoteUserToAdmin; thêm cờ `envAdmin` của hàng từ `isEnvAdminEmail` (`features/admin-users/server/env-admin-email.ts`) so với biến `ADMIN_EMAILS`.
- **Dependencies**: `UserRoleService.setRole` khoá các hàng admin theo `id` (`features/admin-users/server/user-role-service.ts`); `roleMenuState` và `roleErrorKey` (`features/admin-users/lib/admin-user-role-menu-state.ts`); `completeLogin` đặt lại `role = 'admin'` cho email trong `ADMIN_EMAILS` ở mỗi lần đăng nhập (`features/auth/server/complete-login.ts`); PERM017_AdminUserRoleChange, PERM018_AdminRoleMenuState, PERM006_EnvAdminPromotion.
- **Notes**: Tách khỏi PromoteUserToAdmin vì có ba luật từ chối riêng và là thao tác thu hồi quyền; phần ẩn hay khoá trên giao diện chỉ là gợi ý, server vẫn từ chối các ca tương ứng.

### Screens

- SCR018: AdminUser

### Background Logic

- Không có BL riêng (luật chạy trong `UserRoleService`; việc đặt lại admin theo `ADMIN_EMAILS` nằm ở luồng đăng nhập).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có hai admin, hàng admin kia không thuộc `ADMIN_EMAILS` | Chọn "Set as User" rồi Confirm | Hàng đổi sang User, toast thành công; người đó vào `/admin/overview` nhận 403 |
| Own Row | Hàng của chính admin đang thao tác | Rê hoặc focus nút "⋯" | Nút bị khoá kèm chú thích, không mở được menu |
| Env Admin | Hàng admin thuộc `ADMIN_EMAILS` | Mở menu | Mục "Set as User" bị khoá kèm chú thích, không mở hộp |
| Self Demotion | Admin gửi thẳng action hạ chính mình (bỏ qua giao diện) | Server xử lý | Trả `SELF_DEMOTE` kể cả khi còn admin khác; role không đổi |
| Mutual Demotion | Hai admin cùng hạ nhau | Cả hai Confirm gần như đồng thời | Một thao tác thành công, thao tác còn lại nhận `LAST_ADMIN` |

---

## US012_ExportUsersCsv: Export Users Csv

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: M

### User Story

Là Admin, tôi muốn xuất CSV danh sách Sunner theo bộ lọc đang chọn để lập báo cáo hoạt động ngoài hệ thống.

### Acceptance Criteria

- [ ] Criterion 1: Nút Export dùng bộ lọc và thứ tự đang hiện nhưng bỏ `page`: tệp chứa mọi Sunner khớp, theo đúng thứ tự bảng.
- [ ] Criterion 2: Tối đa `EXPORT_MAX_ROWS` dòng (mặc định 10000): thừa thì 422 `export_too_large`, không có tệp, giao diện hiện toast "quá lớn".
- [ ] Criterion 3: Tệp `users-yyyyMMdd-HHmm.csv` (giờ `ADMIN_TIMEZONE`), UTF-8 có BOM, formula guard.
- [ ] Criterion 4: Mười một cột `ID` (uuid đầy đủ), `User`, `Email`, `Sent Kudos`, `Received Kudos`, `Total Heart`, `Level` ("New Hero", "Rising Hero", "Super Hero", "Legend Hero" hoặc trống), `Number of Badges`, `Time to get 6 Badges`, `Last Logged in`, `Role`; ô "—" của bảng để trống trong tệp.
- [ ] Criterion 5: Tham số mà bảng từ chối (như `q` dài hơn 100 ký tự) trả 400 `invalid_params`; mọi câu trả lời mang `Cache-Control: private, no-store`.

### Technical Notes

- **Endpoint**: GET `/api/admin/users/export?<cùng tham số với /admin/users>` (ROUTE004, `app/api/admin/users/export/route.ts`). Trả 200 `text/csv`; 401 `unauthorized`; 403 `forbidden`; 400 `invalid_params`; 422 `export_too_large`; 500 `unexpected`.
- **Data Required**: `parseUserListParams`; `UserAdminQuery.listForExport(filter, "vi", EXPORT_MAX_ROWS + 1)`; `serializeAdminUserCsv` (`features/admin-users/server/user-export-columns.ts`); tên tệp từ `adminCsvFilename`.
- **Dependencies**: `requireAdminApi()` chạy trước khi đọc tham số (PERM015_AdminApiGate); `assertWithinExportLimit` (`shared/admin/export-limit.ts`); nút `ReviewExportButton` dùng chung (`features/admin-users/components/admin-users-view.tsx` truyền `adminUsersExportHref(filter)`).
- **Notes**: Cột và nhãn lấy từ bảng nên tiêu đề tệp bằng tiếng Anh, khác tệp Kudo (tiêu đề tiếng Việt).

### Screens

- SCR018: AdminUser

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Bảng đang lọc Role là admin, sắp theo `last_login_at` | Bấm Export | Tệp có đủ admin khớp, đúng thứ tự bảng, 11 cột theo thứ tự trên |
| Empty Cells | Sunner chưa có Level và chưa đăng nhập lần nào | Mở tệp | Hai ô `Level` và `Last Logged in` trống, không có "—" |
| Too Large | Số dòng khớp lớn hơn `EXPORT_MAX_ROWS` | Bấm Export | Server trả 422, giao diện hiện toast "quá lớn", không có tệp |
| Bad Params | Link export có `q` dài hơn 100 ký tự | Gọi endpoint | Trả 400 `invalid_params` |

---

## US013_CreateCampaign: Create Campaign

**Type**: ui
**Interaction**: primary-action
**Priority**: P2
**Estimate**: M

### User Story

Là Admin, tôi muốn tạo một campaign x2 tim với khung giờ riêng để tim thả trong khung giờ đó được nhân hệ số.

### Acceptance Criteria

- [ ] Criterion 1: Nút "Add Campaign" mở hộp "Add Campaign" gồm Campaign Name (bắt buộc, tối đa 100 ký tự), Start Date, End Date (`datetime-local`, đọc theo giờ `ADMIN_TIMEZONE`, năm từ 2000), nút Cancel và nút gửi.
- [ ] Criterion 2: Kiểm sớm phía client bằng cùng schema Zod; lỗi hiện theo từng trường (tên bắt buộc, thiếu Start, thiếu End, ngày giờ không hợp lệ, End không sau Start, End đã qua) và focus nhảy tới trường lỗi đầu tiên.
- [ ] Criterion 3: Start trong quá khứ được phép; End phải sau Start và sau thời điểm hiện tại.
- [ ] Criterion 4: Khoảng giờ không được chồng campaign khác (khoảng nửa mở; chạm đầu mút thì không chồng); vi phạm hiện lỗi dưới End Date nêu tên và khoảng giờ campaign đụng; ràng buộc `campaigns_no_overlap` chặn cả khi hai admin lưu cùng lúc.
- [ ] Criterion 5: Thành công thì đóng hộp, hiện toast "đã tạo" và bảng làm mới, hàng mới nằm theo thứ tự Start giảm dần.
- [ ] Criterion 6: Lỗi chung hiện "Không lưu được" và giữ nguyên dữ liệu đã nhập; trong lúc lưu ô nhập chỉ đọc và hai nút bị khoá.
- [ ] Criterion 7: Trong khi campaign đang chạy, tim thả được nhân hệ số `HEART_CAMPAIGN_MULTIPLIER` (mặc định 2); không còn campaign hiệu lực thì hệ số là 1.

### Technical Notes

- **Endpoint**: POST Server Action `createCampaign(input)` trên `/admin/settings` (ROUTE029, `features/admin-campaigns/server/campaign-admin-actions.ts`).
- **Data Required**: `CampaignCreateSchema` (`features/admin-campaigns/schemas/campaign-input-schema.ts`); `zonedDateTimeToUtc` (`shared/admin/timezone.ts`) đổi giờ địa phương sang UTC; bảng `campaigns` (MODEL009_Campaign); kết quả `CampaignActionResult` (`VALIDATION`, `OVERLAP`, `UNEXPECTED`).
- **Dependencies**: `requireAdmin()` đầu tiên; `campaignWindowErrors`; `CampaignOverlapCheck.find` kiểm trước trong transaction, ràng buộc EXCLUDE (SQLSTATE `23P01`) là chốt chặn cuối (`features/admin-campaigns/server/campaign-overlap-check.ts`, `campaign-write-transaction.ts`); hook `useCampaignForm`; `HeartMultiplierResolver` đọc campaign hiệu lực (`features/kudos-hearts/server/heart-multiplier-resolver.ts`); PERM020_AdminCampaignManagement.
- **Notes**: Nút mở hộp không có kết quả độc lập nên gộp vào story này.

### Screens

- SCR014: AdminCampaignSettings

### Background Logic

- Không có BL riêng (hệ số tim đọc trực tiếp lúc thả tim, không có tác vụ nền).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Không có campaign nào chồng giờ | Nhập tên, Start, End hợp lệ rồi gửi | Hộp đóng, toast "đã tạo", hàng mới có trong bảng |
| Validation | Hộp đang mở | Gửi khi chưa nhập tên | Báo "tên bắt buộc" dưới trường Name, focus ở trường đó |
| End Before Start | Hộp đang mở | Nhập End không sau Start | Báo lỗi dưới End Date, không gọi server |
| Overlap | Đã có campaign trùng một phần khoảng giờ | Gửi | Lỗi dưới End Date nêu tên campaign đụng, không lưu |
| Past Start | Start nằm trong quá khứ, End ở tương lai | Gửi | Lưu thành công; campaign hiện ở trạng thái đang chạy |

---

## US014_EditCampaign: Edit Campaign

**Type**: ui
**Interaction**: primary-action
**Priority**: P2
**Estimate**: M

### User Story

Là Admin, tôi muốn sửa thông tin của một campaign chưa kết thúc để khung giờ nhân đôi tim khớp với kế hoạch mới.

### Acceptance Criteria

- [ ] Criterion 1: Nút "⋯" chỉ có ở hàng đang chờ hoặc đang chạy (hàng đã kết thúc không có nút); mục "Edit" mở hộp "Edit Campaign" đã nạp tên, Start, End hiện có.
- [ ] Criterion 2: Pha tính theo giờ máy chủ trong transaction khoá hàng, không theo pha trình duyệt đã thấy: campaign chờ sửa được cả ba trường; campaign đang chạy chỉ sửa tên và End, Start chỉ đọc kèm lý do; gửi Start khác phút đã lưu thì `startLocked`.
- [ ] Criterion 3: Campaign đã kết thúc trong lúc sửa thì `ENDED`; bị xoá trong lúc sửa thì `NOT_FOUND`; cả hai đóng hộp, hiện toast lỗi và bảng làm mới.
- [ ] Criterion 4: Cùng luật thời gian như khi tạo (End sau Start và sau hiện tại) và luật không chồng giờ, loại trừ chính campaign đang sửa.
- [ ] Criterion 5: Thành công thì đóng hộp, hiện toast "đã cập nhật", bảng làm mới.
- [ ] Criterion 6: Lỗi chung hiện "Không lưu được" và giữ nguyên dữ liệu nhập.

### Technical Notes

- **Endpoint**: POST Server Action `updateCampaign(input)` trên `/admin/settings` (ROUTE030, `features/admin-campaigns/server/campaign-admin-actions.ts`).
- **Data Required**: `CampaignUpdateSchema` (`id` số nguyên dương, `name`, `startsAt` tuỳ chọn, `endsAt`); `startsAt` bị bỏ khi campaign đang chạy; trả `CampaignActionResult` (`VALIDATION`, `OVERLAP`, `ENDED`, `NOT_FOUND`, `UNEXPECTED`).
- **Dependencies**: `requireAdmin()` đầu tiên; `lockCampaignRow` (`SELECT ... FOR UPDATE`) và `campaignPhase` (`features/admin-campaigns/server/campaign-phase.ts`, khoảng nửa mở `[starts_at, ends_at)`); `CampaignOverlapCheck`; hộp `CampaignFormModal` (`features/admin-campaigns/components/campaign-form-modal.tsx`) dùng chung `useCampaignForm`; PERM020_AdminCampaignManagement.
- **Notes**: Dùng chung hộp với CreateCampaign nhưng khác action, khác luật theo pha nên là story riêng.

### Screens

- SCR014: AdminCampaignSettings

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Campaign đang chờ | Sửa tên và End rồi bấm "Save Campaign" | Hộp đóng, toast "đã cập nhật", bảng hiện giá trị mới |
| Active Start Locked | Campaign đang chạy | Mở hộp sửa | Start chỉ đọc kèm lý do; chỉ tên và End sửa được |
| Became Ended | Campaign hết hạn trong lúc hộp mở | Bấm lưu | `ENDED`, hộp đóng, toast lỗi, bảng làm mới và hàng không còn nút "⋯" |
| Deleted Meanwhile | Admin khác đã xoá campaign | Bấm lưu | `NOT_FOUND`, hộp đóng, toast lỗi |
| Overlap | Khung giờ mới chồng campaign khác | Bấm lưu | Lỗi dưới End Date nêu campaign đụng, không lưu |

---

## US015_DeleteCampaign: Delete Campaign

**Type**: ui
**Interaction**: destructive-action
**Priority**: P2
**Estimate**: S

### User Story

Là Admin, tôi muốn xoá một campaign chưa kết thúc để huỷ khung giờ nhân đôi tim đó.

### Acceptance Criteria

- [ ] Criterion 1: Mục "Delete" trong menu "⋯" mở hộp xác nhận (`alertdialog`) hiện tên campaign, có nút Delete (đỏ) và Cancel; Cancel giữ focus ban đầu.
- [ ] Criterion 2: Trong lúc xoá cả hai nút bị khoá; Cancel hoặc Esc đóng hộp mà không xoá.
- [ ] Criterion 3: Xoá cứng hàng trong transaction khoá hàng; pha tính lại ở máy chủ: campaign đang chạy bị xoá thì dừng sớm (tim thả sau đó trở về hệ số 1), campaign đã kết thúc thì `ENDED`.
- [ ] Criterion 4: Thành công thì đóng hộp, hiện toast "đã xoá" và hàng biến khỏi bảng.
- [ ] Criterion 5: Campaign đã bị xoá từ trước (`NOT_FOUND`) hoặc đã kết thúc (`ENDED`) thì đóng hộp, hiện toast lỗi và bảng làm mới; lỗi khác giữ hộp mở với "Không xoá được, vui lòng thử lại".

### Technical Notes

- **Endpoint**: POST Server Action `removeCampaign(id)` trên `/admin/settings` (ROUTE031, `features/admin-campaigns/server/campaign-admin-actions.ts`).
- **Data Required**: `id` số nguyên dương (`z.int().positive()`, sai thì `NOT_FOUND`); trả `CampaignActionResult`.
- **Dependencies**: `requireAdmin()` đầu tiên; `lockCampaignRow` và `campaignPhase`; `runCampaignWrite` làm mới `/admin/settings` khi kết quả đã chạm DB; hộp `CampaignDeleteDialog` (`features/admin-campaigns/components/campaign-delete-dialog.tsx`); PERM020_AdminCampaignManagement.
- **Notes**: Theo giao thức IPE, thao tác huỷ không hoàn tác luôn là story riêng; xoá cứng nên không có đường khôi phục.

### Screens

- SCR014: AdminCampaignSettings

### Background Logic

- Không có BL riêng.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Campaign đang chờ | Chọn "Delete" rồi xác nhận | Hộp đóng, toast "đã xoá", hàng biến khỏi bảng |
| Cancel | Hộp xác nhận đang mở | Bấm Cancel | Hộp đóng, campaign còn nguyên |
| Active Deleted | Campaign đang chạy | Xác nhận xoá | Campaign mất; tim thả sau đó dùng hệ số 1 |
| Ended Meanwhile | Campaign hết hạn trong lúc hộp mở | Xác nhận xoá | `ENDED`, hộp đóng, toast lỗi, bảng làm mới |
| Unexpected Failure | Server lỗi bất ngờ | Xác nhận xoá | Hộp ở lại, hiện "Không xoá được, vui lòng thử lại" |

## US016_SignInWithGoogle: Sign In With Google

**Type**: ui
**Interaction**: primary-action
**Priority**: P0
**Estimate**: M

### User Story

Là Khách, tôi muốn đăng nhập bằng tài khoản Google của công ty để vào hệ thống Kudos với phiên của riêng mình.

### Acceptance Criteria

- [ ] Criterion 1: `/login` hiện nút "Đăng nhập bằng Google" cho khách chưa có phiên; người đã có phiên mở `/login` bị proxy đưa về `/`.
- [ ] Criterion 2: Bấm nút gửi form tới Server Action `signInWithGoogle`: làm sạch `next` bằng `safeNextPath`, dựng `redirectTo` là `/auth/callback` (kèm `next` khi khác `/`), gọi Supabase `signInWithOAuth` với provider `google` và `hd` bằng tên miền công ty, rồi chuyển trình duyệt tới Google.
- [ ] Criterion 3: Trong lúc action chạy nút khoá kèm spinner nên bấm đôi không khởi động hai luồng OAuth; lỗi khi khởi động (hoặc thiếu URL) hiện banner `auth_failed`.
- [ ] Criterion 4: Sau Google, `GET /auth/callback` đổi `code` lấy phiên (PKCE), kiểm lại tên miền của email, cập nhật `last_login_at` (và đặt `role = 'admin'` cho email thuộc `ADMIN_EMAILS`, ở mọi lần đăng nhập), rồi chuyển tới trang chọn phòng ban nếu chưa có phòng ban, ngược lại tới `next` đã làm sạch (mặc định `/`).
- [ ] Criterion 5: `next` không an toàn (khác origin, bắt đầu bằng `//`, có `\` hoặc ký tự điều khiển, dài hơn 2048 ký tự) bị thay bằng `/`.
- [ ] Criterion 6: Trước `LAUNCH_AT`, người không phải admin đăng nhập xong rồi vào `/` bị cổng prelaunch đưa tới `/countdown`; admin đi thẳng.
- [ ] Criterion 7: Email ngoài tên miền công ty bị cơ sở dữ liệu từ chối, người dùng về `/login?error=domain_not_allowed` với banner "Chỉ tài khoản @tên-miền được phép đăng nhập"; mọi lỗi khác (huỷ ở Google, đổi mã thất bại, lỗi DB) về `/login?error=auth_failed`.
- [ ] Criterion 8: Khi bước hoàn tất đăng nhập thất bại sau lúc đã đổi được phiên (kiểm lại tên miền không đạt, không có hàng profile để cập nhật, lỗi DB), callback gọi `signOut({ scope: "local" })` nên không ai giữ phiên chưa qua kiểm tra; banner ẩn khi bắt đầu lần thử mới.

### Technical Notes

- **Endpoint**: POST Server Action `signInWithGoogle` trên `/login` (ROUTE021, `features/auth/server/sign-in-with-google-action.ts`); GET `/auth/callback` (ROUTE020, `app/auth/callback/route.ts`).
- **Data Required**: Trường ẩn `next`; biến môi trường `ALLOWED_EMAIL_DOMAIN` và `ADMIN_EMAILS`; `profiles.last_login_at`, `role`, `department_id` (MODEL004_Profile); `LoginErrorCode` (`domain_not_allowed`, `auth_failed`) trong `features/auth/login-error-codes.ts`.
- **Dependencies**: Supabase Auth với provider Google và danh sách cho phép `redirectTo`; `hd` chỉ thu hẹp bộ chọn tài khoản, chốt tên miền thật là auth hook `before_user_created` cùng trigger trên `auth.users` (`db/migrations/0005_auth_user_triggers.sql`); `completeLogin` (`features/auth/server/complete-login.ts`); form và nút ở `features/auth/components/google-sign-in-form.tsx`, `google-sign-in-button.tsx`; trang `app/(public)/login/page.tsx`; PERM001_PublicPathAllowlist, PERM005_CompanyEmailDomainAdmission, PERM006_EnvAdminPromotion, PERM007_SafeNextRedirect.
- **Notes**: Chọn phòng ban lần đầu và đổi ngôn ngữ ở `/login` là story riêng. Điều khiển đổi ngôn ngữ của khách dùng chung với Sunner nên không có story thứ hai.

### Screens

- SCR001: Login

### Background Logic

- BL005_GoogleSignInStart: khởi động OAuth Google bằng PKCE.
- BL004_GoogleOAuthCallback: đổi mã lấy phiên, kiểm lại tên miền, đặt `last_login_at` và quyền theo `ADMIN_EMAILS`, chọn đích.
- BL018_BeforeUserCreatedHook: auth hook từ chối email ngoài tên miền bằng 403 `domain_not_allowed`.
- BL021_RejectForeignDomainOnInsert: trigger BEFORE INSERT trên `auth.users` làm chốt chặn thứ hai.
- BL019_CreateSunnerProfile: trigger tạo hồ sơ Sunner sau khi tạo user lần đầu.
- BL013_PrelaunchGate: quyết định người không phải admin đi `/countdown` trước `LAUNCH_AT`.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path (lần đầu) | Khách có email công ty, chưa có phòng ban | Bấm "Đăng nhập bằng Google" và chấp nhận ở Google | Về `/auth/callback`, có phiên, `last_login_at` được ghi, chuyển tới trang chọn phòng ban |
| Return Path | Khách mở `/login?next=/kudos/123`, đã có phòng ban | Đăng nhập thành công | Chuyển tới `/kudos/123` |
| Foreign Domain | Khách chọn tài khoản Google ngoài tên miền công ty | Google chuyển về callback | Về `/login?error=domain_not_allowed`, hiện banner tên miền; không có phiên |
| Cancelled | Khách đóng màn hình đồng ý của Google | Callback nhận lỗi, không có `code` | Về `/login?error=auth_failed` |
| Unsafe Next | Khách mở `/login?next=//evil.example` | Đăng nhập thành công | Chuyển tới `/`, không rời origin |
| Prelaunch | Trước `LAUNCH_AT`, email công ty, role `user` | Đăng nhập xong và vào `/` | Proxy chuyển tới `/countdown` |
| Double Click | Nút đang pending | Bấm nút lần nữa | Nút khoá, chỉ một luồng OAuth chạy |

---

## US017_ReturnToLoginFromNotFound: Return To Login From Not Found

**Type**: ui
**Interaction**: navigation
**Priority**: P2
**Estimate**: S

### User Story

Là Khách, tôi muốn quay về trang đăng nhập từ trang 404 để đăng nhập thay vì kẹt ở một địa chỉ không tồn tại.

### Acceptance Criteria

- [ ] Criterion 1: Địa chỉ không khớp route nào hiện trang 404 trần (status 404, không header, không footer) với tiêu đề, minh hoạ và mô tả, không lộ chi tiết kỹ thuật.
- [ ] Criterion 2: Khi `getShellUser()` trả null (không có phiên, hoặc có phiên nhưng không có hàng profile) nút duy nhất là "Đăng nhập" dẫn tới `/login`; người đã có phiên và có profile thấy "Về trang chủ" dẫn tới `/`.
- [ ] Criterion 3: Bấm "Đăng nhập" mở `/login` sạch, không mang `next` của địa chỉ không tồn tại.

### Technical Notes

- **Endpoint**: N/A (link `next/link` tới `/login`). Trang render ở `app/not-found.tsx` với status 404; khung dùng chung `ErrorPanel` (`features/app-shell/components/error-panel.tsx`).
- **Data Required**: `ShellUser | null` từ `getShellUser()` (`features/app-shell/server/shell-session.ts`, đọc phiên rồi đọc profile; trả null cho khách và cho phiên thiếu profile) chỉ để chọn nút, không hiển thị tên; đích lấy từ `APP_ROUTES` (`shared/ui/app-routes.ts`).
- **Dependencies**: Chuỗi quyết định ở proxy (`shared/auth/route-access-policy.ts`); phiên đọc qua `getSessionUser` (`shared/auth/current-user.ts`).
- **Notes**: Hạn chế đã biết: nhánh khách của trang 404 gần như không với tới trong thực tế. `decideRouteAccess` chuyển khách khỏi mọi path ngoài danh sách công khai (`/login`, `/auth/callback`, `/countdown`, `/access-denied`, hai endpoint nội bộ) sang `/login?next=...` (API thì 401) trước khi Next.js render 404; matcher của proxy chỉ bỏ qua `_next/static/`, `_next/image`, `images/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml` (`proxy.ts`). Bài e2e hiện có khẳng định khách vào đường dẫn lạ bị chuyển `/login?next=...` và không thấy chữ "KHÔNG TÌM THẤY" (`tests/e2e/app-shell/admin-frame-and-errors.spec.ts`); chỉ nhánh người đã đăng nhập có bài kiểm tra 404. Nhánh "Đăng nhập" còn tới được ở hai ca hẹp: có phiên nhưng thiếu hàng profile, và địa chỉ lạ nằm ngoài matcher mà Next.js vẫn dựng trang 404 (suy luận từ matcher, chưa có kiểm chứng chạy thực). Story vẫn giữ vì mã nguồn có nhánh này (quyết định D005 trong mô tả màn hình).

### Screens

- SCR005: Error404

### Background Logic

- BL011_SupabaseServerClient: tạo client phiên phía server để `getShellUser()` biết có phiên hay không.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có phiên nhưng không có hàng profile, mở địa chỉ không tồn tại | Trang 404 hiện, bấm "Đăng nhập" | Chuyển tới `/login` |
| Signed-in Branch | Sunner đã đăng nhập, mở địa chỉ không tồn tại | Trang 404 hiện | Nút là "Về trang chủ" dẫn tới `/`, không có nút "Đăng nhập" |
| Error Case | Khách chưa có phiên, mở địa chỉ không tồn tại ngoài các prefix của proxy | Proxy xử lý | Khách bị chuyển `/login?next=...` nên không thấy trang 404 (nhánh khách không với tới) |

## US018_ChooseDepartment: Choose Department

**Type**: ui
**Interaction**: primary-action
**Priority**: P0
**Estimate**: S

### User Story

Là một Sunner vừa đăng nhập lần đầu, tôi muốn chọn đơn vị làm việc của mình để hoàn tất hồ sơ và vào được các trang dành cho Sunner.

### Acceptance Criteria

- [ ] Criterion 1: Sunner chưa có đơn vị vào bất kỳ trang Sunner nào đều bị chuyển tới `/onboarding/department` (kèm `next` đã làm sạch); người đã có đơn vị mở lại trang này bị chuyển thẳng tới `next`.
- [ ] Criterion 2: Trang liệt kê các đơn vị đã seed theo `sort_order`, tên theo ngôn ngữ đang chọn (vi hoặc en), dạng nhóm radio bắt buộc chọn một.
- [ ] Criterion 3: Bấm "Tiếp tục" ghi `departmentId` vào hồ sơ của chính mình rồi chuyển tới `next` (`safeNextPath`, mặc định `/`); trong lúc gửi nút hiện "Đang lưu…" và bị khoá.
- [ ] Criterion 4: Chỉ đặt được một lần: lệnh UPDATE chỉ chạy khi `profiles.department_id` còn trống; gửi lại khi đã có đơn vị thì không đổi gì và vẫn chuyển tới `next`.
- [ ] Criterion 5: Đơn vị không tồn tại hoặc không phải uuid hiện "Vui lòng chọn một đơn vị trong danh sách."; lỗi ghi DB hoặc phiên không có dòng hồ sơ hiện "Không lưu được lựa chọn, vui lòng thử lại."; id người dùng luôn lấy từ phiên, trường lạ trong form bị bỏ.

### Technical Notes

- **Endpoint**: POST server action `chooseDepartment` (ROUTE022, path `/onboarding/department`); trang `GET /onboarding/department`.
- **Data Required**: `departmentId` (uuid) và `next` (tối đa 2048 ký tự, tùy chọn); đọc `departments`, ghi `profiles.department_id`.
- **Dependencies**: PERM008_SunnerAreaGate (người chưa có đơn vị bị đẩy về đây, `shared/auth/current-user.ts:48-53`), PERM009_OnboardingDepartmentChoice, PERM007_SafeNextRedirect.
- **Source**: `features/auth/server/choose-department-action.ts:18-70` (`assignFirstDepartment`, `chooseDepartment`), `features/auth/components/department-picker-form.tsx:31-61`, `features/auth/schemas/choose-department-schema.ts`, `features/auth/server/department-options-query.ts`, `app/onboarding/department/page.tsx:26-48`, `shared/auth/safe-next-path.ts`.

### Screens

- SCR020: OnboardingDepartment

### Background Logic

- BL004_GoogleOAuthCallback: chọn đích là trang chọn đơn vị ở lần đăng nhập đầu
- BL019_CreateSunnerProfile: tạo dòng `profiles` với đơn vị trống ở lần đăng nhập đầu

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner mới đăng nhập, chưa có đơn vị, mở `/kudos` | Bị chuyển tới trang chọn đơn vị, chọn một đơn vị rồi bấm "Tiếp tục" | `profiles.department_id` được đặt và trình duyệt tới `/kudos` |
| Error Case | Form gửi `departmentId` không có trong `departments` | Bấm "Tiếp tục" | Hiện "Vui lòng chọn một đơn vị trong danh sách.", không ghi gì, ở lại trang |
| Edge Case | Sunner đã có đơn vị (tab khác vừa chọn) và `next` là `https://evil.example` | Gửi lại form | Đơn vị cũ giữ nguyên, `next` bị thay bằng `/`, chuyển tới `/` |

---

## US019_SignOut: Sign Out

**Type**: ui
**Interaction**: secondary-action
**Priority**: P0
**Estimate**: S

### User Story

Là một Sunner, tôi muốn đăng xuất khỏi thiết bị đang dùng để phiên làm việc trên máy này kết thúc và không ai dùng tiếp được tài khoản của tôi.

### Acceptance Criteria

- [ ] Criterion 1: Avatar ở header mở menu tài khoản gồm Profile, Dashboard (chỉ admin) và Logout; nút "Logout" chỉ hiện khi layout truyền được hành động đăng xuất.
- [ ] Criterion 2: Bấm "Logout" gọi `signOut`: kết thúc phiên của thiết bị này (`scope: "local"`, phiên ở thiết bị khác giữ nguyên), xoá cookie xác thực rồi chuyển về `/login`.
- [ ] Criterion 3: Phiên đã hết hạn vẫn tính là đã đăng xuất (supabase-js bỏ qua 401, 403, 404 từ `/logout`) và vẫn về `/login`.
- [ ] Criterion 4: Trong lúc chờ nút bị khoá; khi Auth không với tới được thì hành động trả `{ ok: false }`, menu ở lại và hiện "Không thể đăng xuất, vui lòng thử lại."
- [ ] Criterion 5: Admin dùng chung nút này ở thanh đầu trang admin, không có story thứ hai cho cùng điều khiển.

### Technical Notes

- **Endpoint**: POST server action `signOut` (ROUTE035), chạy từ mọi trang Sunner và trang admin.
- **Data Required**: không có đầu vào; đọc cookie phiên Supabase của request.
- **Dependencies**: PERM012_PreferenceAndSignOutActions (action không tự kiểm phiên, chỉ proxy chặn khách).
- **Source**: `shared/auth/sign-out-action.ts:16-24`, `features/app-shell/components/account-menu.tsx:32-43,71-81`, `features/app-shell/server/shell-session.ts` (`getShellSignOutAction`), `app/(app)/layout.tsx:20-26`.

### Screens

- SCR003: AppLayout
- SCR002: AdminLayout

### Background Logic

- BL011_SupabaseServerClient: dựng client Supabase theo cookie để kết thúc phiên

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner đang đăng nhập ở `/kudos` | Mở menu tài khoản và bấm "Logout" | Phiên thiết bị này bị huỷ, trình duyệt về `/login` |
| Error Case | Supabase Auth không phản hồi | Bấm "Logout" | `signOut` trả `{ ok: false }`, menu ở lại và hiện "Không thể đăng xuất, vui lòng thử lại." |
| Edge Case | Phiên đã hết hạn nhưng trang chưa tải lại | Bấm "Logout" | Vẫn về `/login`, không báo lỗi |

---

## US020_SwitchLanguage: Switch Language

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn đổi giao diện giữa tiếng Việt và English để đọc nội dung bằng ngôn ngữ mình quen.

### Acceptance Criteria

- [ ] Criterion 1: Nút ngôn ngữ ở header hiện mã ngôn ngữ hiện tại (VN hoặc EN) và mở danh sách Tiếng Việt, English; chọn lại đúng ngôn ngữ đang dùng thì không làm gì.
- [ ] Criterion 2: Chọn ngôn ngữ khác gọi `setLocaleAction`, hành động chỉ nhận `vi` hoặc `en`, ghi cookie `NEXT_LOCALE` (httpOnly, sameSite lax, 1 năm, `secure` ở production) rồi `router.refresh()` để cả trang đổi ngôn ngữ.
- [ ] Criterion 3: Giá trị ngoài danh sách không đổi cookie và hành động trả `{ ok: false }`.
- [ ] Criterion 4: Khi hành động thất bại (trả `{ ok: false }` hoặc lỗi mạng) hiện "Không thể đổi ngôn ngữ, vui lòng thử lại."; trong lúc chờ nút bị khoá.
- [ ] Criterion 5: Esc hoặc bấm ra ngoài đóng danh sách. Admin và khách dùng chung điều khiển này; khách chỉ thấy ở `/login` và `/countdown`.

### Technical Notes

- **Endpoint**: POST server action `setLocaleAction` (ROUTE036), gọi được từ `/login`, `/countdown`, mọi trang Sunner và trang admin.
- **Data Required**: `locale` (`vi` hoặc `en`); ghi cookie `NEXT_LOCALE`, không ghi DB.
- **Dependencies**: PERM012_PreferenceAndSignOutActions, PERM013_LocaleCookieSecureFlag; next-intl đọc cookie này ở request config.
- **Source**: `shared/i18n/set-locale-action.ts:18-34`, `features/app-shell/components/language-switcher.tsx:33-48`, `features/app-shell/components/public-header.tsx`, `features/app-shell/components/header-actions.tsx`.

### Screens

- SCR003: AppLayout
- SCR002: AdminLayout
- SCR001: Login
- SCR010: CountdownPrelaunch

### Background Logic

- Không có BL tương ứng: hành vi chỉ gồm một server action ghi cookie và làm mới route.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner đang xem giao diện tiếng Việt | Mở danh sách và chọn English | Cookie `NEXT_LOCALE=en` được ghi, trang làm mới và hiện tiếng Anh, nút hiện EN |
| Error Case | `setLocaleAction` trả `{ ok: false }` | Chọn English | Ngôn ngữ giữ nguyên, hiện "Không thể đổi ngôn ngữ, vui lòng thử lại." |
| Edge Case | Khách ở `/login` | Đổi sang English | Cookie được ghi mà không cần phiên, trang đăng nhập hiện tiếng Anh |

---

## US021_NavigateSunnerPages: Navigate Sunner Pages

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn mở các trang Sunner từ header, footer, menu tài khoản và dropdown chuông để đi tới đúng nội dung mình cần mà không phải gõ đường dẫn.

### Acceptance Criteria

- [ ] Criterion 1: Header có logo (về `/`) và ba link About SAA 2025 (`/`), Award Information (`/awards`), Sun* Kudos (`/kudos`); dưới `md` ba link gom vào menu di động, đóng khi chọn, bấm ngoài hoặc Esc; link của trang hiện tại mang `aria-current="page"` (khớp theo tiền tố đường dẫn).
- [ ] Criterion 2: Footer đầy đủ có logo (về `/`) và năm link: About SAA, Award Information, Sun* Kudos, Thể lệ (`/rules`), Tiêu chuẩn cộng đồng (`/community-standards`); footer của admin chỉ có dòng bản quyền.
- [ ] Criterion 3: Menu tài khoản có "Profile" mở `/profile`; admin dùng chung link này.
- [ ] Criterion 4: Dropdown chuông có "Xem tất cả" mở `/notifications` và đóng panel; dòng thông báo Kudo bị ẩn do spam có thêm link "Tiêu chuẩn cộng đồng" mở `/community-standards`, đặt trên vùng link kéo giãn của dòng nên hai link không lồng nhau.
- [ ] Criterion 5: Mọi đích đều qua `requireSunner()`: chưa có phiên thì về `/login`, chưa có đơn vị thì về trang chọn đơn vị.

### Technical Notes

- **Endpoint**: N/A (điều hướng phía client tới các trang GET `/`, `/awards`, `/kudos`, `/rules`, `/community-standards`, `/profile`, `/notifications`).
- **Data Required**: tên, avatar, cờ admin của người dùng cho menu tài khoản (`ShellUser`); bảng đường dẫn `APP_ROUTES`.
- **Dependencies**: PERM008_SunnerAreaGate. Trang SCR009 là trang tĩnh không có điều khiển riêng nên chỉ tới được qua các link ở trên (và link ở thanh công cụ composer thuộc story CreateKudo).
- **Source**: `features/app-shell/components/app-header.tsx:21-25`, `app-header-nav-links.tsx`, `mobile-nav-menu.tsx`, `app-footer.tsx:26-32`, `account-menu.tsx:61-70`, `features/notifications/components/notification-panel.tsx:77`, `notification-row.tsx:53-61`, `shared/ui/app-routes.ts`.

### Screens

- SCR003: AppLayout
- SCR003/REG001: NotificationBell
- SCR009: CommunityStandards
- SCR017: AllNotifications

### Background Logic

- Không có BL tương ứng: chỉ là link thuần, không có nhánh dữ liệu.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner đang ở `/kudos/{id}` | Bấm "Award Information" ở header | Tới `/awards`, link đó được đánh dấu trang hiện tại |
| Edge Case | Màn hình dưới `md` | Mở menu di động rồi chọn Sun* Kudos | Tới `/kudos` và menu đóng |
| Error Case | Phiên hết hạn trước khi bấm "Profile" | Bấm "Profile" | Guard đưa về `/login` |

---

## US022_ReturnHomeFromErrorPage: Return Home From Error Page

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner gặp trang lỗi 403 hoặc 404, tôi muốn quay về trang chủ bằng một cú bấm để tiếp tục làm việc thay vì bị kẹt ở trang lỗi.

### Acceptance Criteria

- [ ] Criterion 1: Trang "Không có quyền truy cập" (do `forbidden()` dựng, hoặc `/access-denied` là thân HTTP 403 mà proxy trả cho người không phải admin vào `/admin/*`) dùng chung một `ForbiddenPanel` với đúng một CTA "Về trang chủ".
- [ ] Criterion 2: Trang 404 cho người đã đăng nhập có CTA "Về trang chủ"; khách thấy CTA "Đăng nhập" (thuộc story ReturnToLoginFromNotFound).
- [ ] Criterion 3: Bấm CTA đi tới `/`.
- [ ] Criterion 4: Hai trang là trang trống không header, footer, và không bao giờ hiện chi tiết lỗi.
- [ ] Criterion 5: Sunner chưa chọn đơn vị bấm CTA vẫn bị `requireSunner()` đưa về trang chọn đơn vị.

### Technical Notes

- **Endpoint**: N/A (link tới trang GET `/`).
- **Data Required**: người dùng của phiên (`getShellUser`) để chọn CTA ở trang 404; trang 403 không đọc phiên.
- **Dependencies**: PERM003_AdminAreaProxyGate (sinh ra HTTP 403 cho `/admin/*`), PERM008_SunnerAreaGate.
- **Source**: `features/app-shell/components/forbidden-panel.tsx:9-20`, `features/app-shell/components/error-panel.tsx:42-47`, `app/not-found.tsx:7-22`, `app/forbidden.tsx`, `app/access-denied/page.tsx`.

### Screens

- SCR004: Error403
- SCR005: Error404

### Background Logic

- Không có BL tương ứng: chỉ là link thuần.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner không phải admin mở `/admin/overview` và thấy trang 403 | Bấm "Về trang chủ" | Tới `/` |
| Happy Path | Sunner đã đăng nhập mở một đường dẫn không tồn tại | Bấm "Về trang chủ" ở trang 404 | Tới `/` |
| Error Case | Phiên hết hạn trong lúc đang xem trang 403 hoặc 404 | Bấm "Về trang chủ" | Proxy đưa về `/login` thay vì vào `/` |
| Edge Case | Sunner chưa chọn đơn vị | Bấm "Về trang chủ" | Guard đưa tiếp về `/onboarding/department` |

---

## US023_BrowseNotifications: Browse Notifications

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: M

### User Story

Là một Sunner, tôi muốn xem danh sách thông báo của mình ở chuông và ở trang tất cả thông báo để biết ai vừa gửi Kudo, thả tim hay có phần thưởng mới.

### Acceptance Criteria

- [ ] Criterion 1: Chuông ở header mở và đóng panel (`aria-expanded`); Esc hoặc bấm ra ngoài đóng panel; chấm đỏ (không hiện số) sáng khi còn thông báo chưa đọc.
- [ ] Criterion 2: Mỗi lần mở panel nạp 10 thông báo mới nhất của chính mình, mới tới cũ theo `(occurred_at, id)`.
- [ ] Criterion 3: Trang `/notifications` nạp 20 dòng mỗi lần; cuộn tới cuối thì nạp tiếp 20 dòng cũ hơn theo cursor, hết trang thì dừng.
- [ ] Criterion 4: Có đủ trạng thái: khung chờ khi nạp trang đầu, "Bạn chưa có thông báo nào" khi rỗng, "Không tải được thông báo. Vui lòng thử lại." kèm nút "Thử lại"; lỗi nạp thêm có nút thử lại riêng và vẫn giữ các dòng đã có.
- [ ] Criterion 5: Có thông báo mới qua Realtime thì chấm đỏ sáng ngay và danh sách đang mở gộp trang đầu mới vào; thông báo Kudo ẩn danh chỉ hiện biệt danh, không bao giờ kèm tên người gửi.

### Technical Notes

- **Endpoint**: `GET /api/notifications?limit&cursor` (ROUTE011, `limit` 1 đến 50, mặc định 20; lỗi 401 `unauthorized`, 400 `invalid_request`); chấm đỏ đọc lại qua `GET /api/notifications/unread-count` (ROUTE012).
- **Data Required**: `NotificationPage {items, nextCursor}` chỉ của người dùng phiên; tên người gửi nối từ `profiles` khi đọc, biệt danh theo trạng thái ẩn danh hiện tại của Kudo.
- **Dependencies**: PERM032_NotificationRecipientOnly, PERM011_SessionOnlyApiGate, PERM038_NotificationsRealtimeChannelRead.
- **Source**: `features/notifications/components/notification-bell.tsx`, `notification-panel.tsx:31-61`, `notification-list.tsx:50-110`, `notification-list-page-client.tsx`, `features/notifications/hooks/use-notification-list.ts`, `features/notifications/server/notification-query.ts`, `app/api/notifications/route.ts`, `app/(app)/notifications/page.tsx`.

### Screens

- SCR003/REG001: NotificationBell
- SCR017: AllNotifications

### Background Logic

- BL002_NotificationChannelListener: nghe kênh Realtime riêng `notifications:{userId}` để bật chấm đỏ và gộp trang đầu
- BL010_SupabaseBrowserClient: client trình duyệt dùng cho kênh Realtime
- BL024_NotificationsPublishSignal: trigger phát tín hiệu khi có thông báo mới

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner có 14 thông báo, 3 chưa đọc | Bấm chuông | Panel mở với 10 dòng mới nhất, chấm đỏ đang sáng |
| Happy Path | Sunner có 45 thông báo | Mở `/notifications` và cuộn xuống cuối hai lần | Hiện 20, rồi 40, rồi 45 dòng, sau đó không nạp thêm |
| Error Case | `GET /api/notifications` trả 500 khi mở panel | Mở chuông | Panel hiện "Không tải được thông báo. Vui lòng thử lại." với nút "Thử lại"; bấm nút nạp lại danh sách |
| Edge Case | Một thông báo mới tới khi panel đang mở | Tín hiệu Realtime đến | Chấm đỏ sáng, trang đầu được nạp lại và gộp vào, các dòng đang xem giữ nguyên |

---

## US024_OpenNotification: Open Notification

**Type**: ui
**Interaction**: primary-action
**Priority**: P2
**Estimate**: M

### User Story

Là một Sunner, tôi muốn bấm vào một thông báo để đi tới Kudo hoặc trang liên quan và đồng thời thông báo đó được đánh dấu đã đọc.

### Acceptance Criteria

- [ ] Criterion 1: Cả dòng thông báo là một link; bấm vào đánh dấu dòng đã đọc ngay (không chờ server) rồi đi tới `href` của dòng; ở panel, panel đóng lại.
- [ ] Criterion 2: Đích theo loại: `kudo_received`, `heart_received`, `kudo_hidden_spam` tới `/kudos/{kudoId}`; `secret_box_granted` tới `/kudos?secretBox=open`; `hero_tier_up`, `icon_set_completed` tới `/profile`; `national_kudos` tới Kudo xếp hạng cao nhất trong thông báo.
- [ ] Criterion 3: Đánh dấu đọc chỉ một chiều và chỉ cho thông báo của chính mình: lệnh UPDATE lọc `recipient_id = phiên` và `read_at IS NULL`, nên mở lại hay mở ở hai tab vẫn giữ `read_at` đầu tiên; dòng đã đọc bấm lại không gọi server.
- [ ] Criterion 4: Nếu server từ chối hoặc lỗi (id không phải của mình, lỗi bất ngờ) dòng trở lại trạng thái chưa đọc, nhưng việc đi tới `href` vẫn diễn ra.
- [ ] Criterion 5: Sau khi server xác nhận, chuông đọc lại số chưa đọc và danh sách ở panel hoặc trang khác tải lại để khớp trạng thái.

### Technical Notes

- **Endpoint**: POST server action `markNotificationRead` (ROUTE033), trả `{ ok: true, unread }` hoặc `{ ok: false, code: "not_found" | "unexpected" }`.
- **Data Required**: `id` (uuid) của thông báo; ghi `notifications.read_at`; người nhận lấy từ phiên.
- **Dependencies**: PERM032_NotificationRecipientOnly, PERM008_SunnerAreaGate (`requireSunner()` trong action).
- **Source**: `features/notifications/server/notification-actions.ts:15-26`, `notification-read-state.ts:14-24`, `notification-view-mapper.ts:43-57`, `components/notification-row.tsx:27-69`, `hooks/use-notification-list.ts:138-148`.

### Screens

- SCR003/REG001: NotificationBell
- SCR017: AllNotifications

### Background Logic

- Không có BL tương ứng: đây là server action đồng bộ, không có tiến trình nền.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có thông báo `kudo_received` chưa đọc cho Kudo X | Bấm dòng đó trong panel | Dòng thành đã đọc, panel đóng, trình duyệt tới `/kudos/X`, `read_at` được ghi |
| Happy Path | Có thông báo `secret_box_granted` chưa đọc | Bấm dòng đó | Tới `/kudos?secretBox=open` |
| Error Case | `markNotificationRead` trả `{ ok: false }` | Bấm một dòng chưa đọc | Dòng trở lại chưa đọc, trình duyệt vẫn tới đích |
| Edge Case | Thông báo đã được đọc ở tab khác | Bấm dòng ở tab này | `read_at` giữ giá trị đầu tiên, vẫn tới đích |

---

## US025_MarkAllNotificationsRead: Mark All Notifications Read

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn đánh dấu đọc tất cả thông báo bằng một lần bấm để xoá chấm đỏ mà không phải mở từng dòng.

### Acceptance Criteria

- [ ] Criterion 1: Panel có nút biểu tượng "Đánh dấu đọc tất cả" cạnh "Xem tất cả"; trang `/notifications` có nút cùng tên (biểu tượng kèm chữ) ở hàng tiêu đề.
- [ ] Criterion 2: Bấm nút đánh dấu mọi dòng đang hiện là đã đọc ngay và tắt chấm đỏ; server đánh dấu toàn bộ thông báo chưa đọc của người dùng, kể cả dòng chưa nạp.
- [ ] Criterion 3: Chỉ đánh dấu thông báo của người dùng phiên; thông báo tới sau lệnh này vẫn là chưa đọc; trong lúc chờ nút `aria-disabled`.
- [ ] Criterion 4: Nếu server trả lỗi, các dòng vừa đánh dấu trở lại chưa đọc.
- [ ] Criterion 5: Panel, trang `/notifications` và chuông đồng bộ qua sự kiện nội bộ: đánh dấu ở nơi này thì nơi kia tải lại trạng thái.

### Technical Notes

- **Endpoint**: POST server action `markAllNotificationsRead` (ROUTE034), trả `{ ok: true, updated, unread }` hoặc `{ ok: false, code: "unexpected" }`.
- **Data Required**: không có đầu vào; ghi `notifications.read_at` cho mọi dòng `recipient_id = phiên` và `read_at IS NULL`.
- **Dependencies**: PERM032_NotificationRecipientOnly, PERM008_SunnerAreaGate.
- **Source**: `features/notifications/server/notification-actions.ts:28-37`, `notification-read-state.ts:27-35`, `components/notification-panel.tsx:54-61,80-89`, `components/notification-list-page-client.tsx:37-55`, `hooks/use-notification-list.ts:151-158`.

### Screens

- SCR003/REG001: NotificationBell
- SCR017: AllNotifications

### Background Logic

- Không có BL tương ứng: đây là server action đồng bộ.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner có 30 thông báo chưa đọc, panel hiện 10 | Bấm "Đánh dấu đọc tất cả" | 10 dòng hiện thành đã đọc, chấm đỏ tắt, cả 30 dòng có `read_at` |
| Error Case | `markAllNotificationsRead` trả `{ ok: false }` | Bấm nút | Các dòng trở lại chưa đọc, chấm đỏ vẫn sáng |
| Edge Case | Một thông báo mới tới ngay sau khi bấm | Tín hiệu Realtime đến | Thông báo mới vẫn chưa đọc và chấm đỏ sáng lại |

---

## US026_CreateKudo: Create Kudo

**Type**: ui
**Interaction**: primary-action
**Priority**: P0
**Estimate**: L

### User Story

Là một Sunner, tôi muốn viết và gửi một Kudo cảm ơn đồng đội để ghi nhận đóng góp của họ và để lời nhắn hiện trên Live board.

### Acceptance Criteria

- [ ] Criterion 1: Ô "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" trên Live board mở modal viết Kudo; từ `EVENT_END_AT` ô bị khoá và hiện "Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa."
- [ ] Criterion 2: Form gồm Người nhận (chọn từ ô tìm, không chọn được chính mình), Danh hiệu (tùy chọn, tối đa 50 ký tự), Lời nhắn (Markdown 1 đến 1000 ký tự, thanh công cụ in đậm, nghiêng, gạch ngang, danh sách số, link, trích dẫn; link chỉ http hoặc https; không chèn ảnh vào nội dung; gõ `@` gợi ý tên để gắn mention), Hashtag (1 đến 5 hashtag đang hoạt động) và tùy chọn gửi ẩn danh kèm biệt danh 1 đến 30 ký tự, bắt buộc khi ẩn danh.
- [ ] Criterion 3: Thanh công cụ có link "Tiêu chuẩn cộng đồng" mở ở tab mới nên không mất bản nháp.
- [ ] Criterion 4: Bấm Gửi: trình duyệt kiểm bằng cùng schema Zod với server; thiếu Người nhận, Lời nhắn hoặc Hashtag thì hiện "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" kèm lỗi theo trường; bấm đúp chỉ gửi một lần.
- [ ] Criterion 5: Server (`createKudo`) lấy người gửi từ phiên, kiểm cửa sổ ghi và schema, từ chối tự gửi (`SELF_SEND`), rồi ghi Kudo (`status` mặc định `public`), hashtag, ảnh và dòng outbox `KudoCreated` trong một giao dịch; thành công thì modal đóng, hiện toast "Đã gửi Kudo thành công!" và feed làm mới.
- [ ] Criterion 6: Hủy hoặc Esc khi đã nhập dở thì hỏi xác nhận bỏ nội dung ("Tiếp tục soạn" là lựa chọn an toàn); bấm lớp phủ không đóng modal; đang gửi thì không đóng được.

### Technical Notes

- **Endpoint**: POST server action `createKudo` (ROUTE023); ô nhập gọi thêm `GET /api/sunners/search` (ROUTE018, người nhận và mention) và `GET /api/hashtags` (ROUTE013).
- **Data Required**: `recipientId` (uuid), `title?`, `body`, `hashtagIds[]`, `imagePaths[]` (tối đa 5, lấy từ story AttachKudoImage), `isAnonymous`, `anonymousNickname`; kết quả `{ ok, id }` hoặc mã `MISSING_REQUIRED`, `VALIDATION`, `SELF_SEND`, `RECIPIENT_INVALID`, `HASHTAG_INVALID`, `IMAGE_INVALID`, `WRITING_CLOSED`, `UNEXPECTED`.
- **Dependencies**: PERM022_EventWritingWindow, PERM023_KudoCreate, PERM028_AnonymousSenderMask, PERM010_ApiSunnerGate (hai route phụ trợ).
- **Source**: `features/kudos-authoring/server/create-kudo-action.ts:19-39`, `server/kudo-write-repository.ts:56-66`, `schemas/kudo-input-schema.ts`, `kudo-authoring-limits.ts`, `components/kudo-composer-launcher.tsx`, `kudo-composer-modal.tsx`, `kudo-composer-dialog.tsx`, `kudo-composer-form.tsx`, `use-kudo-composer-submit.ts`, `kudo-message-toolbar.tsx`, `anonymous-sender-field.tsx`, `hashtag-picker.tsx`, `recipient-picker.tsx`, `app/(app)/kudos/page.tsx:62-66`.

### Screens

- SCR007/REG001: KudoComposer

### Background Logic

- BL023_SpotlightPublishKudoEvent: trigger đẩy Kudo mới lên kênh `spotlight`
- BL026_NotificationOutboxDrain: consumer đọc sự kiện `KudoCreated` từ outbox
- BL015_NotificationEventContextLoad: nạp lại người gửi, người nhận và trạng thái Kudo trước khi phát thông báo
- BL014_HeroTierUpDetection: quyết định có thông báo lên bậc Hero cho người nhận
- BL016_EventToNotificationMapping: ánh xạ `KudoCreated` thành thông báo `kudo_received`
- BL017_NotificationWrite: ghi thông báo cho người nhận
- BL024_NotificationsPublishSignal: phát tín hiệu Realtime để chuông của người nhận sáng

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Cửa sổ ghi còn mở, Sunner A chọn Sunner B, nhập lời nhắn và một hashtag | Bấm Gửi | Kudo `public` cùng dòng outbox `KudoCreated` được ghi trong một giao dịch, modal đóng, hiện toast, feed làm mới |
| Error Case | Form chưa chọn hashtag | Bấm Gửi | Hiện banner thiếu thông tin và lỗi trường Hashtag, không gọi server |
| Error Case | Modal mở từ trước nhưng đã qua `EVENT_END_AT` | Bấm Gửi | Server trả `WRITING_CLOSED`, không ghi gì, modal ở lại với thông báo |
| Edge Case | Bật ẩn danh nhưng để trống biệt danh | Bấm Gửi | Lỗi trường biệt danh, không gửi |

---

## US027_AttachKudoImage: Attach Kudo Image

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: L

### User Story

Là một Sunner đang viết hoặc sửa Kudo, tôi muốn đính kèm ảnh vào Kudo để lời cảm ơn có thêm hình ảnh minh hoạ.

### Acceptance Criteria

- [ ] Criterion 1: Hàng "Image" có nút "+ Image / Tối đa 5" chọn được nhiều tệp một lần; chỉ nhận jpeg, png, webp từ 1 byte đến 5 MB; nút khoá khi đã đủ 5 ảnh, tệp thừa bị bỏ và hiện lỗi vượt số ảnh.
- [ ] Criterion 2: Với mỗi tệp hợp lệ, trình duyệt xin vé ký ở `POST /api/kudos/images/sign` rồi tải thẳng lên Storage bằng token đó; thumbnail 80×80 hiện vòng chờ rồi chuyển sang xong, thứ tự hiển thị là vị trí 0 đến 4.
- [ ] Criterion 3: Tệp sai loại hoặc quá cỡ hiện thumbnail lỗi, không có nút thử lại; lỗi mạng, `UPLOAD_LIMIT` hoặc `WRITING_CLOSED` hiện lỗi kèm nút thử lại; mỗi ảnh gỡ được bằng nút xoá.
- [ ] Criterion 4: Bấm Gửi hoặc Lưu bị chặn khi còn ảnh đang tải ("Vui lòng chờ ảnh tải lên xong.") hoặc còn ảnh lỗi ("Có ảnh chưa tải lên được. Hãy thử lại hoặc gỡ ảnh đó.").
- [ ] Criterion 5: Mỗi Sunner tối đa 20 vé chưa gắn trong 24 giờ (quá thì 429 `UPLOAD_LIMIT`); đường dẫn ký có dạng `kudos/{uuid}.{ext}` không chứa id người gửi; khi ghi Kudo, server chỉ nhận đường dẫn do chính người đó xin và object đã tồn tại.

### Technical Notes

- **Endpoint**: `POST /api/kudos/images/sign` (ROUTE010), body JSON `{ contentType, size }` tối đa 4 KB, trả `{ path, token, signedUrl }`; lỗi 401, 403 `WRITING_CLOSED`, 400 `VALIDATION`, 413, 429.
- **Data Required**: tệp ảnh (type, size), vé `{ path, token, signedUrl }`; ghi `kudo_image_uploads`, đối tượng trong bucket riêng `kudo-images`; `imagePaths[]` đi cùng lần gửi Kudo.
- **Dependencies**: PERM024_KudoImageUploadSigning, PERM022_EventWritingWindow, PERM036_KudoImageStorageAccess. Ảnh bị gỡ sau khi đã tải lên để lại đối tượng mồ côi trong Storage (rủi ro đã chấp nhận, ghi trong mã).
- **Source**: `features/kudos-authoring/components/kudo-image-picker.tsx`, `kudo-image-thumbnail.tsx`, `use-kudo-image-uploads.ts:36-91`, `kudo-image-upload-client.ts:34-58`, `server/kudo-image-upload-service.ts:19-92`, `app/api/kudos/images/sign/route.ts:18-37`.

### Screens

- SCR007/REG001: KudoComposer
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- BL006_KudoImageBrowserUpload: tải ảnh từ trình duyệt lên Storage bằng token đã ký
- BL008_KudoImageUploadSigning: cấp vé ký và ghi người xin vé

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Composer đang mở, chưa có ảnh | Chọn hai ảnh PNG 1 MB | Hai thumbnail chuyển từ vòng chờ sang xong, hai đường dẫn nằm trong `imagePaths` khi gửi |
| Error Case | Chọn một tệp GIF | Chọn tệp | Thumbnail lỗi "sai định dạng", không có nút thử lại, gửi bị chặn tới khi gỡ ảnh |
| Error Case | Sunner đã có 20 vé chưa gắn trong 24 giờ | Chọn thêm một ảnh | Sign trả 429, thumbnail lỗi có nút thử lại |
| Edge Case | Composer có 4 ảnh | Chọn 3 ảnh một lúc | Nhận 1 ảnh, bỏ 2, hiện lỗi vượt số ảnh, nút thêm ảnh khoá |

---

## US028_EditKudo: Edit Kudo

**Type**: ui
**Interaction**: primary-action
**Priority**: P1
**Estimate**: L

### User Story

Là một Sunner đã gửi Kudo, tôi muốn sửa nội dung Kudo của mình để chỉnh lại lời nhắn hoặc thông tin sau khi gửi.

### Acceptance Criteria

- [ ] Criterion 1: Bút sửa ở dòng tiêu đề thẻ chỉ hiện khi người xem là chủ Kudo, Kudo không bị spam và cửa sổ ghi còn mở (chủ của Kudo ẩn danh vẫn thấy bút).
- [ ] Criterion 2: Bấm bút mở composer chế độ sửa, nạp dữ liệu qua `GET /api/kudos/{id}/edit`: người nhận bị khoá, kèm Danh hiệu, Lời nhắn, hashtag, ảnh (URL xem trước ký trong 10 phút), trạng thái ẩn danh và biệt danh.
- [ ] Criterion 3: Sửa được mọi trường trừ người nhận (gửi kèm người nhận bị từ chối `recipientImmutable`); "Lưu" gọi `updateKudo` thay trọn bộ hashtag và ảnh, giữ nguyên `created_at`, số tim và `status`, không phát sự kiện outbox; thành công thì modal đóng và hiện toast "Đã lưu thay đổi."
- [ ] Criterion 4: Chỉ chủ và Kudo còn `public` mới lưu được, kiểm trong một lệnh UPDATE có điều kiện nên nếu admin vừa đánh dấu spam thì trả `SPAM_LOCKED`; người khác nhận `FORBIDDEN` ("Bạn không có quyền sửa Kudo này."), id lạ nhận `NOT_FOUND`, đều không lộ nội dung; Kudo spam của chủ mở ra ở chế độ chỉ đọc kèm thông báo khoá, không có nút Lưu.
- [ ] Criterion 5: Sau `EVENT_END_AT` bút ẩn và server trả `WRITING_CLOSED` khi lưu; Hủy khi có thay đổi hỏi xác nhận như lúc tạo.

### Technical Notes

- **Endpoint**: `GET /api/kudos/{id}/edit` (ROUTE009) nạp dữ liệu điền sẵn; POST server action `updateKudo` (ROUTE024) lưu.
- **Data Required**: `kudoId` (uuid) và các trường giống story CreateKudo trừ `recipientId`; `KudoEditPrefill` có cờ `locked` cho Kudo không còn `public`; ghi `kudos`, `kudo_hashtags`, `kudo_images`.
- **Dependencies**: PERM025_KudoOwnerEdit, PERM026_KudoEditButtonVisibility, PERM022_EventWritingWindow, PERM029_SpamKudoVisibility.
- **Source**: `features/kudos-feed/components/kudo-owner-edit-button.tsx`, `kudo-card-can-edit.ts:6-8`, `kudo-card.tsx:36,53`, `features/kudos-authoring/components/kudo-composer-edit-loader.tsx`, `server/kudo-edit-query.ts:33-76`, `server/update-kudo-action.ts:18-32`, `server/kudo-write-repository.ts:74-88`, `app/api/kudos/[id]/edit/route.ts`.

### Screens

- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR016: OwnProfile

### Background Logic

- BL007_KudoImagePreviewSigning: ký URL xem trước cho ảnh đã gắn khi mở chế độ sửa
- BL006_KudoImageBrowserUpload: tải ảnh mới thêm khi sửa
- BL008_KudoImageUploadSigning: cấp vé ký cho ảnh mới thêm

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner A xem Kudo `public` của mình trong ALL KUDOS, cửa sổ ghi còn mở | Bấm bút, đổi Lời nhắn rồi Lưu | Nội dung cập nhật, `created_at` và số tim giữ nguyên, hiện "Đã lưu thay đổi." |
| Error Case | Admin đánh dấu Kudo là spam trong lúc composer đang mở | Bấm Lưu | Server trả `SPAM_LOCKED`, composer hiện thông báo khoá, không ghi gì |
| Error Case | Sunner B gọi `GET /api/kudos/{id}/edit` của Kudo thuộc A | Mở composer bằng id đó | Nhận `FORBIDDEN`, chỉ hiện thông báo, không có nội dung Kudo |
| Edge Case | Sunner A mở composer sửa nhưng đã qua `EVENT_END_AT` | Bấm Lưu | Server trả `WRITING_CLOSED`, không ghi gì |

---

## US029_SendKudoToSunner: Send Kudo To Sunner

**Type**: ui
**Interaction**: primary-action
**Priority**: P1
**Estimate**: M

### User Story

Là một Sunner đang xem hồ sơ hoặc thẻ của một đồng nghiệp, tôi muốn gửi Kudo thẳng cho người đó để khỏi phải tìm lại người nhận trong form.

### Acceptance Criteria

- [ ] Criterion 1: Trên hồ sơ người khác, nút "Gửi lời cảm ơn và ghi nhận tới {tên}" mở composer chế độ tạo; hết cửa sổ ghi thì nút khoá và hiện thông báo kết thúc sự kiện.
- [ ] Criterion 2: Ở thẻ Kudo, rê chuột vào avatar (sau 300 ms) hoặc focus bàn phím vào tên người có tên mở thẻ tóm tắt; nút "Gửi KUDO" trong thẻ chỉ hiện khi `canSendKudo` (còn cửa sổ ghi và không phải thẻ của chính mình); trên màn hình cảm ứng chạm avatar chỉ mở hồ sơ, không mở thẻ; người gửi ẩn danh không có thẻ.
- [ ] Criterion 3: Composer mở với người nhận đã điền và khoá (chỉ hiện tên, gửi theo id), các trường còn lại và luật gửi giống story CreateKudo.
- [ ] Criterion 4: Gửi thành công thì hiện toast "Đã gửi Kudo thành công!", modal đóng và bộ nhớ đệm thẻ tóm tắt của người nhận bị xoá để lần mở sau hiện số Kudo mới; Hủy thì trang đang xem giữ nguyên.
- [ ] Criterion 5: Server vẫn từ chối tự gửi (`SELF_SEND`, 422) và ngoài cửa sổ ghi (`WRITING_CLOSED`) dù giao diện đã ẩn nút.

### Technical Notes

- **Endpoint**: POST server action `createKudo` (ROUTE023, dùng chung với story CreateKudo); thẻ tóm tắt nạp qua `GET /api/sunners/{userId}/card` (ROUTE019).
- **Data Required**: `recipientId` lấy từ hồ sơ hoặc thẻ (`{ id, fullName }`), các trường còn lại như story CreateKudo; thẻ tóm tắt chỉ có `id`, `fullName`, `departmentName`, `heroTier`, `kudosReceived`, `kudosSent`, `canSendKudo`.
- **Dependencies**: PERM023_KudoCreate, PERM022_EventWritingWindow, PERM031_SunnerCardFieldWhitelist; trang `/profile/{id}` của chính mình tự chuyển về `/profile` nên nút này không xuất hiện trên hồ sơ của mình.
- **Source**: `features/profile/components/profile-send-kudo-button.tsx:21-51`, `avatar-hover-card.tsx:47-172`, `sunner-card-content.tsx:96-105`, `locked-recipient-composer.tsx:22-35`, `features/profile/server/sunner-card-query.ts:31`, `features/kudos-authoring/components/kudo-composer-modal.tsx`, `app/(app)/profile/[userId]/page.tsx:27-40`.

### Screens

- SCR015: OtherProfile
- SCR006: KudoDetail
- SCR007/REG005: AllKudosFeed
- SCR016: OwnProfile

### Background Logic

- BL023_SpotlightPublishKudoEvent: trigger đẩy Kudo mới lên kênh `spotlight`
- BL026_NotificationOutboxDrain: consumer đọc sự kiện `KudoCreated` từ outbox
- BL015_NotificationEventContextLoad: nạp lại người gửi, người nhận và trạng thái Kudo trước khi phát thông báo
- BL014_HeroTierUpDetection: quyết định có thông báo lên bậc Hero cho người nhận
- BL016_EventToNotificationMapping: ánh xạ `KudoCreated` thành thông báo `kudo_received`
- BL017_NotificationWrite: ghi thông báo cho người nhận
- BL024_NotificationsPublishSignal: phát tín hiệu Realtime để chuông của người nhận sáng

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner A mở hồ sơ của B, cửa sổ ghi còn mở | Bấm nút gửi, nhập lời nhắn, chọn hashtag rồi Gửi | Composer mở với B bị khoá, Kudo tới B được tạo, hiện toast, hồ sơ giữ nguyên |
| Happy Path | Sunner A rê chuột vào avatar của B trên một thẻ Kudo | Bấm "Gửi KUDO" trong thẻ | Thẻ đóng, composer mở với B bị khoá |
| Edge Case | Thẻ tóm tắt của chính A | Mở thẻ | Không có nút "Gửi KUDO" |
| Error Case | Đã qua `EVENT_END_AT` | Mở hồ sơ của B | Nút gửi khoá kèm thông báo kết thúc sự kiện |

---

## US030_SearchSunnerProfile: Search Sunner Profile

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn tìm một đồng nghiệp theo tên hoặc email ngay trên Live board để mở nhanh hồ sơ của người đó.

### Acceptance Criteria

- [ ] Criterion 1: Ô "Tìm kiếm profile Sunner" cạnh ô viết Kudo là một combobox: gõ thì đợi 250 ms rồi gọi tìm, từ khoá tối đa 50 ký tự, tối đa 10 kết quả xếp theo tên.
- [ ] Criterion 2: Tên khớp không phân biệt hoa thường và dấu (chứa chuỗi gõ), email khớp theo tiền tố; `%`, `_`, `\` được hiểu là chữ thường, không phải ký tự đại diện.
- [ ] Criterion 3: Chọn kết quả bằng chuột hoặc ↑, ↓, Enter mở `/profile/{id}`; chọn chính mình thì trang chuyển tiếp về `/profile`; Esc đóng danh sách và Enter không gửi form nào.
- [ ] Criterion 4: Ô này không loại chính mình khỏi kết quả (`excludeSelf=false`), khác với ô chọn người nhận của composer.
- [ ] Criterion 5: Có đủ trạng thái: "Đang tìm…", "Không tìm thấy Sunner phù hợp.", "Không tìm được, vui lòng thử lại.", và "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." khi API trả 401.

### Technical Notes

- **Endpoint**: `GET /api/sunners/search?q&limit&excludeSelf` (ROUTE018), trả `SunnerOption[]`; lỗi 401, 403 `ONBOARDING_REQUIRED`, 400 `VALIDATION`, 500.
- **Data Required**: `q` (1 đến 50 ký tự sau khi cắt khoảng trắng), `limit` (1 đến 20, mặc định 10), `excludeSelf`; đọc `profiles` nối `departments`.
- **Dependencies**: PERM010_ApiSunnerGate, PERM031_SunnerCardFieldWhitelist; dùng chung combobox với ô chọn người nhận.
- **Source**: `features/kudos-feed/components/sunner-profile-search.tsx:17-46`, `features/sunner-search/components/sunner-search-combobox.tsx:34-137`, `use-sunner-search.ts:22-54`, `schemas/sunner-search-params-schema.ts`, `server/sunner-search-query.ts:56-67`, `app/api/sunners/search/route.ts:12-26`.

### Screens

- SCR007/REG002: SunnerProfileSearch

### Background Logic

- Không có BL tương ứng: chỉ là một lần đọc đồng bộ qua route handler.

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có Sunner tên "Nguyễn Văn An" | Gõ "van an" rồi chọn kết quả | Danh sách hiện sau 250 ms, trình duyệt tới `/profile/{id}` của người đó |
| Error Case | `GET /api/sunners/search` trả 500 | Gõ một từ khoá | Hiện "Không tìm được, vui lòng thử lại." |
| Error Case | Phiên đã hết hạn | Gõ một từ khoá | API trả 401, hiện "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." |
| Edge Case | Sunner gõ tên của chính mình | Chọn kết quả | Mở `/profile/{id của mình}` rồi chuyển về `/profile` |

---

## US031_BrowseHighlightKudos: Browse Highlight Kudos

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: M

### User Story

Là một Sunner, tôi muốn lọc và lướt các Kudo nổi bật trong khối HIGHLIGHT KUDOS để xem những lời cảm ơn được thả tim nhiều nhất theo hashtag và phòng ban.

### Acceptance Criteria

- [ ] Criterion 1: Khối HIGHLIGHT KUDOS hiện tối đa 5 Kudo `public` xếp theo số tim giảm dần, rồi mới nhất; kết quả "Tất cả" do server dựng sẵn khi vào trang.
- [ ] Criterion 2: Hai dropdown Hashtag và Phòng ban chọn một giá trị, mục "Tất cả" bỏ lọc; hai bộ lọc kết hợp bằng AND và phòng ban là phòng ban của người nhận.
- [ ] Criterion 3: Mỗi lần đổi bộ lọc gọi lại `GET /api/kudos/highlight`, huỷ yêu cầu cũ nếu còn chạy và đưa carousel về thẻ đầu khi kết quả mới về.
- [ ] Criterion 4: Carousel chuyển thẻ bằng mũi tên trái phải (từ `md`), nút pager, phím ← →; chỉ thẻ giữa tương tác được; nút ở hai đầu `aria-disabled`; chỉ số "n/N" cập nhật. Việc chuyển thẻ chỉ ở phía client giữa các thẻ đã nạp.
- [ ] Criterion 5: Không có Kudo phù hợp hiện "Chưa có Kudo nào phù hợp." mà bộ lọc vẫn dùng được; nạp lỗi hiện thông báo riêng của khối này kèm "Thử lại".

### Technical Notes

- **Endpoint**: `GET /api/kudos/highlight?hashtag&department` (ROUTE008), trả `{ items, total }` tối đa 5; lỗi 401, 403 `ONBOARDING_REQUIRED`, 400 `VALIDATION`, 500.
- **Data Required**: `hashtag` và `department` (uuid, vắng mặt nghĩa là "Tất cả"); `KudoCardView[]` đã che người gửi ẩn danh; chỉ Kudo `public`.
- **Dependencies**: PERM010_ApiSunnerGate, PERM028_AnonymousSenderMask, PERM029_SpamKudoVisibility.
- **Source**: `features/kudos-feed/components/highlight-section.tsx`, `highlight-filter-dropdown.tsx`, `highlight-carousel.tsx:36-111`, `use-highlight-kudos.ts:18-72`, `server/kudo-highlight-query.ts:21-33`, `server/enrich-heart-summary.ts`, `app/api/kudos/highlight/route.ts`, `app/(app)/kudos/page.tsx:47-71`.

### Screens

- SCR007/REG003: HighlightKudos

### Background Logic

- BL009_KudoImageReadSigning: ký URL đọc ảnh khi dựng thẻ Kudo của khối này

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có hơn 5 Kudo `public` trong hashtag X | Chọn hashtag X ở dropdown | Hiện 5 Kudo nhiều tim nhất của X, carousel về thẻ 1/5 |
| Happy Path | Carousel đang ở thẻ 2/5 | Bấm phím → | Chuyển sang thẻ 3/5 mà không gọi server |
| Error Case | `GET /api/kudos/highlight` trả 500 | Đổi bộ lọc | Khối hiện thông báo lỗi với "Thử lại"; bấm nút gọi lại với bộ lọc đang chọn |
| Edge Case | Hashtag và phòng ban đã chọn không có Kudo nào | Áp bộ lọc | Hiện "Chưa có Kudo nào phù hợp.", hai dropdown vẫn dùng được |

---

## US032_LoadMoreKudos: Load More Kudos

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: M

### User Story

Là một Sunner, tôi muốn tải thêm các Kudo cũ hơn trong danh sách ALL KUDOS để xem lại những lời cảm ơn đã đăng trước đó.

### Acceptance Criteria

- [ ] Criterion 1: Trang đầu 10 Kudo `public`, mới nhất trước, do server dựng sẵn; nút "Tải thêm" nối trang kế (10 Kudo) theo cursor và biến mất khi không còn `nextCursor`.
- [ ] Criterion 2: Trong lúc nạp nút `aria-disabled`, `aria-busy` và có vòng chờ; bấm lúc đang nạp không gửi thêm yêu cầu.
- [ ] Criterion 3: Sau khi nối, tiêu điểm chuyển tới thẻ mới đầu tiên và vùng trạng thái đọc "Đã tải thêm {count} Kudo"; thẻ trùng id giữa các trang chỉ giữ một.
- [ ] Criterion 4: Nạp lỗi hiện "Không tải được Kudos. Vui lòng thử lại." kèm nút "Thử lại" gọi lại cùng endpoint; cursor bị từ chối (400) thì danh sách quay về trang đầu; 401 hiện thông báo phiên hết hạn kèm link đăng nhập.
- [ ] Criterion 5: Người gửi ẩn danh luôn bị che trong mọi trang; Kudo spam không bao giờ có trong danh sách này.

### Technical Notes

- **Endpoint**: `GET /api/kudos?cursor` (ROUTE007), trả `{ items, nextCursor? }`, 10 Kudo mỗi trang; lỗi 401 `UNAUTHENTICATED`, 403 `ONBOARDING_REQUIRED`, 400 `VALIDATION`, 500; `Cache-Control: private, no-store`.
- **Data Required**: `cursor` (chuỗi mờ, tối đa 200 ký tự, mã hoá `(created_at, id)`); `KudoCardView[]` đã che người gửi ẩn danh, kèm `isOwner`, `heartCount`, `heartedByMe`.
- **Dependencies**: PERM010_ApiSunnerGate, PERM028_AnonymousSenderMask, PERM029_SpamKudoVisibility.
- **Source**: `features/kudos-feed/components/all-kudos-feed.tsx:33-121`, `kudo-feed-status-message.tsx`, `server/kudo-public-query.ts:64-82`, `server/kudo-feed-cursor.ts`, `schemas/kudo-feed-params-schema.ts`, `app/api/kudos/route.ts:13-37`.

### Screens

- SCR007/REG005: AllKudosFeed

### Background Logic

- BL009_KudoImageReadSigning: ký URL đọc ảnh cho mỗi trang thẻ Kudo được nạp

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Có 25 Kudo `public`, trang đầu hiện 10 | Bấm "Tải thêm" hai lần | Hiện 20 rồi 25 Kudo, nút biến mất, tiêu điểm nằm ở thẻ mới đầu tiên |
| Error Case | `GET /api/kudos` trả 500 | Bấm "Tải thêm" | Hiện "Không tải được Kudos. Vui lòng thử lại." với "Thử lại"; bấm nút nạp lại cùng cursor |
| Error Case | Cursor đã hết hiệu lực nên API trả 400 | Bấm "Tải thêm" | Danh sách quay về trang đầu và hiện thông báo lỗi |
| Edge Case | Một Kudo mới làm trang bị lệch khi nối | Nối trang kế | Kudo trùng id chỉ hiện một lần |

---

## US033_OpenKudoDetail: Open Kudo Detail

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn mở trang chi tiết của một Kudo để đọc trọn lời nhắn, xem hết ảnh và hashtag của Kudo đó.

### Acceptance Criteria

- [ ] Criterion 1: Nút "Xem chi tiết" trên mọi thẻ Kudo (HIGHLIGHT KUDOS, ALL KUDOS, danh sách trên hồ sơ của mình và của người khác) mở `/kudos/{id}`.
- [ ] Criterion 2: Trang chi tiết hiện đủ lời nhắn không cắt dòng, mọi ảnh (mỗi ảnh mở tệp đầy đủ ở tab mới), mọi hashtag, tim, Copy Link và nút "Đóng" về Live board; người gửi ẩn danh vẫn bị che.
- [ ] Criterion 3: Id sai định dạng, id không tồn tại và Kudo spam của người khác cùng cho một kết quả "Kudo này không tồn tại hoặc đã bị gỡ." kèm nút "Quay lại Live board", để không dò được Kudo có tồn tại hay không.
- [ ] Criterion 4: Kudo spam của chính người xem mở được ở chế độ chỉ đọc: có thẻ Spam và lớp phủ mờ, không có tim, Copy Link, ảnh không mở được; chỉ "Đóng" còn dùng được.
- [ ] Criterion 5: Khi đọc lỗi trang hiện "Không tải được Kudo. Vui lòng thử lại." kèm link "Thử lại" mở lại đúng URL đó bằng lần tải trang mới.

### Technical Notes

- **Endpoint**: `GET /kudos/{id}` (trang RSC, đọc `KudoPublicQuery.findForViewer`); không có route JSON riêng.
- **Data Required**: `id` (uuid) và Sunner xem; `KudoCardView` đủ ảnh, hashtag, trạng thái spam của chính người xem, cửa sổ ghi.
- **Dependencies**: PERM008_SunnerAreaGate, PERM029_SpamKudoVisibility, PERM028_AnonymousSenderMask. Nút "Quay lại Live board" và nút "Đóng" thuộc story OpenKudosBoard.
- **Source**: `features/kudos-feed/components/kudo-card.tsx:76-79`, `kudo-detail-view.tsx:26-68`, `server/kudo-public-query.ts:84-100`, `app/(app)/kudos/[id]/page.tsx:27-65`, `app/(app)/kudos/[id]/not-found.tsx`.

### Screens

- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile
- SCR006: KudoDetail

### Background Logic

- BL009_KudoImageReadSigning: ký URL đọc ảnh khi dựng trang chi tiết

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner xem một thẻ Kudo `public` trong ALL KUDOS | Bấm "Xem chi tiết" | Tới `/kudos/{id}` hiện đủ lời nhắn, ảnh, hashtag, tim |
| Error Case | Kudo bị đánh dấu spam, người xem không phải người gửi | Mở `/kudos/{id}` | Hiện "Kudo này không tồn tại hoặc đã bị gỡ." giống hệt trường hợp id không tồn tại |
| Error Case | Đọc DB lỗi khi dựng trang chi tiết | Mở `/kudos/{id}` | Hiện "Không tải được Kudo. Vui lòng thử lại." với link "Thử lại" tới cùng URL |
| Edge Case | Người gửi mở Kudo spam của chính mình từ danh sách "Đã gửi" | Mở `/kudos/{id}` | Hiện chỉ đọc, có lớp phủ Spam, chỉ nút "Đóng" dùng được |

---

## US034_OpenSunnerProfile: Open Sunner Profile

**Type**: ui
**Interaction**: navigation
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn mở hồ sơ của một đồng nghiệp từ tên hoặc avatar của họ, để xem họ đã nhận bao nhiêu Kudo và gửi lời cảm ơn tới họ.

### Acceptance Criteria

- [ ] Bấm tên của người có tên (người nhận, hoặc người gửi không ẩn danh) trên thẻ Kudo mở `/profile/{userId}`; avatar cũng là link nhưng chỉ dành cho con trỏ (`aria-hidden`, ngoài thứ tự Tab) nên mỗi người chỉ có một điểm dừng Tab.
- [ ] Bấm tên trong đám mây của SCR007/REG004 mở `/profile/{recipientId}`; nhãn đọc là "{tên}, {n} Kudos".
- [ ] Người gửi ẩn danh chỉ hiện biệt danh: không link, không thẻ hover.
- [ ] Bấm tên chính mình dẫn tới `/profile/{id}` rồi chuyển về `/profile`; id sai định dạng hoặc không tồn tại hiện "Không tìm thấy Sunner này." kèm nút về Live board.
- [ ] Trên Kudo spam của chính mình (đang phủ lớp mờ) link vẫn nằm trong DOM nhưng bị đưa ra khỏi thứ tự Tab.

### Technical Notes

- **Endpoint**: N/A — điều hướng GET `/profile/{userId}` (page RSC, không có API riêng); `app/(app)/profile/[userId]/page.tsx:30-36`
- **Data Required**: `KudoPersonView.id` (uuid) và tên trên thẻ; `recipientId` trong bản chụp Spotlight (`features/spotlight-board/components/spotlight-name-cloud.tsx:44-55`)
- **Dependencies**: `requireSunner()` (PERM008_SunnerAreaGate), cổng prelaunch (PERM004_PrelaunchGate); nhánh tên có link và nhánh ẩn danh ở `features/kudos-feed/components/kudo-card-sender.tsx:27-65`; chuyển về `/profile` ở `page.tsx:33`; trang 404 ở `app/(app)/profile/[userId]/not-found.tsx`
- **Notes**: thẻ trong carousel Highlight (SCR007/REG003) dùng cùng `KudoCard` nên cùng hành vi, Inventory tính chung vào dòng REG005; link tên trong Spotlight đặt `prefetch={false}`.

### Screens

- SCR006: KudoDetail
- SCR007/REG004: SpotlightBoard
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- Không có BL riêng cho story này (điều hướng thuần; BL013_PrelaunchGate áp chung cho mọi trang).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner đã đăng nhập, thẻ Kudo có người nhận tên "A" | Bấm tên "A" | Mở `/profile/{id của A}` hiện hồ sơ của A |
| Spotlight | Đám mây có tên "A" | Bấm tên "A" | Mở `/profile/{id của A}` |
| Chính mình | Thẻ Kudo có tên của chính Sunner | Bấm tên mình | `/profile/{id}` chuyển về `/profile` |
| Ẩn danh | Kudo gửi ẩn danh | Nhìn khối người gửi | Chỉ có biệt danh, không link, không hover card |
| Error Case | Id không có trong DB | Mở `/profile/{id}` | Hiện "Không tìm thấy Sunner này." và nút "Quay lại Live board" |

---

## US035_PreviewSunnerCard: Preview Sunner Card

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: M

### User Story

Là một Sunner, tôi muốn rê chuột hoặc đặt focus bàn phím lên avatar và tên một người trên thẻ Kudo để xem thẻ tóm tắt của họ, để biết nhanh phòng ban, bậc Hero và số Kudo mà không phải rời trang.

### Acceptance Criteria

- [ ] Rê chuột vào avatar (hoặc focus bàn phím lên tên) 300 ms thì thẻ mở; con trỏ rời khỏi khối người và thẻ 150 ms thì thẻ đóng; Esc, bấm ra ngoài, hoặc focus rời cả tên lẫn thẻ cũng đóng.
- [ ] Mỗi lúc chỉ một thẻ mở trên trang; thao tác chạm không mở thẻ, avatar chỉ là link hồ sơ.
- [ ] Thẻ hiện tên (link tới hồ sơ), "Tên đơn vị: …", huy hiệu Hero nếu có, "Số Kudos nhận được" và "Số Kudos đã gửi"; không có email, role, avatar, Kudo hay dữ liệu người gửi.
- [ ] Nút "Gửi KUDO" chỉ có khi cửa sổ ghi còn mở và thẻ không phải của chính mình.
- [ ] Lần mở đầu gọi API, các lần sau trong 60 giây dùng bản đã cache trên trang; tải lỗi thì không hiện thẻ nào (không bao giờ có thẻ rỗng).
- [ ] Người gửi ẩn danh và Kudo spam của chính mình (dưới lớp mờ) không có thẻ hover.

### Technical Notes

- **Endpoint**: GET `/api/sunners/:userId/card` (ROUTE019) — 200 `SunnerCardView`; 401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED, 404 NOT_FOUND, 500 UNEXPECTED; `Cache-Control: private, no-store` (`app/api/sunners/[userId]/card/route.ts:15-33`)
- **Data Required**: `{ id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo }`; `kudosReceived` là số Kudo public đã nhận, `kudosSent` là số Kudo public đã gửi, với người khác thì bỏ Kudo ẩn danh để số không nhúc nhích khi họ gửi ẩn danh (`features/profile/server/profile-kudo-counts-query.ts:28-34`); `canSendKudo = writingOpen && userId !== viewerId` (`features/profile/server/sunner-card-query.ts:31`)
- **Dependencies**: PERM031_SunnerCardFieldWhitelist, PERM022_EventWritingWindow; bậc Hero tính khi đọc từ `HeroTierQuery`; hành vi mở/đóng ở `features/profile/components/avatar-hover-card.tsx:16-18,90-101,134-141`; bàn phím ở `use-hover-card-keyboard.ts`; cache 60 giây ở `features/profile/lib/sunner-card-cache.ts:4,24-53`; nội dung thẻ ở `sunner-card-content.tsx:41-103`
- **Notes**: nút "Gửi KUDO" trong thẻ có story riêng (SendKudoToSunner); story này dừng ở việc xem thẻ.

### Screens

- SCR006: KudoDetail
- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- Không có BL riêng (bậc Hero tính khi đọc, không đi qua BL014_HeroTierUpDetection vốn chỉ phục vụ thông báo).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Thẻ Kudo có người nhận tên "A", chuột trên desktop | Rê vào avatar của A đủ 300 ms | Thẻ hiện tên, đơn vị, bậc Hero, hai số đếm và nút "Gửi KUDO" |
| Thẻ của mình | Avatar của chính Sunner | Rê vào avatar | Thẻ hiện nhưng không có nút "Gửi KUDO" |
| Hết sự kiện | Sau `EVENT_END_AT` | Mở thẻ của người khác | Không có nút "Gửi KUDO" |
| Chạm | Màn hình cảm ứng | Chạm avatar | Không có thẻ, chuyển tới hồ sơ |
| Error Case | API trả 500 hoặc mạng lỗi | Rê vào avatar | Không hiện thẻ nào, lần rê sau gọi lại |
| Ẩn danh | Kudo gửi ẩn danh | Rê vào khối người gửi | Không có thẻ |

---

## US036_ViewKudoImage: View Kudo Image

**Type**: ui
**Interaction**: navigation
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn mở ảnh đính kèm của một Kudo ở kích thước đầy đủ trong tab mới, để xem rõ nội dung mà trang chỉ hiện dưới dạng ảnh nhỏ 88×88.

### Acceptance Criteria

- [ ] Trên `/kudos/{id}` mỗi ảnh (tối đa 5, theo thứ tự `position`) là link `target="_blank"` với `rel="noopener noreferrer"`, nhãn "Mở ảnh đính kèm {n} trong thẻ mới", trỏ tới signed URL của tệp.
- [ ] Ảnh nào không ký được URL hiện khung trống kèm chữ ẩn "Ảnh đính kèm {n} không tải được" và không phải link.
- [ ] Với Kudo spam của chính mình (lớp mờ) ảnh không phải link.
- [ ] Ở feed và profile ảnh chỉ để xem, không mở được; muốn mở phải vào trang chi tiết.

### Technical Notes

- **Endpoint**: signed URL Storage bucket `kudo-images` (không qua route của app); page RSC `/kudos/{id}` (`app/(app)/kudos/[id]/page.tsx:43-65`)
- **Data Required**: `KudoCardImage { position, url }`; URL đọc có hạn 30 phút (`KUDO_IMAGE_READ_URL_SECONDS = 1800`), ký một lần cho cả trang (`features/kudos-feed/server/kudo-image-read-urls.ts:11-26`)
- **Dependencies**: PERM036_KudoImageStorageAccess (bucket private, client không có policy); `openable={tabbable}` ở `features/kudos-feed/components/kudo-detail-view.tsx:43`; nhánh link và nhánh khung trống ở `features/kudos-feed/components/kudo-card-images.tsx:19-49`
- **Notes**: URL hết hạn sau 30 phút nên tab đã mở lâu rồi bấm ảnh có thể bị Storage từ chối, tải lại trang để ký URL mới (suy ra từ cơ chế signed URL, chưa có thông báo riêng trong UI).

### Screens

- SCR006: KudoDetail

### Background Logic

- BL009_KudoImageReadSigning: ký URL đọc ảnh Kudo, một lần cho mỗi trang

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Kudo có 3 ảnh, mở `/kudos/{id}` | Bấm ảnh thứ 2 | Tab mới mở tệp ảnh đầy đủ, trang hiện tại giữ nguyên |
| Ký lỗi | `createSignedUrls` lỗi | Mở trang chi tiết | Trang vẫn dựng, mỗi ảnh là khung trống có chữ ẩn "không tải được", không có link |
| Spam của mình | Kudo spam của chính Sunner | Mở trang chi tiết | Ảnh nằm dưới lớp mờ và không bấm được |
| Error Case | Ảnh còn trên trang quá 30 phút | Bấm ảnh | Storage từ chối URL cũ; tải lại trang thì mở được |

---

## US037_GiveHeartToKudo: Give Heart To Kudo

**Type**: ui
**Interaction**: primary-action
**Priority**: P1
**Estimate**: M

### User Story

Là một Sunner, tôi muốn thả tim cho Kudo của đồng nghiệp, để bày tỏ sự ghi nhận và giúp người gửi Kudo đó tích đủ tim đổi lấy Secret Box.

### Acceptance Criteria

- [ ] Bấm nút tim khi chưa tim thì số tim tăng 1 và tim đặc ngay (optimistic, `aria-pressed="true"`); nút khoá cho tới khi server trả lời nên không bấm đúp được.
- [ ] Server trả số tim thô mới và trạng thái của mình; số hiển thị là số Sunner đã tim (định dạng "1.000" ở vi), không nhân với hệ số campaign.
- [ ] Kudo do chính mình gửi (kể cả ẩn danh) và mọi Kudo từ `EVENT_END_AT` trở đi: nút `aria-disabled`, số tim vẫn hiện, tooltip nêu lý do ("Bạn không thể thả tim cho Kudo của mình" hoặc "Sự kiện đã kết thúc, không thể thả tim nữa"); bấm vào chỉ hiện lý do trong toast và không gửi request.
- [ ] Kudo đã bị đánh dấu spam giữa chừng, hoặc bị từ chối vì lý do khác: số tim trở về như cũ và toast hiện "Kudo này không còn khả dụng" hoặc "Không thể cập nhật, vui lòng thử lại".
- [ ] Thả tim lần thứ hai cho cùng Kudo là no-op im lặng; 20 lần bấm song song chỉ tạo 1 dòng tim và 1 sự kiện `HeartAdded`.
- [ ] Thẻ Kudo spam của chính mình không có nút tim.

### Technical Notes

- **Endpoint**: POST server action `addHeartAction` (ROUTE025) — trả `{ ok, heartCount, heartedByMe }` hoặc `{ ok: false, error: SELF_HEART | KUDO_UNAVAILABLE | EVENT_ENDED | UNEXPECTED }` (`features/kudos-hearts/server/kudo-heart-actions.ts:18-35`, mã lỗi ở `features/kudos-hearts/schemas/kudo-heart-result.ts:12-20`)
- **Data Required**: `kudoId` (uuid); người thả lấy từ phiên; hệ số campaign (2 khi có campaign đang chạy, ngược lại 1) được chụp vào dòng tim (`features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21`)
- **Dependencies**: PERM027_KudoHeartToggle, PERM022_EventWritingWindow, PERM008_SunnerAreaGate (khách bị chuyển `/login`); một câu `INSERT … SELECT … ON CONFLICT DO NOTHING` giữ đủ điều kiện (Kudo `public`, không phải người gửi, trước `EVENT_END_AT`) và chỉ ghi outbox khi chèn được dòng (`features/kudos-hearts/server/kudo-heart-service.ts:32-69`); nút ở `features/kudos-hearts/components/kudo-heart-button.tsx:49-124`
- **Notes**: tim đi tới người gửi Kudo; số Secret Box được cấp theo `floor(tổng tim có trọng số / SECRET_BOX_HEARTS_PER_BOX)`, mặc định 5 (`features/secret-box-rewards/server/secret-box-grant-service.ts:29`, `shared/config/env-schema.ts:72`); người gửi nhận thông báo `heart_received` gộp theo Kudo khi chưa đọc.

### Screens

- SCR006: KudoDetail
- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- BL015_NotificationEventContextLoad: đọc lại Kudo trong giao dịch của sự kiện `HeartAdded` (kiểm tra Kudo còn public)
- BL016_EventToNotificationMapping: `HeartAdded` thành thông báo `heart_received` cho người gửi
- BL017_NotificationWrite: ghi thông báo, tăng `count` nếu còn dòng chưa đọc của cùng Kudo
- BL026_NotificationOutboxDrain: consumer xử lý dòng outbox
- BL033_SecretBoxSweep: cấp Secret Box cho người gửi vừa nhận tim

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Kudo public của người khác, mình chưa tim, cửa sổ ghi mở | Bấm tim | Số tim +1 ngay, tim đặc; server ghi 1 dòng tim và 1 sự kiện `HeartAdded` |
| Campaign x2 | Có campaign đang chạy | Bấm tim | Dòng tim lưu hệ số 2, số hiển thị vẫn tăng 1 |
| Kudo của mình | Mình là người gửi | Rê hoặc bấm nút tim | Nút khoá, tooltip và toast `SELF_HEART`, không có request |
| Hết sự kiện | Sau `EVENT_END_AT` | Bấm tim | Nút khoá, toast `EVENT_ENDED` |
| Spam giữa chừng | Admin vừa Mark Spam Kudo | Bấm tim | Số tim trở lại như cũ, toast `KUDO_UNAVAILABLE` |
| Error Case | Mạng đứt hoặc action ném lỗi | Bấm tim | Hoàn tác số tim, toast `UNEXPECTED`, nút mở lại |

---

## US038_WithdrawHeartFromKudo: Withdraw Heart From Kudo

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn bỏ tim đã thả cho một Kudo, để sửa lại khi tôi lỡ tay hoặc đổi ý.

### Acceptance Criteria

- [ ] Bấm nút tim đang đặc thì số tim giảm 1 và tim rỗng ngay (optimistic, `aria-pressed="false"`); nút khoá cho tới khi server trả lời.
- [ ] Bỏ tim là idempotent: bỏ khi chưa tim không báo lỗi, server trả lại trạng thái hiện tại.
- [ ] Bỏ tim vẫn được trên Kudo vừa bị đánh dấu spam; ngoài cửa sổ ghi (từ `EVENT_END_AT`) nút bị khoá và toast "Sự kiện đã kết thúc, không thể thả tim nữa".
- [ ] Lỗi mạng hoặc lỗi server: số tim hoàn tác và toast "Không thể cập nhật, vui lòng thử lại".

### Technical Notes

- **Endpoint**: POST server action `removeHeartAction` (ROUTE026) — mã lỗi `KUDO_UNAVAILABLE` (id sai), `EVENT_ENDED`, `UNEXPECTED` (`features/kudos-hearts/server/kudo-heart-actions.ts:38-41`)
- **Data Required**: `kudoId` (uuid); người dùng từ phiên; kết quả `{ heartCount, heartedByMe }`
- **Dependencies**: PERM027_KudoHeartToggle, PERM022_EventWritingWindow; `remove` là `DELETE` thuần theo `(kudo_id, user_id)`, chặn ngoài cửa sổ ghi (`features/kudos-hearts/server/kudo-heart-service.ts:71-74`); cùng `KudoHeartButton` với thả tim, khác trạng thái `heartedByMe` (`kudo-heart-button.tsx:72-90`)
- **Notes**: không có sự kiện `HeartRemoved`, các consumer đối soát lại từ tổng tim (YAGNI, ghi ở `kudo-heart-service.ts:19`).

### Screens

- SCR006: KudoDetail
- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- BL033_SecretBoxSweep: tổng tim của người gửi giảm nên lần đối soát sau tính lại số hộp được cấp

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Mình đã tim Kudo, cửa sổ ghi mở | Bấm nút tim | Số tim -1 ngay, tim rỗng; server xoá dòng tim của mình |
| Idempotent | Mình chưa tim (trạng thái cũ trên tab khác) | Gửi bỏ tim | Không lỗi, trả số tim hiện tại |
| Spam giữa chừng | Kudo vừa bị đánh dấu spam | Bấm bỏ tim | Vẫn bỏ được |
| Hết sự kiện | Sau `EVENT_END_AT` | Bấm tim đang đặc | Nút khoá, toast `EVENT_ENDED`, tim giữ nguyên |
| Error Case | Server lỗi | Bấm bỏ tim | Hoàn tác về tim đặc, toast `UNEXPECTED` |

---

## US039_CopyKudoLink: Copy Kudo Link

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn sao chép đường dẫn của một Kudo vào clipboard, để dán chia sẻ cho đồng nghiệp ở chỗ khác.

### Acceptance Criteria

- [ ] Bấm "Copy Link" ghi `{origin}/kudos/{id}` vào clipboard và hiện toast trạng thái "Đã sao chép liên kết", tự tắt sau 4 giây.
- [ ] Clipboard bị chặn hoặc không có: hiện toast cảnh báo "Không sao chép được liên kết, vui lòng thử lại." kèm ô chỉ đọc chứa link (tự chọn hết khi focus) và nút "Đóng"; toast này nằm tới khi bấm Đóng.
- [ ] Nút không có trên Kudo spam của chính mình.
- [ ] Đường dẫn cố định là `/kudos/{id}`, không kèm tham số khác.

### Technical Notes

- **Endpoint**: N/A — thuần phía trình duyệt (Clipboard API), không gọi server
- **Data Required**: `kudoId` trên thẻ; `window.location.origin`
- **Dependencies**: `features/kudos-feed/components/kudo-copy-link-button.tsx:29-61` (URL dựng ở dòng 37, toast mount qua body portal sau khi hydrate), `kudo-copy-link-toast.tsx:24-58`; PERM008_SunnerAreaGate cho trang chứa nút
- **Notes**: toast dùng vùng `role="status"` luôn mount để trình đọc màn hình đã theo dõi trước khi có thông báo; người nhận link vẫn phải đăng nhập và Kudo spam của người khác sẽ cho 404.

### Screens

- SCR006: KudoDetail
- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- Không có BL liên quan (hành vi hoàn toàn phía client).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Thẻ Kudo `abc` trên Live board | Bấm "Copy Link" | Clipboard chứa `{origin}/kudos/abc`, toast "Đã sao chép liên kết" rồi tự tắt |
| Spam của mình | Kudo spam của chính Sunner | Nhìn hàng hành động | Không có nút "Copy Link" |
| Error Case | Trình duyệt chặn clipboard | Bấm "Copy Link" | Toast lỗi kèm ô chứa link để copy tay, giữ tới khi bấm "Đóng" |

---

## US040_ViewHeroBadgeTooltip: View Hero Badge Tooltip

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn xem giải thích bậc Hero khi rê, focus hoặc chạm vào huy hiệu của một người, để hiểu huy hiệu đó nói lên điều gì.

### Acceptance Criteria

- [ ] Tooltip mở khi rê chuột vào huy hiệu, khi focus bàn phím, hoặc khi chạm; đóng khi chuột rời (trễ 120 ms), khi blur, bấm Esc, chạm lần hai, hoặc bấm chỗ khác (bấm trong tooltip thì giữ mở).
- [ ] Mỗi lúc chỉ một tooltip mở trên trang; panel không focus được nên focus không bị kẹt, `aria-describedby` trỏ tới panel khi đang mở.
- [ ] Nội dung theo bậc: New (1–4 người gửi), Rising (5–9), Super (10–20), Legend (hơn 20), gồm tiêu đề và mô tả.
- [ ] Người chưa có người gửi nào không có huy hiệu; người gửi ẩn danh không có bậc.
- [ ] Trên Kudo spam của chính mình, huy hiệu ra khỏi thứ tự Tab.

### Technical Notes

- **Endpoint**: N/A — tooltip hiển thị từ dữ liệu bậc đã có trên thẻ và header profile, không gọi thêm API
- **Data Required**: `HeroTier` (`new`, `rising`, `super`, `legend`) tính khi đọc từ số người gửi public khác nhau của người nhận: bỏ spam, tính cả Kudo ẩn danh, bỏ tự gửi; ngưỡng 1, 5, 10, 21 (`features/hero-badges/server/hero-tier-constants.ts:6-9`, `hero-tier-query.ts:20,42-49`)
- **Dependencies**: PERM008_SunnerAreaGate; trigger và panel ở `features/hero-badges/components/hero-badge-tooltip.tsx:23-122` và `hero-badge-tooltip-panel.tsx:27-65`; khe huy hiệu ở `features/kudos-feed/components/kudo-card-hero-badge-slot.tsx:12-28`; header profile ở `features/profile/components/profile-header.tsx:32-37`
- **Notes**: Index chỉ liệt kê REG003, REG005, SCR015, SCR016, nhưng `KudoDetailView` (SCR006) cũng dùng `KudoCardPeople` nên có cùng huy hiệu; tooltip dùng nguyên văn các thông điệp `hero.*` của trang Thể lệ, viết ngôi thứ hai ("cho bạn") kể cả khi xem huy hiệu người khác.

### Screens

- SCR007/REG003: HighlightKudos
- SCR007/REG005: AllKudosFeed
- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- Không có BL riêng (bậc tính khi đọc; BL014_HeroTierUpDetection chỉ quyết định thông báo lên bậc).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Người nhận có 6 người gửi khác nhau | Rê vào huy hiệu | Tooltip hiện huy hiệu Rising Hero và tiêu đề "Có 5–9 người gửi Kudos cho bạn" |
| Bàn phím | Huy hiệu nằm trong thứ tự Tab | Tab tới huy hiệu rồi bấm Esc | Mở khi focus, Esc đóng và Esc không lan tới dialog phía dưới |
| Chạm | Màn hình cảm ứng | Chạm một lần rồi chạm lần hai | Lần một mở, lần hai đóng |
| Không có bậc | Người nhận chưa có Kudo public | Xem thẻ hoặc hồ sơ | Không có dấu chấm ngăn cách, không có huy hiệu |
| Error Case | Hai huy hiệu trên cùng trang | Mở tooltip thứ hai | Tooltip thứ nhất tự đóng |

---

## US041_BrowseProfileKudos: Browse Profile Kudos

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: M

### User Story

Là một Sunner, tôi muốn duyệt danh sách Kudo trên hồ sơ (của mình theo hướng đã gửi hoặc đã nhận, của người khác theo hướng đã nhận), để xem lại các lời cảm ơn mà không phải cuộn cả Live board.

### Acceptance Criteria

- [ ] Hồ sơ của mình mở bằng "Đã gửi (n)" và có dropdown "Đã gửi"/"Đã nhận" kèm số đếm; hồ sơ người khác chỉ hiện "Đã nhận: n Kudos", không có dropdown và không có "Đã gửi".
- [ ] Đổi hướng thì danh sách bắt đầu lại từ trang đầu; đổi liền tay nhiều lần chỉ hiện kết quả của lựa chọn cuối (request cũ bị huỷ).
- [ ] "Tải thêm" nối 10 Kudo kế tiếp (mới nhất trước), chuyển focus vào thẻ đầu của trang vừa nối và đọc số thẻ vừa tải; bấm khi đang tải thì bị bỏ qua; hết cursor thì nút biến mất.
- [ ] Danh sách rỗng hiện "Chưa có Kudo nào."; lỗi tải hiện khối cảnh báo cùng nút "Thử lại"; cursor bị từ chối (400) thì lần thử lại quay về trang đầu; phiên hết hạn (401) hiện link đăng nhập quay lại đúng trang hồ sơ.
- [ ] "Đã gửi" của mình gồm cả Kudo spam của chính mình, hiện lớp mờ và tag Spam; người gửi ẩn danh luôn chỉ hiện biệt danh.

### Technical Notes

- **Endpoint**: GET `/api/profile/:userId/kudos?direction=sent|received&cursor=` (ROUTE014) — 200 `{ items, nextCursor?, counts }`, 10 mỗi trang theo `(created_at, id)` giảm dần; `direction=sent` của người khác trả 403 FORBIDDEN; 404 NOT_FOUND, 400 VALIDATION, 401 (`app/api/profile/[userId]/kudos/route.ts:19-49`)
- **Data Required**: `profileUserId` (uuid), `direction`, `cursor`; `ProfileKudoCounts { received, sent? }` dùng đúng bộ lọc của danh sách (`features/profile/lib/profile-kudos-filter.ts:12-38`)
- **Dependencies**: PERM030_ProfileSentListOwnerOnly (lọc người gửi trên hồ sơ người khác sẽ lộ người gửi ẩn danh bằng phép trừ tập), PERM029_SpamKudoVisibility, PERM028_AnonymousSenderMask; `FEED_PAGE_SIZE = 10` (`features/kudos-feed/server/kudo-public-query.ts:19`); trạng thái và huỷ request ở `features/profile/components/use-profile-kudos-list.ts:22-95`; giao diện ở `profile-kudos-section.tsx:30-86` và `profile-kudos-direction-dropdown.tsx:27-108`
- **Notes**: `[IPE_FOLDED]` đổi hướng, "Tải thêm" và thử lại là các điều khiển của cùng một lần đọc và cùng một endpoint nên gộp thành một story duyệt; SCR015 chỉ có "Tải thêm" và thử lại vì không có dropdown.

### Screens

- SCR015: OtherProfile
- SCR016: OwnProfile

### Background Logic

- BL009_KudoImageReadSigning: ký URL đọc ảnh cho các thẻ của mỗi trang danh sách

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Hồ sơ của mình có 25 Kudo đã gửi | Bấm "Tải thêm" hai lần | Hiện 10, rồi 20, rồi 25 Kudo; nút biến mất ở cuối; focus nhảy vào thẻ đầu mỗi trang mới |
| Đổi hướng | Đang xem "Đã gửi (25)" | Chọn "Đã nhận" | Danh sách xoá và nạp lại từ trang đầu với "Đã nhận" |
| Đổi liền tay | Đổi hướng hai lần liên tiếp thật nhanh | Chờ | Chỉ hiện kết quả của lựa chọn cuối |
| Hồ sơ người khác | Mở `/profile/{id người khác}` | Nhìn tiêu đề | "Đã nhận: n Kudos", không có dropdown; gọi `direction=sent` trả 403 |
| Rỗng | Hồ sơ chưa nhận Kudo nào | Mở hồ sơ | "Chưa có Kudo nào." và không có nút "Tải thêm" |
| Error Case | API trả 500 khi "Tải thêm" | Bấm "Tải thêm" | Danh sách cũ giữ nguyên, hiện cảnh báo và "Thử lại" |

---

## US042_SearchSpotlightNames: Search Spotlight Names

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: M

### User Story

Là một Sunner, tôi muốn gõ tên để làm nổi bật người đó trong đám mây tên của Spotlight Board, để tìm nhanh một đồng nghiệp đang được vinh danh.

### Acceptance Criteria

- [ ] Gõ vào ô "Tìm kiếm" (tối đa 50 ký tự); sau 200 ms ngừng gõ, tên khớp giữ nguyên còn tên không khớp mờ còn 25%; xoá hết chữ thì bỏ lọc.
- [ ] Khớp theo chuỗi con của tên, không phân biệt hoa thường, bỏ dấu tiếng Việt và coi `đ` như `d` ("chuc" khớp "Nguyễn Bá Chức").
- [ ] Không tên nào khớp thì hiện "Không tìm thấy tên nào"; bảng chưa có Kudo nào hiện "Chưa có Kudos nào để vinh danh."
- [ ] Việc lọc chạy phía client trên các tên đang hiện (tối đa 60 tên, 24 tên khi bảng hẹp dưới 640 px), không gọi server.
- [ ] Khi lần tải đầu lỗi, vùng hiện "Không tải được Spotlight Board. Vui lòng thử lại." kèm "Thử lại" nạp lại bản chụp, phần còn lại của Live board không bị ảnh hưởng.
- [ ] Sau 5 lần nối kênh realtime thất bại liên tiếp hiện "Không cập nhật được trực tiếp." kèm "Thử lại" mở kết nối mới; số liệu đang có trên bảng được giữ nguyên.

### Technical Notes

- **Endpoint**: lọc không có endpoint (phía client); nút thử lại gọi GET `/api/spotlight` (ROUTE017) — 200 `{ total, names, recent }`, 401 `unauthorized`, 500 `unexpected`, `Cache-Control: private, no-store` (`app/api/spotlight/route.ts:14-23`)
- **Data Required**: `SpotlightSnapshot { total, names, recent }`, `SpotlightName { recipientId, name, count }`; `NAME_CLOUD_MAX = 60` (`features/spotlight-board/spotlight-config.ts:9`); `SEARCH_MAX_LENGTH = 50`, `SEARCH_DEBOUNCE_MS = 200`, `RECONNECT_MAX_ATTEMPTS = 5` (`features/spotlight-board/lib/spotlight-ui-config.ts:29-36`)
- **Dependencies**: PERM037_SpotlightRealtimeChannelRead (kênh Broadcast riêng `spotlight`); bộ khớp ở `features/spotlight-board/lib/normalize-search-text.ts:5-23`; ô nhập ở `components/spotlight-search-input.tsx:19-45`; đám mây ở `spotlight-name-cloud.tsx:27-66`; thử lại ở `spotlight-load-error.tsx:15-36` và `spotlight-connection-banner.tsx:19-36`; kênh ở `hooks/use-spotlight-channel.ts:31-120`
- **Notes**: `[IPE_FOLDED]` nút thử lại ở `SpotlightLoadError` và `SpotlightConnectionBanner` gộp vào story này vì cùng vùng REG004 và cùng nguồn `GET /api/spotlight`; tên khớp được giữ nguyên chứ không bị loại khỏi đám mây.

### Screens

- SCR007/REG004: SpotlightBoard

### Background Logic

- BL003_SpotlightChannelListener: nghe kênh `spotlight`, đồng bộ lại bản chụp sau mỗi lần nối và sau sự kiện kiểm duyệt
- BL023_SpotlightPublishKudoEvent: trigger phát sự kiện `added`, `removed`, `restored` khi Kudo được tạo hoặc đổi trạng thái spam

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Đám mây có "Nguyễn Bá Chức" và "Lê An" | Gõ "chuc" rồi ngừng 200 ms | "Nguyễn Bá Chức" giữ nguyên, "Lê An" mờ còn 25% |
| Không khớp | Đám mây có vài tên | Gõ "zzz" | Mọi tên mờ và hiện "Không tìm thấy tên nào" |
| Xoá chữ | Đang lọc | Xoá hết ô tìm kiếm | Tất cả tên trở lại rõ nét |
| Giới hạn | Ô tìm kiếm | Dán chuỗi 80 ký tự | Chỉ giữ 50 ký tự đầu |
| Rỗng | Chưa có Kudo public | Mở Live board | Hiện "Chưa có Kudos nào để vinh danh." |
| Error Case | `GET /api/spotlight` lỗi lúc tải đầu | Bấm "Thử lại" | Gọi lại API, thành công thì hiện bảng, thất bại thì giữ thông báo lỗi |

---

## US043_ToggleSpotlightFullscreen: Toggle Spotlight Fullscreen

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn phóng to Spotlight Board ra toàn màn hình và thu nhỏ lại, để xem đám mây tên và dòng Kudo mới trên màn hình lớn.

### Acceptance Criteria

- [ ] Bấm nút phóng to đưa riêng khung bảng vào toàn màn hình; nhãn nút đổi giữa "Phóng to bảng" và "Thu nhỏ bảng".
- [ ] Bấm lại hoặc Esc thì thoát; trạng thái nút theo sự kiện `fullscreenchange` nên thoát bằng phím hay bằng trình duyệt đều khớp.
- [ ] Ô tìm kiếm, bộ đếm "{n} KUDOS", ticker và nhãn kết nối nằm trong khung nên vẫn dùng được khi toàn màn hình; focus giữ trên nút ở cả hai chiều.
- [ ] Trình duyệt không hỗ trợ hoặc từ chối thì hiện thông báo "Không thể phóng to bảng." và bảng giữ nguyên.

### Technical Notes

- **Endpoint**: N/A — Fullscreen API của trình duyệt, không gọi server
- **Data Required**: phần tử khung bảng (`ref`) và cờ `active`; không có dữ liệu nghiệp vụ
- **Dependencies**: `features/spotlight-board/hooks/use-fullscreen-toggle.ts:10-38`, `components/spotlight-fullscreen-button.tsx:16-28`, thông báo từ chối ở `components/spotlight-board.tsx:46,71`; khung bỏ viền và bo góc khi `:fullscreen` ở `components/spotlight-board-frame.tsx:21`; PERM008_SunnerAreaGate cho trang chứa bảng
- **Notes**: phần tử toàn màn hình là khung bảng chứ không phải cả trang; chữ trong đám mây phóng theo kích thước khung nhưng không nhỏ hơn cỡ Figma.

### Screens

- SCR007/REG004: SpotlightBoard

### Background Logic

- Không có BL riêng (hành vi phía client; kênh realtime của bảng vẫn chạy bình thường khi toàn màn hình, xem BL003_SpotlightChannelListener).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Bảng đang ở khung thường | Bấm nút phóng to | Khung bảng chiếm toàn màn hình, nhãn nút thành "Thu nhỏ bảng" |
| Thoát bằng Esc | Đang toàn màn hình | Bấm Esc | Về khung thường, nhãn nút trở lại "Phóng to bảng" |
| Dùng trong toàn màn hình | Đang toàn màn hình | Gõ vào ô tìm kiếm | Tên được lọc, ticker vẫn nhận Kudo mới |
| Error Case | `document.fullscreenEnabled` là false hoặc `requestFullscreen` bị từ chối | Bấm nút phóng to | Toast "Không thể phóng to bảng.", bảng giữ nguyên |

---

## US044_OpenSecretBox: Open Secret Box

**Type**: ui
**Interaction**: primary-action
**Priority**: P2
**Estimate**: L

### User Story

Là một Sunner, tôi muốn mở Secret Box mình đã kiếm được từ tim, để nhận icon hoặc quà từ BTC và tiến dần tới trọn bộ 6 icon.

### Acceptance Criteria

- [ ] Nút "Mở Secret Box" có ở cột phần thưởng của Live board (SCR007/REG006) và ở bảng thống kê trên hồ sơ của mình (SCR016); bấm mở modal "KHÁM PHÁ SECRET BOX CỦA BẠN" và nạp số hộp chưa mở. Deep link `/kudos?secretBox=open` mở modal ngay cả khi bảng thống kê lỗi.
- [ ] Hết hộp thì nút mờ và `aria-disabled` nhưng vẫn focus được; tooltip "Bạn chưa có Secret Box nào" hiện khi rê, focus hoặc chạm.
- [ ] Bấm vào hộp trong modal mở hộp có số thứ tự thấp nhất của mình, hiện khung đang mở tối thiểu 900 ms (0 ms khi người dùng bật giảm chuyển động), rồi hiện icon hoặc quà vừa nhận cùng số hộp còn lại.
- [ ] Icon đã có thì hiện "Bạn đã có icon này rồi"; mở trúng icon cuối của bộ 6 thì tiêu đề thành "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" và hiện tên quà bí ẩn.
- [ ] Khi một lần mở không biết kết quả (lỗi mạng, quá 15 giây, 5xx, 401), lần bấm sau gửi lại đúng Idempotency-Key cũ nên server trả kết quả đã lưu, không mở thêm hộp; mỗi lần bấm bình thường dùng key mới.
- [ ] Hết hộp (409) hiện "Bạn chưa có Secret Box nào để mở"; 400 hoặc lỗi khác hiện toast "Không thể mở hộp, vui lòng thử lại"; 401 hiện "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".
- [ ] Đóng modal bằng X, Esc hoặc bấm nền (không đóng được lúc đang mở hộp) thì làm mới trang để thống kê thấy số hộp đã mở và chưa mở mới, và gỡ tham số deep link khỏi URL; mở hộp vẫn được sau `EVENT_END_AT`.
- [ ] Không đọc được số hộp thì modal hiện "Không tải được số Secret Box. Vui lòng thử lại." kèm "Thử lại"; panel thống kê lỗi hiện "Không tải được thống kê. Vui lòng thử lại." kèm "Thử lại" làm mới cột.

### Technical Notes

- **Endpoint**: GET `/api/secret-boxes/me` (ROUTE015) trả `{ unopened }` sau khi đối soát; POST `/api/secret-boxes/open` (ROUTE016) với header `Idempotency-Key` uuid v4, không body — 200 `OpenSecretBoxResult` (có `replayed: true` khi phát lại), 401 `unauthorized`, 400 `invalid_idempotency_key`, 409 `no_box_left`, 500 `unexpected` (`app/api/secret-boxes/me/route.ts:9-18`, `app/api/secret-boxes/open/route.ts:13-25`)
- **Data Required**: số hộp chưa mở; `OpenSecretBoxResult { kind, iconCode, name, setCompleted, giftName, duplicate, unopenedLeft, replayed }`; người dùng chỉ lấy từ phiên; số hộp được cấp là `floor(tổng tim có trọng số / SECRET_BOX_HEARTS_PER_BOX)`, mặc định 5
- **Dependencies**: PERM033_SecretBoxOwnerOnly, PERM022_EventWritingWindow (không áp cho việc mở hộp); mở dưới khoá advisory của người dùng, giải thưởng rút phía server (`features/secret-box-rewards/server/secret-box-open-service.ts:66-95`); máy trạng thái client ở `features/secret-box-rewards/components/secret-box-opener.ts:37-150`; modal ở `secret-box-modal.tsx:33-116`; launcher và deep link ở `secret-box-launcher.tsx:38-73`; nút và tooltip ở `open-secret-box-button.tsx:21-77`; thống kê ở `personal-stats-panel.tsx:41-71`
- **Notes**: `[IPE_FOLDED]` nút mở modal, đóng modal, tải lại khi lỗi và `RewardsStatusMessage` thử lại không có kết quả độc lập nên gộp vào story này (cùng vùng REG006, cùng nguồn `GET /api/secret-boxes/me`); quà vật lý hiện chưa có ảnh sản phẩm nên hiển thị bằng vầng sáng vàng kèm tên quà.

### Screens

- SCR007/REG006: RewardsColumn
- SCR016: OwnProfile

### Background Logic

- BL033_SecretBoxSweep: cấp hộp cho người gửi vừa nhận tim, để hộp có sẵn trước lần mở kế tiếp
- BL034_SecretBoxTick: điều phối tick cấp hộp và chốt Kudos Quốc Dân
- BL016_EventToNotificationMapping: `BoxGranted` thành thông báo `secret_box_granted` (nguồn của deep link vào modal)

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Mình có 2 hộp chưa mở | Bấm "Mở Secret Box" rồi bấm hộp | Modal hiện icon vừa nhận, "Secretbox chưa mở 01", server ghi hộp đã mở với đúng Idempotency-Key |
| Deep link | Mở `/kudos?secretBox=open` | Trang tải xong | Modal tự mở; đóng modal thì URL mất tham số `secretBox` |
| Hết hộp | `unopened = 0` | Rê vào nút | Nút mờ, tooltip "Bạn chưa có Secret Box nào", không mở modal |
| Phát lại | Lần mở trước hết hạn 15 giây | Bấm hộp lần nữa | Gửi lại cùng key, server trả `replayed: true`, không tốn thêm hộp |
| Trọn bộ | Đang có 5 icon khác nhau | Mở hộp ra icon thứ 6 | Tiêu đề chúc mừng, hiện "Bạn đã sưu tập trọn bộ 6 icon" và tên quà bí ẩn |
| Hết phiên | Phiên hết hạn | Bấm hộp | Toast "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", hộp mở lại được sau khi đăng nhập |
| Error Case | `GET /api/secret-boxes/me` lỗi | Mở modal | Hiện "Không tải được số Secret Box" và "Thử lại" gọi lại API |

---

## US045_OpenAwardsFromHomepage: Open Awards From Homepage

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn từ trang chủ mở trang Hệ thống giải (cả trang lẫn đúng khối giải tôi quan tâm), để đọc chi tiết số lượng và giá trị của từng giải.

### Acceptance Criteria

- [ ] Nút "ABOUT AWARDS" ở hero mở `/awards`, trang dừng ở đầu.
- [ ] Mỗi trong 6 thẻ giải (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) có link "Chi tiết" mở `/awards#<slug>` và trang cuộn tới đúng khối của giải đó.
- [ ] Hash lạ không khớp khối nào thì trang đứng ở đầu.
- [ ] Link "Chi tiết" có tên truy cập riêng theo từng giải ("Chi tiết {tên giải}") để trình đọc màn hình phân biệt được.

### Technical Notes

- **Endpoint**: N/A — điều hướng GET `/awards` (page RSC, dữ liệu tĩnh, không có API)
- **Data Required**: danh sách `AWARDS` (6 slug: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`) ở `features/awards-portal/data/awards-data.ts:42-52`
- **Dependencies**: `requireSunner()` (PERM008_SunnerAreaGate) và cổng prelaunch (PERM004_PrelaunchGate, trước `LAUNCH_AT` Sunner thường bị chuyển `/countdown`); nút ở `features/awards-portal/components/homepage-hero.tsx:45-48`; thẻ ở `award-card.tsx:22-29`; mỗi khối `/awards` có `id=<slug>` và `scroll-mt` ở `award-detail-block.tsx:26-31`
- **Notes**: story này dừng ở việc mở trang đích; việc chuyển giữa các khối ngay trên `/awards` thuộc story JumpToAwardSection; nút "ABOUT KUDOS" và banner Sun* Kudos thuộc story OpenKudosBoard.

### Screens

- SCR011: Homepage
- SCR008: AwardsSystem

### Background Logic

- BL013_PrelaunchGate: trước `LAUNCH_AT` chặn Sunner thường vào `/` và `/awards`, chuyển sang `/countdown`

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner ở `/` sau `LAUNCH_AT` | Bấm "ABOUT AWARDS" | Mở `/awards` ở đầu trang |
| Theo giải | Thẻ "MVP" trên trang chủ | Bấm "Chi tiết" | Mở `/awards#mvp` và cuộn tới khối MVP |
| Hash lạ | Mở `/awards#khong-co` | Trang tải xong | Trang đứng ở đầu, không lỗi |
| Error Case | Trước `LAUNCH_AT`, Sunner thường | Mở `/` | Bị chuyển `/countdown`, không thấy các nút |

---

## US046_OpenKudosBoard: Open Kudos Board

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn đi tới Live board từ các lời mời Sun* Kudos, từ trang Thể lệ, từ trang chi tiết Kudo và từ trang báo không tìm thấy, để xem và gửi Kudo mà không phải tự gõ địa chỉ.

### Acceptance Criteria

- [ ] "ABOUT KUDOS" ở hero trang chủ và nút CTA của banner Sun* Kudos (trang chủ và `/awards`) mở `/kudos`.
- [ ] Link "Viết KUDOS" trên trang Thể lệ mở `/kudos`; trang chỉ điều hướng, ô soạn Kudo không tự mở.
- [ ] "Đóng" trên trang chi tiết Kudo mở `/kudos` (link thường, không phải quay lại lịch sử) nên Live board hiện từ đầu; với Kudo spam của chính mình nút "Đóng" nằm trên lớp mờ và vẫn bấm được.
- [ ] Nút "Quay lại Live board" ở trang "Kudo này không tồn tại hoặc đã bị gỡ." (Kudo sai id, đã spam của người khác) và ở trang "Không tìm thấy Sunner này." mở `/kudos`.

### Technical Notes

- **Endpoint**: N/A — điều hướng GET `/kudos` (page RSC), không có API riêng
- **Data Required**: không có (đích cố định `APP_ROUTES.kudos`)
- **Dependencies**: `requireSunner()` (PERM008_SunnerAreaGate), PERM004_PrelaunchGate; `features/awards-portal/components/homepage-hero.tsx:49-52`, `kudos-banner.tsx:38`, `rules-panel.tsx:43-46`; `features/kudos-feed/components/kudo-detail-view.tsx:61`; `app/(app)/kudos/[id]/not-found.tsx:11-25`; `app/(app)/profile/[userId]/not-found.tsx:11-25`
- **Notes**: các CTA này thỏa merge exception của IPE: cùng vai, cùng đích, không rẽ nhánh dữ liệu; chúng gộp theo đích `/kudos`, không theo trang chứa.

### Screens

- SCR011: Homepage
- SCR008: AwardsSystem
- SCR012: Rules
- SCR006: KudoDetail
- SCR015: OtherProfile

### Background Logic

- Không có BL riêng cho story này (điều hướng thuần; BL013_PrelaunchGate áp chung cho mọi trang).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner ở trang chủ | Bấm "ABOUT KUDOS" | Mở `/kudos` |
| Banner | Sunner ở `/awards` | Bấm nút CTA của banner | Mở `/kudos` |
| Thể lệ | Sunner ở `/rules` | Bấm "Viết KUDOS" | Mở `/kudos`, ô soạn chưa mở |
| Chi tiết Kudo | Sunner ở `/kudos/{id}` | Bấm "Đóng" | Mở `/kudos` ở đầu trang |
| Error Case | Id Kudo không tồn tại | Mở `/kudos/{id}` rồi bấm "Quay lại Live board" | Hiện thông báo chung rồi mở `/kudos` |

---

## US047_JumpToAwardSection: Jump To Award Section

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

Là một Sunner, tôi muốn bấm vào menu neo bên trái trang Hệ thống giải để nhảy tới khối của một giải, để khỏi cuộn qua cả 6 giải.

### Acceptance Criteria

- [ ] Menu có 6 mục (một mục mỗi giải); bấm một mục cuộn mượt tới khối đó (tức thì khi người dùng bật giảm chuyển động), đặt focus vào khối và cập nhật hash thành `#<slug>` mà không thêm mục lịch sử.
- [ ] Mục của khối đang ở đường đọc (25% chiều cao khung nhìn) được đánh dấu `aria-current="true"` và cập nhật theo cuộn và theo đổi kích thước; nhảy xa (Home, "về đầu trang") vẫn đánh dấu đúng.
- [ ] Bấm kèm Ctrl, Cmd, Shift, Alt hoặc không phải chuột trái thì giữ hành vi mặc định của link `#slug`; khi chưa có JavaScript link vẫn là neo thật.
- [ ] Desktop: cột menu dính bên trái; điện thoại: thanh chip ngang dưới header, chip đang chọn tự cuộn vào tầm nhìn trong thanh.

### Technical Notes

- **Endpoint**: N/A — thuần phía client trên trang `/awards`, không gọi server
- **Data Required**: `items { slug, label }` suy ra từ `AWARDS`; vị trí các khối `id=<slug>` trong DOM
- **Dependencies**: `features/awards-portal/components/awards-anchor-menu.tsx:37-114` (`onSelect` ở dòng 71-80, `READING_LINE = 0.25` ở dòng 10); khối đích ở `award-detail-block.tsx:26-31` (`tabIndex={-1}`, `scroll-mt-40 md:scroll-mt-28`); trang ở `app/(app)/awards/page.tsx:50-63`; PERM008_SunnerAreaGate
- **Notes**: vị trí được đọc theo cuộn (một lần mỗi frame) thay vì `IntersectionObserver` vì nhảy xa không đi qua khối trung gian nào.

### Screens

- SCR008: AwardsSystem

### Background Logic

- Không có BL liên quan (hành vi hoàn toàn phía client).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | `/awards` ở đầu trang, 6 khối | Bấm mục "MVP" | Trang cuộn mượt tới khối MVP, focus vào khối, URL thành `#mvp`, mục MVP có `aria-current` |
| Giảm chuyển động | Hệ điều hành bật giảm chuyển động | Bấm một mục | Nhảy tức thì, không cuộn mượt |
| Mở tab mới | Bất kỳ mục nào | Ctrl+bấm | Trình duyệt mở `/awards#<slug>` ở tab mới, trang hiện tại không cuộn |
| Cuộn tay | Đang ở khối thứ 3 | Cuộn xuống khối thứ 5 | Dấu hiệu `aria-current` chuyển sang mục thứ 5 |
| Error Case | Không tìm thấy phần tử có `id` tương ứng | Bấm mục | Bỏ qua việc chặn sự kiện, link mặc định hoạt động |

---

## US048_CloseRulesPage: Close Rules Page

**Type**: ui
**Interaction**: navigation
**Priority**: P2
**Estimate**: S

### User Story

Là một Sunner, tôi muốn đóng trang Thể lệ để quay về trang tôi vừa đọc, để tiếp tục việc đang làm.

### Acceptance Criteria

- [ ] Có trang trước thuộc cùng site thì "Đóng" quay lại trang đó (`router.back()`).
- [ ] Không có trang trước cùng site (mở `/rules` trực tiếp ở tab mới, hoặc đến từ site khác) thì "Đóng" mở trang chủ `/`.
- [ ] Nút nằm cạnh "Viết KUDOS" ở cuối panel, nhãn "Đóng" kèm biểu tượng đóng.

### Technical Notes

- **Endpoint**: N/A — điều hướng phía client, không gọi server
- **Data Required**: lịch sử trình duyệt; đọc bằng Navigation API (`currentEntry.index > 0`, chỉ liệt kê mục cùng origin), nếu không có thì `history.length > 1` và `document.referrer` cùng origin
- **Dependencies**: `features/awards-portal/components/rules-close-button.tsx:15-38` (nhánh về trang chủ dùng `router.push`); `rules-panel.tsx:41-47`; `app/(app)/rules/page.tsx:19-29`; PERM008_SunnerAreaGate
- **Notes**: chữ trên trang là nội dung tĩnh lấy từ thông điệp, không có form hay dữ liệu người dùng; nhánh về trang chủ thêm một mục vào lịch sử (`push`) chứ không thay thế.

### Screens

- SCR012: Rules

### Background Logic

- Không có BL liên quan (hành vi hoàn toàn phía client).

### Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Happy Path | Sunner mở `/rules` từ footer của `/kudos` | Bấm "Đóng" | Quay lại `/kudos` |
| Mở trực tiếp | Dán `/rules` vào tab mới | Bấm "Đóng" | Mở `/` |
| Từ site khác | Vào `/rules` từ link ngoài (referrer khác origin) | Bấm "Đóng" | Mở `/` |
| Error Case | Trình duyệt không có Navigation API và `document.referrer` rỗng | Bấm "Đóng" | Dùng nhánh dự phòng, kết quả vẫn là mở `/` |

---

---

## Screen → US Map

| Screen | US Codes |
|--------|---------|
| SCR001_Login | US016, US020 |
| SCR002_AdminLayout | US001, US002, US019, US020 |
| SCR003_AppLayout | US002, US019, US020, US021, US023, US024, US025 |
| SCR004_Error403 | US022 |
| SCR005_Error404 | US017, US022 |
| SCR006_KudoDetail | US029, US033, US034, US035, US036, US037, US038, US039, US046 |
| SCR007_KudosLiveBoardFeed | US026, US027, US028, US029, US030, US031, US032, US033, US034, US035, US037, US038, US039, US040, US042, US043, US044 |
| SCR008_AwardsSystem | US045, US046, US047 |
| SCR009_CommunityStandards | US021 |
| SCR010_CountdownPrelaunch | US020 |
| SCR011_Homepage | US045, US046 |
| SCR012_Rules | US046, US048 |
| SCR013_AdminReviewContent | US005, US006, US007, US008 |
| SCR014_AdminCampaignSettings | US001, US013, US014, US015 |
| SCR015_OtherProfile | US027, US029, US033, US034, US035, US037, US038, US039, US040, US041, US046 |
| SCR016_OwnProfile | US027, US028, US029, US033, US034, US035, US037, US038, US039, US040, US041, US044 |
| SCR017_AllNotifications | US021, US023, US024, US025 |
| SCR018_AdminUser | US009, US010, US011, US012 |
| SCR019_AdminOverview | US002, US003, US004 |
| SCR020_OnboardingDepartment | US018 |

> Screens with 0 US mapped → emit `[IPE_ZERO]` warning. Không có screen nào có 0 US trong bản kế hoạch này; hai screen không có điều khiển riêng (SCR009_CommunityStandards, SCR010_CountdownPrelaunch) đã được gán story điều hướng hoặc đổi ngôn ngữ ở trên.

## Cross-Reference Validation

- [ ] All US### codes are unique (kiểm sau khi merge fragment)
- [ ] All acceptance criteria are testable (kiểm sau khi merge fragment)
- [ ] All technical notes are complete (kiểm sau khi merge fragment)
- [ ] All US### codes are referenced in FeatureList.md (Wave 5 điền)
- [ ] All `ui` US### mapped to SCR### or SCR###/REG### (parent SCR must exist in ScreenList; system US excluded) (kiểm sau khi merge fragment)
- [ ] All system US### have at least one BL### mapped (UI US excluded; không có system US trong artifact này)
