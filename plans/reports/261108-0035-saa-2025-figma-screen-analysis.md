# Phân tích tổng quan màn hình — SAA 2025 (Internal Live Coding)

- Nguồn: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C/SAA-2025---Internal-Live-Coding
- Phạm vi đã đọc: toàn bộ cấu trúc trang Website (User + Admin) và Mobile; chữ trên mọi frame; ảnh chụp 7 màn chính (Login, Homepage, Hệ thống giải, Sun* Kudos Live board, Admin Overview / Review content / User).
- Chưa đọc: trang Components (39:28). Trang Tablet trống.
- Loại công việc: phân tích (deliverable), chưa code.

## 1. Sản phẩm là gì

Website nội bộ của Sun* cho **Sun* Annual Awards 2025 (SAA 2025)**, chủ đề **"ROOT FURTHER"**. Gồm hai phần:

1. **Cổng thông tin lễ trao giải** — giới thiệu chủ đề, đếm ngược tới lễ (26/12/2025, Âu Cơ Art Center, có livestream), giới thiệu 6 hạng mục giải.
2. **Sun* Kudos** — "Hệ thống ghi nhận và cảm ơn": nhân viên (Sunner) gửi lời cảm ơn công khai cho đồng nghiệp, kèm cơ chế game hoá (tim, huy hiệu, Secret Box, quà). Kudos là điểm mới của SAA 2025, triển khai từ 11/2025; BTC dùng dữ liệu Kudos làm nguồn tham khảo cho Hội đồng xét giải.

Kèm một **trang quản trị (Admin)** để BTC theo dõi số liệu, kiểm duyệt nội dung, quản lý người dùng và chiến dịch.

## 2. Vai trò

| Vai trò | Suy ra từ | Quyền chính |
|---|---|---|
| Sunner (User) | Đăng nhập Google, email @sun-asterisk.com | Xem awards, gửi/nhận Kudos, thả tim, mở Secret Box, xem profile |
| Admin | Dropdown-profile Admin, cột Role = Admin | Thêm mọi quyền User + vào khu Admin |
| Khách chưa đăng nhập | Login, Countdown prelaunch | Chỉ thấy trang đăng nhập / đếm ngược |

## 3. Nhóm tính năng

### 3.1 Xác thực & khung chung
- Đăng nhập **chỉ bằng Google** (SSO nội bộ).
- Đổi ngôn ngữ VN/EN.
- Header: About SAA 2025 · Award Information · Sun* Kudos · chuông thông báo · avatar (dropdown profile).
- Trang lỗi 404 (Not Found), 403 (Access Denied).
- Trang **Countdown – Prelaunch**: trước giờ mở cửa chỉ hiện đếm ngược.

### 3.2 Cổng SAA 2025
- **Homepage**: hero ROOT FURTHER, đếm ngược Days/Hours/Minutes, thời gian–địa điểm, nút About Awards / About Kudos, bài viết về chủ đề, lưới 6 giải, banner Sun* Kudos.
- **Hệ thống giải** (menu bên trái neo theo cuộn):

| Giải | Số lượng | Giá trị |
|---|---|---|
| Top Talent | 10 cá nhân | 7.000.000 VNĐ/giải |
| Top Project | 02 tập thể | 15.000.000 VNĐ/giải |
| Top Project Leader | 03 cá nhân | 7.000.000 VNĐ/giải |
| Best Manager | 01 cá nhân | 10.000.000 VNĐ |
| Signature 2025 – Creator | 01 cá nhân hoặc tập thể | 5.000.000 (cá nhân) / 8.000.000 (tập thể) |
| MVP | 01 cá nhân | 15.000.000 VNĐ |

- **Thể lệ**, **Tiêu chuẩn cộng đồng** (kèm Tiêu chuẩn bảo mật): trang nội dung tĩnh.

### 3.3 Sun* Kudos (lõi nghiệp vụ)
**Live board** gồm:
- Ô "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" (mở form viết) + ô tìm profile Sunner.
- **Highlight Kudos**: carousel, 1 thẻ ở giữa rõ nét, 2 bên mờ; lọc theo Hashtag và Phòng ban; phân trang (2/5).
- **Spotlight Board**: bản đồ tên người nhận dạng đám mây chữ, tổng số Kudos (388), luồng sự kiện thời gian thực ("08:30PM X đã nhận được một Kudos mới"), có tìm kiếm và phóng to.
- **All Kudos**: feed thẻ Kudos.
- Cột phải: thống kê cá nhân (Kudos nhận / đã gửi, tim nhận được, chiến dịch x2, Secret Box đã mở / chưa mở, nút **Mở Secret Box**) + danh sách **10 Sunner nhận quà mới nhất**.
- Nút nổi cố định (FAB) cho các thao tác nhanh.

**Thẻ Kudos**: người gửi → người nhận (avatar, tên, phòng ban, huy hiệu Hero), thời gian, danh hiệu do người gửi đặt (VD "IDOL GIỚI TRẺ", "NGƯỜI HÙNG CỦA LÒNG EM"), nội dung, ảnh đính kèm (tối đa ~5), hashtag, số tim, Copy Link, Xem chi tiết, nút sửa (với bài của mình). Có biến thể **ẩn danh**.

**Viết / Sửa Kudo** (modal):
- Trường bắt buộc: Người nhận (dropdown tìm người), Lời nhắn, Hashtag (chọn từ danh sách, VD #BE PROFESSIONAL, #BE OPTIMISTIC, #High-performing).
- Danh hiệu, ảnh đính kèm, chèn link (Addlink box), nhắc tên bằng "@ + tên", giới hạn 1.000 ký tự, tuỳ chọn gửi ẩn danh.
- Thiếu trường bắt buộc → lỗi "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!".
- Có thể sửa bài sau khi đăng.

**Kiểm duyệt**: Kudo bị đánh dấu spam hiển thị dạng riêng; người dùng thấy **Alert Overlay "Cảnh báo vi phạm tiêu chuẩn cộng đồng"**.

### 3.4 Game hoá (theo Thể lệ)
- **Huy hiệu Hero cho người nhận** (tính theo số người khác nhau đã gửi Kudos), hiện cạnh tên:
  - New Hero: 1–4 người · Rising Hero: 5–9 · Super Hero: 10–20 · Legend Hero: >20.
- **Người gửi**: Kudos được thả ❤️; **cứ 5 tim = mở 1 Secret Box**. Secret Box cho ra icon (bộ 6) hoặc quà hiện vật (Áo phông SAA, Lót chuột / Khăn Root Further…). **Gom đủ 6 icon → nhận quà bí ẩn**.
- **Chiến dịch "Ngày x2 tim"**: trong khung giờ do Admin cấu hình, tim nhận được nhân đôi.
- **Kudos Quốc Dân**: 5 Kudos nhiều tim nhất toàn Sun* nhận quà đặc biệt.
- Màn mở hộp có nhiều trạng thái: chưa mở → bấm mở (animation) → hiện quà → chờ mở hộp tiếp.

### 3.5 Profile & Thông báo
- Profile bản thân: thông tin, danh hiệu, thống kê, danh sách Kudos đã nhận/gửi (lọc đã nhận / đã gửi).
- Profile người khác: thông tin + Kudos của họ. Rê chuột lên avatar → thẻ thông tin nhanh.
- Thông báo: danh sách tất cả + xem chi tiết.

### 3.6 Admin
- **Overview**: bảng số liệu theo đơn vị (tổng thành viên, Kudos gửi, Kudos nhận, số người có ≥1 Kudos, số Secret Box nhận), lọc theo khoảng ngày, **Export**.
- **Review content**: bảng mọi Kudo (người gửi, người nhận, nội dung, hashtag, tim, trạng thái Public/Spam), lọc theo người gửi / người nhận / trạng thái / ngày, tìm theo nội dung, thao tác **Mark Spam / Un Spam**, Export, phân trang.
- **User**: bảng người dùng (Kudos gửi/nhận, tổng tim, Level, số Badges, thời điểm gom đủ 6 Badges, lần đăng nhập cuối, Role), lọc theo phòng ban / Level / Role, tìm kiếm, Export, menu thao tác từng dòng (đổi role…).
- **Settings**: quản lý **Campaign** (tên, ngày giờ bắt đầu–kết thúc), thêm / sửa / xoá — chính là cấu hình "Ngày x2 tim".

## 4. Luồng chính

```
Đăng nhập Google ─► (trước giờ G) Countdown
                 └► Homepage ─► Hệ thống giải / Thể lệ
                             └► Sun* Kudos Live board
                                  ├─ Viết Kudo ─► đăng lên feed + Spotlight realtime ─► người nhận có thông báo, lên huy hiệu Hero
                                  ├─ Thả tim ─► người gửi đủ 5 tim ─► +1 Secret Box ─► mở ─► icon/quà ─► đủ 6 icon ─► quà bí ẩn
                                  └─ Xem profile / Kudo chi tiết
Admin ─► Overview (số liệu) · Review content (spam) · User · Settings (campaign x2)
```

## 5. Yêu cầu phi chức năng suy ra
- **Thời gian thực**: Spotlight live feed, thông báo mới, bộ đếm Kudos.
- **Đa ngôn ngữ** VN/EN.
- **Responsive**: Desktop 1440/1512 và Mobile 375 (thiết kế mobile ghi "[iOS]").
- **Bảo mật**: chỉ email công ty; phân quyền User/Admin; 403 cho truy cập trái phép.
- **Kiểm duyệt nội dung** và tiêu chuẩn cộng đồng.
- **Export dữ liệu** cho BTC.
- Thương hiệu tối màu, chữ vàng, hoạ tiết ROOT FURTHER.

## 6. Câu hỏi còn mở (cần BTC/PO xác nhận)
1. Mobile là **app iOS native** hay **web responsive**? Frame đặt tên "[iOS]" và dùng SF Symbols.
2. Gửi ẩn danh: Admin có thấy người gửi thật không? Ẩn danh có được tính tim / Secret Box không?
3. "5 tim = 1 Secret Box": tính trên tổng tim mọi Kudo đã gửi? Tim x2 trong chiến dịch có được cộng gấp đôi vào tiến độ Secret Box không?
4. Tỉ lệ ra quà / icon trong Secret Box, kho quà có giới hạn số lượng không?
5. **Level** (1–5) trong Admin User tính theo gì? Có phải khác với huy hiệu Hero?
6. Được tự gửi cho chính mình, hoặc gửi nhiều lần cho cùng một người không? Có giới hạn số Kudos mỗi ngày không?
7. Hashtag cố định (theo giá trị cốt lõi Sun*) hay người dùng tạo được?
8. Kudo bị Mark Spam: ẩn khỏi feed, có trừ tim / huy hiệu đã cộng không?
9. Menu Admin chỗ ghi "Role", chỗ ghi "User": tên nào đúng?
10. Thời điểm mở/đóng hệ thống: hết lễ 26/12 có khoá gửi Kudos không? (bảng Admin User có ngày tới 01/2026)
11. Trang Tablet trống: dùng layout nào cho tablet?
