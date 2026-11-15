---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Functional Spec — F010_SecretBoxRewards

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoint dự kiến, thiết kế dữ liệu, thuật toán cấp hộp / bốc quà và cách xử lý đồng thời cho Dev/QA/SA.

**Traceability:** F010_SecretBoxRewards → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft)

## 1. Overview

**Problem:** Sun* Kudos cần một vòng thưởng để Sunner gửi Kudo có động lực: Kudo được tim thì người gửi nhận hộp quà bí ẩn. Nếu cấp hộp hoặc bốc quà không chặt, hai lần bấm hoặc hai tab có thể mở một hộp hai lần, cấp thừa hộp, hay phát quá số quà BTC đã chuẩn bị.
**Solution:** Cứ mỗi 5 tim người gửi nhận được thì hệ thống tự cấp một Secret Box. Sunner mở hộp để ra một icon (trong bộ 6) hoặc một món quà hiện vật; gom đủ 6 icon khác nhau thì nhận một quà bí ẩn từ BTC. Cột bên phải của Live board có bảng thống kê cá nhân (kèm nút Mở Secret Box) và danh sách 10 Sunner nhận quà mới nhất. Cuối chiến dịch, 5 Kudo nhiều tim nhất toàn Sun* trở thành Kudos Quốc Dân và người gửi nhận quà đặc biệt "Root Further".
**Scope:** Quy đổi tim thành Secret Box; mở hộp và bốc quà; bộ sưu tập 6 icon và quà bí ẩn; bảng thống kê cá nhân; danh sách 10 Sunner nhận quà mới nhất; màn mở hộp; chốt Kudos Quốc Dân; phát tín hiệu sự kiện (có hộp mới, đủ 6 icon, Kudos Quốc Dân chốt) cho feature thông báo.
**Non-Scope:** Không tự thả hay đếm tim (F005, feature này chỉ đọc tổng tim). Không dựng trang Live board (F004) hay trang profile (F012), chỉ cung cấp vùng và thành phần nhúng. Không gửi thông báo (F013). Không quản lý chiến dịch x2 (F011). Không có màn Admin để sửa kho quà, và không theo dõi việc BTC giao quà hiện vật (BTC giao ngoài hệ thống vào cuối sự kiện).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner gửi Kudo | Sunner đã đăng nhập và đã gửi Kudo được cộng đồng thả tim | Tích đủ tim để có Secret Box, mở hộp, gom đủ 6 icon |
| Sunner xem | Sunner đã đăng nhập đang xem Live board hoặc profile | Xem ai vừa nhận quà và bộ sưu tập icon của đồng nghiệp |
| Hệ thống / BTC | Tiến trình nền và Ban tổ chức đứng sau kho quà | Cấp hộp đúng, phát quà đúng số lượng, chốt Kudos Quốc Dân |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Earn Secret Boxes | Nhận thêm Secret Box tự động khi tổng tim nhận được đủ thêm mỗi mốc 5 | US002_EarnSecretBox | FR-001, FR-401, FR-405, FR-407 | BR-001, BR-002, BR-006, BR-007 | TBD (draft) |
| CAP-02 | Open a Secret Box | Mở từng hộp chưa mở và thấy ngay icon hoặc quà nhận được | US003_OpenSecretBox | FR-002, FR-003, FR-004, FR-102, FR-301, FR-302, FR-303, FR-402, FR-403, FR-601, FR-602 | BR-003, BR-004, DEC-002, SM-001, SM-002 | TBD (draft) |
| CAP-03 | Collect icons and mystery gift | Xem bộ sưu tập 6 icon và nhận quà bí ẩn khi gom đủ | US004_CollectIcons | FR-207, FR-304, FR-404, FR-408 | BR-005 | TBD (draft) |
| CAP-04 | Personal reward stats | Xem bảng thống kê cá nhân và bấm nút Mở Secret Box | US001_ViewPersonalStats | FR-101, FR-201, FR-202, FR-203 | DEC-001 | TBD (draft) |
| CAP-05 | Latest gift winners | Xem 10 Sunner nhận quà mới nhất | US005_ViewLatestGiftWinners | FR-204, FR-205, FR-206, FR-604 | BR-009, DEC-003 | TBD (draft) |
| CAP-06 | National Kudos | Biết Kudo nào thành Kudos Quốc Dân và nhận quà đặc biệt nếu là người gửi | US006_NationalKudos | FR-406, FR-603 | BR-008 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Tim nhân đôi (x2) có cộng gấp đôi vào tiến độ Secret Box không? | Có: tiến độ dùng tổng tim đã nhân hệ số của F005 | Khớp mặc định D005 của F005; chiến dịch x2 có ý nghĩa với phần thưởng | no |
| D002 | Kudo bị Mark Spam hoặc tim bị bỏ thì hộp đã cấp có bị thu hồi không? | Không thu hồi hộp đã cấp; tiến độ tính lại từ tổng hiện tại và chỉ cấp thêm khi vượt mốc mới | Hộp đã mở không rút lại được; thu hồi hộp chưa mở gây tranh chấp | no |
| D003 | Tỉ lệ ra icon / quà và số lượng quà hiện vật là bao nhiêu? | Mỗi phần thưởng có trọng số và số lượng cấu hình sẵn; icon không giới hạn, quà hiện vật hữu hạn; quà hết hàng thì hộp ra icon | Cần con số thật từ BTC trước khi chạy; thiết kế không phụ thuộc con số | yes |
| D004 | Kudo gửi ẩn danh có được tính tim và Secret Box cho người gửi không? | Có tính; danh tính chỉ ẩn khi hiển thị cho người khác | Người gửi vẫn xứng đáng nhận thưởng; F005 đã đếm tim theo Kudo đã gửi | no |
| D005 | Sau mốc 26/12/2025 hệ thống làm gì? | Mốc chốt 23:59:59 ngày 26/12/2025 (giờ Việt Nam) [INFERRED]; sau đó không cấp hộp mới, hộp đã có vẫn mở được, không đặt hạn mở | Brief chỉ nêu mốc khoá; không có dấu hiệu hạn mở hộp | no |
| D006 | Kudos Quốc Dân được chốt và công bố thế nào? | Tiến trình nền tự chốt đúng một lần ở mốc khoá, xếp theo số tim thô (số người đã thả), hoà thì Kudo gửi sớm hơn đứng trước; báo cho người gửi qua thông báo; chưa có vùng hiển thị riêng | Không cần thao tác tay; số thô công bằng hơn số nhân hệ số | no |
| D007 | Quà bí ẩn khi gom đủ 6 icon là gì và do ai quyết? | Một quà cố định cấu hình sẵn; BTC giao ngoài hệ thống vào cuối sự kiện, ứng dụng không theo dõi việc giao | Thông báo trong Figma nói BTC sẽ liên hệ giao quà cuối sự kiện | no |
| D008 | Danh sách 10 Sunner nhận quà mới nhất gồm những sự kiện nào? | Chỉ quà hiện vật mở từ hộp (không icon, không quà bí ẩn); mới nhất theo lúc mở | Mẫu trong Figma là "Nhận được 1 áo phông SAA" | no |
| D009 | Màn mở hộp là modal hay trang riêng? | Một modal mở từ nút trên bảng thống kê, mở thẳng được từ thông báo | Figma có cả khung trang lẫn khung modal cùng nội dung; một thành phần tái dùng là đủ | no |
| D010 | Bấm vào hộp thì mở hộp nào khi có nhiều hộp? | Mở hộp cấp sớm nhất còn chưa mở; người dùng không chọn hộp | Mọi hộp như nhau, bỏ bước chọn cho đơn giản | no |
| D011 | "Số Kudos đã gửi/nhận" trên bảng thống kê có tính Kudo bị Spam không? | Chỉ tính Kudo đang Public; Kudo gửi ẩn danh vẫn tính cho người gửi | Khớp cách F005 loại Kudo Spam khỏi tổng tim | no |
| D012 | Một người có được nhận nhiều quà hiện vật giống nhau không? | Không giới hạn | Đơn giản nhất; rủi ro hết hàng sớm ghi ở § 11 | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Cứ mỗi 5 điểm tim nhận được (tính trên Kudo mình đã gửi, đã nhân hệ số) Sunner có thêm đúng một Secret Box.
- **FR-002** Mỗi Secret Box chỉ mở được đúng một lần và kết quả được lưu lại để xem lại.
- **FR-003** Kho phần thưởng gồm 6 icon cố định và các quà hiện vật có số lượng giới hạn, đặt sẵn trước khi chiến dịch chạy.
- **FR-004** Tỉ lệ ra phần thưởng và số lượng quà đổi được bằng cấu hình, không phải sửa mã.

### Navigation (1xx)

- **FR-101** Bảng thống kê cá nhân và danh sách nhận quà mới nhất nằm ở cột phải của Live board; bảng thống kê cũng dùng lại trên trang profile của chính mình.
- **FR-102** Bấm nút "Mở Secret Box" mở màn mở hộp; màn này cũng mở thẳng được từ đường dẫn trong thông báo.

### Rewards Column (2xx)

- **FR-201** Bảng thống kê hiện năm số: Kudos nhận được, Kudos đã gửi, tim nhận được, Secret Box đã mở, Secret Box chưa mở.
- **FR-202** Khi chiến dịch x2 đang hiệu lực, số tim nhận được có nhãn x2 (nhãn do F005 báo).
- **FR-203** Nút "Mở Secret Box" bị vô hiệu hoá và có chú thích khi chưa có hộp nào chưa mở.
- **FR-204** Danh sách "10 Sunner nhận quà mới nhất" hiện avatar, tên và tên quà của từng người, cuộn được.
- **FR-205** Danh sách chỉ gồm quà hiện vật mở từ hộp, không gồm icon.
- **FR-206** Danh sách trống thì hiện thông báo thay vì vùng trắng.
- **FR-207** Bộ sưu tập icon hiện 6 vòng tròn theo đúng thứ tự icon; icon chưa có hiện vòng xám rỗng; dùng lại được trên profile của mình và của người khác.

### Open Box Screen (3xx)

- **FR-301** Màn mở hộp hiện tiêu đề "KHÁM PHÁ SECRET BOX CỦA BẠN", hướng dẫn "Click vào box để mở" và số hộp chưa mở.
- **FR-302** Bấm vào hộp chạy hoạt ảnh mở rồi hiện lời chúc mừng cùng tên quà hoặc icon nhận được.
- **FR-303** Xem xong kết quả, màn về trạng thái chờ hộp tiếp theo với số hộp chưa mở đã giảm một; hết hộp thì báo chưa có hộp nào.
- **FR-304** Khi ra icon, màn kết quả cho biết đó là icon nào và bộ sưu tập đã đủ chưa; icon trùng được ghi nhận nhưng không làm bộ sưu tập đủ thêm.

### Interaction (4xx)

- **FR-401** Hộp mới được cấp tự động khi đủ mốc, người dùng không phải thao tác; số hộp cập nhật ở lần tải hoặc lần tương tác kế tiếp.
- **FR-402** Kết quả mở hộp do máy chủ quyết định; bấm đúp, mở nhiều tab hoặc gửi lặp cùng một yêu cầu không mở thừa hộp.
- **FR-403** Quà hiện vật hết số lượng thì không phát nữa, hộp đó ra icon.
- **FR-404** Gom đủ 6 icon khác nhau thì nhận đúng một quà bí ẩn, và chỉ một lần.
- **FR-405** Sau mốc khoá không cấp thêm hộp mới; hộp đã có vẫn mở được.
- **FR-406** Cuối chiến dịch, 5 Kudo Public nhiều tim nhất toàn Sun* trở thành Kudos Quốc Dân, chốt đúng một lần; người gửi nhận quà đặc biệt "Root Further".
- **FR-407** Mỗi lần cấp hộp mới, hệ thống phát tín hiệu để feature thông báo báo cho Sunner.
- **FR-408** Khi một Sunner vừa đủ 6 icon, hệ thống phát tín hiệu để feature thông báo báo cho Sunner.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem thống kê và mở hộp, và chỉ mở hộp của chính mình.
- **FR-602** Máy khách không bao giờ quyết định kết quả; trình duyệt chỉ gửi yêu cầu mở, kết quả bốc ở máy chủ.
- **FR-603** Sunner không tự kích hoạt được việc chốt Kudos Quốc Dân; chỉ tiến trình hệ thống chốt.
- **FR-604** Danh sách nhận quà mới nhất chỉ hiện cho Sunner đã đăng nhập, kèm tên thật của người nhận.

## 5. Business Rules

- Số hộp được cấp bằng phần nguyên của tổng tim chia 5, trừ đi số hộp đã cấp; không bao giờ cấp trùng một mốc (BR-001)
- Hộp đã cấp không bị thu hồi dù sau đó tim bị bỏ hoặc Kudo bị Mark Spam; tiến độ tính tiếp từ tổng hiện tại (BR-002)
- Mỗi hộp chỉ mở một lần; yêu cầu mở lặp lại cùng mã yêu cầu trả đúng kết quả cũ (BR-003)
- Kết quả bốc theo trọng số trong số phần thưởng còn khả dụng; quà hết hàng bị loại, và luôn có icon làm phương án dự phòng (BR-004)
- Gom đủ 6 icon khác nhau thì nhận một quà bí ẩn một lần; icon trùng chỉ cộng dồn số lượng (BR-005)
- Sau mốc khoá không cấp hộp mới (BR-006)
- Kudo ẩn danh vẫn được tính tim, hộp và Kudos Quốc Dân cho người gửi; danh tính chỉ ẩn khi hiển thị (BR-007)
- Kudos Quốc Dân là 5 Kudo Public nhiều tim thô nhất; hoà thì Kudo gửi sớm hơn đứng trước; chốt một lần (BR-008)
- Danh sách nhận quà mới nhất lấy 10 lần mở hộp ra quà hiện vật gần nhất (BR-009)
- Nút Mở Secret Box chỉ bấm được khi còn hộp chưa mở, còn không bị mờ kèm chú thích (DEC-001)
- Mở hộp ra quà hiện vật nếu còn hàng, ra icon nếu không; icon cuối cùng hoàn tất bộ thì thêm thông điệp nhận quà bí ẩn (DEC-002)
- Danh sách nhận quà hiện các dòng khi có người nhận quà, còn không hiện thông báo trống (DEC-003)
- Một Secret Box chỉ có hai trạng thái: chưa mở và đã mở, chuyển một chiều khi mở (SM-001)
- Màn mở hộp đi từ chờ mở, sang đang mở, sang kết quả, rồi về chờ hoặc hết hộp (SM-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Cột thưởng của Live board (vùng nhúng cột phải của trang Live board do F004 sở hữu) | TBD (draft) | Bảng thống kê cá nhân (5 số, nhãn x2, nút Mở Secret Box) và danh sách 10 Sunner nhận quà mới nhất | Bấm Mở Secret Box, cuộn danh sách |
| Mở Secret Box (modal) | TBD (draft) | Tiêu đề, hướng dẫn, hộp quà, số hộp chưa mở, kết quả chúc mừng kèm tên quà hoặc icon | Bấm hộp để mở, xem kết quả, mở hộp kế tiếp, đóng |

Bộ sưu tập icon (FR-207) và bảng thống kê cá nhân là thành phần dùng lại trên trang profile (F012); mã màn của profile do F012 quản lý (TBD (draft)).

### User Journey

1. Sunner gửi Kudo, đồng nghiệp thả tim; khi tổng tim nhận được đủ mốc 5, Sunner thấy "Secret Box chưa mở" tăng ở cột phải Live board.
2. Sunner bấm "Mở Secret Box" và thấy màn mở hộp với số hộp chưa mở.
3. Sunner bấm vào hộp, xem hoạt ảnh, rồi thấy "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" kèm tên quà hoặc icon.
4. Màn về trạng thái chờ; Sunner mở tiếp hộp khác hoặc đóng lại và thấy số hộp đã mở tăng ở bảng thống kê.
5. Khi đủ 6 icon, Sunner thấy thông điệp nhận quà bí ẩn và nhận thông báo; bộ sưu tập trên profile sáng đủ 6 vòng.
6. Sunner khác thấy tên mình và món quà trong danh sách "10 Sunner nhận quà mới nhất".

## 7. User Stories

### US001_ViewPersonalStats — Xem thống kê phần thưởng cá nhân

**Actor:** Sunner gửi Kudo
**Goal:** Thấy số Kudos nhận/gửi, tim nhận được và số Secret Box đã mở / chưa mở ngay trên Live board.
**Business value:** Cho người dùng thấy tiến độ phần thưởng và nhắc họ mở hộp còn dở.

**Acceptance Criteria:**
- [ ] Bảng hiện đủ năm số và nút "Mở Secret Box".
- [ ] Trong chiến dịch x2, số tim nhận được có nhãn x2.
- [ ] Chưa có hộp chưa mở thì nút bị mờ kèm chú thích.

### US002_EarnSecretBox — Nhận Secret Box khi Kudo được tim

**Actor:** Sunner gửi Kudo
**Goal:** Tim các Kudo mình gửi tích đủ mốc 5 thì có Secret Box mới mà không phải làm gì thêm.
**Business value:** Biến lượng tương tác thành phần thưởng, khuyến khích viết Kudo chất lượng.

**Acceptance Criteria:**
- [ ] Đủ 5 điểm tim thì thêm đúng một hộp; 12 điểm tim ra đúng hai hộp.
- [ ] Hai lần tính cùng lúc không cấp trùng hộp.
- [ ] Hộp đã cấp không mất khi tim bị bỏ về sau.
- [ ] Sau mốc khoá không có hộp mới.

### US003_OpenSecretBox — Mở Secret Box

**Actor:** Sunner gửi Kudo
**Goal:** Mở một hộp chưa mở để nhận icon hoặc quà.
**Business value:** Đây là khoảnh khắc thưởng của cả cơ chế game hoá, phải công bằng và không gian lận được.

**Acceptance Criteria:**
- [ ] Bấm hộp thì có hoạt ảnh rồi hiện kết quả đúng với dữ liệu lưu.
- [ ] Bấm đúp hoặc mở hai tab không mở thừa hộp.
- [ ] Quà hết hàng thì hộp ra icon, không báo lỗi.
- [ ] Hết hộp thì không mở được và có thông báo rõ ràng.

### US004_CollectIcons — Gom 6 icon nhận quà bí ẩn

**Actor:** Sunner gửi Kudo
**Goal:** Gom đủ 6 icon khác nhau để nhận quà bí ẩn từ BTC.
**Business value:** Tạo mục tiêu dài hơi để Sunner tiếp tục tham gia đến hết chiến dịch.

**Acceptance Criteria:**
- [ ] Bộ sưu tập hiện đúng icon đã có, icon chưa có là vòng xám.
- [ ] Icon trùng không làm bộ đủ sớm.
- [ ] Vừa đủ 6 icon thì thấy thông điệp nhận quà và chỉ nhận một lần.

### US005_ViewLatestGiftWinners — Xem 10 Sunner nhận quà mới nhất

**Actor:** Sunner xem
**Goal:** Biết đồng nghiệp nào vừa nhận quà gì.
**Business value:** Tạo không khí và chứng minh phần thưởng có thật, kéo thêm người tham gia.

**Acceptance Criteria:**
- [ ] Danh sách có tối đa 10 dòng, mới nhất ở trên, mỗi dòng có avatar, tên và tên quà.
- [ ] Không có dòng nào ứng với icon.
- [ ] Chưa ai nhận quà thì hiện thông báo trống.

### US006_NationalKudos — Kudos Quốc Dân

**Actor:** Hệ thống / BTC
**Goal:** Chốt 5 Kudo nhiều tim nhất toàn Sun* và trao quà đặc biệt cho người gửi.
**Business value:** Vinh danh những lời cảm ơn được cả công ty đồng tình nhất.

**Acceptance Criteria:**
- [ ] Đúng 5 Kudo Public nhiều tim thô nhất được chốt; hoà thì Kudo gửi sớm hơn đứng trước.
- [ ] Chạy lại việc chốt không tạo thêm hay đổi kết quả.
- [ ] Người gửi của 5 Kudo nhận thông báo.

## 8. Scenarios

### US001_ViewPersonalStats — Happy Path

**Given** Sunner đã gửi 3 Kudo và có 7 tim nhận được, đã mở 1 hộp và còn 0 hộp, **When** mở Live board, **Then** bảng hiện đúng các số đó và nút "Mở Secret Box" bị mờ.

### US001_ViewPersonalStats — Error: Không tải được thống kê

**Given** dữ liệu thống kê tạm thời không tải được, **When** Live board hiển thị, **Then** cột phải hiện thông báo "Không tải được thống kê. Vui lòng thử lại." kèm nút thử lại, phần còn lại của trang vẫn dùng bình thường.

### US002_EarnSecretBox — Happy Path

**Given** Sunner có 4 điểm tim và chưa có hộp nào, **When** một Kudo của Sunner nhận thêm 1 tim, **Then** Sunner có 1 Secret Box chưa mở.

### US002_EarnSecretBox — Error: Sau mốc khoá

**Given** đã quá mốc khoá, **When** Sunner có thêm tim đủ mốc mới, **Then** không có hộp mới nào được cấp và hộp cũ vẫn mở được.

### US003_OpenSecretBox — Happy Path

**Given** Sunner còn 2 hộp chưa mở, **When** bấm vào hộp, **Then** hoạt ảnh chạy, màn hiện "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" kèm kết quả, và số hộp chưa mở còn 1.

### US003_OpenSecretBox — Error: Không còn hộp

**Given** Sunner mở màn mở hộp ở tab cũ trong khi hộp cuối đã được mở ở tab khác, **When** bấm vào hộp, **Then** hiện thông báo "Bạn chưa có Secret Box nào để mở" và số hộp cập nhật về 0.

### US003_OpenSecretBox — Error: Mất kết nối

**Given** Sunner bấm mở hộp và mạng bị ngắt, **When** yêu cầu không tới được máy chủ, **Then** hộp vẫn chưa mở, hiện "Không thể mở hộp, vui lòng thử lại", và bấm lại không làm mất hộp hay mở hai hộp.

### US004_CollectIcons — Happy Path

**Given** Sunner đã có 5 icon khác nhau, **When** mở hộp ra icon thứ sáu chưa có, **Then** màn kết quả báo đã đủ bộ 6 icon và Sunner nhận quà bí ẩn.

### US004_CollectIcons — Error: Icon trùng

**Given** Sunner đã có 5 icon, **When** mở hộp ra lại một icon đã có, **Then** bộ sưu tập vẫn 5 icon, màn kết quả cho biết đã có icon này.

### US005_ViewLatestGiftWinners — Happy Path

**Given** đã có 12 lần mở hộp ra quà hiện vật, **When** mở Live board, **Then** danh sách hiện đúng 10 lần mới nhất, mới nhất ở trên cùng.

### US005_ViewLatestGiftWinners — Error: Chưa có ai nhận quà

**Given** chưa có hộp nào ra quà hiện vật, **When** mở Live board, **Then** vùng danh sách hiện "Chưa có Sunner nào nhận quà."

### US006_NationalKudos — Happy Path

**Given** tới mốc chốt và có hơn 5 Kudo Public, **When** tiến trình chốt chạy, **Then** 5 Kudo nhiều tim thô nhất được ghi nhận và người gửi nhận thông báo.

### US006_NationalKudos — Error: Chạy lặp

**Given** Kudos Quốc Dân đã được chốt, **When** tiến trình chốt chạy lại, **Then** kết quả cũ giữ nguyên, không thông báo lần hai.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hai tab cùng bấm mở khi chỉ còn 1 hộp | Một yêu cầu mở được hộp, yêu cầu kia bị từ chối vì hết hộp | "Bạn chưa có Secret Box nào để mở" |
| Bấm đúp vào hộp | Chỉ một hộp được mở; lần bấm sau được coi là cùng yêu cầu và trả cùng kết quả | "None — silent handling" |
| Hai người cùng mở hộp khi chỉ còn 1 áo phông | Chỉ một người nhận áo; người kia ra icon | "None — silent handling" |
| Quà hiện vật hết hàng hoàn toàn | Mọi hộp sau đó ra icon | "None — silent handling" |
| Hộp ra icon trùng khi đã có | Ghi nhận số lượng icon, bộ sưu tập không đổi | "Bạn đã có icon này rồi" |
| Mất kết nối giữa lúc mở | Kết quả có thể đã được lưu; mở lại màn thì hộp đã mở nằm trong số đã mở và thấy kết quả | "Không thể mở hộp, vui lòng thử lại" |
| Phiên đăng nhập hết hạn lúc mở hộp | Từ chối, đưa về đăng nhập | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" |
| Tim bị bỏ làm tổng tụt dưới mốc đã cấp hộp | Hộp đã cấp giữ nguyên, không cấp thêm cho tới khi vượt mốc mới | "None — silent handling" |
| Tới mốc chốt giữa lúc đang mở màn mở hộp | Hộp đang có vẫn mở được | "None — silent handling" |
| Có ít hơn 5 Kudo Public lúc chốt Kudos Quốc Dân | Chốt bấy nhiêu Kudo có | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-001** → 4, 5, 9, 10, 12 điểm tim lần lượt cho 0, 1, 1, 2, 2 hộp; không thừa không thiếu.
- **FR-002** → Hộp đã mở không mở lại được; xem lại thấy đúng kết quả cũ.
- **FR-402** → Hai tab, hoặc bấm đúp, không mở nhiều hơn số hộp đang có.
- **FR-403** → Khi chỉ còn một món quà hữu hạn, nhiều người mở cùng lúc thì chỉ một người nhận.
- **FR-404** → Đủ 6 icon khác nhau tạo đúng một quà bí ẩn, mở thêm hộp sau đó không tạo thêm.
- **FR-405** → Sau mốc khoá không có hộp mới, hộp cũ vẫn mở được.
- **FR-406** → Chạy việc chốt hai lần cho đúng một bộ 5 Kudo; hoà thì Kudo gửi sớm hơn đứng trước.
- **FR-601** → Người chưa đăng nhập không xem thống kê, không mở được hộp; không mở được hộp của người khác.
- **FR-602** → Sửa yêu cầu từ trình duyệt không đổi được kết quả bốc.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Thả tim, bỏ, thả lại trong chiến dịch x2 có thể thổi phồng tiến độ hộp (rủi ro cùng gốc với F005) | Người gửi nhận nhiều hộp hơn dự kiến, quà hiện vật cạn sớm | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Quà hiện vật hữu hạn có thể hết sớm khi nhiều người mở hộp ngay đầu chiến dịch | Người đến sau chỉ nhận icon | [EXPECTED] |
| RISK-03 | risk | Tỉ lệ ra quà và số lượng quà chưa có số liệu thật từ BTC | Không chạy thật được khi chưa nhập số | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-04 | risk | Hộp cấp theo tim nhưng không thu hồi: tim có thể bị bỏ sau khi đã cấp | Số hộp cấp có thể cao hơn số tim còn lại | [EXPECTED] |
| RISK-05 | risk | Mốc khoá 26/12/2025 do suy luận từ brief, chưa rõ giờ chốt | Lệch giờ khiến vài hộp cấp thừa hoặc thiếu | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Biết Sunner nào đang thao tác, lấy tên và avatar cho danh sách nhận quà | FR-601, FR-204 |
| F003_KudosAuthoring | feature | Cung cấp Kudo, người gửi, người nhận, trạng thái cho thống kê và Kudos Quốc Dân | FR-201, FR-406 |
| F004_KudosFeed | feature | Sở hữu trang Live board chứa cột phải nơi hai vùng của feature này được nhúng | FR-101 |
| F005_KudosHearts | feature | Cung cấp tổng tim thô và đã nhân hệ số của người gửi, nhãn x2 | FR-001, FR-202, BR-001 |
| F007_AdminModeration | feature | Trạng thái Spam quyết định Kudo còn được tính tim và Kudos Quốc Dân hay không | BR-002, BR-008 |
| F011_AdminCampaigns | feature | Chiến dịch x2 ảnh hưởng gián tiếp qua hệ số tim (không bắt buộc) | D001 |
| F012_Profile | feature | Nhúng bảng thống kê và bộ sưu tập icon vào profile | FR-101, FR-207 |
| F013_Notifications | feature | Nhận tín hiệu có hộp mới, đủ 6 icon, Kudos Quốc Dân để gửi thông báo | FR-407, FR-408 |
| Kho phần thưởng do BTC cung cấp | data | Danh sách quà, số lượng, trọng số, quà bí ẩn | FR-003, D003, D007 |

## 13. Configuration

```text
HEARTS_PER_BOX = 5                         # số điểm tim nhận được đổi một Secret Box
ICON_SET_SIZE = 6                          # số icon khác nhau cần gom để nhận quà bí ẩn
LATEST_WINNERS_LIMIT = 10                  # số dòng của danh sách nhận quà mới nhất
SECRET_BOX_LOCK_AT = 2025-12-26 23:59:59   # sau mốc này không cấp hộp mới (giờ Việt Nam) [INFERRED]
NATIONAL_KUDOS_COUNT = 5                   # số Kudo thành Kudos Quốc Dân
NATIONAL_KUDOS_FINALIZE_AT = 2025-12-26 23:59:59  # mốc chốt Kudos Quốc Dân (giờ Việt Nam) [INFERRED]
NATIONAL_KUDOS_GIFT = Root Further         # quà đặc biệt cho người gửi Kudos Quốc Dân
MYSTERY_GIFT_NAME = TBD (draft)            # quà bí ẩn khi đủ 6 icon (D007)
```
