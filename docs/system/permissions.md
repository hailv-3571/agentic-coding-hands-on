---
status: implemented
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Permissions

**Project**: SAA 2025 "ROOT FURTHER" — Cổng giải thưởng + Sun* Kudos + gamification + Admin
**Generated**: 2026-11-08
**Analysis Scope**: Toàn hệ thống (F001–F015), web only. Bản nháp forward-authored từ các spec feature; mọi mã `PERM###` = `TBD (draft)`, sẽ được máy cấp ở bước reconcile.

> **Curated, plain-language view.** Tài liệu cho PM, BA, khách hàng; không có mã `PERM###` và không có bảng ma trận. Ma trận thô nằm ở `docs/generated/permissions-matrix.md` (do Core pass sinh, không viết ở đây). Lý do chọn mô hình phân quyền thuộc về ADR, không nằm trong bản nháp này.

## Authorization System Type

**System Type**: `hybrid` — hai role (`rbac`) cộng quyền theo chủ sở hữu (`ownership`) và quy tắc hiển thị theo trạng thái nội dung (`abac` nhẹ: Kudo `public`/`spam`, cờ ẩn danh).

**Identified Roles**:
- Guest — chưa đăng nhập.
- User (Sunner) — đã đăng nhập bằng Google `@sun-asterisk.com`, `profiles.role = user` (mặc định).
- Admin — `profiles.role = admin`; do Admin khác nâng quyền (F014); cách tạo Admin đầu tiên: `TBD (draft)`.

## Curated View

### Theo role

- **Guest** chỉ thấy màn đăng nhập, trang callback đăng nhập, tài nguyên tĩnh và trang lỗi 404. Màn Countdown trước giờ mở và `/awards` có công khai hay không còn chờ xác nhận. Mọi trang và API khác chuyển về đăng nhập (trang) hoặc trả 401 (dữ liệu). Guest không bao giờ đọc được dữ liệu nghiệp vụ.
- **User (Sunner)** dùng toàn bộ khu Sunner: xem Kudo công khai, viết và sửa Kudo của mình, thả tim, xem Spotlight, huy hiệu Hero, Secret Box của mình, thông báo của mình, profile. Không vào được khu Admin (nhận 403) và không gọi được hành động của Admin dù gọi trực tiếp.
- **Admin** làm được mọi việc của User, cộng khu `/admin`: duyệt và đánh dấu Spam Kudo, quản lý Campaign, quản lý người dùng và đổi role, xem Overview, Export. Admin không được tự hạ role của mình và không được để hệ thống hết Admin.

### Theo feature (mỗi dòng là một quy tắc truy cập, đặt tên mô tả)

**F001_Auth**
- *Chỉ email công ty được vào*: email ngoài `@sun-asterisk.com` bị từ chối ở máy chủ (trước khi tài khoản được tạo), không chỉ ẩn ở giao diện.
- *Mỗi tài khoản một hồ sơ, role mặc định User*: không bao giờ tự tạo Admin.
- *Khách bị đưa về đăng nhập, người đã đăng nhập vào trang Login thì về trang chủ*; đích quay lại chỉ nhận đường dẫn nội bộ (chặn open redirect).
- *Role đọc từ cơ sở dữ liệu ở mỗi request*, không từ cookie hay dữ liệu client; hạ role có hiệu lực ngay ở request kế.
- *Khu Admin chỉ cho Admin*: một hàm kiểm tra dùng chung (`AdminGuard#requireAdmin`), mọi action Admin tự gọi lại, không dựa vào việc layout chặn.

**F002_AppShell**
- *Trang 404 cho mọi người, kể cả Guest*; *trang 403 cho User đã đăng nhập mà không đủ quyền*, không lộ nội dung khu Admin.
- *Mục Admin Dashboard trong menu avatar chỉ hiện với Admin* — chỉ để gọn giao diện, không phải lớp bảo vệ.
- *Đổi ngôn ngữ* lưu bằng cookie, không ghi hồ sơ; Guest có đổi được hay không (trang Login) chờ xác nhận.

**F003_KudosAuthoring**
- *Người gửi luôn là người đang đăng nhập*: không nhận `sender_id` từ client.
- *Chỉ chủ bài được sửa Kudo*; Admin có được sửa hay không: `TBD (draft)`. Người khác gọi đọc/sửa nhận 403.
- *Không đặt được trạng thái Kudo*: Kudo mới luôn `public`; luồng tạo/sửa không nhận `status`.
- *Ảnh đính kèm phải nằm trong thư mục Storage của người gửi*, tối đa 5; không tham chiếu được ảnh của người khác.
- *Tìm Sunner làm người nhận hoặc người được nhắc* dành cho mọi User; có loại chính mình khỏi kết quả hay không: `TBD (draft)`.

**F004_KudosFeed**
- *Chỉ Kudo `public` được hiển thị*: Highlight, All Kudos, chi tiết. Kudo spam và id lạ trả cùng 404 (cả với chủ bài ở màn chi tiết).
- *Kudo ẩn danh không lộ người gửi* (xem mục Quyền riêng tư Kudo ẩn danh bên dưới).
- *Sao chép liên kết* chỉ là thao tác ở trình duyệt; người mở liên kết vẫn phải đăng nhập.

**F005_KudosHearts**
- *Chỉ thả tim cho Kudo `public` của người khác*: tự thả tim cho Kudo của mình bị 403, Kudo spam bị 404.
- *Tim luôn gắn với người đang đăng nhập*; mỗi người một tim cho mỗi Kudo; bỏ tim khi chưa thả vẫn thành công.
- *Hệ số x2 gắn lúc thả* và giữ nguyên sau khi campaign kết thúc hoặc bị xoá.

**F006_AwardsPortal**
- *Trước giờ mở (`LAUNCH_AT`) người dùng thường chỉ thấy Countdown*; `/awards` mở được trước giờ mở theo mặc định đề xuất. Admin có bỏ qua cổng này hay không: `TBD (draft)`.
- *Thể lệ, Tiêu chuẩn cộng đồng, Hệ thống giải là trang tĩnh, không có ô nhập, không có dữ liệu cá nhân.*

**F007_AdminModeration**
- *Chỉ Admin duyệt Kudo*: xem bảng mọi Kudo (cả `public` lẫn `spam`), lọc, tìm, Export, Mark Spam, Un Spam; kiểm role ở server cho từng action.
- *Chủ bài chỉ thấy Kudo spam do chính mình gửi*, kèm thẻ "Spam" và lớp cảnh báo vi phạm; người khác không bao giờ thấy.
- *Chủ bài không tự gỡ spam được*: bảng `kudos` không có đường ghi cho client; luồng sửa của F003 không nhận `status`.
- *Mark Spam không thu hồi Secret Box đã cấp hay đã mở*; số đếm (tim, huy hiệu Hero, thống kê) tự loại Kudo spam khi truy vấn.

**F008_SpotlightBoard**
- *Mọi User đã đăng nhập xem được Spotlight*; chỉ có người nhận, tổng số Kudo `public`; không bao giờ có người gửi, kể cả Kudo ẩn danh.
- *Kênh thời gian thực là kênh riêng tư*: chỉ tài khoản đã xác thực nhận được.

**F009_HeroBadges**
- *Huy hiệu Hero chỉ dựng cho người đã đăng nhập*, không có endpoint công khai; client chỉ nhận tên cấp, không nhận danh sách người gửi.
- *Chỉ Kudo `public` và người gửi khác người nhận được tính vào cấp.*

**F010_SecretBoxRewards**
- *Bảng thống kê và nút Mở Secret Box chỉ của chính mình*; mở hộp luôn chỉ tìm hộp của người đang đăng nhập, không mở được hộp của người khác.
- *Bộ sưu tập icon của người khác và danh sách 10 Sunner nhận quà mới nhất* đọc được với mọi User đã đăng nhập (tên, avatar, quà hiện vật; không có icon thường).
- *Kết quả bốc hộp do máy chủ quyết định*; client không chọn được phần thưởng.
- *Việc chốt Kudos Quốc Dân chỉ chạy bằng khoá dịch vụ phía máy chủ*, không có đường gọi từ trình duyệt.
- *Kudo ẩn danh vẫn được tính tim, hộp, Kudos Quốc Dân cho người gửi.*

**F011_AdminCampaigns**
- *Chỉ Admin thêm, sửa, xoá Campaign*; campaign đã kết thúc không sửa/xoá được; campaign đang chạy không đổi được giờ bắt đầu.
- *Bảng `campaigns` chỉ đi qua máy chủ*; F005 và F010 đọc campaign hiệu lực qua hàm nội bộ, không có endpoint công khai.

**F012_Profile**
- *Bảng thống kê cá nhân và danh sách "Đã gửi" chỉ cho chủ profile*; xem "Đã gửi" của người khác bị 403.
- *Profile người khác chỉ hiện Kudo `public` họ đã nhận*, người gửi ẩn danh vẫn bị che.
- *Thẻ nhanh khi rê chuột chỉ có tên, avatar, phòng ban, cấp Hero*, không email, không thống kê; *người gửi ẩn danh không có thẻ nhanh và không sinh request nào*.
- *Kudo spam của mình hiện trong "Đã gửi" với thẻ "Spam"; không bao giờ trong "Đã nhận" của ai.*

**F013_Notifications**
- *Mọi thao tác chỉ trên thông báo của chính mình*: thông báo của người khác trả 404; không đọc, không đánh dấu đọc được.
- *Kênh thời gian thực theo từng người*: chỉ chủ nhận thông báo của mình.
- *Thông báo Kudo ẩn danh không có người gửi* (`actor` rỗng, không có tên hay id).
- *Việc sinh thông báo chạy phía máy chủ bằng khoá dịch vụ*, không có đường gọi từ trình duyệt.

**F014_AdminUserManagement**
- *Chỉ Admin xem bảng người dùng, lọc, Export, đổi role.*
- *Admin không được tự hạ role của chính mình* (403) và *hệ thống luôn còn ít nhất một Admin* (409); hai Admin hạ nhau cùng lúc chỉ một lệnh thành công.
- *Role chỉ đổi qua hành động này*: Sunner không tự nâng role được qua API Supabase công khai.

**F015_AdminOverview**
- *Chỉ Admin xem Overview và Export*; chỉ đọc, không ghi.

## Access Boundaries

### Ranh giới Guest / User / Admin

- Giữa Guest và User: session Supabase hợp lệ (`getUser()`), email đúng domain. Cổng này đặt ở lớp proxy (khách chuyển `/login?next=…`, đường dẫn `/api/` trả JSON 401) và nhắc lại ở đầu mọi page, route handler, server action qua `requireSunner()`.
- Giữa User và Admin: role đọc từ cơ sở dữ liệu. Với `/admin/*`, proxy trả luôn 403 cho người không phải Admin (trang tải: HTML của `/access-denied` với status 403; non-GET hoặc server action: JSON 403), vì dưới Cache Components layout không đổi được status. Layout chỉ là UX: mỗi page, action và truy vấn Admin tự gọi `requireAdmin()` (layout không chạy lại ở mỗi lần điều hướng phía client và không bảo vệ server action). Chi tiết: `architecture.md`, mục Session proxy.
- Khu Admin gồm: Overview, Review content, User, Settings (Campaign), cùng mọi route `/admin/*` và `/api/admin/*`. Không có khu vực nào chỉ dành cho một Sunner cụ thể ngoài dữ liệu của chính người đó.

### Quyền sở hữu (ownership)

- Chủ Kudo (người gửi): sửa Kudo của mình, thấy Kudo spam của mình, thấy bài ẩn danh của mình.
- Chủ hộp / thông báo / thống kê: chỉ người đó; `userId` luôn lấy từ session, không từ body, đường dẫn hay query.

### Quyền riêng tư Kudo ẩn danh

- Máy chủ cắt bỏ mọi trường nhận diện người gửi (id, tên, avatar, phòng ban, cấp Hero) khỏi mọi dữ liệu gửi tới trình duyệt: thẻ Kudo, chi tiết, Highlight, danh sách trên profile (kể cả "Đã gửi" của chính người gửi), Spotlight (ảnh chụp và sự kiện realtime), thông báo. Việc che nằm ở tầng truy vấn (`KudoPublicQuery`, truy vấn Spotlight, hàm trigger, bộ sinh thông báo), không dựa vào giao diện và không dựa vào RLS.
- Chỉ chính người gửi biết bài của mình (cờ "chủ bài" do máy chủ tính, chỉ trả cho đúng người đó).
- Người gửi ẩn danh vẫn được tính điểm: tim, Secret Box, Kudos Quốc Dân, số liệu Admin. Ẩn danh chỉ là chuyện hiển thị.
- Avatar người gửi ẩn danh không có thẻ nhanh; thẻ nhanh không gắn với Kudo nên không suy ra được người gửi.
- Admin: mặc định đề xuất `[INFERRED]` — Admin thấy người gửi thật kèm nhãn "Ẩn danh" trong bảng Review, bộ lọc người gửi và Export (để truy vết vi phạm). Chính sách này trái với cam kết ẩn danh nếu doanh nghiệp quyết định "không ai thấy"; cần xác nhận (`[NEEDS_DOMAIN_CONFIRMATION]`).

### Quy tắc hiển thị Kudo spam

- Kudo `spam` biến mất khỏi mọi nơi công khai: Highlight, All Kudos, chi tiết (404 cho mọi người, kể cả chủ bài), Spotlight, profile "Đã nhận", mọi số đếm (tim, Hero, tổng Kudo, thống kê Admin).
- Chủ bài thấy Kudo spam của chính mình (một thẻ "Spam" ở "Đã gửi" trên profile, và lớp cảnh báo "Cảnh báo vi phạm tiêu chuẩn cộng đồng"); người khác không bao giờ thấy, kể cả khi biết id.
- Admin thấy cả hai trạng thái trong bảng Review với huy hiệu `Public`/`Spam`.
- Chỉ Admin đổi được trạng thái; chủ bài nhận thông báo "Kudo bị tạm ẩn".

### Quy tắc dữ liệu: Supabase RLS

- Drizzle chạy bằng vai trò server nên bỏ qua RLS: mọi kiểm quyền, kiểm sở hữu và che dữ liệu **phải nằm ở tầng server**, không được trông vào RLS.
- RLS **bật** ở mọi bảng nghiệp vụ (`profiles`, `kudos`, `kudo_hearts`, `campaigns`, `secret_boxes` và các bảng thưởng, `notifications`, `domain_event_outbox`, …) làm lớp phòng thủ thứ hai. **Không có policy ghi** (INSERT/UPDATE/DELETE) nào cho vai trò `anon`/`authenticated`: mọi ghi đi qua server.
- Không có policy đọc cho `anon`/`authenticated` trên `kudos` và các bảng khác chứa thông tin nhạy cảm (người gửi ẩn danh, Kudo spam): nếu cần đọc trực tiếp từ client trong tương lai, phải thêm policy tối thiểu riêng cho từng bảng và rà lại quy tắc che dữ liệu. (Câu chữ "RLS yêu cầu đã đăng nhập" ở F001 cần hiểu theo hướng này — xem Consistency Check trong `architecture.md`, C-20.)
- Ngoại lệ duy nhất là chính sách đọc trên `realtime.messages` (Supabase Realtime): cho vai trò đã xác thực nhận kênh `spotlight` và kênh `notifications:{auth.uid()}` của chính mình. Kênh Realtime công khai phải tắt.
- Khoá dịch vụ (service role) chỉ ở phía máy chủ, không bao giờ gửi xuống client: dùng cho bộ xử lý outbox (F013) và job chốt Kudos Quốc Dân (F010). Khoá công khai (anon) đi cùng RLS như trên.
- Storage ảnh Kudo: upload qua signed upload URL vào thư mục của người gửi; chính sách đọc bucket (công khai hay signed URL): `TBD (draft)`.

## Special Conditions

- **Trước giờ mở (`LAUNCH_AT`)**: người dùng thường bị đưa về Countdown; sau giờ mở `/countdown` về trang chủ. Chỉ suy ra từ giờ máy chủ, không lưu cờ.
- **Khung giờ campaign x2 tim**: hệ số của tim gắn lúc thả theo campaign đang hiệu lực `[starts_at, ends_at)`; không đổi hồi tố.
- **Mốc khoá Secret Box (`SECRET_BOX_LOCK_AT`, `[INFERRED]` 2025-12-26 23:59:59+07)**: sau mốc này không cấp hộp mới; tim thả sau mốc không tính. Kudos Quốc Dân chốt đúng một lần ở mốc `NATIONAL_KUDOS_FINALIZE_AT`.
- **Phiên hết hạn / hạ role giữa chừng**: coi như chưa có session (chuyển Login kèm đích quay lại) hoặc bị 403 ở request kế (role đọc lại từ DB). Quyền kênh Realtime chỉ cập nhật khi token hết hạn.
- **Giới hạn nhập**: lời nhắn tối đa 1.000 ký tự, tối đa 5 ảnh; Export tối đa `EXPORT_MAX_ROWS` dòng, ô CSV bắt đầu bằng `= + - @` bị vô hiệu hoá.
- **Gọi trực tiếp API / server action khi chưa đủ quyền**: bị từ chối theo cùng quy tắc như đi qua giao diện (401 chưa đăng nhập, 403 không đủ quyền, 404 với tài nguyên không được phép biết là tồn tại: Kudo spam, thông báo của người khác).
- **Cấu hình môi trường**: `ALLOWED_EMAIL_DOMAIN` chỉ là gợi ý cho màn chọn tài khoản Google; chốt chặn thật nằm ở auth hook `before_user_created` cùng trigger trên `auth.users` (INSERT và đổi email), chung vị từ `is_sunner_email()`.

### Quyết định còn mở liên quan phân quyền

- Admin đầu tiên được tạo bằng cách nào (F001 D003).
- Admin có được sửa Kudo của người khác không (F003).
- Admin có vào được trang trước giờ mở không (F006); Guest có xem Countdown, `/awards`, đổi ngôn ngữ ở Login không (F001, F002, F006).
- Admin có thấy người gửi thật của Kudo ẩn danh không (F007 D001, RISK-01).
- Chủ bài có xem/sửa được Kudo spam của mình không (F003, F004, F007).
- Tự gửi Kudo cho chính mình có bị cấm không (F003).
