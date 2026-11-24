# Permissions

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Analysis Scope**: `proxy.ts`, `shared/auth/*`, guard từng feature, Route Handler, Server Action và RLS/trigger trong `db/migrations`

> **Bản tóm tắt dễ đọc.** Tài liệu này dành cho PM, BA và khách hàng muốn nắm ai làm được gì mà không phải
> đọc mã kỹ thuật. Bản chi tiết đầy đủ nằm ở
> [permissions-matrix.md](../generated/permissions-matrix.md); nội dung ở đây được rút ra từ bản đó.

## Authorization System Type

**System Type**: hybrid

Hệ thống kết hợp bốn lớp luật: vai trò hai mức (`user` và `admin`, lưu ở `profiles.role`), quyền sở hữu tài nguyên (chủ Kudo, người nhận thông báo, chủ Secret Box), cửa sổ thời gian theo ngày ra mắt và ngày kết thúc sự kiện, và secret riêng cho các job nền. Vai trò luôn đọc từ cơ sở dữ liệu ở mỗi request, không lấy từ cookie hay token, nên đổi quyền có hiệu lực ngay.

**Identified Roles**:
- `guest` — chưa đăng nhập.
- `sunner` — nhân viên công ty đã đăng nhập, vai trò `user`. Lần đầu phải chọn phòng ban mới dùng được ứng dụng.
- `admin` — thành viên ban tổ chức, vai trò `admin`.
- `scheduler` — job nền (pg_cron hoặc cron của máy chủ), không phải người dùng.

## Curated View

- **`guest`** chỉ mở được trang đăng nhập, trang đếm ngược trước ngày ra mắt và trang báo "không có quyền truy cập". Mọi trang khác tự chuyển về đăng nhập, mọi API trả lỗi 401. Đăng nhập chỉ thành công với tài khoản Google đúng domain công ty; domain khác bị từ chối ngay ở cơ sở dữ liệu lẫn ở ứng dụng.
- **`sunner` đăng nhập lần đầu** chưa vào được các trang chính. Người này chỉ thấy trang chọn phòng ban và chỉ chọn được một lần, khi hồ sơ còn chưa có phòng ban.
- **`sunner` đã chọn phòng ban** vào được trang chủ, giải thưởng, tiêu chuẩn cộng đồng, thể lệ, Live board, chi tiết Kudo, thông báo và hồ sơ cá nhân. Người này xem được Kudo công khai của mọi người, gửi Kudo cho Sunner khác (không gửi cho chính mình, có thể đính ảnh), sửa Kudo của chính mình khi Kudo chưa bị đánh dấu spam, thả hoặc bỏ tim cho Kudo công khai của người khác, đọc và đánh dấu đã đọc thông báo của mình, mở Secret Box của mình. Người này không thấy được người gửi thật của Kudo ẩn danh, không thấy Kudo spam của người khác và không xem được danh sách "Đã gửi" trên hồ sơ của người khác.
- **`admin`** làm được mọi việc của `sunner` với cùng điều kiện, cộng thêm khu quản trị: xem tổng quan và xuất CSV, duyệt nội dung (đánh dấu hoặc bỏ đánh dấu spam, thấy người gửi thật của Kudo ẩn danh, xuất CSV), cài campaign nhân đôi tim (tạo, sửa, xóa), xem danh sách người dùng, xuất CSV và nâng hoặc hạ vai trò. Admin không có đặc quyền sửa Kudo, đọc thông báo hay mở Secret Box thay người khác, và vẫn bị khóa ngoài cửa sổ ghi như mọi người. Admin không tự hạ quyền mình, không hạ tài khoản thuộc danh sách admin cấu hình sẵn và không hạ admin cuối cùng.
- **`scheduler`** chỉ gọi được hai endpoint nội bộ (tick Secret Box mỗi phút, xả hàng đợi thông báo mỗi 5 giây) và phải gửi đúng secret. Không có người dùng nào, kể cả admin, gọi được hai endpoint này từ giao diện.

## Access Boundaries

- **Khách và Sunner**: ranh giới là phiên đăng nhập hợp lệ do Supabase Auth xác nhận. Phiên bị thu hồi thì mất quyền ngay; nếu Auth không trả lời được, hệ thống coi như chưa đăng nhập.
- **Sunner và admin**: ranh giới là vai trò trong hồ sơ. Khu `/admin` bị chặn ngay ở cổng đầu vào (trả 403), và mỗi trang quản trị, mỗi thao tác quản trị còn tự kiểm lại một lần nữa. Riêng các API quản trị `/api/admin/*` không có cổng ở cổng đầu vào, chỉ được chặn bên trong từng API.
- **Quyền sở hữu**: chỉ chủ Kudo mới sửa Kudo của mình, và chỉ khi Kudo còn công khai. Thông báo và Secret Box luôn gắn với người dùng của phiên, không nhận mã người dùng từ phía trình duyệt. Danh sách "Đã gửi" chỉ có trên hồ sơ của chính mình, vì cho lọc theo người gửi trên hồ sơ người khác sẽ lộ người gửi ẩn danh.
- **Kudo ẩn danh**: mọi màn hình công khai chỉ hiện biệt danh, không hiện tên, ảnh đại diện, phòng ban hay hạng của người gửi, kể cả với admin. Chỉ truy vấn riêng của khu quản trị mới thấy người gửi thật.
- **Kudo spam**: bị loại khỏi mọi danh sách công khai; chỉ người gửi còn xem được (ở dạng chỉ đọc). Người khác mở đường dẫn của Kudo spam nhận kết quả giống Kudo không tồn tại.
- **Ẩn nút trên giao diện không phải là phân quyền**: mục Dashboard của admin, nút sửa Kudo, nút tim và menu đổi vai trò đều chỉ ẩn hoặc khóa cho gọn; máy chủ vẫn kiểm lại từng thao tác.
- **Cơ sở dữ liệu**: mọi bảng bật RLS và không cấp quyền cho trình duyệt, nên trình duyệt không đọc ghi bảng nào trực tiếp. Ứng dụng truy cập qua máy chủ bằng vai trò bỏ qua RLS, vì vậy các kiểm tra ở tầng máy chủ mới là phân quyền thật. Ảnh Kudo nằm trong kho private, chỉ xem được qua đường dẫn ký sẵn của máy chủ; hai kênh realtime (Spotlight, thông báo) cũng có policy riêng, kênh thông báo chỉ nghe được thông báo của chính mình.

## Special Conditions

- **Trước giờ ra mắt**: chỉ admin vào được ứng dụng; Sunner thường bị đưa về trang đếm ngược (các thao tác khác trả 403). Sau giờ ra mắt, trang đếm ngược tự chuyển về trang chủ cho mọi người.
- **Cửa sổ ghi**: từ giờ ra mắt đến hết thời điểm kết thúc sự kiện mới gửi, sửa Kudo, tải ảnh lên, thả hoặc bỏ tim được. Ngoài khoảng này nút bị khóa và máy chủ từ chối, admin cũng không ngoại lệ. Hai mốc thời gian cấu hình theo môi trường, mốc kết thúc phải sau mốc ra mắt.
- **Admin cấu hình sẵn**: email nằm trong danh sách admin của môi trường được nâng lên admin ở mỗi lần đăng nhập, nên không hạ quyền được từ giao diện (bảng người dùng ghi "Admin · env").
- **Domain email**: chỉ domain công ty được phép. Hook kiểm tra của Supabase phải bật thủ công trên bản hosted; nếu quên, trigger trong cơ sở dữ liệu vẫn chặn nhưng người dùng chỉ thấy lỗi chung thay vì thông báo "sai domain".
- **Job nền**: hai secret nội bộ phải đủ dài (tối thiểu 32 ký tự) và là tuỳ chọn; chưa cấu hình thì endpoint trả 503 và job không chạy được.
- **Giới hạn upload ảnh**: mỗi người tối đa 20 ảnh đang chờ gắn vào Kudo trong 24 giờ.
- **Cookie ngôn ngữ**: chỉ gắn cờ bảo mật ở môi trường production.
- Không có feature flag, A/B test hay nhánh theo ngôn ngữ nào ảnh hưởng tới quyền truy cập. Chi tiết từng luật nằm trong [permissions-matrix.md](../generated/permissions-matrix.md).
