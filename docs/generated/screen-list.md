# Screen List

## SCR001_Login

**Feature:** F001 — Auth
**Route:** TBD (draft)
**Description:** Khách chưa đăng nhập dùng màn này để đăng nhập vào hệ thống SAA 2025 bằng tài khoản Google công ty.
**States:** loading, empty, error, saving, success

## SCR002_AdminLayout

**Feature:** F002 — AppShell
**Route:** Áp dụng cho mọi trang dưới khu Admin (TBD (draft))
**Description:** Khung riêng của khu Admin để Admin chuyển giữa Overview, Review content, User và Settings.
**States:** loading, empty, error, saving, success

## SCR003_AppLayout

**Feature:** F002 — AppShell
**Route:** Áp dụng cho mọi trang sau đăng nhập (không có địa chỉ riêng; TBD (draft))
**Description:** Khung bao quanh mọi trang sau đăng nhập, giúp Sunner đi tới các trang chính, đổi ngôn ngữ và mở menu tài khoản.
**States:** loading, empty, error, saving, success

## SCR004_Error403

**Feature:** F002 — AppShell
**Route:** Hiện khi người dùng đã đăng nhập nhưng không đủ quyền vào khu vừa mở (TBD (draft))
**Description:** Báo cho Sunner biết họ không có quyền vào khu vừa mở và đưa họ quay về trang chính.
**States:** TBD (draft)

## SCR005_Error404

**Feature:** F002 — AppShell
**Route:** Mọi địa chỉ không khớp trang nào (TBD (draft))
**Description:** Báo cho người dùng biết địa chỉ vừa vào không tồn tại và đưa họ quay về trang chính.
**States:** TBD (draft)

## SCR006_WriteKudoModal

**Feature:** F003 — KudosAuthoring
**Route:** TBD (draft) — modal mở đè lên Live board, route của Live board do F004 sở hữu
**Description:** Sunner dùng modal này để viết Kudo gửi đồng nghiệp, hoặc sửa lại Kudo mình đã đăng; gặp khi bấm ô "gửi lời cảm ơn" trên Live board hoặc nút sửa trên thẻ Kudo của mình.
**States:** loading, loading, empty, error, error, error, saving, success

## SCR007_KudoDetail

**Feature:** F004 — KudosFeed
**Route:** TBD (draft)
**Description:** Sunner đọc đầy đủ một Kudo (lời nhắn dài, mọi ảnh) khi bấm "Xem chi tiết" hoặc mở liên kết được chia sẻ.
**States:** loading, empty, error, success

## SCR008_KudosLiveBoardFeed

**Feature:** F004 — KudosFeed
**Route:** TBD (draft)
**Description:** Sunner xem các Kudo công khai: carousel Highlight (lọc Hashtag, Phòng ban), feed All Kudos và ô tìm profile Sunner, khi vào mục "Sun* Kudos".
**States:** loading, empty, error, saving, success, loading-more

## SCR009_AwardsSystem

**Feature:** F006 — AwardsPortal
**Route:** /awards (TBD (draft))
**Description:** Cho Sunner xem từng hạng mục giải SAA 2025 với mô tả, số lượng và giá trị, và nhảy nhanh giữa các giải.
**States:** initial, scrolling, image-error

## SCR010_CommunityStandards

**Feature:** F006 — AwardsPortal
**Route:** /community-standards (TBD (draft))
**Description:** Cho Sunner đọc tiêu chuẩn cộng đồng của SAA 2025, trong đó có Tiêu chuẩn bảo mật.
**States:** initial

## SCR011_CountdownPrelaunch

**Feature:** F006 — AwardsPortal
**Route:** /countdown (TBD (draft))
**Description:** Cho người dùng vào trước giờ mở hệ thống thấy còn bao lâu nữa và đi xem thông tin giải.
**States:** initial, ticking, reached-zero, image-error

## SCR012_Homepage

**Feature:** F006 — AwardsPortal
**Route:** / (TBD (draft))
**Description:** Giới thiệu SAA 2025 cho Sunner đã đăng nhập: chủ đề, thời gian, địa điểm, các giải và Sun* Kudos, rồi đưa họ tới trang chi tiết.
**States:** initial, ticking, after-event, image-error

## SCR013_Rules

**Feature:** F006 — AwardsPortal
**Route:** /rules (TBD (draft))
**Description:** Cho Sunner đọc thể lệ: bậc huy hiệu Hero, luật Secret Box và Kudos Quốc Dân. Màn chỉ hiển thị chữ mô tả, luật do feature khác tính.
**States:** initial, image-error

## SCR014_AdminReviewContent

**Feature:** F007 — AdminModeration
**Route:** TBD (draft) — trang "Review content" dưới khu Admin
**Description:** Admin rà soát mọi Kudo trong một bảng, lọc và tìm bài nghi vấn, tạm ẩn (Mark Spam) hoặc trả lại (Un Spam) từng bài và xuất danh sách đang lọc.
**States:** loading, empty, error, saving, success, exporting, export-error

## SCR015_SpamAlertOverlay

**Feature:** F007 — AdminModeration
**Route:** Không có route riêng — hiển thị trong danh sách "Đã gửi" trên profile của chính chủ bài (màn do F012 sở hữu; TBD (draft))
**Description:** Cho chủ bài thấy Kudo của mình đang bị tạm ẩn khỏi các trang công khai và lý do chung: vi phạm tiêu chuẩn cộng đồng.
**States:** loading, empty, error, spam, restored

## SCR016_SpotlightBoardRegion

**Feature:** F008 — SpotlightBoard
**Route:** — (không có route riêng; là vùng R4 "Slot Spotlight Board" của trang SCR008_KudosLiveBoardFeed do F004_KudosFeed sở hữu; route của trang: TBD (draft))
**Description:** Sunner xem nhanh ai đang được ghi nhận Kudos: đám mây tên người nhận, tổng số Kudos và các dòng sự kiện mới nhất cập nhật trực tiếp, khi cuộn tới giữa Highlight Kudos và All Kudos trên Live board.
**States:** loading, empty, error, reconnecting, live-failed, search-no-match, saving, success

## SCR017_LiveBoardRewardsColumn

**Feature:** F010 — SecretBoxRewards
**Route:** TBD (draft) — không có route riêng; là vùng nhúng R6 (cột phải) của trang SCR008_KudosLiveBoardFeed do F004_KudosFeed sở hữu. Bảng thống kê cá nhân (R1 dưới đây) còn được dùng lại trên profile của chính mình (F012, TBD (draft)).
**Description:** Sunner xem tiến độ phần thưởng của mình (Kudos nhận/gửi, tim, Secret Box đã/chưa mở), mở Secret Box, và thấy đồng nghiệp nào vừa nhận quà, mỗi khi vào Live board.
**States:** loading, empty, error, saving, success, no-box

## SCR018_SecretBoxOpen

**Feature:** F010 — SecretBoxRewards
**Route:** TBD (draft) — mặc định là modal phủ lên Live board (kích thước tham chiếu 651×822 trong Figma), mở được bằng đường dẫn từ thông báo
**Description:** Sunner có Secret Box chưa mở bấm vào hộp để mở và biết mình nhận được icon hay quà gì từ BTC SAA 2025.
**States:** loading, waiting (chưa mở), opening, result, empty (hết hộp), error, saving, success

## SCR019_AdminCampaignSettings

**Feature:** F011 — AdminCampaigns
**Route:** `/admin/settings` (`app/admin/settings/page.tsx`)
**Description:** Admin xem mọi campaign "x2 heart" trong một bảng, mở menu từng dòng để sửa hoặc xoá, và bấm Add Campaign để tạo mới.
**States:** loading, empty, error, saving, success, error-delete

## SCR020_CampaignFormModal

**Feature:** F011 — AdminCampaigns
**Route:** TBD (draft) — hộp thoại nổi trên SCR019_AdminCampaignSettings, không có route riêng
**Description:** Admin nhập tên và giờ bắt đầu, giờ kết thúc để thêm campaign mới (hộp "Add Campaign") hoặc đổi campaign hiện có (hộp "Edit Campaign").
**States:** loading, empty, error, saving, success

## SCR021_AvatarHoverCard

**Feature:** F012 — Profile
**Route:** N/A — lớp phủ nhỏ trên trang chứa avatar, không có địa chỉ riêng
**Description:** Sunner rê chuột lên avatar một đồng nghiệp (trên thẻ Kudo, profile...) để xem nhanh họ là ai mà không rời trang. (Figma 721:5827, instance "Infor - HoverAvatar" 2268:35101, khoảng 344×300)
**States:** loading, empty, error, saving, success

## SCR022_OtherProfile

**Feature:** F012 — Profile
**Route:** TBD (draft) — đề xuất địa chỉ có mã Sunner
**Description:** Sunner xem thông tin, huy hiệu, bộ sưu tập icon của đồng nghiệp, đọc Kudo họ đã nhận và gửi lời cảm ơn tới họ. (Figma 362:5097)
**States:** loading, empty, error, not-found, saving, success

## SCR023_OwnProfile

**Feature:** F012 — Profile
**Route:** TBD (draft) — đề xuất trang cố định riêng cho "profile của tôi"
**Description:** Sunner xem thông tin, huy hiệu Hero, bộ sưu tập icon, số liệu cá nhân và các Kudo mình đã gửi/đã nhận; mở từ mục Profile của menu avatar. (Figma 362:5037)
**States:** loading, empty, error, saving, success, loading-more

## SCR024_AllNotifications

**Feature:** F013 — Notifications
**Route:** TBD (draft) — trang riêng trong khu Sunner, mở từ liên kết "Xem tất cả" ở dropdown thông báo
**Description:** Sunner xem lại toàn bộ thông báo của mình, kể cả những thông báo đã trôi khỏi dropdown, và đánh dấu đã đọc hàng loạt.
**States:** loading, loading-more, empty, error, saving, success

## SCR025_NotificationDropdown

**Feature:** F013 — Notifications
**Route:** — (không có route riêng; là bảng thả xuống mở từ chuông ở header của SCR003_AppLayout do F002_AppShell sở hữu; route của các trang chứa header: TBD (draft))
**Description:** Sunner bấm chuông ở header để xem nhanh các thông báo mới nhất và đi thẳng tới đối tượng liên quan mà không rời trang đang dùng.
**States:** loading, empty, error, saving, success, live-update

## SCR026_AdminUser

**Feature:** F014 — AdminUserManagement
**Route:** TBD (draft) — trang "User" dưới khu Admin
**Description:** Admin xem toàn bộ Sunner cùng số liệu tham gia trong một bảng, lọc và tìm người cần xem, sắp theo cột số liệu, đổi role từng người và xuất danh sách đang lọc.
**States:** loading, empty, error, saving, success, exporting, export-error, filter-options-error

## SCR027_AdminOverview

**Feature:** F015 — AdminOverview
**Route:** TBD (draft) — trang "Overview" dưới khu Admin
**Description:** Admin xem số liệu Kudo và Secret Box theo từng đơn vị trong một bảng, chọn khoảng ngày để thu hẹp giai đoạn và xuất bảng ra tệp CSV.
**States:** loading, empty, error, exporting, export-error, success

