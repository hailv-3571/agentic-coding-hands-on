# Feature List

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-24
**Analysis Scope**: Gom theo ý định nghiệp vụ chính (Feature Clustering Rule) từ các bản nháp trước: 48 US trong `user-stories.md`, 20 SCR kèm 7 REG trong `screen-list.md`, 36 route trong `route-list.md`, 16 model trong `data-model.md`, 34 BL trong `behavior-logic.md`, 38 PERM trong `permissions-matrix.md`. 15 feature đã publish giữ nguyên mã và tên; không tạo feature mới.

**Code Format**: All codes MUST follow `F###_NameSlug` format (e.g., F001_Auth, F002_UserProfile)
**Screen Code Format**: All screen codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm)
**User Story Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login)
**Background Logic Code Format**: All BL codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport)
**Permission Code Format**: All PERM codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports)

**Feature Types**:
- `ui` - Feature has UI screens (SCR###)
- `background` - Feature only has background logic (BL###, no SCR###)
- `mixed` - Feature has both UI screens and background logic

**Related Screens column format**: Accepts `SCR###`, `SCR###/REG###`, or mixed comma-separated (e.g., `SCR001, SCR002/REG003`). Tokenizer splits on `,` then on `/`. No intra-screen shorthand (`SCR###/REG001+REG002` invalid) — enumerate each ref explicitly.

**Partial-screen ownership note**: A feature with only a `SCR###/REG###` ref owns the region, NOT the parent SCR. The screen shell (`SCR###`) must be owned by a separate F### with a bare `SCR###` ref (typically a layout/dashboard feature).

**Cross-reference**: See ScreenList Regions subsection for region definitions and the `REG###_NameSlug` registry.

## Feature Hierarchy

**Note**: Features are sorted by priority from highest to lowest (P0 → P1 → P2 → P3). Priority levels:
- **P0**: Core functionality, blocking issues, or essential features
- **P1**: High priority, significant features
- **P2**: Medium priority, standard features
- **P3**: Low priority, nice-to-have features

| Code | Name | Type | Language | Workspace | Priority |
|------|------|------|----------|-----------|----------|
| F001_Auth | Auth | mixed | TypeScript | my-app (Next.js) | P0 |
| F002_AppShell | App Shell | ui | TypeScript | my-app (Next.js) | P0 |
| F003_KudosAuthoring | Kudos Authoring | mixed | TypeScript | my-app (Next.js) | P0 |
| F004_KudosFeed | Kudos Feed | mixed | TypeScript | my-app (Next.js) | P1 |
| F005_KudosHearts | Kudos Hearts | ui | TypeScript | my-app (Next.js) | P1 |
| F006_AwardsPortal | Awards Portal | mixed | TypeScript | my-app (Next.js) | P1 |
| F007_AdminModeration | Admin Moderation | ui | TypeScript | my-app (Next.js) | P1 |
| F008_SpotlightBoard | Spotlight Board | mixed | TypeScript | my-app (Next.js) | P2 |
| F009_HeroBadges | Hero Badges | background | TypeScript | my-app (Next.js) | P2 |
| F010_SecretBoxRewards | Secret Box Rewards | mixed | TypeScript | my-app (Next.js) | P2 |
| F011_AdminCampaigns | Admin Campaigns | ui | TypeScript | my-app (Next.js) | P2 |
| F012_Profile | Profile | ui | TypeScript | my-app (Next.js) | P2 |
| F013_Notifications | Notifications | mixed | TypeScript | my-app (Next.js) | P2 |
| F014_AdminUserManagement | Admin User Management | ui | TypeScript | my-app (Next.js) | P2 |
| F015_AdminOverview | Admin Overview | ui | TypeScript | my-app (Next.js) | P3 |

## Feature Details

### F001_Auth: Auth

**Type**: mixed
**Description**: Sunner đăng nhập bằng Google qua Supabase Auth, chỉ nhận email đúng tên miền công ty `@sun-asterisk.com`. Lần đăng nhập đầu, trigger trong DB tạo hồ sơ Sunner (`profiles`) rồi người dùng chọn phòng ban một lần; email nằm trong `ADMIN_EMAILS` được nâng `role = 'admin'` ở mọi lần đăng nhập. Feature gồm callback OAuth `/auth/callback`, đăng xuất thiết bị đang dùng và các cổng truy cập: proxy (allowlist path công khai, bắt buộc có phiên, chặn khu Admin), guard `requireSunner()` / `requireApiSunner()`, tham số `next` chỉ nhận path cùng origin, và RLS bật sẵn trên mọi bảng `public`. Tên miền được chặn ở ba lớp (auth hook, hai trigger trên `auth.users`) cộng một lần kiểm lại ở callback. Đây là nền danh tính cho mọi feature còn lại; lệnh seed `db:seed` cũng nằm ở đây vì nạp phòng ban, hashtag và danh mục Secret Box.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 4 (`features/auth/components`)

**Related Screens**:
- SCR001_Login: màn đăng nhập cho khách, nút "LOGIN With Google" và banner lỗi `domain_not_allowed` / `auth_failed`
- SCR020_OnboardingDepartment: bước chọn phòng ban ở lần đăng nhập đầu, nhóm radio bắt buộc, gửi một lần

**Related User Stories**:
- US016_SignInWithGoogle: Khách đăng nhập bằng tài khoản Google của công ty để có phiên riêng
- US018_ChooseDepartment: Sunner vừa đăng nhập lần đầu chọn đơn vị làm việc để hoàn tất hồ sơ
- US019_SignOut: Sunner đăng xuất khỏi thiết bị đang dùng

**Related APIs/Routes**:
- (GET) /auth/callback — ROUTE020
- (POST) server action signInWithGoogle — ROUTE021
- (POST) server action chooseDepartment — ROUTE022
- (POST) server action signOut — ROUTE035

**Related Data Models**:
- MODEL001_Department
- MODEL004_Profile

**Related Background Logic**:
- BL001_SeedDatabaseCli: lệnh `npm run db:seed` nạp phòng ban, hashtag, danh mục Secret Box trong một giao dịch, chạy lại nhiều lần vẫn an toàn
- BL004_GoogleOAuthCallback: đổi `code` lấy phiên, kiểm lại tên miền, cập nhật `last_login_at` và role admin theo `ADMIN_EMAILS`, rồi chọn đích chuyển hướng
- BL005_GoogleSignInStart: server action khởi động OAuth Google (PKCE), `hd` chỉ thu hẹp bộ chọn tài khoản
- BL011_SupabaseServerClient: client Supabase gắn cookie phiên, tạo mới cho từng request và chịu RLS
- BL018_BeforeUserCreatedHook: auth hook chặn tạo user sai tên miền bằng lỗi 403 `domain_not_allowed`
- BL019_CreateSunnerProfile: trigger tạo dòng `profiles` ở lần đăng nhập đầu
- BL020_RejectForeignDomainOnEmailChange: trigger từ chối đổi email sang tên miền ngoài công ty
- BL021_RejectForeignDomainOnInsert: trigger chốt chặn cuối khi chèn user sai tên miền vào `auth.users`
- BL022_SyncProfileEmail: trigger chép email mới sang `profiles.email` để bản sao không cũ đi

**Related Permissions**:
- PERM001_PublicPathAllowlist: sáu path khớp chính xác được vào không cần phiên
- PERM002_SessionRequiredOnProtectedPaths: path ngoài allowlist cần phiên xác thực, Auth không với tới thì coi như khách
- PERM003_AdminAreaProxyGate: proxy chặn người không phải admin ở `/admin` và `/admin/*`
- PERM005_CompanyEmailDomainAdmission: chỉ email đúng tên miền công ty (không nhận sub-domain) tạo được tài khoản hoặc đăng nhập
- PERM006_EnvAdminPromotion: email trong `ADMIN_EMAILS` được nâng admin ở mọi lần đăng nhập
- PERM007_SafeNextRedirect: `next` chỉ nhận path cùng origin, sai thì rơi về `/`
- PERM008_SunnerAreaGate: page nhóm `(app)` và Server Action của Sunner gọi `requireSunner()` (khách về `/login`, chưa chọn phòng ban về trang onboarding)
- PERM009_OnboardingDepartmentChoice: chọn phòng ban cần phiên, chỉ đặt được khi phòng ban còn trống
- PERM010_ApiSunnerGate: Route Handler dữ liệu Kudos, Feed, Profile gọi `requireApiSunner()` (401, 403 `ONBOARDING_REQUIRED`)
- PERM011_SessionOnlyApiGate: endpoint thông báo, Secret Box, Spotlight chỉ đòi phiên, không kiểm phòng ban
- PERM014_AdminPageAndActionGuard: `requireAdmin()` chạy đầu tiên ở layout, page và query của khu Admin
- PERM015_AdminApiGate: các endpoint `/api/admin/*` gọi `requireAdminApi()` (khách 401, không phải admin 403)
- PERM035_DatabaseRlsBaseline: mọi bảng `public` bật RLS, không có policy nào cho `anon` hay `authenticated`

---

### F002_AppShell: App Shell

**Type**: ui
**Description**: Khung dùng chung quanh các trang sau đăng nhập. Khung Sunner (route group `(app)`) có header (logo, ba link chính, chuông thông báo, đổi ngôn ngữ, menu tài khoản), footer năm link và guard `requireSunner()`. Khung Admin riêng có thanh trên mang nhãn ADMIN, bốn mục menu, footer tối giản; guard `requireShellAdmin()` chạy trước nên người không phải admin không bao giờ nhận markup admin. Hai trang lỗi dùng chung cho cả hai khu: 403 (đã đăng nhập nhưng thiếu quyền) và 404 (người đã đăng nhập thấy nút Home, khách thấy nút Login). Đổi ngôn ngữ vi/en là một server action ghi cookie `NEXT_LOCALE`. Feature không chứa nội dung nghiệp vụ của từng trang; chuông thông báo và toast gửi Kudo chỉ được gắn vào khung này, phần nội dung do Notifications và Kudos Authoring sở hữu.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 14 (`features/app-shell/components`)

**Related Screens**:
- SCR002_AdminLayout: khung khu Admin, thanh trên ADMIN với bốn mục menu, đổi ngôn ngữ và menu tài khoản
- SCR003_AppLayout: khung bao mọi trang Sunner, header, footer, chuông thông báo, toast Kudo và guard `requireSunner()`
- SCR004_Error403: báo đã đăng nhập nhưng không đủ quyền vào khu vừa mở, đưa về trang chủ
- SCR005_Error404: báo địa chỉ không tồn tại, đưa về trang chính

**Related User Stories**:
- US001_NavigateAdminSections: Admin chuyển giữa các mục của khu Admin mà không phải gõ địa chỉ
- US002_OpenAdminDashboard: Admin mở Dashboard từ menu tài khoản để vào thẳng trang Overview
- US017_ReturnToLoginFromNotFound: Khách quay về trang đăng nhập từ trang 404
- US020_SwitchLanguage: Sunner đổi giao diện giữa tiếng Việt và English
- US021_NavigateSunnerPages: Sunner mở các trang Sunner từ header, footer, menu tài khoản và dropdown chuông
- US022_ReturnHomeFromErrorPage: Sunner quay về trang chủ bằng một cú bấm từ trang lỗi 403 hoặc 404

**Related APIs/Routes**:
- (POST) server action setLocaleAction — ROUTE036

**Related Data Models**:
- None

**Related Background Logic**:
- None

**Related Permissions**:
- PERM012_PreferenceAndSignOutActions: `signOut` và `setLocaleAction` không tự kiểm phiên vì proxy đã đưa khách về `/login`; locale chỉ nhận giá trị trong danh sách cho phép
- PERM013_LocaleCookieSecureFlag: cookie ngôn ngữ chỉ gắn cờ `secure` khi chạy production
- PERM016_AdminMenuVisibility: mục Dashboard trong menu tài khoản chỉ hiện với admin, chỉ là ẩn giao diện còn chặn thật nằm ở cổng admin

---

### F003_KudosAuthoring: Kudos Authoring

**Type**: mixed
**Description**: Sunner viết Kudo cảm ơn đồng đội và sửa lại Kudo của chính mình. Composer dạng modal gồm người nhận (tìm Sunner), danh hiệu tuỳ chọn (tối đa 50 ký tự), lời nhắn Markdown giới hạn 1 đến 1.000 ký tự (link chỉ nhận http(s), không nhúng ảnh), 1 đến 5 hashtag, tối đa 5 ảnh jpeg/png/webp dưới 5 MB và tuỳ chọn gửi ẩn danh kèm biệt danh 1 đến 30 ký tự. Composer cũng mở từ hồ sơ hoặc thẻ đồng nghiệp với người nhận đã điền và khoá. Server chạy lại cùng schema Zod, người gửi luôn lấy từ phiên; Kudo, hashtag, ảnh và dòng outbox `KudoCreated` ghi trong một giao dịch. Ảnh đi qua vé tải lên ký sẵn (`kudos/{uuid}.{ext}`, không chứa id người gửi) vào bucket private `kudo-images`, mỗi người giữ tối đa 20 vé chưa gắn trong 24 giờ. Chỉ chủ Kudo còn `public` được sửa, đổi được mọi trường trừ người nhận; viết lẫn sửa chỉ mở trong cửa sổ ghi từ `LAUNCH_AT` đến trước `EVENT_END_AT`. Đầu ra là bản ghi Kudo, nguồn dữ liệu cho các feature Kudos khác.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 20 (`features/kudos-authoring/components`)

**Related Screens**:
- SCR007_KudosLiveBoardFeed/REG001_KudoComposer: ô viết Kudo và modal viết/sửa Kudo trên Live board (feature chỉ sở hữu vùng này, khung màn hình do Kudos Feed sở hữu)

**Related User Stories**:
- US026_CreateKudo: Sunner viết và gửi Kudo cảm ơn đồng đội để lời nhắn hiện trên Live board
- US027_AttachKudoImage: Sunner đính kèm ảnh vào Kudo khi viết hoặc sửa
- US028_EditKudo: Sunner sửa nội dung Kudo đã gửi
- US029_SendKudoToSunner: Sunner gửi Kudo thẳng cho đồng nghiệp từ hồ sơ hoặc thẻ, người nhận đã điền và khoá

**Related APIs/Routes**:
- (GET) /api/kudos/[id]/edit — ROUTE009
- (POST) /api/kudos/images/sign — ROUTE010
- (GET) /api/hashtags — ROUTE013
- (GET) /api/sunners/search — ROUTE018
- (POST) server action createKudo — ROUTE023
- (POST) server action updateKudo — ROUTE024

**Related Data Models**:
- MODEL002_Hashtag
- MODEL003_Kudo
- MODEL005_KudoHashtag
- MODEL006_KudoImage
- MODEL007_KudoImageUpload

**Related Background Logic**:
- BL006_KudoImageBrowserUpload: trình duyệt xin vé rồi tải ảnh thẳng lên Storage, kiểm kích thước và loại tệp trước khi gửi, không bao giờ throw
- BL007_KudoImagePreviewSigning: ký URL xem trước sống 10 phút cho ảnh đã gắn khi mở form sửa, lỗi thì ảnh hiện placeholder
- BL008_KudoImageUploadSigning: cấp vé tải lên `kudos/{uuid}.{ext}`, ghi ai xin vé và từ chối khi quá 20 vé chưa gắn trong 24 giờ
- BL012_SupabaseServiceClient: client service-role bỏ qua RLS, chỉ dùng phía server để ký URL Storage

**Related Permissions**:
- PERM022_EventWritingWindow: một hàm duy nhất quyết định còn được ghi Kudo, tim, upload ảnh hay không (mở từ `LAUNCH_AT` đến trước `EVENT_END_AT`, admin cũng bị áp dụng)
- PERM023_KudoCreate: tạo Kudo kiểm theo thứ tự phiên Sunner, cửa sổ ghi, schema Zod, người nhận khác chính mình
- PERM024_KudoImageUploadSigning: endpoint ký vé kiểm phiên, cửa sổ ghi, body JSON tối đa 4 KB, ảnh 1 đến 5 MB và giới hạn 20 vé chờ
- PERM025_KudoOwnerEdit: chỉ chủ Kudo còn `public` trong cửa sổ ghi mới sửa được, không đổi được người nhận
- PERM026_KudoEditButtonVisibility: nút sửa trên thẻ chỉ hiện khi là chủ, không phải spam và còn cửa sổ ghi
- PERM036_KudoImageStorageAccess: bucket `kudo-images` private, client không có policy, đọc chỉ qua signed URL và tải lên chỉ qua vé ký

---

### F004_KudosFeed: Kudos Feed

**Type**: mixed
**Description**: Sunner xem Kudo công khai trên Live board `/kudos` và trang chi tiết `/kudos/{id}`. HIGHLIGHT KUDOS lấy 5 Kudo nhiều tim nhất rồi mới nhất, lọc theo hashtag và phòng ban của người nhận (điều kiện AND); ALL KUDOS phân trang cursor, 10 Kudo mỗi trang (tối đa 50). Thẻ Kudo có cả biến thể ẩn danh; người xem mở chi tiết, xem ảnh cỡ đầy đủ ở tab mới, sao chép liên kết và tìm profile Sunner theo tên hoặc email. Mọi lần đọc đi qua một đường duy nhất lọc `status = 'public'` và mapper whitelist, nên Kudo ẩn danh chỉ lộ biệt danh, còn Kudo spam chỉ chủ thấy. Ảnh private đọc qua signed URL sống 30 phút, ký một lần cho mỗi trang. Live board còn chứa vùng của các feature khác (Spotlight Board, cột phần thưởng Secret Box) và ô viết Kudo của Kudos Authoring; feature này sở hữu khung màn hình và ba vùng đọc của nó.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 24 (`features/kudos-feed/components`)

**Related Screens**:
- SCR006_KudoDetail: trang đọc đầy đủ một Kudo (lời nhắn không cắt, mọi ảnh và hashtag, Copy Link); id sai hoặc Kudo spam của người khác đều ra cùng một trang 404 mềm
- SCR007_KudosLiveBoardFeed: Live board `/kudos`, khung màn hình composite chứa các vùng của nhiều feature
- SCR007_KudosLiveBoardFeed/REG002_SunnerProfileSearch: ô tìm profile Sunner, combobox đợi 250 ms rồi gọi tìm
- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos: khối HIGHLIGHT KUDOS với bộ lọc hashtag và phòng ban
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed: feed ALL KUDOS phân trang cursor

**Related User Stories**:
- US030_SearchSunnerProfile: Sunner tìm đồng nghiệp theo tên hoặc email ngay trên Live board để mở hồ sơ
- US031_BrowseHighlightKudos: Sunner lọc và lướt các Kudo nổi bật theo hashtag và phòng ban
- US032_LoadMoreKudos: Sunner tải thêm Kudo cũ hơn trong danh sách ALL KUDOS
- US033_OpenKudoDetail: Sunner mở trang chi tiết để đọc trọn lời nhắn, xem hết ảnh và hashtag
- US036_ViewKudoImage: Sunner mở ảnh đính kèm cỡ đầy đủ trong tab mới
- US039_CopyKudoLink: Sunner sao chép đường dẫn của một Kudo vào clipboard

**Related APIs/Routes**:
- (GET) /api/kudos — ROUTE007
- (GET) /api/kudos/highlight — ROUTE008
- (GET) /api/sunners/search — ROUTE018 (dùng chung với F003, F007: ô tìm profile Sunner REG002)

**Related Data Models**:
- MODEL003_Kudo

**Related Background Logic**:
- BL009_KudoImageReadSigning: ký URL đọc ảnh sống 30 phút, một lần cho mỗi trang, lỗi thì feed vẫn hiển thị với ảnh placeholder

**Related Permissions**:
- PERM028_AnonymousSenderMask: Kudo ẩn danh chỉ lộ `{ anonymous: true, nickname }`, thẻ dựng từ whitelist tường minh
- PERM029_SpamKudoVisibility: feed chỉ trả Kudo `public`, Kudo spam chỉ người gửi thấy (trang chi tiết và danh sách của chính mình)

---

### F005_KudosHearts: Kudos Hearts

**Type**: ui
**Description**: Sunner thả tim cho Kudo của đồng nghiệp và bỏ tim đã thả. Nút tim hiện số tim thô, cập nhật ngay khi bấm (optimistic) rồi lấy kết quả của server làm trạng thái chính thức; nút khoá khi là Kudo của chính mình hoặc khi sự kiện đã kết thúc. Thả tim là một câu `INSERT … SELECT … ON CONFLICT DO NOTHING` chứa đủ điều kiện (Kudo `public`, người thả khác người gửi kể cả Kudo ẩn danh, còn trước `EVENT_END_AT`) nên bấm lặp vẫn chỉ một dòng; dòng outbox `HeartAdded` ghi cùng giao dịch và chỉ khi chèn thật. Hệ số tim chốt vào dòng tim lúc thả: 2 khi có chiến dịch "Ngày x2 tim" đang hiệu lực (Admin Campaigns quản lý), ngược lại 1, và tra chiến dịch lỗi thì rơi về 1. Xếp hạng Highlight dùng số tim thô; tổng tim nhận được có trọng số là đầu vào cho tiến độ Secret Box. Feature không có màn riêng: nút tim gắn vào thẻ Kudo trên Live board, trang chi tiết và hồ sơ.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 3 (`features/kudos-hearts/components`)

**Related Screens**:
- None

**Related User Stories**:
- US037_GiveHeartToKudo: Sunner thả tim cho Kudo của đồng nghiệp để ghi nhận và giúp người gửi tích tim đổi Secret Box
- US038_WithdrawHeartFromKudo: Sunner bỏ tim đã thả khi lỡ tay hoặc đổi ý

**Related APIs/Routes**:
- (POST) server action addHeartAction — ROUTE025
- (POST) server action removeHeartAction — ROUTE026

**Related Data Models**:
- MODEL008_KudoHeart
- MODEL009_Campaign

**Related Background Logic**:
- None

**Related Permissions**:
- PERM027_KudoHeartToggle: thả tim cần phiên Sunner, id hợp lệ, Kudo `public`, người thả không phải người gửi và còn trong cửa sổ ghi

---

### F006_AwardsPortal: Awards Portal

**Type**: mixed
**Description**: Cổng thông tin lễ trao giải SAA 2025, phần lớn là nội dung tĩnh hai ngôn ngữ (vi/en). Gồm trang chủ (hero ROOT FURTHER với đồng hồ đếm tới `EVENT_AT`, thời gian, địa điểm, bài giới thiệu chủ đề, lưới 6 thẻ giải và banner Sun* Kudos), trang Hệ thống giải `/awards` (6 khối giải có số lượng, giá trị và menu neo `#<slug>` đánh dấu khối đang đọc theo vị trí cuộn), trang Thể lệ `/rules` (bậc huy hiệu Hero, luật Secret Box, Kudos Quốc Dân; nút Đóng và nút Viết KUDOS) và trang Tiêu chuẩn cộng đồng `/community-standards`. Danh sách giải là hằng số trong `data/awards-data.ts`, không có model hay route API riêng. Phần nền là cổng prelaunch: `prelaunchGateStep` chạy trong `proxy.ts` ở mọi request và so giờ máy chủ với `LAUNCH_AT`; trước giờ mở, người không phải admin chỉ vào được các path công khai, tải trang bị chuyển về `/countdown`, còn Server Action hoặc `/api/*` nhận JSON 403 `prelaunch`. Trang `/countdown` hiện đồng hồ DAYS/HOURS/MINUTES theo giờ máy chủ, về 0 thì `router.replace('/')`; sau `LAUNCH_AT` chính proxy chuyển `/countdown` về `/`.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 19 (`features/awards-portal/components`)

**Related Screens**:
- SCR008_AwardsSystem: Trang Hệ thống giải với 6 khối giải và menu neo; hash lạ thì trang đứng ở đầu
- SCR009_CommunityStandards: Trang Tiêu chuẩn cộng đồng gồm cả tiêu chuẩn bảo mật; nội dung tĩnh lấy từ messages
- SCR010_CountdownPrelaunch: Trang công khai cho người vào trước giờ mở hệ thống; đồng hồ đếm tới `LAUNCH_AT`
- SCR011_Homepage: Trang chủ cho Sunner đã đăng nhập; hero đếm tới `EVENT_AT` và dẫn sang trang chi tiết
- SCR012_Rules: Trang Thể lệ dạng panel bên phải; chỉ hiển thị chữ mô tả luật

**Related User Stories**:
- US045_OpenAwardsFromHomepage: Từ trang chủ mở trang Hệ thống giải hoặc đúng khối giải mình quan tâm
- US046_OpenKudosBoard: Đi tới Live board từ lời mời Sun* Kudos, trang Thể lệ, trang chi tiết Kudo và trang không tìm thấy
- US047_JumpToAwardSection: Bấm menu neo bên trái trang Hệ thống giải để nhảy tới khối của một giải
- US048_CloseRulesPage: Đóng trang Thể lệ để quay về trang vừa đọc, không có lịch sử cùng origin thì về trang chủ

**Related APIs/Routes**:
- None

**Related Data Models**:
- None

**Related Background Logic**:
- BL013_PrelaunchGate: Bước 5 của proxy so giờ máy chủ với `LAUNCH_AT` ở mọi request, không lưu trạng thái; chuyển non-admin về `/countdown` hoặc trả JSON 403 `prelaunch`

**Related Permissions**:
- PERM004_PrelaunchGate: Trước `LAUNCH_AT` chỉ admin và các path công khai được qua; role admin đọc từ DB, lỗi đọc coi như không phải admin

---

### F007_AdminModeration: Admin Moderation

**Type**: ui
**Description**: Admin rà soát và kiểm duyệt Kudo tại `/admin/review`. Bảng liệt kê mọi Kudo (10 dòng mỗi trang) gồm ID, người gửi, người nhận, nội dung, hashtag, số tim và trạng thái Public hoặc Spam; lọc theo người gửi, người nhận, trạng thái, khoảng ngày; tìm theo nội dung (debounce 300 ms); sắp theo tim. Toàn bộ trạng thái nằm trên URL nên tải lại hay chia sẻ link đều ra cùng kết quả. Admin bấm Mark Spam hoặc Un Spam từng dòng qua Server Action `markKudoSpam` và `unSpamKudo` (một giao dịch, idempotent, chạy `requireAdmin()` đầu tiên; chỉ lần chuyển public sang spam mới ghi sự kiện `KudoMarkedSpam` vào outbox) và xuất CSV theo bộ lọc đang chọn qua `GET /api/admin/kudos/export` (có BOM, chặn công thức, quá giới hạn dòng thì 422 `export_too_large`). Người gửi thật của Kudo ẩn danh chỉ hiện cho admin ở bảng và CSV. Slice này còn chứa `SpamAlertOverlay` và `KudoSpamTag` để chủ bài thấy cảnh báo vi phạm tiêu chuẩn cộng đồng trên Kudo spam của mình; thẻ Kudo chứa chúng thuộc feature khác.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 19 (`features/admin-moderation/components`)

**Related Screens**:
- SCR013_AdminReviewContent: Bảng Review content của Admin với lọc; tìm; sắp theo tim; phân trang; Mark Spam hoặc Un Spam từng dòng và xuất CSV

**Related User Stories**:
- US005_BrowseKudosForReview: Duyệt bảng mọi Kudo; lọc, tìm, sắp xếp và chuyển trang là các cách thu hẹp cùng một lần đọc
- US006_MarkKudoSpam: Đánh dấu một Kudo công khai là spam để Kudo biến mất khỏi các bề mặt công khai
- US007_RestoreSpamKudo: Trả một Kudo spam về công khai khi bị đánh dấu nhầm
- US008_ExportKudoReviewCsv: Xuất CSV các Kudo theo bộ lọc đang chọn để đối soát ngoài hệ thống

**Related APIs/Routes**:
- (GET) /api/admin/kudos — ROUTE001
- (GET) /api/admin/kudos/export — ROUTE002
- (POST) /admin/review — ROUTE027 (server action markKudoSpam)
- (POST) /admin/review — ROUTE028 (server action unSpamKudo)
- (GET) /api/sunners/search — ROUTE018 (dùng chung với F003, F004: bộ lọc người gửi/nhận)

**Related Data Models**:
- MODEL003_Kudo

**Related Background Logic**:
- None

**Related Permissions**:
- PERM019_AdminKudoModeration: Chỉ admin chuyển trạng thái Kudo giữa public và spam; `adminId` lấy từ phiên, id phải là uuid
- PERM021_AdminRealSenderView: Chỉ admin thấy người gửi thật của Kudo ẩn danh ở bảng Review và CSV

---

### F008_SpotlightBoard: Spotlight Board

**Type**: mixed
**Description**: Spotlight Board thời gian thực trên Live board, là một vùng riêng có Suspense boundary và trạng thái lỗi riêng. Gồm đám mây tên người nhận (tối đa 60 tên xếp theo số Kudo công khai nhận được, 24 tên trên màn hẹp, 4 cỡ chữ), bộ đếm tổng Kudos, ticker "X đã nhận được một Kudos mới" (nạp sẵn 5 Kudo gần nhất), ô tìm tên (bỏ dấu tiếng Việt, debounce 200 ms, tối đa 50 ký tự, lọc ngay trên các tên đang hiện) và nút phóng to toàn màn hình bằng Fullscreen API. Snapshot đọc qua `GET /api/spotlight` (chỉ Kudo public, không có dữ liệu người gửi). Cập nhật sống đi qua kênh Broadcast riêng `spotlight` của Supabase Realtime: trigger Postgres `spotlight_publish_kudo_event` phát `added`, `removed`, `restored` khi Kudo được ghi hoặc đổi trạng thái spam. Client tải lại snapshot sau mỗi lần join, 2–3 giây sau sự kiện kiểm duyệt và khi tab hiện lại; sau 5 lần kết nối hỏng liên tiếp thì dừng cho tới khi người dùng bấm thử lại.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 11 (`features/spotlight-board/components`)

**Related Screens**:
- SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard: Vùng Spotlight Board của Live board; feature chỉ sở hữu vùng này còn khung màn hình thuộc feature khác

**Related User Stories**:
- US042_SearchSpotlightNames: Gõ tên để làm nổi bật người đó trong đám mây tên và tìm nhanh một đồng nghiệp được vinh danh
- US043_ToggleSpotlightFullscreen: Phóng to Spotlight Board ra toàn màn hình và thu nhỏ lại để xem trên màn hình lớn

**Related APIs/Routes**:
- (GET) /api/spotlight — ROUTE017

**Related Data Models**:
- MODEL003_Kudo

**Related Background Logic**:
- BL003_SpotlightChannelListener: Hook `useSpotlightChannel` nghe kênh Broadcast `spotlight`, đưa sự kiện vào reducer và gom yêu cầu tải lại snapshot theo kiểu trailing debounce
- BL023_SpotlightPublishKudoEvent: Trigger Postgres phát sự kiện `added`, `removed`, `restored` khi Kudo được thêm hoặc đổi trạng thái; payload không mang dữ liệu người gửi

**Related Permissions**:
- PERM037_SpotlightRealtimeChannelRead: Policy RLS trên `realtime.messages` chỉ cho role `authenticated` đọc topic `spotlight`

---

### F009_HeroBadges: Hero Badges

**Type**: background
**Description**: Huy hiệu Hero của người nhận Kudo, tính khi đọc (không lưu) từ số người gửi khác nhau có Kudo công khai tới họ: New (1–4), Rising (5–9), Super (10–20), Legend (từ 21). Kudo spam và Kudo tự gửi không được tính, Kudo ẩn danh vẫn tính, người chưa có người gửi nào thì không có huy hiệu. `HeroTierQuery` là nguồn bậc duy nhất (mỗi câu truy vấn phục vụ tối đa 500 id) và được thẻ Kudo, hồ sơ, thẻ nhanh, bộ lọc Level của admin và bộ phát hiện lên bậc dùng chung. Phần giao diện chỉ là huy hiệu và tooltip giải thích bậc (mở khi rê, focus hoặc chạm; mỗi lúc chỉ một tooltip mở); feature không có màn hình riêng vì huy hiệu nằm trong các màn của feature khác. Phần logic nền là `detectHeroTierUp`, quyết định thông báo trong app `hero_tier_up` khi người nhận lên bậc, dựa trên bậc cao nhất đã báo chứ không dựa trên số đếm ngay trước Kudo, nên đúng cả khi sự kiện xử lý trễ hoặc đảo thứ tự (mã nằm trong slice notifications).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 3 (`features/hero-badges/components`)

**Related Screens**:
- None

**Related User Stories**:
- US040_ViewHeroBadgeTooltip: Xem giải thích bậc Hero khi rê, focus hoặc chạm vào huy hiệu của một người

**Related APIs/Routes**:
- None

**Related Data Models**:
- MODEL003_Kudo

**Related Background Logic**:
- BL014_HeroTierUpDetection: Hàm thuần so bậc đạt được với bậc cao nhất đã báo để quyết định thông báo `hero_tier_up`; vượt nhiều ngưỡng thì báo bậc đạt được

**Related Permissions**:
- None

---

### F010_SecretBoxRewards: Secret Box Rewards

**Type**: mixed
**Description**: Phần thưởng cho người gửi Kudo, quy đổi từ tim mà Kudo công khai của họ nhận được, theo hai đường: Secret Box (cứ 5 tim một hộp; mở ra icon hoặc quà hiện vật; đủ 6 icon nhận Quà bí ẩn) và Kudos Quốc Dân (5 Kudo nhiều tim nhất tại `NATIONAL_KUDOS_FINALIZE_AT`, chốt một lần, người gửi nhận quà đặc biệt "Root Further"). Kudos Quốc Dân thuộc feature này vì cùng kết quả phần thưởng cho người gửi, không phải vì cùng nhịp tick chạy nền. Tiến độ Secret Box là tổng tim có trọng số mà các Kudo công khai do người đó gửi nhận được (spam bị loại, Kudo ẩn danh vẫn tính, đóng băng tại `EVENT_END_AT`); số hộp được cấp là `floor(tổng tim / SECRET_BOX_HEARTS_PER_BOX)`, mặc định 5, đối soát idempotent và không bao giờ thu hồi hộp. Mở hộp qua `POST /api/secret-boxes/open` (header `Idempotency-Key` uuid v4; gửi lại cùng key trả kết quả đã lưu) rút giải phía máy chủ theo trọng số trong `secret_box_prizes`: icon thuộc bộ 6 hoặc quà hiện vật có kho giới hạn (thua tranh kho thì rút lại tối đa 3 lần rồi rơi về nhóm icon); trùng icon chỉ tăng số lượng, gom đủ 6 icon thì nhận một lần Quà bí ẩn. Giao diện là cột phần thưởng của Live board: bảng thống kê cá nhân với nút "Mở Secret Box" (modal mở hộp, deep link `?secretBox=open`) và danh sách 10 Sunner nhận quà hiện vật mới nhất; mỗi panel lỗi riêng. Phần nền: mỗi phút pg_cron hoặc cron máy chủ gọi `POST /api/internal/secret-box/tick` (không có phiên, bảo vệ bằng header `x-job-secret`); tick giữ advisory lock để không chạy chồng, chạy job quét cấp bù hộp cho người gửi vừa nhận tim rồi job chốt Kudos Quốc Dân, tức 5 Kudo công khai nhiều tim nhất, ghi đúng một lần sau `NATIONAL_KUDOS_FINALIZE_AT`.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 11 (`features/secret-box-rewards/components`)

**Related Screens**:
- SCR007_KudosLiveBoardFeed/REG006_RewardsColumn: Cột phần thưởng của Live board gồm thống kê cá nhân; nút Mở Secret Box; 10 người nhận quà mới nhất; feature chỉ sở hữu vùng này còn khung màn hình thuộc feature khác

**Related User Stories**:
- US044_OpenSecretBox: Mở Secret Box đã kiếm được từ tim để nhận icon hoặc quà từ BTC và tiến dần tới trọn bộ 6 icon

**Related APIs/Routes**:
- (POST) /api/internal/secret-box/tick — ROUTE006
- (GET) /api/secret-boxes/me — ROUTE015
- (POST) /api/secret-boxes/open — ROUTE016

**Related Data Models**:
- MODEL010_SecretBoxPrize
- MODEL011_SecretBox
- MODEL012_UserIcon
- MODEL013_MysteryGiftAward
- MODEL014_NationalKudo

**Related Background Logic**:
- BL027_SecretBoxTickEndpoint: Điểm vào HTTP của job cron; kiểm `x-job-secret`, chạy tick và trả kết quả quét cùng kết quả chốt
- BL028_SecretBoxTickCron: Migration đăng ký job pg_cron `saa-secret-box-tick` chạy mỗi phút, gọi endpoint tick qua pg_net với secret lấy từ Vault
- BL032_NationalKudosFinalize: Sau `NATIONAL_KUDOS_FINALIZE_AT` chốt đúng một lần 5 Kudo công khai có nhiều tim thô nhất vào Kudos Quốc Dân; người gửi nhận quà đặc biệt 'Root Further'
- BL033_SecretBoxSweep: Mỗi tick cấp bù hộp cho người gửi vừa có Kudo nhận tim trong 10 phút gần nhất, tối đa 500 người mỗi tick
- BL034_SecretBoxTick: Bộ điều phối tick, chạy job quét rồi job chốt; advisory lock chặn tick chạy chồng

**Related Permissions**:
- PERM033_SecretBoxOwnerOnly: User id chỉ lấy từ phiên; mở hộp luôn chọn hộp chưa mở thấp nhất của chính người đó và tra kết quả cũ theo Idempotency-Key
- PERM034_InternalJobSecretGuards: Endpoint cron không có phiên và tự bảo vệ bằng header bí mật so SHA-256 với `timingSafeEqual`

---

### F011_AdminCampaigns: Admin Campaigns

**Type**: ui
**Description**: Admin quản lý campaign "x2 tim" ở Admin › Settings (`/admin/settings`): xem danh sách, thêm, sửa, xoá campaign gồm tên (1–100 ký tự), giờ bắt đầu và giờ kết thúc (nhập theo múi giờ admin, lưu UTC). Cùng một lúc chỉ có tối đa một campaign đang hiệu lực: khung giờ chồng nhau bị từ chối kèm tên campaign đang vướng, còn hai khung chỉ chạm đầu mút thì hợp lệ vì khoảng là nửa mở [bắt đầu, kết thúc). Giờ kết thúc phải sau giờ bắt đầu và sau thời điểm hiện tại; giờ bắt đầu trong quá khứ vẫn được nhận. Trạng thái tính theo đồng hồ máy chủ chứ không theo trình duyệt: campaign sắp tới sửa được cả ba trường, đang chạy chỉ sửa tên và giờ kết thúc (đổi giờ bắt đầu bị từ chối), đã kết thúc không sửa hay xoá được; xoá là xoá hẳn và xoá campaign đang chạy nghĩa là dừng sớm. Feature chỉ ghi cấu hình: campaign đang hiệu lực là nguồn hệ số x2 mà luồng thả tim của Kudos Hearts và tooltip x2 của Secret Box Rewards đọc lại. Mọi action chạy `requireAdmin()` trước khi đọc hay ghi.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 10 (`features/admin-campaigns/components`)

**Related Screens**:
- SCR014_AdminCampaignSettings: Trang Admin › Settings: bảng campaign, menu từng dòng, nút Add Campaign, hộp thoại thêm/sửa và hộp xác nhận xoá

**Related User Stories**:
- US013_CreateCampaign: Tạo campaign x2 tim với khung giờ riêng, chặn chồng giờ với campaign khác
- US014_EditCampaign: Sửa campaign chưa kết thúc; campaign đang chạy chỉ đổi được tên và giờ kết thúc
- US015_DeleteCampaign: Xoá campaign sắp tới hoặc đang chạy sau khi xác nhận

**Related APIs/Routes**:
- (POST) /admin/settings — ROUTE029 (server action createCampaign)
- (POST) /admin/settings — ROUTE030 (server action updateCampaign)
- (POST) /admin/settings — ROUTE031 (server action removeCampaign)

**Related Data Models**:
- MODEL009_Campaign

**Related Background Logic**:
- None

**Related Permissions**:
- PERM020_AdminCampaignManagement: Chỉ admin tạo, sửa, xoá campaign; `requireAdmin()` ở ba action và ở query danh sách

---

### F012_Profile: Profile

**Type**: ui
**Description**: Hồ sơ Sunner chỉ đọc. Hồ sơ của chính mình (`/profile`) có thông tin, huy hiệu Hero, bộ sưu tập icon, bảng thống kê cá nhân (do Secret Box Rewards cung cấp, chỉ nhúng ở trang này) và danh sách Kudo mở đầu bằng "Đã gửi", có bộ lọc Đã gửi/Đã nhận. Hồ sơ đồng nghiệp (`/profile/{userId}`) có thông tin, icon, nút gửi lời cảm ơn mở composer với người nhận đã điền sẵn và khoá, cùng danh sách Kudo chỉ có "Đã nhận"; mở id của chính mình thì chuyển về `/profile`, id sai hoặc không tồn tại thì báo not-found. Phần riêng tư là lõi của feature: "Đã gửi" chỉ có ở hồ sơ của mình (hồ sơ người khác trả 403), bộ lọc người gửi luôn gắn id của phiên để không ai suy ra được người gửi ẩn danh bằng phép trừ tập, Kudo spam của chính mình hiện kèm cờ spam, và số đếm luôn khớp đúng danh sách nó gắn nhãn. Danh sách phân trang theo cursor. Thẻ tóm tắt hiện khi rê chuột hoặc đặt focus bàn phím lên avatar và tên của người có tên trên thẻ Kudo (không áp cho người gửi ẩn danh), trả đúng bảy trường: tên, phòng ban, bậc Hero, số Kudo nhận, số Kudo gửi, cờ cho phép gửi Kudo, id; không có email, role, avatar hay dữ liệu Kudo.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 9 (`features/profile/components`)

**Related Screens**:
- SCR015_OtherProfile: Hồ sơ đồng nghiệp `/profile/{userId}`: thông tin, icon, nút gửi cảm ơn, danh sách Kudo "Đã nhận"
- SCR016_OwnProfile: Hồ sơ của mình `/profile`: thông tin, bảng thống kê cá nhân, danh sách Kudo có bộ lọc Đã gửi/Đã nhận

**Related User Stories**:
- US034_OpenSunnerProfile: Mở hồ sơ đồng nghiệp từ tên hoặc avatar; id của chính mình chuyển về hồ sơ của mình
- US035_PreviewSunnerCard: Xem thẻ tóm tắt khi rê chuột hoặc đặt focus bàn phím lên avatar và tên
- US041_BrowseProfileKudos: Duyệt Kudo trên hồ sơ (của mình theo đã gửi hoặc đã nhận, của người khác chỉ đã nhận)

**Related APIs/Routes**:
- (GET) /api/profile/:userId/kudos — ROUTE014
- (GET) /api/sunners/:userId/card — ROUTE019

**Related Data Models**:
- MODEL003_Kudo
- MODEL004_Profile

**Related Background Logic**:
- None

**Related Permissions**:
- PERM030_ProfileSentListOwnerOnly: Danh sách "Đã gửi" chỉ chủ hồ sơ xem được; hồ sơ người khác nhận 403
- PERM031_SunnerCardFieldWhitelist: Thẻ tóm tắt chỉ trả đúng danh sách trường cho phép, không lộ email, role hay dữ liệu người gửi

---

### F013_Notifications: Notifications

**Type**: mixed
**Description**: Thông báo cho Sunner theo mô hình outbox. Các sự kiện nghiệp vụ (Kudo mới, tim, Kudo bị ẩn do spam, được cấp Secret Box, hoàn thành bộ icon, Kudo lọt top toàn quốc) nằm trong `domain_event_outbox`; pg_cron gọi endpoint nội bộ mỗi 5 giây (bảo vệ bằng header `x-drain-secret`), mỗi sự kiện xử lý trong transaction riêng (khoá hàng `SKIP LOCKED`, lỗi thì thử lại với backoff, quá 5 lần thì đỗ lại chờ phát lại thủ công) và đổi thành dòng `notifications`. Quy tắc: không báo Kudo tự gửi hay Kudo không còn công khai; người gửi ẩn danh không bao giờ thành actor; tim trên cùng một Kudo gộp thành một dòng chưa đọc có bộ đếm; lên bậc Hero chỉ báo một lần cho mỗi bậc. Bản ghi mới bắn tín hiệu Realtime qua kênh riêng `notifications:{userId}` (chỉ id và loại, không có nội dung) nên chuông cập nhật gần như tức thì. Phía người dùng: chuông ở header (chấm đỏ khi còn chưa đọc, dropdown 10 thông báo mới nhất), trang `/notifications` (20 dòng mỗi lượt, cuộn vô hạn, trạng thái rỗng và lỗi), bấm một dòng thì đi tới Kudo hoặc trang liên quan và đánh dấu đã đọc, nút đánh dấu đọc tất cả; đã đọc là một chiều. Hai job dọn nền giữ cho outbox và lịch sử cron không phình mãi.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 7 (`features/notifications/components`)

**Related Screens**:
- SCR017_AllNotifications: Trang `/notifications`: panel danh sách, nút đánh dấu đọc tất cả, cuộn vô hạn, trạng thái rỗng và lỗi
- SCR003_AppLayout/REG001_NotificationBell: Chuông thông báo và dropdown 10 thông báo mới nhất ở header (composite screen; feature chỉ sở hữu vùng này, vỏ AppLayout thuộc feature App Shell)

**Related User Stories**:
- US023_BrowseNotifications: Xem danh sách thông báo ở chuông và ở trang tất cả thông báo
- US024_OpenNotification: Bấm một thông báo để tới Kudo hoặc trang liên quan, đồng thời đánh dấu đã đọc
- US025_MarkAllNotificationsRead: Đánh dấu đọc tất cả thông báo bằng một lần bấm

**Related APIs/Routes**:
- (POST) /api/internal/notifications/drain — ROUTE005
- (GET) /api/notifications — ROUTE011
- (GET) /api/notifications/unread-count — ROUTE012
- (POST) /notifications — ROUTE033 (server action markNotificationRead; chuông ở AppLayout và trang này dùng chung)
- (POST) /notifications — ROUTE034 (server action markAllNotificationsRead; chuông ở AppLayout và trang này dùng chung)

**Related Data Models**:
- MODEL015_DomainEventOutbox
- MODEL016_Notification

**Related Background Logic**:
- BL002_NotificationChannelListener: Hook mở kênh Realtime riêng của người dùng, nhận tín hiệu thông báo và đồng bộ lại ở mỗi lần vào kênh, khi tab hiện lại, khi mạng online trở lại
- BL010_SupabaseBrowserClient: Client Supabase phía trình duyệt, một bản cho mỗi tab, chỉ dùng để vào kênh Realtime
- BL015_NotificationEventContextLoad: Đọc ngữ cảnh của sự kiện trong transaction của nó: Kudo hiện tại (người gửi, người nhận, ẩn danh, công khai) và bậc Hero vừa đạt
- BL016_EventToNotificationMapping: Ánh xạ thuần một sự kiện outbox thành các bản nháp thông báo; params chỉ chứa id và giá trị, không bao giờ có danh tính người gửi
- BL017_NotificationWrite: Ghi thông báo trong cùng transaction với việc đánh dấu sự kiện đã xử lý; trùng thì bỏ qua, tim gộp vào dòng chưa đọc, người nhận đã xoá hồ sơ thì bỏ qua
- BL024_NotificationsPublishSignal: Trigger cơ sở dữ liệu bắn tín hiệu Realtime khi thông báo được thêm hoặc bộ đếm tăng
- BL025_NotificationOutboxDrainEndpoint: Endpoint nội bộ kích một lượt drain, kiểm secret bằng so sánh băm có thời gian cố định
- BL026_NotificationOutboxDrain: Một lượt drain: tối đa 50 sự kiện cũ nhất, mỗi sự kiện một transaction, lỗi thì thử lại với backoff và đỗ lại sau 5 lần
- BL029_NotificationsDrainCron: Job pg_cron gọi endpoint drain mỗi 5 giây qua pg_net
- BL030_CronHistoryPrune: Job hằng ngày xoá lịch sử chạy của cron cũ hơn 7 ngày
- BL031_OutboxPrune: Job hằng ngày xoá sự kiện outbox đã xử lý quá 30 ngày; sự kiện chờ hoặc đã đỗ lại không bao giờ bị xoá

**Related Permissions**:
- PERM032_NotificationRecipientOnly: Thông báo chỉ thuộc người dùng của phiên; danh sách, số chưa đọc và đánh dấu đã đọc đều lọc theo người nhận
- PERM038_NotificationsRealtimeChannelRead: Policy RLS chỉ cho đọc topic `notifications:{auth.uid()}` của chính mình

---

### F014_AdminUserManagement: Admin User Management

**Type**: ui
**Description**: Admin duyệt và quản lý toàn bộ Sunner ở Admin › User (`/admin/users`). Bảng 20 dòng mỗi trang gồm Kudo gửi, Kudo nhận, tổng tim, Level Hero, số Badge, thời điểm gom đủ 6 Badge, lần đăng nhập cuối và Role; lọc theo Unit, Level, Role, tìm theo tên hoặc email, sắp theo cột số liệu. Bộ lọc nằm trên URL nên tải lại hay chia sẻ link ra cùng kết quả; tham số sai (tìm quá 100 ký tự, sort lạ…) báo lỗi trên trang 1 chưa lọc. Menu "⋯" từng dòng đổi role sau khi xác nhận: nâng User lên Admin, hạ Admin xuống User. Một service duy nhất ghi role từ giao diện, trong một transaction khoá các hàng admin, và chặn ba trường hợp: tự hạ chính mình, hạ admin cuối cùng, hạ tài khoản thuộc `ADMIN_EMAILS` (đăng nhập sẽ nâng lại ngay); mỗi lần đổi ghi người đổi và thời điểm đổi. Xuất CSV theo đúng bộ lọc và thứ tự đang xem (bỏ qua phân trang); vượt giới hạn `EXPORT_MAX_ROWS` thì từ chối 422, không cắt bớt dòng.

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 9 (`features/admin-users/components`)

**Related Screens**:
- SCR018_AdminUser: Trang Admin › User: bảng Sunner, bộ lọc, tìm kiếm, sắp xếp, menu đổi role và nút Export

**Related User Stories**:
- US009_BrowseUsers: Duyệt bảng Sunner kèm số liệu tham gia, lọc và tìm kiếm
- US010_PromoteUserToAdmin: Nâng một Sunner lên admin
- US011_DemoteAdminToUser: Hạ một admin khác xuống user, có chặn tự hạ, hạ admin cuối và hạ tài khoản thuộc `ADMIN_EMAILS`
- US012_ExportUsersCsv: Xuất CSV danh sách Sunner theo bộ lọc đang chọn

**Related APIs/Routes**:
- (GET) /api/admin/users/export — ROUTE004
- (POST) /admin/users — ROUTE032 (server action setUserRoleAction)

**Related Data Models**:
- MODEL004_Profile

**Related Background Logic**:
- None

**Related Permissions**:
- PERM017_AdminUserRoleChange: Chỉ admin đổi được role của người khác; actor lấy từ phiên, không nhận từ client
- PERM018_AdminRoleMenuState: Menu "⋯" quyết định tuỳ chọn theo từng hàng (chỉ là giao diện, server vẫn từ chối các ca bị cấm)

---

### F015_AdminOverview: Admin Overview

**Type**: ui
**Description**: Admin xem số liệu theo đơn vị ở Admin › Overview (`/admin/overview`): mỗi Unit một dòng với năm chỉ số (tổng thành viên, Kudo gửi, Kudo nhận, số người nhận được ít nhất một Kudo, số Secret Box nhận), kèm dòng "All" bằng tổng các dòng; Unit không có hoạt động vẫn hiện, và dòng "Chưa gán đơn vị" chỉ xuất hiện khi có profile chưa gán Unit. Chọn khoảng ngày (theo múi giờ admin) để thu hẹp giai đoạn; khoảng nằm trên URL (`from`, `to`) nên tải lại hay chia sẻ link ra cùng số liệu, khoảng ngược hoặc tham số xấu báo lỗi lọc trên bảng toàn thời gian. Cách đếm: chỉ tính Kudo công khai (Kudo ẩn danh vẫn tính), Kudo gửi tính theo Unit người gửi, Kudo nhận theo Unit người nhận, Secret Box theo thời điểm được cấp, còn thành viên không phụ thuộc khoảng ngày. Xuất CSV dùng chính truy vấn của trang nên tệp luôn khớp bảng (dòng "All" đứng đầu). Chỉ đọc, chỉ admin vào được (`requireAdmin()` ở trang, `requireAdminApi()` ở route xuất).

**Workspace**: my-app (Next.js)
**Languages**: TypeScript
**Components**: 3 (`features/admin-overview/components`)

**Related Screens**:
- SCR019_AdminOverview: Trang Admin › Overview: bảng số liệu theo Unit kèm dòng All, bộ chọn khoảng ngày và nút Export

**Related User Stories**:
- US003_FilterOverviewByDateRange: Lọc bảng Overview theo khoảng ngày để so sánh các Unit trong một giai đoạn
- US004_ExportOverviewCsv: Xuất bảng Overview ra tệp CSV

**Related APIs/Routes**:
- (GET) /api/admin/overview/export — ROUTE003

**Related Data Models**:
- MODEL001_Department
- MODEL003_Kudo
- MODEL004_Profile
- MODEL011_SecretBox

**Related Background Logic**:
- None

**Related Permissions**:
- None

---

## Summary

- **Total Features**: 15
- **Total Screens**: 20
- **Total User Stories**: 48
- **Total Routes**: 36
- **Total Data Models**: 16
- **Total Background Logic**: 34
- **Total Permissions**: 38
- **Languages Detected**: TypeScript

## Cross-Reference Validation

- [x] All F### codes are unique (kiểm sau khi merge fragment)
- [ ] All F### codes are referenced in UserStories.md (US không mang mã F###; quan hệ nằm ở Related User Stories của từng feature, kiểm sau khi merge fragment)
- [x] All screen references are valid (SCR### or SCR###/REG### in ScreenList; bare-SCR refs and region refs both accepted) (kiểm sau khi merge fragment)
- [x] All user story references are valid (US### in UserStories) (kiểm sau khi merge fragment)
- [x] All route references are valid (ROUTE### in RouteList) (kiểm sau khi merge fragment)
- [x] All data model references are valid (MODEL### in DataModel) (kiểm sau khi merge fragment)
- [x] All behavior logic references are valid (BL### in BehaviorLogic) (kiểm sau khi merge fragment)
- [x] All permission references are valid (PERM### in Permissions) (kiểm sau khi merge fragment)
- [x] Every US has a parent feature (F###) (kiểm sau khi merge fragment)
- [x] Every screen has a parent feature (F###) (kiểm sau khi merge fragment)
- [x] Every route maps to a feature (F###) (kiểm sau khi merge fragment)
- [x] Every data model maps to a feature (F###) (kiểm sau khi merge fragment)
- [x] Every background logic maps to a feature (F###) (kiểm sau khi merge fragment)
- [x] Every permission maps to a feature (F###) (kiểm sau khi merge fragment)
