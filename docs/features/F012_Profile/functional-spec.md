---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: văn phong thường, không file:line, không tên lớp, không động từ HTTP. Chi tiết kỹ thuật nằm ở technical-spec.md. -->

# Functional Spec — F012_Profile

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F012_Profile → SCR015_OtherProfile, SCR016_OwnProfile → US034_OpenSunnerProfile, US035_PreviewSunnerCard, US041_BrowseProfileKudos → ROUTE014, ROUTE019

## 1. Overview

**Problem:** Sunner muốn xem mình đang được ghi nhận ra sao (huy hiệu Hero, bộ sưu tập icon, số liệu, Kudo đã gửi và đã nhận) và muốn biết thêm về đồng nghiệp ngay trước khi cảm ơn họ; không có trang riêng thì lời ghi nhận chỉ trôi trên Live board.
**Solution:** Hai trang hồ sơ chỉ đọc (của mình, của đồng nghiệp) cùng một thẻ tóm tắt hiện khi rê chuột hoặc đặt focus bàn phím lên tên hay avatar của người có tên trên thẻ Kudo. Hồ sơ của mình có thêm bảng thống kê và danh sách Kudo "Đã gửi" / "Đã nhận"; hồ sơ đồng nghiệp có nút gửi lời cảm ơn và danh sách Kudo họ đã nhận.
**Scope:** Hai trang hồ sơ, danh sách Kudo trên hồ sơ (phân trang, có lọc ở hồ sơ của mình), thẻ tóm tắt khi rê chuột, và phần riêng tư của chúng: "Đã gửi" chỉ chủ hồ sơ thấy, người gửi ẩn danh không bao giờ bị lộ, số đếm luôn khớp danh sách.
**Non-Scope:** Sửa tên, avatar, phòng ban (tên và avatar lấy từ Google, phòng ban do F001_Auth quản lý); thẻ Kudo và việc che người gửi ẩn danh (F004_KudosFeed); thả tim (F005_KudosHearts); đánh dấu hoặc bỏ đánh dấu Spam (F007_AdminModeration); huy hiệu Hero (F009_HeroBadges); bộ sưu tập icon, bảng thống kê và mở Secret Box (F010_SecretBoxRewards); form viết và sửa Kudo (F003_KudosAuthoring).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner (chủ hồ sơ) | Nhân viên đã đăng nhập, xem trang của chính mình | Xem huy hiệu, icon, số liệu và các Kudo mình đã gửi hoặc nhận |
| Sunner (người xem) | Nhân viên đã đăng nhập, xem đồng nghiệp | Tìm hiểu đồng nghiệp, đọc Kudo họ nhận, xem nhanh họ qua thẻ tóm tắt, gửi lời cảm ơn |

Feature này chưa tham gia luồng liên-feature nào (chưa có tài liệu luồng nào trong `docs/flows/`).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem hồ sơ Sunner | Mở hồ sơ của mình hoặc của đồng nghiệp từ tên hay avatar, xem huy hiệu, icon, bảng thống kê (chỉ của mình) và bấm gửi lời cảm ơn cho đồng nghiệp | US034 | FR-001, FR-002, FR-101, FR-102, FR-103, FR-104, FR-201, FR-202, FR-203, FR-301, FR-302, FR-303, FR-304, FR-601 | BR-004, BR-005, BR-009, BR-010, BR-011, DEC-001, DEC-007 | SCR015, SCR016 |
| CAP-02 | Duyệt Kudo trên hồ sơ | Đọc danh sách Kudo trên hồ sơ (của mình theo đã gửi hoặc đã nhận, của người khác chỉ đã nhận), đổi hướng, tải thêm, thử lại khi lỗi | US041 | FR-204, FR-205, FR-305, FR-401, FR-402, FR-405, FR-406, FR-602, FR-603, FR-604 | BR-001, BR-002, BR-003, BR-006, DEC-002, DEC-008, SM-002 | SCR015, SCR016 |
| CAP-03 | Xem nhanh một Sunner | Rê chuột hoặc đặt focus lên avatar và tên để xem thẻ tóm tắt mà không rời trang, gửi lời cảm ơn ngay từ thẻ | US035 | FR-403, FR-404, FR-407, FR-408, FR-605 | BR-007, BR-008, DEC-003, DEC-004, DEC-005, DEC-006, SM-001 | SCR015, SCR016 |

## 3. Open Decisions

None — no unresolved domain confirmations.

## 4. Requirements

### Foundation (0xx)

- **FR-001** Tên, avatar và mã phòng ban hiển thị trên hồ sơ lấy từ hồ sơ và danh sách phòng ban do F001_Auth quản lý.
- **FR-002** Tính năng này không tự thay đổi dữ liệu: không sửa thông tin cá nhân, không tạo hay sửa Kudo (việc đó thuộc F003_KudosAuthoring).

### Navigation (1xx)

- **FR-101** Sunner vào hồ sơ của mình từ mục "Profile" của menu tài khoản, hoặc từ thông báo lên bậc Hero và thông báo đủ bộ icon.
- **FR-102** Bấm tên hoặc avatar của người có tên trên thẻ Kudo, chọn kết quả tìm Sunner, bấm tên trong Spotlight hoặc bấm tên trên thẻ tóm tắt thì mở hồ sơ người đó.
- **FR-103** Mở hồ sơ của chính mình bằng địa chỉ của người khác thì được đưa về trang hồ sơ của mình.
- **FR-104** Mở hồ sơ của một Sunner không tồn tại, hoặc địa chỉ sai định dạng, thì thấy trang "Không tìm thấy Sunner này." kèm nút quay lại Live board.

### Hồ sơ của mình (2xx)

- **FR-201** Phần đầu trang hiện avatar lớn ở giữa, tên, mã phòng ban và huy hiệu Hero (chỉ khi đã có cấp).
- **FR-202** Dưới tên có 6 ô icon tròn: ô đã có hiện hình icon (kèm "×N" khi có hơn một), ô chưa có hiện xám rỗng; chú thích "Bộ sưu tập icon của tôi".
- **FR-203** Bảng thống kê cá nhân hiện số Kudo nhận, Kudo đã gửi, tim nhận, Secret Box đã mở, chưa mở, kèm nút "Mở Secret Box".
- **FR-204** Mục KUDOS có dropdown "Đã gửi (n)" / "Đã nhận (n)", mở đầu bằng "Đã gửi"; dropdown dùng được bằng bàn phím.
- **FR-205** Danh sách là các thẻ Kudo như trên Live board; Kudo Spam của chính mình hiện mờ kèm thẻ cam "Spam".

### Hồ sơ người khác (3xx)

- **FR-301** Phần đầu trang hiện avatar, tên, mã phòng ban và huy hiệu Hero giống trang của mình.
- **FR-302** Có đủ 6 ô icon như trang của mình, chú thích "Bộ sưu tập icon"; tên từng icon chỉ có ở nhãn đọc cho trình đọc màn hình, không in dưới ô.
- **FR-303** Trang người khác không có bảng thống kê cá nhân.
- **FR-304** Nút rộng "Gửi lời cảm ơn và ghi nhận tới {tên}" mở form viết Kudo với người nhận đã điền sẵn và khoá; nút bị vô hiệu kèm thông báo khi sự kiện đã đóng cửa ghi.
- **FR-305** Mục KUDOS hiện nhãn "Đã nhận: n Kudos", không có dropdown, danh sách là các Kudo người đó đã nhận.

### Interaction (4xx)

- **FR-401** Đổi dropdown Đã gửi / Đã nhận thì danh sách tải lại từ trang đầu theo lựa chọn mới; đổi liền tay nhiều lần chỉ hiện kết quả của lựa chọn cuối.
- **FR-402** "Tải thêm" nối 10 Kudo kế tiếp (mới nhất trước), chuyển focus vào thẻ đầu của đợt vừa nối và đọc số thẻ vừa tải; bấm khi đang tải thì bị bỏ qua, hết Kudo thì nút biến mất.
- **FR-403** Rê chuột lên avatar (hoặc đặt focus bàn phím lên tên) đủ 300 ms thì avatar có viền vàng và thẻ tóm tắt mở ra.
- **FR-404** Thẻ đóng khi chuột rời khối người và thẻ (150 ms), khi nhấn Esc, bấm ra ngoài hoặc focus rời cả tên lẫn thẻ; mỗi lúc chỉ một thẻ mở; cảm ứng không mở thẻ.
- **FR-405** Danh sách không có Kudo nào thì hiện "Chưa có Kudo nào." và không có nút "Tải thêm".
- **FR-406** Tải danh sách lỗi thì hiện cảnh báo kèm "Thử lại" (lỗi khi tải thêm vẫn giữ phần đã có); cursor bị từ chối thì "Thử lại" quay về trang đầu; phiên hết hạn thì hiện liên kết đăng nhập quay lại đúng hồ sơ.
- **FR-407** Thẻ tóm tắt hiện tên (liên kết tới hồ sơ), tên đơn vị, huy hiệu Hero nếu có, "Số Kudos nhận được" và "Số Kudos đã gửi".
- **FR-408** Nút "Gửi KUDO" trên thẻ mở form viết Kudo với người nhận đã điền sẵn và khoá; sau khi gửi, thẻ của người đó tải lại số đếm ở lần mở kế.

### Security (6xx)

- **FR-601** Mọi trang và dữ liệu của tính năng này yêu cầu Sunner đã đăng nhập và đã chọn phòng ban.
- **FR-602** Kudo ẩn danh không bao giờ lộ người gửi trên danh sách của hồ sơ hay trên thẻ tóm tắt.
- **FR-603** Bảng thống kê và danh sách "Đã gửi" chỉ chủ hồ sơ xem được; việc kiểm tra làm ở máy chủ, không dựa vào giao diện.
- **FR-604** Kudo Spam chỉ hiện cho chính người gửi, trong danh sách "Đã gửi" của họ.
- **FR-605** Thẻ tóm tắt chỉ trả đúng bảy trường: tên, phòng ban, bậc Hero, số Kudo nhận, số Kudo gửi, cờ cho phép gửi Kudo và mã định danh; không có email, role, avatar hay dữ liệu Kudo.

## 5. Business Rules

- Danh sách "Đã nhận" của bất kỳ ai chỉ gồm Kudo ở trạng thái Public (BR-001)
- "Đã gửi" chỉ có trên hồ sơ của mình, lọc theo người đang đăng nhập, gồm Kudo Public và Kudo Spam của chính mình trộn theo thời gian, Spam gắn thẻ "Spam" (BR-002)
- Kudo ẩn danh luôn chỉ hiện biệt danh trên mọi danh sách của hồ sơ, kể cả của người nhận và người gửi (BR-003)
- Bảng thống kê cá nhân chỉ hiện trên hồ sơ của chính mình (BR-004)
- Huy hiệu Hero chỉ hiện khi Sunner đã có cấp; chưa có thì bỏ cả phần huy hiệu, không để ô trống (BR-005)
- Con số trong dropdown và nhãn "Đã nhận" bằng đúng số Kudo mà danh sách đó hiện cho người xem (BR-006)
- Thẻ tóm tắt chỉ có cho Sunner có tên; người gửi ẩn danh không có thẻ, và dữ liệu thẻ không gắn với Kudo nào (BR-007)
- Trên thẻ, số nhận là Kudo Public nhận, số gửi là Kudo Public gửi không tính Spam; với người khác thì bỏ cả Kudo ẩn danh của họ (BR-008)
- Nút gửi lời cảm ơn và nút "Gửi KUDO" chỉ bật khi sự kiện còn mở cửa ghi; thẻ của chính mình không có "Gửi KUDO" (BR-009)
- Một khối đọc lỗi chỉ làm mất khối đó (huy hiệu, hàng icon, danh sách Kudo), không làm hỏng cả trang (BR-010)
- Form viết Kudo mở từ hồ sơ hoặc thẻ có người nhận điền sẵn và khoá; đóng form thì chưa có Kudo nào được gửi (BR-011)
- Hồ sơ nào hiện là "của mình" hay "của người khác" do người đang đăng nhập quyết định, không do địa chỉ (DEC-001)
- Danh sách Kudo dựng theo lựa chọn: Đã nhận → Kudo người đó nhận; Đã gửi → Kudo mình gửi, và Đã gửi của người khác bị từ chối (DEC-002)
- Thẻ tóm tắt chỉ mở cho người có tên, bằng chuột hoặc bàn phím, không phải cảm ứng, không dưới lớp mờ Spam (DEC-003)
- Thẻ đóng khi chuột rời, Esc, bấm ra ngoài, focus rời hoặc khi một thẻ khác mở (DEC-004)
- Dùng bàn phím, Tab đi từ tên vào thẻ, qua các nút của thẻ rồi ra ngoài; Shift+Tab và Esc quay về tên (DEC-005)
- Nội dung thẻ: luôn có tên và hai số đếm; đơn vị, huy hiệu Hero và "Gửi KUDO" chỉ hiện khi có (DEC-006)
- Phần đầu trang: dòng "mã phòng ban · huy hiệu" và hàng icon chỉ hiện khi có dữ liệu; bảng thống kê chỉ ở trang của mình (DEC-007)
- Vùng KUDOS hiện dropdown (của mình) hoặc nhãn "Đã nhận" (của người khác), rồi danh sách, trạng thái đang tải, trống, lỗi và nút "Tải thêm" theo trạng thái nạp (DEC-008)
- Thẻ tóm tắt trên một avatar đi qua các trạng thái đóng, chờ mở, đang tải, đã hiện, rồi đóng (SM-001)
- Danh sách Kudo của hồ sơ đi qua các trạng thái sẵn sàng, đang tải, trống, lỗi, và quay lại tải khi đổi hướng hoặc thử lại (SM-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Hồ sơ của mình | SCR016_OwnProfile | Nền Live board, avatar lớn, tên, mã phòng ban và huy hiệu Hero, hàng 6 icon "Bộ sưu tập icon của tôi", bảng thống kê cá nhân, mục KUDOS có dropdown và danh sách thẻ | Mở Secret Box, đổi Đã gửi / Đã nhận, tải thêm, sửa Kudo của mình qua bút trên thẻ, bấm sang hồ sơ người khác, rê chuột lên avatar để xem thẻ tóm tắt |
| Hồ sơ đồng nghiệp | SCR015_OtherProfile | Như trên nhưng chú thích icon là "Bộ sưu tập icon", không có bảng thống kê, có nút "Gửi lời cảm ơn và ghi nhận tới {tên}" và nhãn "Đã nhận: n Kudos" | Gửi lời cảm ơn tới người đó, tải thêm, bấm sang hồ sơ khác, xem thẻ tóm tắt; mở địa chỉ sai thì thấy trang không tìm thấy |

Thẻ tóm tắt không phải một màn riêng: đó là thành phần hiện cạnh avatar trên thẻ Kudo ở Live board, trang chi tiết Kudo và chính hai hồ sơ này.

### User Journey

1. Sunner mở menu tài khoản, chọn Profile và thấy Hồ sơ của mình: huy hiệu, icon, bảng thống kê và mục KUDOS đang ở "Đã gửi".
2. Sunner đổi sang "Đã nhận" để đọc các lời cảm ơn mình nhận, bấm "Tải thêm" khi muốn xem thêm.
3. Trên Live board, Sunner rê chuột lên avatar một đồng nghiệp và thấy thẻ tóm tắt với đơn vị, bậc Hero và hai số đếm.
4. Sunner bấm tên trên thẻ, tới Hồ sơ đồng nghiệp và đọc các Kudo họ đã nhận.
5. Sunner bấm "Gửi lời cảm ơn và ghi nhận tới {tên}", form viết Kudo mở ra với người nhận đã điền sẵn.

## 7. User Stories

### US034_OpenSunnerProfile — Mở hồ sơ một Sunner

**Actor:** Sunner (người xem)
**Goal:** Mở hồ sơ của một đồng nghiệp từ tên hoặc avatar của họ, để xem họ đã nhận bao nhiêu Kudo và gửi lời cảm ơn tới họ.
**Business value:** Rút ngắn đường từ "thấy một lời cảm ơn" tới "hiểu người được cảm ơn" và "cảm ơn lại", tăng gắn kết và số Kudo.

**Acceptance Criteria:**
- [ ] Bấm tên của người có tên (người nhận, hoặc người gửi không ẩn danh) trên thẻ Kudo mở hồ sơ người đó; avatar cũng dẫn tới hồ sơ nhưng chỉ cho con trỏ, nên mỗi người chỉ có một điểm dừng Tab.
- [ ] Bấm tên trong đám mây Spotlight, kết quả tìm Sunner hoặc tên trên thẻ tóm tắt cũng mở hồ sơ người đó.
- [ ] Người gửi ẩn danh chỉ hiện biệt danh: không liên kết, không thẻ tóm tắt.
- [ ] Bấm tên chính mình thì được đưa về Hồ sơ của mình; địa chỉ sai định dạng hoặc không có Sunner thì hiện "Không tìm thấy Sunner này." kèm nút "Quay lại Live board".
- [ ] Trên Hồ sơ đồng nghiệp: có avatar, tên, mã phòng ban, huy hiệu Hero (nếu có), 6 ô icon, nút gửi lời cảm ơn ghi đúng tên người đang xem và không có bảng thống kê.

### US041_BrowseProfileKudos — Duyệt Kudo trên hồ sơ

**Actor:** Sunner (chủ hồ sơ)
**Goal:** Duyệt Kudo trên hồ sơ (của mình theo hướng đã gửi hoặc đã nhận, của người khác theo hướng đã nhận) mà không phải cuộn cả Live board.
**Business value:** Cho Sunner nhìn lại các lời cảm ơn đã trao và nhận, kể cả thấy Kudo của mình bị đánh dấu Spam, mà không lộ người gửi ẩn danh.

**Acceptance Criteria:**
- [ ] Hồ sơ của mình mở bằng "Đã gửi (n)" và có dropdown "Đã gửi" / "Đã nhận" kèm số đếm; hồ sơ người khác chỉ hiện "Đã nhận: n Kudos", không có dropdown và không có "Đã gửi".
- [ ] Đổi hướng thì danh sách bắt đầu lại từ trang đầu; đổi liền tay nhiều lần chỉ hiện kết quả của lựa chọn cuối.
- [ ] "Tải thêm" nối 10 Kudo kế tiếp (mới nhất trước), chuyển focus vào thẻ đầu của đợt vừa nối và đọc số thẻ vừa tải; hết Kudo thì nút biến mất.
- [ ] Danh sách rỗng hiện "Chưa có Kudo nào."; lỗi tải hiện cảnh báo kèm "Thử lại"; phiên hết hạn hiện liên kết đăng nhập quay lại đúng hồ sơ.
- [ ] "Đã gửi" của mình gồm cả Kudo Spam của chính mình, hiện mờ kèm thẻ "Spam"; người gửi ẩn danh luôn chỉ hiện biệt danh.

### US035_PreviewSunnerCard — Xem nhanh một Sunner

**Actor:** Sunner (người xem)
**Goal:** Rê chuột hoặc đặt focus bàn phím lên avatar và tên một người trên thẻ Kudo để xem thẻ tóm tắt mà không rời trang.
**Business value:** Biết nhanh đơn vị, bậc Hero và số Kudo của một người, giảm số lần phải chuyển trang khi lướt Live board.

**Acceptance Criteria:**
- [ ] Rê chuột vào avatar (hoặc focus bàn phím lên tên) 300 ms thì thẻ mở và avatar có viền vàng; chuột rời khỏi khối người và thẻ 150 ms thì thẻ đóng; Esc, bấm ra ngoài hoặc focus rời cả tên lẫn thẻ cũng đóng.
- [ ] Mỗi lúc chỉ một thẻ mở; thao tác chạm không mở thẻ, avatar chỉ là liên kết tới hồ sơ.
- [ ] Thẻ hiện tên (liên kết tới hồ sơ), "Tên đơn vị: …", huy hiệu Hero nếu có, "Số Kudos nhận được" và "Số Kudos đã gửi"; không có email, role, avatar, Kudo hay dữ liệu người gửi.
- [ ] Nút "Gửi KUDO" chỉ có khi sự kiện còn mở cửa ghi và thẻ không phải của chính mình.
- [ ] Lần mở đầu tải dữ liệu, các lần sau trong 60 giây dùng bản đã nhớ trên trang; tải lỗi thì không hiện thẻ nào (không bao giờ có thẻ rỗng).
- [ ] Người gửi ẩn danh và Kudo Spam của chính mình (dưới lớp mờ) không có thẻ.

## 8. Scenarios

### US034_OpenSunnerProfile — Happy Path

**Given** Sunner đã đăng nhập và thẻ Kudo có người nhận tên "A", **When** bấm tên "A", **Then** thấy Hồ sơ đồng nghiệp của A với icon, nút gửi lời cảm ơn và không có bảng thống kê.

### US034_OpenSunnerProfile — Own profile

**Given** thẻ Kudo có tên của chính Sunner, **When** bấm tên mình, **Then** thấy Hồ sơ của mình (có bảng thống kê), không thấy trang trung gian nào.

### US034_OpenSunnerProfile — Error: Sunner không tồn tại

**Given** một địa chỉ hồ sơ không có Sunner thật hoặc sai định dạng, **When** Sunner mở nó, **Then** thấy "Không tìm thấy Sunner này." và nút "Quay lại Live board".

### US041_BrowseProfileKudos — Happy Path

**Given** Sunner có 25 Kudo đã gửi và một số Kudo đã nhận, **When** mở hồ sơ, bấm "Tải thêm" hai lần rồi đổi sang "Đã nhận", **Then** thấy 10, rồi 20, rồi 25 Kudo đã gửi (nút biến mất ở cuối), sau đó danh sách nạp lại từ đầu chỉ với Kudo mình nhận.

### US041_BrowseProfileKudos — Error: tải danh sách lỗi

**Given** mạng lỗi khi bấm "Tải thêm", **When** yêu cầu thất bại, **Then** danh sách đã có giữ nguyên, hiện cảnh báo kèm "Thử lại", phần còn lại của trang không đổi.

### US041_BrowseProfileKudos — Error: hồ sơ người khác không có "Đã gửi"

**Given** Sunner xem hồ sơ đồng nghiệp, **When** tìm cách xem danh sách "Đã gửi" của họ, **Then** không có lựa chọn nào trên giao diện và yêu cầu trực tiếp bị từ chối, không có dữ liệu nào trả về.

### US035_PreviewSunnerCard — Happy Path

**Given** Sunner dùng chuột, thẻ Kudo có người gửi không ẩn danh, **When** rê chuột lên avatar người đó đủ 300 ms, **Then** avatar có viền vàng và thẻ hiện tên, đơn vị, bậc Hero, hai số đếm và nút "Gửi KUDO".

### US035_PreviewSunnerCard — Error: thẻ không tải được hoặc người gửi ẩn danh

**Given** dữ liệu thẻ lỗi, hoặc người gửi là ẩn danh, **When** Sunner rê chuột lên avatar, **Then** không hiện thẻ nào (không bao giờ có thẻ rỗng) và bấm avatar của người có tên vẫn mở hồ sơ.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Mở hồ sơ của chính mình bằng địa chỉ của người khác | Chuyển về Hồ sơ của mình | None — chuyển trang im lặng |
| Mở hồ sơ người không tồn tại hoặc địa chỉ sai định dạng | Hiện trang không tìm thấy, hai trường hợp không phân biệt | "Không tìm thấy Sunner này." kèm nút "Quay lại Live board" |
| Danh sách Đã gửi hoặc Đã nhận trống | Hiện trạng thái trống, không có nút "Tải thêm" | "Chưa có Kudo nào." |
| Tải danh sách lỗi | Hiện cảnh báo và nút thử lại; lỗi khi tải thêm giữ nguyên phần đã có | "Không tải được Kudos. Vui lòng thử lại." |
| Phiên hết hạn khi đang tải danh sách | Hiện liên kết đăng nhập, đăng nhập xong quay lại đúng hồ sơ | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." |
| Người xem đổi dropdown nhanh liên tiếp | Chỉ kết quả của lựa chọn cuối cùng được hiện | None — xử lý im lặng |
| Kudo Spam của chính mình trong "Đã gửi" | Hiện mờ kèm thẻ cam "Spam", không có trong "Đã nhận" của ai, không vào số trên thẻ tóm tắt | None — thẻ "Spam" trên Kudo |
| Kudo Public bị Admin đánh dấu Spam khi đang xem | Lần tải kế tiếp biến khỏi "Đã nhận" của người nhận; chủ bài thấy thẻ "Spam" ở "Đã gửi" | None — cập nhật khi tải lại |
| Kudo ẩn danh trong danh sách | Thẻ chỉ hiện biệt danh, không liên kết, avatar không có thẻ tóm tắt; kể cả trên "Đã gửi" của chính người gửi | "Người gửi ẩn danh" |
| Sunner chưa có phòng ban hoặc chưa có bậc Hero | Bỏ phần phòng ban hoặc huy hiệu, bố cục không để ô trống | None — ẩn phần thiếu |
| Icon có hơn một cái, hoặc chưa có | Ô hiện "×N" khi có hơn một; ô chưa có hiện xám rỗng | None — hiển thị theo số lượng |
| Hết cửa sổ ghi Kudo | Nút gửi lời cảm ơn bị vô hiệu, thẻ tóm tắt không còn "Gửi KUDO" | "Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa." |
| Rê chuột lên avatar của chính mình | Thẻ hiện số đếm nhưng không có "Gửi KUDO" | None — nút không hiện |
| Màn cảm ứng | Chạm avatar chỉ mở hồ sơ, không có thẻ tóm tắt | None — đi thẳng tới hồ sơ |
| Đọc bảng thống kê, bậc Hero hoặc icon lỗi | Chỉ khối đó rơi về dự phòng (panel lỗi, bỏ huy hiệu, bỏ hàng icon), trang vẫn hiện | None — khối đó tự báo lỗi hoặc ẩn |
| Admin xem hồ sơ | Giống Sunner thường, không thấy thêm người gửi thật của Kudo ẩn danh | None — như Sunner |

## 10. Edge Behaviours to Verify

- **FR-103** → Mở hồ sơ của chính mình qua địa chỉ của người khác thì về trang hồ sơ của mình, không qua trang trung gian.
- **FR-104** → Địa chỉ sai định dạng và địa chỉ của Sunner không tồn tại cho cùng một trang không tìm thấy.
- **FR-203** → Bảng thống kê có đủ 5 số và nút "Mở Secret Box" chỉ trên trang của mình.
- **FR-303** → Trang người khác không có bảng thống kê dù đi vào bằng cách nào.
- **FR-305** → "Đã nhận: n Kudos" bằng số thẻ Public người đó nhận khi duyệt hết các trang.
- **FR-401** → Đổi dropdown liền tay chỉ hiện kết quả của lựa chọn cuối.
- **FR-402** → Mỗi lần "Tải thêm" nối đúng 10 thẻ, focus vào thẻ đầu của đợt mới, nút biến mất khi hết.
- **FR-403** → Rê chuột đủ 300 ms thì có viền vàng và thẻ; rời chuột thì thẻ đóng.
- **FR-404** → Esc đóng thẻ và trả focus về tên; mỗi lúc chỉ một thẻ mở.
- **FR-406** → Lỗi khi tải thêm giữ nguyên danh sách cũ; cursor bị từ chối thì "Thử lại" về trang đầu.
- **FR-408** → Sau khi gửi Kudo từ thẻ, lần mở thẻ kế của người đó hiện số đếm mới.
- **FR-602** → Kudo ẩn danh không lộ người gửi, dù xem bằng hồ sơ của người nhận hay của chính người gửi.
- **FR-603** → Người xem không có cách nào xem "Đã gửi" hay bảng thống kê của người khác.
- **FR-604** → Kudo Spam chỉ hiện cho chính người gửi, trong "Đã gửi".
- **FR-605** → Thẻ tóm tắt chỉ có bảy trường cho phép, không có email, role, avatar hay dữ liệu Kudo.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | known-issue | Mở Hồ sơ của mình được mô tả là chỉ đọc, nhưng bảng thống kê chạy bước đối chiếu Secret Box: nếu số hộp được hưởng theo tim nhận lớn hơn số đã cấp thì cấp thêm hộp (ghi dữ liệu) ngay khi mở trang | Mở trang có thể làm tăng số Secret Box chưa mở và sinh một sự kiện cấp hộp; "chỉ đọc" chỉ đúng với phần việc của feature này | confirmed |
| RISK-02 | known-issue | Cùng một Sunner thấy ba con số "đã gửi" khác nhau trên màn của chính mình: dropdown "Đã gửi (n)" tính cả Kudo Spam của mình; thẻ tóm tắt và bảng thống kê chỉ tính Kudo Public | Chủ hồ sơ có Kudo bị đánh dấu Spam thấy số dropdown lớn hơn số trên thẻ và bảng thống kê | confirmed (dropdown tính cả Spam để khớp danh sách; số trên thẻ theo quyết định 2026-11-23) |
| RISK-03 | risk | Số đếm và nút "Gửi KUDO" trên thẻ được nhớ tối đa 60 giây trên trang; nút gửi của Live board không làm thẻ tải lại | Thẻ có thể hiện số cũ tới 60 giây sau khi gửi Kudo từ Live board, hoặc vẫn hiện "Gửi KUDO" sát giờ đóng cửa ghi | confirmed (chấp nhận bản nhớ 60 giây) |
| RISK-04 | known-issue | Đang đặt focus bàn phím trong thẻ A rồi dùng chuột mở thẻ B thì thẻ A đóng và focus rơi về đầu trang thay vì về tên | Người dùng bàn phím kết hợp chuột mất vị trí focus | [INFERRED] |
| RISK-05 | risk | Độ trễ mở 300 ms và ân hạn đóng 150 ms của thẻ chưa có kiểm thử đo thời gian | Đổi các mốc này có thể làm thẻ nháy hoặc khó chạm tới mà không có kiểm thử báo | [UNVERIFIED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, hồ sơ, phòng ban và cổng chọn phòng ban | FR-001, FR-601 |
| F002_AppShell | feature | Mục Profile trong menu tài khoản, khung trang, kiểu trang không tìm thấy | FR-101, FR-104 |
| F003_KudosAuthoring | feature | Form viết Kudo (người nhận điền sẵn, khoá), cổng phiên cho dữ liệu, cửa sổ ghi Kudo | FR-304, FR-408, BR-009, BR-011 |
| F004_KudosFeed | feature | Thẻ Kudo, đọc Kudo Public, che người gửi ẩn danh, đánh dấu avatar và tên bằng thẻ tóm tắt | FR-205, FR-602, BR-001, BR-003 |
| F005_KudosHearts | feature | Số tim trên thẻ Kudo và tim nhận trong bảng thống kê | FR-203, FR-205 |
| F007_AdminModeration | feature | Trạng thái Spam của Kudo, lớp mờ và thẻ "Spam" cho chủ bài | FR-205, FR-604 |
| F008_SpotlightBoard | feature | Tên trong đám mây Spotlight dẫn tới hồ sơ | FR-102 |
| F009_HeroBadges | feature | Bậc Hero và huy hiệu cạnh tên | FR-201, FR-301, FR-407, BR-005 |
| F010_SecretBoxRewards | feature | Bộ sưu tập icon, bảng thống kê, nút "Mở Secret Box" | FR-202, FR-203, FR-302, RISK-01 |
| F013_Notifications | feature | Thông báo lên bậc Hero và đủ bộ icon dẫn về hồ sơ của mình | FR-101 |
| Cơ sở dữ liệu và phiên đăng nhập của hệ thống | infrastructure | Đọc hồ sơ, phòng ban và Kudo; xác thực người xem | FR-601, FR-603 |
| Cửa sổ ghi Kudo (giờ mở và giờ đóng sự kiện) | config | Quyết định nút gửi và "Gửi KUDO" có bật không | BR-009 |

## 13. Configuration

```text
PROFILE_KUDOS_PAGE_SIZE = 10        # số Kudo mỗi lần nạp và mỗi lần bấm "Tải thêm", bằng cỡ trang Live board
HOVER_CARD_OPEN_DELAY_MS = 300      # độ trễ trước khi thẻ tóm tắt mở
POINTER_LEAVE_DELAY_MS = 150        # ân hạn sau khi chuột rời, để kịp di vào thẻ
SUNNER_CARD_TTL_MS = 60000          # thời gian một thẻ đã tải được dùng lại trên trang
SECRET_BOX_ICON_CODES = 6 icon      # số ô trong bộ sưu tập icon, luôn đủ 6 ô theo thứ tự cố định
LAUNCH_AT = (giờ mở sự kiện)        # từ giờ này nút gửi lời cảm ơn và "Gửi KUDO" mới bật
EVENT_END_AT = (giờ đóng sự kiện)   # từ giờ này hai nút trên bị vô hiệu
```
