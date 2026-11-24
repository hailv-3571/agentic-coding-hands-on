# Screen List

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Analysis Scope**: `app/` (18 `page.tsx`, 4 `layout.tsx`, `not-found.tsx`, `forbidden.tsx`, `loading.tsx`/`error.tsx`), import sâu một cấp vào `features/*/components`, `features/*/server`, `shared/*`; đối chiếu `route-list.md` (18 URL trang, 36 route backend) và `data-model.md`

**Code Format**: All codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm, SCR002_Dashboard) | `SCR###/REG###` for region-scoped references within a composite screen

**Note**: Feature mapping is managed in FeatureList.md only. UserStory mapping is done in UserStories.md (not in this document).

**Region Guidance**: Declare a Region only when it has ≥1 independence signal: distinct API endpoint (read or write), independent loading state, independent scroll container, independent auth / permission gate, distinct business workflow, distinct mutation surface / API cluster (distinct write endpoints or POST/PUT/DELETE namespace — even if the initial GET payload is shared), or distinct validation / action path. Shared initial payload does NOT disqualify a REG — if regions diverge on mutations, validation, or business workflow, they remain separate. Visual separation alone is NOT sufficient (trap 1).

**Region Cross-ref**: Region codes are per-screen; REG001 under SCR001 is distinct from REG001 under SCR002.

**REG Numbering**: Assign REG001, REG002, ... in top-to-bottom visual order as rendered at the screen's default viewport (desktop default if responsive). Ties broken by left-to-right reading order. Researcher documents source file:line for each REG to allow reviewer verification.

**Region Deprecation**: Regions table MAY include a `status` column with values `active` | `deprecated`. Deprecated regions keep their REG### number reserved (no renumbering); downstream refs remain valid; reviewer emits WARNING (not critical) until spec-wide cleanup.

## Screen Index

| Code | Name | Type | Components | Data Displayed |
|------|------|------|------------|----------------|
| SCR001_Login | Login | atomic | 6 | 2 |
| SCR002_AdminLayout | AdminLayout | atomic | 7 | 2 |
| SCR003_AppLayout | AppLayout | composite | 7 | 3 |
| SCR004_Error403 | Error403 | atomic | 3 | 1 |
| SCR005_Error404 | Error404 | atomic | 2 | 1 |
| SCR006_KudoDetail | KudoDetail | atomic | 11 | 3 |
| SCR007_KudosLiveBoardFeed | KudosLiveBoardFeed | composite | 10 | 7 |
| SCR008_AwardsSystem | AwardsSystem | atomic | 6 | 2 |
| SCR009_CommunityStandards | CommunityStandards | atomic | 3 | 1 |
| SCR010_CountdownPrelaunch | CountdownPrelaunch | atomic | 6 | 2 |
| SCR011_Homepage | Homepage | atomic | 5 | 3 |
| SCR012_Rules | Rules | atomic | 6 | 2 |
| SCR013_AdminReviewContent | AdminReviewContent | atomic | 10 | 3 |
| SCR014_AdminCampaignSettings | AdminCampaignSettings | atomic | 8 | 1 |
| SCR015_OtherProfile | OtherProfile | atomic | 5 | 5 |
| SCR016_OwnProfile | OwnProfile | atomic | 6 | 6 |
| SCR017_AllNotifications | AllNotifications | atomic | 6 | 2 |
| SCR018_AdminUser | AdminUser | atomic | 10 | 3 |
| SCR019_AdminOverview | AdminOverview | atomic | 7 | 2 |
| SCR020_OnboardingDepartment | OnboardingDepartment | atomic | 3 | 2 |

---

## SCR001_Login

**Type**: atomic

**Classification**: atomic — H1: 1 feature slice (`auth`), H2: 1 module → không đạt 2-of-3. Layout `(public)` không phải outlet H6 (con `/countdown` không có lệnh gọi API riêng) nên khung header/footer chỉ ghi như ngữ cảnh chung.

### Description

Màn đăng nhập cho khách chưa có phiên: logo ROOT FURTHER, hai dòng giới thiệu và nút "LOGIN With Google" (chỉ tài khoản cùng tên miền công ty). Người đã đăng nhập bị proxy đưa về `/`. Query `next` được giữ qua OAuth để quay lại đúng trang; query `error` hiện banner `domain_not_allowed` hoặc `auth_failed`. Header (logo + đổi ngôn ngữ) và footer tối giản lấy từ layout `(public)`.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| PublicHeader | header | Logo và LanguageSwitcher, không có menu (layout `(public)`) |
| LoginArtwork | image | Ảnh nền và wordmark ROOT FURTHER làm `<h1>` (`app/(public)/login/page.tsx`) |
| GoogleSignInForm | form | `useActionState` gọi `signInWithGoogle`, gửi `next` ẩn, hiện lỗi |
| GoogleSignInButton | button | Nút Google, trạng thái pending khi đang chuyển hướng |
| LoginErrorBanner | banner | Báo `domain_not_allowed` / `auth_failed` từ query `error` hoặc kết quả action |
| AppFooter (minimal) | footer | Dòng bản quyền, không có link |

### Data Displayed

- Data Entity 1: Mã lỗi đăng nhập `LoginErrorCode` (từ query `error`, không phải bảng)
- Data Entity 2: Tên miền email được phép (`ALLOWED_EMAIL_DOMAIN`, cấu hình env)

### Routes/URLs

- `/login` (query `next`, `error`)

### Service Calls

- `signInWithGoogle` — ROUTE021 (server action POST `/login`), gọi `supabase.auth.signInWithOAuth`; đích quay về là ROUTE020 `GET /auth/callback`
- Helper: `safeNextPath`, `parseLoginErrorCode`, `env` (đọc `ALLOWED_EMAIL_DOMAIN`)

### Related Screens

- SCR011_Homepage: Homepage (đích sau đăng nhập khi `next` rỗng)
- SCR020_OnboardingDepartment: OnboardingDepartment (đăng nhập lần đầu, chưa có phòng ban)
- SCR010_CountdownPrelaunch: CountdownPrelaunch (trước `LAUNCH_AT`, người không phải admin bị đưa về đó)

---

## SCR002_AdminLayout

**Type**: atomic

**Classification**: atomic — H6 parent shell: `app/admin/layout.tsx` bọc 4 route con có URL, file và truy vấn riêng (`/admin/overview`, `/admin/review`, `/admin/users`, `/admin/settings`). Shell có điều hướng cố định (AdminTopBar) và guard riêng `requireShellAdmin()` nên được giữ làm SCR; không tạo REG cho route con. H1/H2: chỉ slice `app-shell` → atomic.

### Description

Khung riêng của khu Admin: thanh trên có logo kèm nhãn ADMIN (bấm về trang Sunner), 4 mục menu, đổi ngôn ngữ và menu tài khoản; footer tối giản. Guard `requireShellAdmin()` chạy trước nên người không phải admin không bao giờ nhận markup admin. Không có chuông thông báo trong khung này.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| AdminTopBar | header | Thanh trên sticky: logo + ADMIN, 4 mục Overview / Review content / User / Settings |
| MobileNavMenu | nav | Menu thu gọn dưới breakpoint `md` |
| NavLinks | nav | Đánh dấu mục đang mở theo pathname (`isRouteActive`) |
| HeaderActions | cluster | Gom LanguageSwitcher và AccountMenu |
| LanguageSwitcher | control | Đổi vi/en qua `setLocaleAction` |
| AccountMenu | menu | Profile, Dashboard, Logout (`signOut`) |
| AppFooter (minimal) | footer | Dòng bản quyền |

### Data Displayed

- Data Entity 1: `ShellUser` (tên, avatar, cờ admin) đọc từ MODEL004_Profile
- Data Entity 2: Ngôn ngữ hiện tại (cookie `NEXT_LOCALE`)

### Routes/URLs

- `/admin/overview`
- `/admin/review`
- `/admin/users`
- `/admin/settings`
- `/admin` (chỉ chuyển hướng về `/admin/overview`, không phải SCR riêng)

### Service Calls

- `requireShellAdmin` → `requireAdmin` (kiểm role từ DB, thuộc Permissions)
- `signOut` — ROUTE035; `setLocaleAction` — ROUTE036

### Related Screens

- SCR019_AdminOverview: AdminOverview (child, mục Overview)
- SCR013_AdminReviewContent: AdminReviewContent (child, mục Review content)
- SCR018_AdminUser: AdminUser (child, mục User)
- SCR014_AdminCampaignSettings: AdminCampaignSettings (child, mục Settings)
- SCR011_Homepage: Homepage (logo ADMIN và menu tài khoản đưa về khu Sunner)
- SCR004_Error403: Error403 (người không phải admin vào `/admin`)

---

## SCR003_AppLayout

**Type**: composite

**Classification**: composite — H1∧H2: file layout import 3 slice `app-shell`, `kudos-authoring`, `notifications` (H1 ≥3, H2 ≥2); H3 không tính (không có wrapper đặt tên theo Card/Panel/Section ở cấp file). Đồng thời là H6 parent shell: bọc 9 route Sunner, có nav cố định, chuông có dữ liệu riêng và guard `requireSunner()`. Không tạo REG cho các route con.

### Description

Khung bao mọi trang Sunner sau đăng nhập (route group `(app)`). Guard `requireSunner()`: khách → `/login`, chưa chọn phòng ban → `/onboarding/department`, có phiên nhưng không có profile → 401. Header: logo, 3 link chính (Về SAA, Thông tin giải, Sun* Kudos), chuông thông báo, đổi ngôn ngữ, menu tài khoản. Footer có 5 link. Toast xác nhận của composer Kudo đặt ở khung này để refresh trang hay remount feed không cắt mất toast.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| AppHeader | header | Logo, NavLinks 3 mục, chỗ gắn chuông và cụm hành động bên phải |
| MobileNavMenu | nav | Menu thu gọn dưới breakpoint `md` |
| NotificationBellSlot | server slot | Đọc `getUnreadCount` lúc render rồi dựng NotificationBell (REG001) |
| LanguageSwitcher | control | Đổi vi/en qua `setLocaleAction` |
| AccountMenu | menu | Profile; Dashboard chỉ hiện với admin (cosmetic); Logout qua `signOut` |
| KudoComposerToastHost | toast host | Toast "đã gửi / đã lưu Kudo" sống trên mọi trang Sunner |
| AppFooter | footer | 5 link: About SAA 2025, Award Information, Sun* Kudos, Thể lệ, Tiêu chuẩn chung (`shell.nav.*`) |

### Data Displayed

- Data Entity 1: `ShellUser` (tên, avatar, cờ admin) từ MODEL004_Profile
- Data Entity 2: Cờ "còn thông báo chưa đọc" từ MODEL016_Notification
- Data Entity 3: Ngôn ngữ hiện tại (cookie `NEXT_LOCALE`)

### Routes/URLs

- `/`
- `/awards`
- `/community-standards`
- `/kudos`
- `/kudos/:id`
- `/notifications`
- `/profile`
- `/profile/:userId`
- `/rules`

### Service Calls

- `requireSunner`, `getShellUser` (đọc phiên và profile, thuộc Permissions)
- `getUnreadCount` (đối ứng ROUTE012 `GET /api/notifications/unread-count`)
- `signOut` — ROUTE035; `setLocaleAction` — ROUTE036
- Hook `useNotificationChannel` (kênh Realtime `notifications:{userId}`) — chạy trong NotificationBell

### Related Screens

- SCR017_AllNotifications: AllNotifications (navigation, "Xem tất cả" trong dropdown chuông)
- SCR016_OwnProfile: OwnProfile (navigation, mục Profile của menu tài khoản)
- SCR019_AdminOverview: AdminOverview (navigation, mục Dashboard của admin)
- SCR001_Login: Login (Logout, hoặc khách bị `requireSunner` đưa về)
- SCR020_OnboardingDepartment: OnboardingDepartment (người chưa có phòng ban bị đưa tới)
- SCR011_Homepage: Homepage (child, logo và mục Về SAA)
- SCR008_AwardsSystem: AwardsSystem (child, mục Thông tin giải)
- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (child, mục Sun* Kudos)
- SCR006_KudoDetail: KudoDetail (child)
- SCR012_Rules: Rules (child, footer)
- SCR009_CommunityStandards: CommunityStandards (child, footer)
- SCR015_OtherProfile: OtherProfile (child)

### Regions

| Code | Label | Owner | Independence Signals |
|------|-------|-------|---------------------|
| REG001_NotificationBell | Chuông thông báo và dropdown 10 thông báo mới nhất | F013_Notifications | own endpoints `GET /api/notifications` (ROUTE011) và `GET /api/notifications/unread-count` (ROUTE012); own mutation `markNotificationRead` / `markAllNotificationsRead` (ROUTE033, ROUTE034); own Realtime channel `notifications:{userId}`; own loading state (`app/(app)/layout.tsx:22`) |

---

## SCR004_Error403

**Type**: atomic

**Classification**: atomic — chỉ import slice `app-shell`; trang tĩnh. Cùng một view (`ForbiddenPanel`) được hiển thị cho cả `/access-denied` và `app/forbidden.tsx` nên chỉ là một SCR.

### Description

Báo người dùng đã đăng nhập nhưng không đủ quyền vào khu vừa mở và đưa họ về trang chủ. Proxy tự fetch `/access-denied` (không cookie) để dựng thân của HTTP 403 cho người không phải admin vào `/admin`; guard gọi `forbidden()` cũng dùng chung view qua `app/forbidden.tsx`. Mở trực tiếp URL này chỉ là trang tĩnh trả 200.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| ForbiddenPanel | panel | Nội dung 403: tiêu đề, mô tả, minh hoạ (nguồn duy nhất cho hai điểm vào) |
| ErrorPanel | frame | Khung toàn màn hình chung 403/404: nền mờ ROOT FURTHER, minh hoạ, văn bản |
| CTA "Về trang chủ" | button | Link tới `/` |

### Data Displayed

- Data Entity 1: Nội dung tĩnh `errors.forbidden` (messages vi/en), không có dữ liệu người dùng

### Routes/URLs

- `/access-denied`

### Service Calls

- Không có lệnh gọi dữ liệu. Phía proxy: `accessDeniedPage` (fetch nội bộ, `shared/auth/access-denied-response.ts`) — xem Permissions

### Related Screens

- SCR011_Homepage: Homepage (navigation, nút về trang chủ)
- SCR002_AdminLayout: AdminLayout (nguồn gây ra 403 khi non-admin vào `/admin`)

---

## SCR005_Error404

**Type**: atomic

**Classification**: atomic — file `app/not-found.tsx` là view riêng của Next.js cho mọi URL không khớp route (status 404), không có URL cụ thể nên mô tả bằng lời thay vì wildcard. 404 riêng của `/kudos/:id` và `/profile/:userId` là trạng thái của SCR006 và SCR015, không tách SCR.

### Description

Báo địa chỉ vừa vào không tồn tại và đưa về trang chính: người đã đăng nhập thấy nút Home, nhánh không có người dùng thấy nút Login (D005). Khách thật không tới được trang này vì proxy chuyển mọi đường không công khai về `/login?next=` trước (`shared/auth/route-access-policy.ts:35-39`); nhánh Login thực tế chỉ gặp khi có phiên nhưng thiếu dòng profile. Hiển thị với status 404.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| ErrorPanel | frame | Khung chung với 403: tiêu đề, minh hoạ 404, mô tả |
| CTA Home / Login | button | Đích chọn theo `getShellUser()`: có người dùng → `/`, không có (phiên thiếu profile) → `/login` |

### Data Displayed

- Data Entity 1: `ShellUser` (chỉ để chọn nút, không hiển thị tên)

### Routes/URLs

- Mọi URL không khớp route nào (không có đường dẫn cụ thể; render bởi `app/not-found.tsx`)

### Service Calls

- `getShellUser` (đọc phiên + profile)

### Related Screens

- SCR011_Homepage: Homepage (navigation, người đã đăng nhập)
- SCR001_Login: Login (navigation, khi `getShellUser()` trả rỗng)

---

## SCR006_KudoDetail

**Type**: atomic

**Classification**: atomic — H2 đạt (2 module: `kudos-authoring`, `kudos-feed`) nhưng H1 chỉ 2 slice và H3 không có wrapper đặt tên → không đạt 2-of-3.

### Description

Trang đọc đầy đủ một Kudo tại `/kudos/{id}`: panel 680 giữa nền keyvisual tối, lời nhắn không cắt, mọi ảnh, mọi hashtag, tim, Copy Link và nút Đóng về Live board. Id sai, không có, hoặc Kudo spam của người khác đều cho `notFound()` cùng một nội dung (soft 404, không lộ sự tồn tại). Kudo spam của chính chủ hiện overlay mờ và tag Spam, ẩn tim và Copy Link. Đọc lỗi thì hiện khối báo lỗi kèm link thử lại.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LiveBoardKeyvisualBackground | background | Nền keyvisual làm tối (`dimmed`) |
| KudoDetailView | article | Panel 680: tiêu đề, người gửi/nhận, thời gian, nội dung, ảnh, hashtag, hàng hành động |
| KudoCardPeople | person block | Người gửi (ẩn danh hiện biệt danh) và người nhận; bọc AvatarHoverCard cho người có tên (gọi `GET /api/sunners/:userId/card`) |
| KudoBodyMarkdown | markdown | Render AST chỉ gồm chữ, đậm/nghiêng/gạch, link http(s) |
| KudoCardImages | gallery | Mọi ảnh bằng signed URL, bấm mở tệp đầy đủ ở tab mới |
| KudoCardHashtags | tags | Toàn bộ hashtag của Kudo |
| KudoCardHeartSlot | button | KudoHeartButton: thả/bỏ tim optimistic, khoá khi hết cửa sổ ghi |
| KudoCopyLinkButton | button | Copy `/kudos/{id}` vào clipboard kèm toast |
| SpamAlertOverlay | overlay | Lớp mờ không đóng được và KudoSpamTag, chỉ khi Kudo spam của chính chủ |
| KudoNotFound | state | `not-found.tsx` của `/kudos/:id`: một thông báo chung và nút về Live board |
| Load-failed alert | state | Khối `role="alert"` khi đọc lỗi, link thử lại |

### Data Displayed

- Data Entity 1: Kudo kèm hashtag, ảnh, số tim (MODEL003_Kudo, MODEL005_KudoHashtag, MODEL006_KudoImage, MODEL008_KudoHeart)
- Data Entity 2: Hồ sơ người gửi và người nhận (MODEL004_Profile)
- Data Entity 3: Trạng thái cửa sổ ghi `isKudoWritingOpen` (cấu hình thời gian sự kiện)

### Routes/URLs

- `/kudos/:id`

### Service Calls

- `KudoPublicQuery.findForViewer` (đọc RSC; cùng module với ROUTE007 `GET /api/kudos`), `isKudoWritingOpen`, `signKudoImageReadUrls`
- `addHeartAction` — ROUTE025; `removeHeartAction` — ROUTE026
- `GET /api/sunners/:userId/card` — ROUTE019 (hover card)

### Related Screens

- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (navigation, nút Đóng và nút về Live board ở trạng thái 404)
- SCR015_OtherProfile: OtherProfile (navigation, bấm tên hoặc avatar người có tên)
- SCR016_OwnProfile: OwnProfile (navigation, khi người đó là chính mình)
- SCR003_AppLayout: AppLayout (parent)

---

## SCR007_KudosLiveBoardFeed

**Type**: composite

**Classification**: composite — H1∧H2: `app/(app)/kudos/page.tsx` import 3 slice `auth`, `kudos-authoring`, `kudos-feed` (H1 ≥3; ngoài ra hai slot kéo thêm `spotlight-board` và `secret-box-rewards`) và 3 module miền (H2 ≥2). H3 không tính ở cấp file (chỉ 1 `<section>` trong page; các vùng là component slot tự đặt tên — [H3_RAW_DIV]). Không có tab hay stepper (H4/H5 không áp dụng); H6 không áp dụng (không phải outlet).

### Description

Live board `/kudos` của Sun* Kudos: tiêu đề và keyvisual, hàng hành động (ô viết Kudo và ô tìm profile Sunner), HIGHLIGHT KUDOS (5 Kudo nhiều tim nhất, lọc theo hashtag và phòng ban), SPOTLIGHT BOARD realtime, rồi ALL KUDOS (feed phân trang cursor) cạnh cột phần thưởng. Phần theo request streaming sau skeleton; mỗi vùng tự đọc lỗi thành trạng thái lỗi riêng thay vì làm hỏng cả trang. Deep link `/kudos?secretBox=open` mở modal Secret Box.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LiveBoardKeyvisualBackground / LiveBoardHeading | header | Keyvisual dưới header trong suốt và tiêu đề Live board |
| LiveBoardSkeleton | skeleton | Fallback Suspense cho phần theo request |
| KudoComposerLauncher | button + modal | Ô "Hôm nay, bạn muốn gửi lời cảm ơn…" mở KudoComposerModal (tạo mới); khoá khi hết cửa sổ ghi (REG001) |
| SunnerProfileSearch | combobox | Tìm Sunner, chọn xong mở `/profile/{id}` (REG002) |
| HighlightSection | section | Header với 2 HighlightFilterDropdown, HighlightCarousel và pager (REG003) |
| LiveBoardSpotlightSlot / SpotlightBoardRegion | section | Đám mây tên người nhận, bộ đếm KUDOS, ô tìm, ticker, fullscreen (REG004) |
| AllKudosFeed | list | Trang đầu từ RSC, "Tải thêm" nối trang cũ, thông báo số thẻ mới (REG005) |
| KudoCard | card | Thẻ post/highlight: hero badge, AvatarHoverCard, KudoHeartButton, Copy Link, bút sửa của chủ Kudo (mở KudoComposerModal chế độ sửa) |
| LiveBoardRewardsColumnSlot / RewardsColumn | aside | PersonalStatsPanel, nút Mở Secret Box (SecretBoxLauncher, SecretBoxModal), LatestGiftWinnersList (REG006) |
| LiveBoardSectionHeader | header | Tiêu đề section dùng chung cho Highlight, Spotlight, All Kudos |

### Data Displayed

- Data Entity 1: Kudo công khai kèm hashtag và ảnh (MODEL003_Kudo, MODEL005_KudoHashtag, MODEL006_KudoImage)
- Data Entity 2: Tim và hệ số campaign (MODEL008_KudoHeart, MODEL009_Campaign)
- Data Entity 3: Lựa chọn lọc phòng ban (MODEL001_Department)
- Data Entity 4: Lựa chọn lọc hashtag (MODEL002_Hashtag)
- Data Entity 5: Snapshot Spotlight (số Kudo, tên người nhận, dòng sự kiện) suy ra từ MODEL003_Kudo và MODEL004_Profile
- Data Entity 6: Thống kê phần thưởng cá nhân và người nhận quà mới nhất (MODEL011_SecretBox, MODEL012_UserIcon, MODEL013_MysteryGiftAward)
- Data Entity 7: Trạng thái cửa sổ ghi `isKudoWritingOpen`

### Routes/URLs

- `/kudos` (query `secretBox=open` mở modal Secret Box)

### Service Calls

- Server (RSC): `KudoPublicQuery.list`, `listHighlightKudos`, `listActiveHashtags`, `listDepartmentOptions`, `isKudoWritingOpen`, `loadSpotlightSnapshot`, `loadRewardsColumnData`, `requireSunner`
- REG001: `createKudo` — ROUTE023; `updateKudo` — ROUTE024; `POST /api/kudos/images/sign` — ROUTE010; `GET /api/kudos/:id/edit` — ROUTE009; `GET /api/hashtags` — ROUTE013; Storage `uploadKudoImage` (browser)
- REG002: `GET /api/sunners/search` — ROUTE018
- REG003: `GET /api/kudos/highlight` — ROUTE008
- REG004: `GET /api/spotlight` — ROUTE017; kênh Realtime `spotlight` qua `useSpotlightChannel`
- REG005: `GET /api/kudos` — ROUTE007; trong thẻ: `addHeartAction` — ROUTE025, `removeHeartAction` — ROUTE026, `GET /api/sunners/:userId/card` — ROUTE019
- REG006: `GET /api/secret-boxes/me` — ROUTE015; `POST /api/secret-boxes/open` — ROUTE016

### Related Screens

- SCR006_KudoDetail: KudoDetail (navigation, "Xem chi tiết" trên thẻ Kudo)
- SCR015_OtherProfile: OtherProfile (navigation, chọn kết quả tìm Sunner, bấm tên/avatar, tên trong Spotlight)
- SCR016_OwnProfile: OwnProfile (navigation, khi người được chọn là chính mình)
- SCR009_CommunityStandards: CommunityStandards (navigation, link trong thanh công cụ của composer)
- SCR017_AllNotifications: AllNotifications (nguồn deep link `/kudos?secretBox=open` từ thông báo hộp quà)
- SCR003_AppLayout: AppLayout (parent)

### Regions

| Code | Label | Owner | Independence Signals |
|------|-------|-------|---------------------|
| REG001_KudoComposer | Ô viết Kudo và modal viết/sửa Kudo | F003_KudosAuthoring | distinct mutation surface `createKudo` / `updateKudo` / `POST /api/kudos/images/sign` (ROUTE023, ROUTE024, ROUTE010); distinct validation (`KudoInputSchema`, cửa sổ ghi); own loading state (`app/(app)/kudos/page.tsx:59`) |
| REG002_SunnerProfileSearch | Ô tìm profile Sunner | F004_KudosFeed | own endpoint `GET /api/sunners/search` (ROUTE018); own loading state (debounce 250 ms) (`page.tsx:60`) |
| REG003_HighlightKudos | HIGHLIGHT KUDOS | F004_KudosFeed | own endpoint `GET /api/kudos/highlight` (ROUTE008); bộ lọc hashtag/phòng ban riêng; own loading và error state (`page.tsx:62`) |
| REG004_SpotlightBoard | SPOTLIGHT BOARD | F008_SpotlightBoard | own endpoint `GET /api/spotlight` (ROUTE017) và private Realtime channel `spotlight`; own Suspense boundary và load error (`page.tsx:68`) |
| REG005_AllKudosFeed | ALL KUDOS feed | F004_KudosFeed | own endpoint `GET /api/kudos` (ROUTE007) phân trang cursor; own loading-more state (`page.tsx:73`) |
| REG006_RewardsColumn | Cột phần thưởng: thống kê cá nhân, Mở Secret Box, 10 người nhận quà mới nhất | F010_SecretBoxRewards | own endpoints `GET /api/secret-boxes/me` (ROUTE015) và `POST /api/secret-boxes/open` (ROUTE016, Idempotency-Key — distinct mutation); own Suspense boundary (`page.tsx:75`) |

---

## SCR008_AwardsSystem

**Type**: atomic

**Classification**: atomic — chỉ import slice `awards-portal`; các khối là component đặt tên riêng, không có tín hiệu độc lập.

### Description

Trang "Hệ thống giải": keyvisual, tiêu đề, menu neo bên trái cạnh 6 khối giải (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) với mô tả, số lượng và giá trị, rồi banner Sun* Kudos. `/awards#<slug>` cuộn tới đúng khối; hash lạ thì trang đứng ở đầu.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| PortalKeyvisualBackground | background | Keyvisual dưới header |
| ROOT FURTHER logo | image | Logo trên đầu trang |
| PortalSectionHeader | header | Chú thích và tiêu đề `<h1>` căn giữa |
| AwardsAnchorMenu | nav | Menu neo 178 px, đánh dấu khối đang đọc theo vị trí cuộn |
| AwardDetailBlock | block | 6 khối giải, ảnh xen kẽ trái/phải (AwardThumbnail, AwardPrizeFacts) |
| KudosBanner | banner | Lời mời tới Sun* Kudos |

### Data Displayed

- Data Entity 1: Danh sách 6 giải tĩnh `AWARDS` (slug, số lượng, giá trị, ảnh) từ `features/awards-portal/data/awards-data.ts`
- Data Entity 2: Nội dung dịch `awardsPortal.awards` (messages vi/en)

### Routes/URLs

- `/awards` (hash `#<slug>`)

### Service Calls

- `requireSunner`; không có lệnh gọi dữ liệu khác (dữ liệu tĩnh)

### Related Screens

- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (navigation, nút trong KudosBanner)
- SCR011_Homepage: Homepage (nguồn vào qua `award-card` với `/awards#<slug>`)
- SCR003_AppLayout: AppLayout (parent)

---

## SCR009_CommunityStandards

**Type**: atomic

**Classification**: atomic — H2 đạt (2 module: `awards-portal`, `kudos-feed` chỉ để mượn keyvisual) nhưng H1 chỉ 2 slice và không có tín hiệu độc lập → atomic.

### Description

Trang "Tiêu chuẩn cộng đồng" của SAA 2025, gồm cả Tiêu chuẩn bảo mật: keyvisual Live board dưới header, logo ROOT FURTHER rồi nội dung tĩnh lấy từ messages. Không có form hay dữ liệu người dùng.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LiveBoardKeyvisualBackground | background | Mượn keyvisual của Live board |
| ROOT FURTHER logo | image | Logo 451×200 |
| CommunityStandardsContent | content | Văn bản tiêu chuẩn cộng đồng và tiêu chuẩn bảo mật |

### Data Displayed

- Data Entity 1: Nội dung tĩnh `awardsPortal.standards` (messages vi/en)

### Routes/URLs

- `/community-standards`

### Service Calls

- `requireSunner`; không có lệnh gọi dữ liệu khác

### Related Screens

- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (nguồn vào từ thanh công cụ composer)
- SCR017_AllNotifications: AllNotifications (nguồn vào từ link trong dòng thông báo Kudo bị ẩn)
- SCR003_AppLayout: AppLayout (parent, footer)

---

## SCR010_CountdownPrelaunch

**Type**: atomic

**Classification**: atomic — chỉ import slice `awards-portal`; đây là trang công khai dưới layout `(public)`.

### Description

Trang cho người vào trước giờ mở hệ thống: tiêu đề và đồng hồ DAYS/HOURS/MINUTES đếm tới `LAUNCH_AT` trên keyvisual mờ, giữa màn hình. Đồng hồ dùng giờ máy chủ nên đồng hồ lệch của thiết bị không đổi kết quả. Về 0 thì `router.replace('/')`; proxy vẫn là bên quyết định `/` hiển thị gì (sau khi mở, `/countdown` tự chuyển về `/`). Không có link tới thông tin giải.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| PublicHeader | header | Logo và LanguageSwitcher (layout `(public)`) |
| PortalKeyvisualBackground | background | Keyvisual mờ phủ kín |
| Title `<h1>` | heading | Tiêu đề trang đếm ngược |
| CountdownTimer | timer | Tính phần còn lại theo giờ máy chủ, vùng đọc `aria-live` đổi theo phút |
| CountdownDigitTile | tile | Ô số cho từng đơn vị |
| AppFooter (minimal) | footer | Dòng bản quyền |

### Data Displayed

- Data Entity 1: Mốc `LAUNCH_AT` (env)
- Data Entity 2: Giờ máy chủ lúc render (`readRequestTimeMs`)

### Routes/URLs

- `/countdown`

### Service Calls

- `readRequestTimeMs`; hook `useServerClockNow` (đồng hồ phía client); `prelaunchGateStep` (proxy) quyết định ai bị đưa tới trang này

### Related Screens

- SCR011_Homepage: Homepage (navigation, tự chuyển khi đồng hồ về 0)
- SCR001_Login: Login (khách vẫn vào được `/login` trong lúc prelaunch)

---

## SCR011_Homepage

**Type**: atomic

**Classification**: atomic — chỉ import slice `awards-portal` (H1/H2 không đạt).

### Description

Trang chủ SAA 2025 cho Sunner đã đăng nhập: hero với đồng hồ đếm tới `EVENT_AT` và thông tin sự kiện, bài giới thiệu chủ đề, 6 thẻ giải và banner Sun* Kudos; từ đó dẫn tới trang chi tiết. Keyvisual chạy dưới header trong suốt. Sau sự kiện đồng hồ về 00 00 00.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| PortalKeyvisualBackground | background | Keyvisual dưới header |
| HomepageHero | section | Logo (`<h1>`), CountdownTimer tới `EVENT_AT`, HomepageEventInfo, hai nút ABOUT AWARDS / ABOUT KUDOS |
| HomepageThemeArticle | article | Bài giới thiệu chủ đề ROOT FURTHER |
| HomepageAwardsSection | section | 6 AwardCard, mỗi thẻ link `/awards#<slug>` |
| KudosBanner | banner | Lời mời tới Sun* Kudos |

### Data Displayed

- Data Entity 1: Mốc `EVENT_AT` (env) và giờ máy chủ lúc render
- Data Entity 2: Danh sách 6 giải tĩnh `AWARDS`
- Data Entity 3: Nội dung dịch `awardsPortal.home` (messages vi/en)

### Routes/URLs

- `/`

### Service Calls

- `requireSunner`, `readRequestTimeMs`; hook `useServerClockNow`

### Related Screens

- SCR008_AwardsSystem: AwardsSystem (navigation, ABOUT AWARDS và thẻ giải)
- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (navigation, ABOUT KUDOS và banner)
- SCR003_AppLayout: AppLayout (parent)

---

## SCR012_Rules

**Type**: atomic

**Classification**: atomic — H2 đạt (2 module: `awards-portal`, `kudos-feed` chỉ để mượn keyvisual); H1 chỉ 2 slice. Ba `<section>` nằm trong RulesPanel (component cấp 1), là chữ tĩnh không có tín hiệu độc lập nên không thành REG.

### Description

Trang Thể lệ: panel 553 px bên phải trên keyvisual tối, gồm bậc huy hiệu Hero cho người nhận, luật Secret Box cho người gửi và Kudos Quốc Dân. Chỉ hiển thị chữ mô tả; luật thật do feature khác tính. Hai nút cuối: Đóng (quay lại trang trước cùng origin, không có thì về trang chủ) và "Viết KUDOS".

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LiveBoardKeyvisualBackground | background | Keyvisual làm tối |
| RulesPanel | panel | Panel 553 px với 3 section nội dung tĩnh |
| RulesHeroTierList | list | Các bậc Hero và ngưỡng hiển thị |
| RulesSecretBoxBadges | list | Biểu tượng icon Secret Box |
| RulesCloseButton | button | `router.back()` khi có trang trước cùng origin, ngược lại về `/` |
| Link "Viết KUDOS" | button | Link tới `/kudos` |

### Data Displayed

- Data Entity 1: Nội dung thể lệ `awardsPortal.rules` (messages vi/en)
- Data Entity 2: Bậc Hero và danh sách icon Secret Box (hằng số hiển thị)

### Routes/URLs

- `/rules`

### Service Calls

- `requireSunner`; không có lệnh gọi dữ liệu khác

### Related Screens

- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (navigation, nút Viết KUDOS)
- SCR011_Homepage: Homepage (navigation, Đóng khi không có lịch sử)
- SCR003_AppLayout: AppLayout (parent, footer)

---

## SCR013_AdminReviewContent

**Type**: atomic

**Classification**: atomic — chỉ import slice `admin-moderation` (H1/H2 không đạt). Các khối lọc, bảng, phân trang, xuất tệp dùng chung một trạng thái URL nên không tách REG.

### Description

Trang "Review content" của Admin: một bảng mọi Kudo (10 dòng mỗi trang) để rà soát; lọc theo người gửi, người nhận, trạng thái, khoảng ngày, tìm theo nội dung (debounce 300 ms), sắp theo tim, tạm ẩn (Mark Spam) hoặc trả lại (Un Spam) từng dòng và xuất CSV theo bộ lọc đang chọn. URL giữ toàn bộ trạng thái nên tải lại hay chia sẻ link cho cùng kết quả; tham số sai thì báo lỗi lọc trên trang 1 chưa lọc. Đọc bảng lỗi hiện trạng thái lỗi kèm nút thử lại.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| ReviewContentScreen | screen body | Giữ trạng thái lọc optimistic (`useOptimistic`) và `router.replace` URL trong transition |
| ReviewFilters | filter bar | Gom các bộ lọc phía dưới |
| ReviewPersonFilter | combobox | Chọn người gửi / người nhận bằng SunnerSearchCombobox |
| ReviewStatusFilter / ReviewDateRangeFilter | select / date range | Lọc trạng thái (public/spam) và khoảng ngày, từ chối khoảng ngược |
| ReviewSearchInput | input | Tìm theo nội dung, debounce 300 ms |
| ReviewTable / ReviewTableRow | table | Cột ID, Người gửi, Người nhận, Nội dung, Hashtag, Tim (bấm đổi sắp xếp), Trạng thái, Thao tác |
| ReviewModerationButton | button | Mark Spam / Un Spam, cập nhật dòng ngay từ kết quả action |
| ReviewPagination | pagination | Chuyển trang |
| ReviewExportButton | button | Tải CSV từ `/api/admin/kudos/export` theo bộ lọc hiện tại |
| AdminLoadErrorPanel / ReviewContentSkeleton | state | Lỗi đọc kèm thử lại; skeleton của `loading.tsx` |

### Data Displayed

- Data Entity 1: Kudo kèm hashtag và số tim (MODEL003_Kudo, MODEL005_KudoHashtag, MODEL008_KudoHeart)
- Data Entity 2: Người gửi và người nhận (MODEL004_Profile); Kudo ẩn danh hiện tên thật người gửi kèm chip "Ẩn danh", biệt danh chỉ ở tooltip của chip (`features/admin-moderation/components/review-table-row.tsx:48-55`)
- Data Entity 3: Nhãn người đã chọn trong bộ lọc (`resolveSelectedPeople`)

### Routes/URLs

- `/admin/review` (query `page`, `sort`, `status`, `sender`, `receiver`, `from`, `to`, `q`)

### Service Calls

- `requireAdmin`, `parseAdminKudoFilter`, `KudoAdminQuery.list` (đối ứng ROUTE001 `GET /api/admin/kudos`), `resolveSelectedPeople`
- `markKudoSpam` — ROUTE027; `unSpamKudo` — ROUTE028 (ghi outbox `KudoMarkedSpam`)
- `GET /api/admin/kudos/export` — ROUTE002; `GET /api/sunners/search` — ROUTE018 (bộ lọc người)

### Related Screens

- SCR002_AdminLayout: AdminLayout (parent)
- SCR016_OwnProfile: OwnProfile (nơi chủ Kudo bị spam thấy thẻ của mình, không có link trực tiếp)

---

## SCR014_AdminCampaignSettings

**Type**: atomic

**Classification**: atomic — chỉ import slice `admin-campaigns`. Hộp thoại thêm/sửa/xoá là component bật theo trạng thái trong trang, không có URL nên không thành SCR hay REG.

### Description

Trang "Settings" của Admin: danh sách campaign "x2 tim" trong một bảng, menu từng dòng để sửa hoặc xoá, nút Add Campaign để tạo mới. Hộp "Add/Edit Campaign" nhập tên, giờ bắt đầu và giờ kết thúc; chồng giờ với campaign khác bị từ chối; campaign đã kết thúc không xoá/sửa được. Danh sách stream sau skeleton; đọc lỗi hiện trạng thái lỗi kèm link tải lại. Toast báo kết quả.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| CampaignSettingsPanel | screen body | Tiêu đề "Setting", nút Add Campaign, quản lý hộp thoại đang mở và toast |
| CampaignTable | table | Cột ID, Name, Time, Actions; không có cột trạng thái. Pha `upcoming`/`active`/`ended` tính khi đọc (`features/admin-campaigns/server/campaign-phase.ts:8-12`) chỉ quyết định menu "⋯" (ẩn khi `ended`) và việc khoá Start Date khi `active` trong modal |
| CampaignRowMenu | menu | Sửa hoặc xoá từng dòng |
| CampaignFormModal | modal | Hộp Add/Edit Campaign (CampaignDialogFrame, CampaignFormField, `useCampaignForm`) |
| CampaignDeleteDialog | dialog | Xác nhận xoá, gọi `removeCampaign` |
| CampaignSettingsToast | toast | Báo thành công hoặc lỗi (5 giây) |
| CampaignSettingsSkeleton | skeleton | Fallback Suspense của danh sách |
| Load-failed block | state | Thông báo lỗi và link tải lại khi `campaigns === null` |

### Data Displayed

- Data Entity 1: Campaign kèm pha tính khi đọc (MODEL009_Campaign)

### Routes/URLs

- `/admin/settings`

### Service Calls

- `CampaignAdminQuery.list` (tự gọi `requireAdmin`)
- `createCampaign` — ROUTE029; `updateCampaign` — ROUTE030; `removeCampaign` — ROUTE031

### Related Screens

- SCR002_AdminLayout: AdminLayout (parent)

---

## SCR015_OtherProfile

**Type**: atomic

**Classification**: atomic — chỉ import slice `profile` ở cấp file; H2 không đạt, H3 chỉ 2 tên khớp (Panel/Section) nên không đạt 2-of-3. Các khối đọc riêng (feed Kudo, composer) là component trong trang chứ không tách REG.

### Description

Hồ sơ đồng nghiệp tại `/profile/{userId}`: avatar, tên, mã phòng ban và huy hiệu Hero, bộ sưu tập icon, nút "Gửi lời cảm ơn và ghi nhận tới {tên}" mở composer với người nhận đã điền sẵn và khoá, rồi danh sách KUDOS chỉ có "Đã nhận: n Kudo" (không bao giờ có "Đã gửi"). Chính id của mình thì chuyển về `/profile`; id sai hoặc không có thì `notFound()`. Không có bảng thống kê cá nhân.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| ProfilePageFrame | frame | Khung trang hồ sơ |
| ProfileHeader | header | UserAvatar, tên `<h1>`, mã phòng ban, KudoCardHeroBadgeSlot (HeroBadge + tooltip), IconCollection 6 ô |
| ProfileSendKudoButton | button | Mở LockedRecipientComposer (KudoComposerModal tạo mới, người nhận bị khoá); khoá khi hết cửa sổ ghi |
| ProfileKudosSection | section | Header "Đã nhận: {count} Kudos", KudoCard, "Tải thêm", trạng thái rỗng và lỗi |
| SunnerNotFound | state | `not-found.tsx` của `/profile/:userId`: một thông báo và nút về Live board |

### Data Displayed

- Data Entity 1: Hồ sơ kèm phòng ban (MODEL004_Profile, MODEL001_Department)
- Data Entity 2: Bậc Hero tính khi đọc từ số người gửi khác nhau (MODEL003_Kudo)
- Data Entity 3: Bộ sưu tập icon (MODEL012_UserIcon)
- Data Entity 4: Kudo đã nhận kèm tim (MODEL003_Kudo, MODEL008_KudoHeart)
- Data Entity 5: Trạng thái cửa sổ ghi `isKudoWritingOpen`

### Routes/URLs

- `/profile/:userId`

### Service Calls

- `loadProfilePageData` (đọc RSC: `ProfileQuery`, `HeroTierQuery`, `IconCollectionQuery`, `listProfileKudos`), `requireSunner`
- `GET /api/profile/:userId/kudos` — ROUTE014 (phân trang phía client)
- `createKudo` — ROUTE023 (qua composer); trong thẻ: `addHeartAction` — ROUTE025, `removeHeartAction` — ROUTE026, `GET /api/sunners/:userId/card` — ROUTE019

### Related Screens

- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (nguồn vào từ ô tìm Sunner; nút về ở trạng thái 404)
- SCR016_OwnProfile: OwnProfile (redirect khi `userId` là chính mình)
- SCR006_KudoDetail: KudoDetail (navigation, "Xem chi tiết" trên thẻ)
- SCR003_AppLayout: AppLayout (parent)

---

## SCR016_OwnProfile

**Type**: atomic

**Classification**: atomic — chỉ import slice `profile` ở cấp file (H1/H2 không đạt); H3 chỉ 2 tên khớp. Bảng thống kê và danh sách Kudo có endpoint riêng nhưng nằm trong trang atomic, được liệt kê ở Components.

### Description

Hồ sơ của chính người dùng tại `/profile` (user luôn lấy từ phiên): avatar, tên, phòng ban, huy hiệu Hero, bộ sưu tập icon "của tôi", bảng thống kê cá nhân (Kudo nhận/gửi, tim, Secret Box đã/chưa mở, nút Mở Secret Box), rồi KUDOS với "Đã gửi" mở đầu và bộ lọc Đã gửi/Đã nhận. Kudo spam của chính mình hiện kèm overlay mờ và tag Spam. Chỉ đọc; sửa Kudo qua bút trên thẻ.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| ProfilePageFrame | frame | Khung trang hồ sơ |
| ProfileHeader | header | Avatar, tên, phòng ban, HeroBadge, IconCollection với caption "của tôi" |
| ProfileStatsPanelSlot | server slot | Suspense riêng, đọc `PersonalRewardStatsQuery.forUser` rồi dựng PersonalStatsPanel |
| PersonalStatsPanel | panel | Số liệu cá nhân và nút Mở Secret Box (SecretBoxLauncher, SecretBoxModal) |
| ProfileKudosSection | section | ProfileKudosDirectionDropdown (Đã gửi / Đã nhận), KudoCard, "Tải thêm", trạng thái rỗng/lỗi |
| KudoCard | card | Thẻ Kudo; spam của chính chủ có SpamAlertOverlay và KudoSpamTag; bút sửa (KudoOwnerEditButton) mở KudoComposerModal chế độ sửa |

### Data Displayed

- Data Entity 1: Hồ sơ kèm phòng ban (MODEL004_Profile, MODEL001_Department)
- Data Entity 2: Bậc Hero tính khi đọc (MODEL003_Kudo)
- Data Entity 3: Bộ sưu tập icon (MODEL012_UserIcon)
- Data Entity 4: Thống kê phần thưởng cá nhân (MODEL008_KudoHeart, MODEL011_SecretBox)
- Data Entity 5: Kudo đã gửi và đã nhận, gồm cả Kudo spam của mình (MODEL003_Kudo)
- Data Entity 6: Trạng thái cửa sổ ghi `isKudoWritingOpen`

### Routes/URLs

- `/profile`

### Service Calls

- `loadProfilePageData`, `PersonalRewardStatsQuery.forUser`, `requireSunner`
- `GET /api/profile/:userId/kudos` — ROUTE014 (`direction=sent|received`)
- `GET /api/secret-boxes/me` — ROUTE015; `POST /api/secret-boxes/open` — ROUTE016
- Sửa Kudo: `GET /api/kudos/:id/edit` — ROUTE009; `updateKudo` — ROUTE024; `POST /api/kudos/images/sign` — ROUTE010
- Trong thẻ: `addHeartAction` — ROUTE025, `removeHeartAction` — ROUTE026, `GET /api/sunners/:userId/card` — ROUTE019

### Related Screens

- SCR006_KudoDetail: KudoDetail (navigation, "Xem chi tiết")
- SCR015_OtherProfile: OtherProfile (navigation, bấm tên người trong thẻ)
- SCR017_AllNotifications: AllNotifications (nguồn vào từ thông báo lên bậc Hero và đủ bộ icon)
- SCR003_AppLayout: AppLayout (parent, mục Profile của menu tài khoản)

---

## SCR017_AllNotifications

**Type**: atomic

**Classification**: atomic — H2 đạt (2 module: `notifications`, `kudos-feed` chỉ để mượn keyvisual); H1 chỉ 2 slice → atomic.

### Description

Trang "Tất cả thông báo": panel 680 giữa trang với đúng các dòng như dropdown chuông, nút "Đánh dấu đọc tất cả", 20 dòng mỗi lượt tải với cuộn vô hạn, trạng thái rỗng và lỗi. Dòng tải trong trình duyệt từ `GET /api/notifications` để trang và chuông dùng chung một đường. Tín hiệu mới từ chuông (CustomEvent trong tab) làm trang gộp lại trang đầu; đánh dấu đã đọc ở dropdown làm trang tải lại. Bấm dòng đánh dấu đã đọc (optimistic) rồi đi tới đối tượng liên quan.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| LiveBoardKeyvisualBackground | background | Keyvisual dưới header |
| NotificationListPageClient | screen body | Tiêu đề, nút "Đánh dấu đọc tất cả", đồng bộ với chuông |
| NotificationList | list | Danh sách dòng, cuộn vô hạn (`use-infinite-scroll-sentinel`), rỗng, lỗi, tải thêm |
| NotificationRow | row | Link toàn dòng, chấm đỏ chưa đọc, thời gian tương đối (`use-minute-clock`); dòng Kudo bị ẩn có link "Tiêu chuẩn cộng đồng" |
| NotificationTypeIcon | icon | Biểu tượng theo 7 loại thông báo |
| Loading state | skeleton | `app/(app)/notifications/loading.tsx` |

### Data Displayed

- Data Entity 1: Thông báo 7 loại, phân trang cursor 20 dòng (MODEL016_Notification)
- Data Entity 2: Trạng thái đã đọc và số lần tim gộp của từng dòng

### Routes/URLs

- `/notifications`

### Service Calls

- `GET /api/notifications` — ROUTE011 (qua `fetchNotificationPage`)
- `markNotificationRead` — ROUTE033; `markAllNotificationsRead` — ROUTE034 (qua `useNotificationList`)
- `requireSunner`; đồng bộ chuông qua `useNotificationSync` (window CustomEvent, chỉ là keo giao diện)

### Related Screens

- SCR003_AppLayout: AppLayout (parent; nguồn vào từ "Xem tất cả" ở chuông)
- SCR006_KudoDetail: KudoDetail (navigation, thông báo nhận Kudo, tim, Kudo bị ẩn, Kudos Quốc Dân)
- SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed (navigation, thông báo hộp quà tới `/kudos?secretBox=open`)
- SCR016_OwnProfile: OwnProfile (navigation, thông báo lên bậc Hero hoặc đủ bộ icon)
- SCR009_CommunityStandards: CommunityStandards (navigation, link trong dòng Kudo bị ẩn)

---

## SCR018_AdminUser

**Type**: atomic

**Classification**: atomic — chỉ import slice `admin-users` ở cấp file (H1/H2 không đạt); bộ lọc, bảng, role menu dùng chung trạng thái URL nên không tách REG.

### Description

Trang "User" của Admin: bảng toàn bộ Sunner kèm số liệu tham gia (20 dòng mỗi trang), lọc theo Unit, Level, Role, tìm theo tên hoặc email, sắp theo cột số liệu, đổi role từng người và xuất CSV theo bộ lọc đang chọn. URL giữ trạng thái; tham số sai (q quá 100 ký tự, sort lạ…) báo lỗi trên trang 1 chưa lọc. Đọc bảng lỗi hiện trạng thái lỗi kèm thử lại; đọc lỗi danh sách Unit chỉ làm trống dropdown, bảng vẫn dùng được. Menu role ẩn thao tác tự hạ quyền; admin cấu hình trong env và admin cuối cùng không hạ được.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| AdminUsersScreen / AdminUsersView | screen body | Trạng thái lọc optimistic và `router.replace` URL trong transition |
| AdminUserFilters | filter bar | Dropdown Unit, Level, Role và ô tìm kiếm |
| AdminUserTable | table | 12 cột: ID (8 ký tự đầu của uuid), User, Email, ∑ sent Kudos, ∑ Received Kudos, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role, Actions |
| AdminUserSortableHeader | header | Sắp xếp theo cột số liệu |
| AdminUserTableRow | row | Một Sunner, patch role ngay từ kết quả action |
| AdminUserRoleMenu | menu | Đổi role; trên dòng của chính mình nút "⋯" vẫn hiện nhưng bị khoá kèm tooltip, không mở menu (`actorId`) |
| AdminUserRoleDialog | dialog | Xác nhận đổi role |
| ReviewPagination / ReviewExportButton | pagination / button | Chuyển trang; tải CSV từ `/api/admin/users/export` |
| AdminLoadErrorPanel / AdminUsersSkeleton / error boundary | state | Lỗi đọc kèm thử lại; skeleton `loading.tsx`; `error.tsx` bắt lỗi render |
| CampaignSettingsToast | toast | Báo kết quả đổi role |

### Data Displayed

- Data Entity 1: Sunner kèm role, phòng ban, lần đăng nhập cuối (MODEL004_Profile, MODEL001_Department)
- Data Entity 2: Số liệu tham gia: Kudo gửi/nhận, tim, số huy hiệu (MODEL003_Kudo, MODEL008_KudoHeart, MODEL012_UserIcon)
- Data Entity 3: Lựa chọn lọc Unit (MODEL001_Department)

### Routes/URLs

- `/admin/users` (query `page`, `unit`, `level`, `role`, `q`, `sort`, `dir`)

### Service Calls

- `requireAdmin`, `parseUserListParams`, `UserAdminQuery.listPage`, `UserFilterOptionsQuery.get`
- `setUserRoleAction` — ROUTE032 (qua `UserRoleService`)
- `GET /api/admin/users/export` — ROUTE004

### Related Screens

- SCR002_AdminLayout: AdminLayout (parent)

---

## SCR019_AdminOverview

**Type**: atomic

**Classification**: atomic — chỉ import slice `admin-overview` ở cấp file (H1/H2 không đạt).

### Description

Trang "Overview" của Admin: bảng số liệu Kudo và Secret Box theo từng đơn vị kèm dòng "All", chọn khoảng ngày để thu hẹp giai đoạn và xuất CSV. Khoảng ngày nằm trên URL (`from`, `to`) để tải lại hay chia sẻ link cho cùng số liệu; khoảng ngược bị từ chối ngay trong ô chọn, URL xấu thì hiện lỗi lọc trên bảng toàn thời gian (xuất CSV cũng xuất bảng đó). `/admin` chỉ chuyển hướng về trang này.

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| AdminOverviewScreen | screen body | Tiêu đề, bộ lọc khoảng ngày, bảng và xuất tệp; `router.replace` URL trong transition |
| ReviewDateRangeFilter | date range | Chọn từ/đến, dùng chung với trang Review |
| OverviewUnitStatsTable | table | Cột No, Unit, Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box; dòng "All" |
| ReviewExportButton | button | Tải CSV từ `/api/admin/overview/export` |
| AdminLoadErrorPanel | state | Lỗi đọc kèm thử lại |
| AdminOverviewSkeleton / error boundary | state | Skeleton `loading.tsx`; `error.tsx` bắt lỗi render |
| CampaignSettingsToast | toast | Báo lỗi xuất tệp |

### Data Displayed

- Data Entity 1: Số liệu theo đơn vị: thành viên, Kudo gửi/nhận, người có ít nhất 1 Kudo (MODEL001_Department, MODEL004_Profile, MODEL003_Kudo)
- Data Entity 2: Tổng Secret Box đã nhận (MODEL011_SecretBox)

### Routes/URLs

- `/admin/overview` (query `from`, `to`)
- `/admin` (chuyển hướng về `/admin/overview`, không phải SCR riêng)

### Service Calls

- `requireAdmin`, `parseOverviewParams`, `UnitStatsQuery.forRange`
- `GET /api/admin/overview/export` — ROUTE003

### Related Screens

- SCR002_AdminLayout: AdminLayout (parent)
- SCR003_AppLayout: AppLayout (nguồn vào từ mục Dashboard của menu tài khoản admin)

---

## SCR020_OnboardingDepartment

**Type**: atomic

**Classification**: atomic — chỉ import slice `auth` ở cấp file; trang nằm ngoài cả ba layout nên không có header hay footer.

### Description

Bước chọn phòng ban ở lần đăng nhập đầu: một nhóm radio bắt buộc, gửi một lần; chỉ đặt được khi phòng ban còn trống. Trang không dùng `requireSunner()` (chính hàm đó đưa người dùng tới đây). Khách → `/login?next=…`; có phiên nhưng không có profile → 401; đã có phòng ban → chuyển thẳng tới `next`. Chọn xong chuyển tới `next` đã làm sạch (mặc định `/`).

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| Onboarding card | section | Thẻ giữa màn hình với tiêu đề `<h1>` và mô tả |
| DepartmentPickerForm | form | Radio group phòng ban, `useActionState` gọi `chooseDepartment`, gửi `next` ẩn |
| Error message | state | Báo `invalid_department` hoặc `unexpected` ("Không lưu được lựa chọn, vui lòng thử lại.") |

### Data Displayed

- Data Entity 1: Danh sách phòng ban theo ngôn ngữ (MODEL001_Department)
- Data Entity 2: `departmentId` của hồ sơ (MODEL004_Profile)

### Routes/URLs

- `/onboarding/department` (query `next`)

### Service Calls

- `listDepartmentOptions`, `getSessionUser`, `findSessionProfile`, `safeNextPath`
- `chooseDepartment` — ROUTE022 (server action POST)

### Related Screens

- SCR001_Login: Login (khách bị đưa về `/login`; nguồn vào sau đăng nhập lần đầu)
- SCR011_Homepage: Homepage (đích mặc định sau khi chọn phòng ban)

---

## Classification Notes

- Phạm vi chấm H-rule: H1 là số slice feature (`features/*`) mà file screen/layout import trực tiếp; H2 là số module miền khác nhau trong các import đó (bỏ `shared/*`, UI lib); H3 chỉ đếm wrapper đặt tên ngay trong JSX của file screen. Component cấp 1 chỉ dùng để rút lệnh gọi dịch vụ, không đưa vào điểm H1/H3.
- Chỉ 2 composite: SCR003_AppLayout (H1∧H2) và SCR007_KudosLiveBoardFeed (H1∧H2). 18 SCR còn lại atomic. Không tag `[SIGNAL_INFERRED]` ở đâu cả; không có screen chỉ import barrel nên không có `[BARREL_IMPORT]`.
- H6: có hai outlet đạt điều kiện là `app/admin/layout.tsx` (SCR002) và `app/(app)/layout.tsx` (SCR003). Mỗi route con có SCR riêng; không route con nào bị gộp thành REG. `app/(public)/layout.tsx` không đạt H6 (con `/countdown` không có lệnh gọi API riêng; header chỉ có logo và đổi ngôn ngữ) nên là ngữ cảnh chung của SCR001 và SCR010. `app/layout.tsx` chỉ là html/body và provider, không có SCR.
- Không phải SCR: `app/admin/page.tsx` chỉ gọi `redirect` về `/admin/overview` (URL alias ghi vào Routes/URLs của SCR019 và SCR002); `loading.tsx`, `error.tsx`, `not-found.tsx` của từng route là trạng thái của screen chủ (ghi ở Components và ScreenFlow), riêng `app/not-found.tsx` toàn cục là SCR005 vì không có screen chủ.
- Overlay, modal, popover không có URL (KudoComposerModal, SecretBoxModal, CampaignFormModal, CampaignDeleteDialog, AdminUserRoleDialog, AvatarHoverCard, SpamAlertOverlay, NotificationPanel) thuộc loại `screen-embedded` trong scout và không đạt H4/H5/H6 nên không là SCR: nếu có tín hiệu độc lập và host là composite thì thành REG (REG001 và REG006 của SCR007, REG001 của SCR003), còn lại ghi như Components của screen chủ.
- Đối chiếu với bản nháp đã promote (`docs/generated/screen-list.md`): 19 SCR giữ nguyên mã và NameSlug; thêm SCR020_OnboardingDepartment (`/onboarding/department`, bản nháp cũ không có). Tám mục của bản nháp hạ cấp vì không đạt luật screen (không có URL, không đạt H4/H5/H6): modal viết/sửa Kudo thành REG001_KudoComposer của SCR007_KudosLiveBoardFeed (modal dùng chung, mở từ Live board, thẻ Kudo và hồ sơ); lớp phủ cảnh báo spam thành trạng thái của thẻ Kudo (không có tín hiệu độc lập); vùng Spotlight Board thành REG004_SpotlightBoard và cột phần thưởng thành REG006_RewardsColumn của SCR007_KudosLiveBoardFeed; modal mở Secret Box thành thành phần bên trong REG006_RewardsColumn (mở bằng nút hoặc deep link `?secretBox=open`); hộp thoại thêm/sửa campaign thành Components của SCR014_AdminCampaignSettings; avatar hover card thành Components của KudoCard và KudoCardPeople; dropdown thông báo thành REG001_NotificationBell của SCR003_AppLayout. Bảng ánh xạ mã cũ sang mới nằm trong báo cáo bàn giao của Wave 2, không ghi trong file này.

---

## Summary

- **Total Screens**: 20
- **Total Regions**: 7 (SCR003_AppLayout: 1, SCR007_KudosLiveBoardFeed: 6)
- **Composite / Atomic**: 2 / 18

---

## Cross-Reference Validation

- [x] All SCR### codes are unique
- [ ] All SCR### codes are referenced in ScreenFlow.md (kiểm sau khi ScreenFlow ghi xong)
- [x] All related screen references are valid
- [x] All route URLs are properly formatted
- [ ] All SCR### codes are referenced in FeatureList.md (Wave 5 điền)
- [x] No orphaned screen references
