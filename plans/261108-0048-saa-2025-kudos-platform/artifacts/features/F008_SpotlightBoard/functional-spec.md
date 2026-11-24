---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc riêng file này là đủ hiểu tính năng làm gì, cư xử ra sao, màn hình hiện gì. Chi tiết kỹ thuật (endpoint, Source, pseudocode, ghi DB) nằm ở technical-spec.md. -->

# Functional Spec — F008_SpotlightBoard

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F008_SpotlightBoard → SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard → US042_SearchSpotlightNames, US043_ToggleSpotlightFullscreen → BL003_SpotlightChannelListener, BL023_SpotlightPublishKudoEvent → ROUTE017

## 1. Overview

**Problem:** Lời cảm ơn được gửi đi nhưng không có chỗ nào để cả công ty thấy "ai đang được ghi nhận" ngay lúc này; không khí lễ trao giải thiếu một điểm nhấn sống động, cập nhật từng giây.
**Solution:** Một vùng "SPOTLIGHT BOARD" trên Live board: đám mây tên người nhận Kudos, tổng số Kudos, dòng "X đã nhận được một Kudos mới" chạy theo thời gian thực, ô tìm tên và nút phóng to toàn màn hình.
**Scope:** Chỉ riêng vùng Spotlight Board nhúng trong Live board: đám mây tên, bộ đếm tổng, dòng sự kiện, cập nhật thời gian thực, ô tìm tên, phóng to.
**Non-Scope:** Trang Live board và các vùng Highlight Kudos, All Kudos, ô tìm profile (F004_KudosFeed); viết và sửa Kudo (F003_KudosAuthoring); thả tim (F005_KudosHearts); duyệt và đánh dấu spam (F007_AdminModeration); trang profile (F012_Profile); thông báo cá nhân qua chuông (F013_Notifications). Feature này không tạo, sửa hay xoá Kudo.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty (kể cả quản trị viên khi mở Live board, họ thấy đúng như Sunner) | Xem ai đang được ghi nhận, thấy Kudos mới ngay khi có, tìm một đồng nghiệp trên bảng, phóng to bảng để chiếu |

Tính năng này chưa tham gia process-flow nào (chưa có flow nào trong `docs/flows/`).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem, theo dõi trực tiếp và tìm tên trên Spotlight Board | Thấy đám mây tên người nhận, tổng số Kudos và các dòng Kudos mới tự cập nhật; gõ để làm nổi tên cần tìm; bấm tên để mở profile; thử lại khi tải hoặc kết nối lỗi | US042_SearchSpotlightNames | FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-401, FR-402, FR-403, FR-404, FR-406, FR-407, FR-408, FR-601, FR-602 | BR-001, BR-002, BR-003, BR-004, BR-005, BR-007, DEC-001, DEC-002, SM-001 | SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard |
| CAP-02 | Phóng to bảng để trình chiếu | Đưa riêng khung bảng ra toàn màn hình và thu nhỏ lại, bảng vẫn chạy trực tiếp | US043_ToggleSpotlightFullscreen | FR-405 | BR-006, DEC-003 | N/A — dùng chung vùng của CAP-01 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cỡ tên tính theo gì, tên nào được tô màu nổi, hiện tối đa bao nhiêu tên? | Cỡ theo hạng số Kudos public của người nhận (4 bậc, bằng nhau cùng bậc); tối đa 60 tên (24 trên màn hẹp); tên người vừa nhận Kudos mới được tô màu nhấn 4 giây | Cấu hình ghi đây là mặc định chờ BTC xác nhận; ảnh thiết kế không nêu quy tắc | no |
| D006 | Dòng sự kiện hiện bao nhiêu dòng, xếp theo thứ tự nào, có nạp lịch sử khi mở trang không? | 5 dòng, mới nhất ở dưới cùng, dòng cũ mờ dần; lúc mở trang nạp sẵn 5 Kudos public gần nhất | Cấu hình ghi đây là mặc định chờ BTC xác nhận; ảnh thiết kế chỉ cho thấy dòng xếp chồng và mờ dần | no |

Các quyết định D002 đến D005 và D007 của bản nháp trước đã được hiện thực đúng theo mặc định (đếm toàn bộ Kudos public, tìm ngay trên các tên đang hiện, bấm tên mở profile, phóng to bằng toàn màn hình của trình duyệt, kênh phát tin riêng tư) nên không còn mở.

## 4. Requirements

### Foundation (0xx)

- **FR-001** Bộ đếm, đám mây tên và dòng sự kiện chỉ tính Kudo ở trạng thái public.
- **FR-002** Tính năng này chỉ đọc và hiển thị: không tạo, sửa hay xoá Kudo (việc đó thuộc F003_KudosAuthoring).

### Navigation (1xx)

- **FR-101** Vùng nằm trên Live board, giữa Highlight Kudos và All Kudos, không có trang riêng; vùng tải độc lập nên Live board không phải chờ nó.

### Spotlight Board (2xx)

- **FR-201** Vùng hiện nhãn "Sun* Annual Awards 2025" và tiêu đề "SPOTLIGHT BOARD".
- **FR-202** Đám mây hiện mỗi người nhận một lần, cỡ chữ theo số Kudos của họ (4 bậc), tối đa 60 tên (24 tên trên màn hẹp); tên không còn chỗ trống thì không hiện.
- **FR-203** Bộ đếm hiện tổng số dạng "{số} KUDOS" ở giữa phía trên khung (hàng trên cùng trên màn hẹp).
- **FR-204** Dòng sự kiện hiện "{giờ} {tên người nhận} đã nhận được một Kudos mới", tối đa 5 dòng, mới nhất ở dưới, dòng cũ mờ dần; lúc mở trang nạp sẵn 5 Kudos public gần nhất.
- **FR-205** Khi đang tải, vùng hiện khung chờ; nếu lần tải đầu lỗi, vùng hiện thông báo lỗi riêng kèm nút "Thử lại" và phần còn lại của Live board vẫn dùng được.
- **FR-206** Chưa có Kudo public nào thì bộ đếm hiện "0 KUDOS" cùng thông báo trống thay vì khung trắng.

### Interaction (4xx)

- **FR-401** Khi có Kudo public mới, bộ đếm tăng 1, tên người nhận hiện hoặc to lên và một dòng mới vào dòng sự kiện, không cần tải lại trang.
- **FR-402** Khi một Kudo bị đánh dấu spam, bộ đếm và số Kudos của người nhận giảm 1 và dòng của nó rời luồng; khi bỏ đánh dấu spam, số tăng lại nhưng không thêm dòng mới.
- **FR-403** Khi mất kết nối thời gian thực, bảng báo "Đang kết nối lại…" và giữ số đang hiện; sau 5 lần nối thất bại liên tiếp bảng báo "Không cập nhật được trực tiếp." kèm nút "Thử lại".
- **FR-404** Gõ vào ô "Tìm kiếm" (tối đa 50 ký tự) thì tên khớp được làm nổi, tên khác mờ đi; không tên nào khớp thì hiện "Không tìm thấy tên nào".
- **FR-405** Nút phóng to đưa khung bảng ra toàn màn hình; nút thu nhỏ hoặc phím Esc đưa về như cũ; không làm được thì báo ngắn và bảng giữ nguyên.
- **FR-406** Bấm một tên trong đám mây mở profile của người đó.
- **FR-407** Số liệu tự được đối chiếu lại với dữ liệu thật sau mỗi lần nối kênh, vài giây sau mỗi lần có Kudo bị gỡ hoặc khôi phục, và khi người dùng quay lại tab; lần đối chiếu lỗi thì giữ số đang hiện.
- **FR-408** Tên người vừa nhận Kudos mới được tô màu nhấn trong vài giây rồi trở về như các tên khác.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem được bảng và nhận được cập nhật thời gian thực.
- **FR-602** Không dữ liệu nào đến trình duyệt người xem nêu người gửi Kudo; bảng chỉ nêu người nhận, kể cả với Kudo gửi ẩn danh.

## 5. Business Rules

- Chỉ Kudo public được đếm, hiện tên và sinh dòng sự kiện; Kudo spam không bao giờ vào bảng (BR-001)
- Cỡ tên theo hạng số Kudos public của người đó, bằng nhau cùng bậc, nhiều nhất thì to nhất; tiêu chí này chờ xác nhận ở D001 (BR-002)
- Dữ liệu của bảng chỉ nêu người nhận, không bao giờ nêu người gửi, kể cả khi gửi ẩn danh (BR-003)
- Mỗi Kudo public mới tạo đúng một dòng sự kiện; đánh dấu spam và bỏ đánh dấu chỉ chỉnh số, không thêm dòng mới; mọi thay đổi khác không phát gì (BR-004)
- Tìm tên không phân biệt hoa thường và dấu tiếng Việt, khớp ở bất kỳ phần nào của tên (BR-005)
- Phần được phóng to là khung bảng chứ không phải cả trang; ô tìm, bộ đếm, dòng sự kiện và nhãn kết nối đều nằm trong khung nên vẫn dùng được (BR-006)
- Bản dữ liệu tải lại là nguồn đúng cuối cùng cho số đếm; tải lại lỗi thì giữ số đang hiện (BR-007)
- Áp một cập nhật theo ba nhánh: Kudo mới thì tăng số và thêm dòng; bị spam thì giảm số và bỏ dòng; bỏ spam thì tăng số, không thêm dòng; cùng một Kudo không bao giờ được đếm hai lần (DEC-001)
- Hiển thị khi tìm: ô trống thì hiện hết; có khớp thì làm nổi tên khớp và mờ tên khác; không khớp thì báo không tìm thấy (DEC-002)
- Nút phóng to: đang phóng to thì thoát; chưa phóng to mà trình duyệt không hỗ trợ hoặc từ chối thì báo "Không thể phóng to bảng."; còn lại thì vào toàn màn hình (DEC-003)
- Kết nối thời gian thực đi qua các trạng thái: đang kết nối, đang chạy, đang kết nối lại, lỗi sau 5 lần thất bại liên tiếp (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Spotlight Board (vùng nhúng trong Live board của F004) | SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard | Khung tối bo góc có header "Sun* Annual Awards 2025 / SPOTLIGHT BOARD" phía trên; trong khung: ô tìm ở góc trái trên, bộ đếm "{số} KUDOS" ở giữa trên, đám mây tên, dòng sự kiện ở góc trái dưới, nút phóng to ở góc phải dưới, nhãn trạng thái kết nối ở góc phải trên | Tìm tên, bấm tên để mở profile, phóng to và thu nhỏ, bấm "Thử lại" khi tải hoặc kết nối lỗi, xem số liệu tự cập nhật |

### User Journey

1. Sunner vào Live board từ mục "Sun* Kudos" và cuộn tới vùng SPOTLIGHT BOARD; trong lúc đó vùng hiện khung chờ, rồi đám mây tên, "388 KUDOS" và vài dòng sự kiện gần nhất.
2. Trong lúc Sunner đang xem, một đồng nghiệp gửi Kudos — bộ đếm nhảy lên, tên người nhận to lên và đổi màu nhấn vài giây, một dòng mới hiện ở dòng sự kiện.
3. Sunner gõ một tên vào ô "Tìm kiếm" — tên khớp giữ nguyên, tên khác mờ đi.
4. Sunner bấm tên đó — mở profile của người đó.
5. Tại sự kiện, Sunner bấm nút phóng to để chiếu bảng lên màn hình lớn, rồi bấm Esc để thoát.

## 7. User Stories

### US042_SearchSpotlightNames — Tìm tên và dùng bảng trực tiếp trên Spotlight Board

**Actor:** Sunner
**Goal:** Thấy ngay những ai đang được ghi nhận lúc này, tìm nhanh một đồng nghiệp trong đám mây tên và vẫn dùng được bảng khi tải hay kết nối gặp lỗi.
**Business value:** Tạo không khí ghi nhận chung và giúp Sunner kiểm tra nhanh tên mình hay tên đồng nghiệp đã lên bảng chưa.

Câu chuyện này gộp luôn hai nút "Thử lại" (khi lần tải đầu lỗi và khi kết nối trực tiếp thất bại), vì cùng một vùng và cùng nguồn dữ liệu với ô tìm.

**Acceptance Criteria:**
- [ ] Gõ vào ô "Tìm kiếm" (tối đa 50 ký tự); sau khi ngừng gõ khoảng 0,2 giây, tên khớp giữ nguyên còn tên không khớp mờ còn 25%; xoá hết chữ thì bỏ lọc.
- [ ] Khớp theo chuỗi con của tên, không phân biệt hoa thường, bỏ dấu tiếng Việt và coi "đ" như "d" ("chuc" khớp "Nguyễn Bá Chức").
- [ ] Không tên nào khớp thì hiện "Không tìm thấy tên nào"; bảng chưa có Kudos nào thì hiện "Chưa có Kudos nào để vinh danh."
- [ ] Lọc chạy ngay trên các tên đang hiện (tối đa 60 tên, 24 tên khi bảng hẹp), không tải lại dữ liệu.
- [ ] Khi lần tải đầu lỗi, vùng hiện "Không tải được Spotlight Board. Vui lòng thử lại." kèm "Thử lại"; phần còn lại của Live board không bị ảnh hưởng.
- [ ] Sau 5 lần nối thất bại liên tiếp hiện "Không cập nhật được trực tiếp." kèm "Thử lại"; bấm thì mở kết nối mới và số liệu đang có được giữ nguyên.
- [ ] Bấm một tên trong đám mây mở profile của người đó.

### US043_ToggleSpotlightFullscreen — Phóng to và thu nhỏ Spotlight Board

**Actor:** Sunner
**Goal:** Xem bảng ở toàn màn hình, ví dụ để chiếu tại sự kiện, rồi thu nhỏ lại.
**Business value:** Bảng đạt hiệu quả trình diễn khi cả phòng cùng xem trên màn hình lớn.

**Acceptance Criteria:**
- [ ] Bấm nút phóng to đưa riêng khung bảng ra toàn màn hình; nhãn nút đổi giữa "Phóng to bảng" và "Thu nhỏ bảng".
- [ ] Bấm lại hoặc Esc thì thoát; nhãn nút luôn khớp trạng thái dù thoát bằng cách nào.
- [ ] Ô tìm, bộ đếm, dòng sự kiện và nhãn kết nối vẫn dùng được khi toàn màn hình, số liệu vẫn cập nhật.
- [ ] Trình duyệt không hỗ trợ hoặc từ chối thì hiện "Không thể phóng to bảng." và bảng giữ nguyên.

## 8. Scenarios

### US042_SearchSpotlightNames — Happy Path

**Given** bảng có "Nguyễn Bá Chức" và "Lê An", **When** Sunner gõ "chuc" rồi ngừng gõ một chút, **Then** "Nguyễn Bá Chức" giữ nguyên, "Lê An" mờ còn 25%.

### US042_SearchSpotlightNames — Error: Không tên nào khớp

**Given** bảng có vài tên, **When** Sunner gõ "zzz", **Then** mọi tên mờ đi và hiện "Không tìm thấy tên nào"; xoá hết chữ thì các tên rõ trở lại.

### US042_SearchSpotlightNames — Happy Path: Kudos mới đến khi đang xem

**Given** Sunner đang mở bảng, **When** một đồng nghiệp gửi Kudos công khai hoặc ẩn danh cho Nguyễn Bá Chức, **Then** bộ đếm tăng 1, tên Nguyễn Bá Chức to lên và có dòng "20:30 Nguyễn Bá Chức đã nhận được một Kudos mới" mà không có tên người gửi.

### US042_SearchSpotlightNames — Error: Mất kết nối

**Given** Sunner đang mở bảng, **When** mạng đứt, **Then** bảng hiện "Đang kết nối lại…" và giữ số đang có; khi mạng về, số liệu được đối chiếu lại với dữ liệu thật và không bị đếm trùng.

### US042_SearchSpotlightNames — Error: Tải lần đầu thất bại

**Given** dịch vụ dữ liệu đang lỗi, **When** Sunner mở Live board, **Then** vùng Spotlight hiện "Không tải được Spotlight Board. Vui lòng thử lại." kèm "Thử lại"; bấm "Thử lại" mà thành công thì hiện bảng đầy đủ, thất bại tiếp thì giữ thông báo lỗi.

### US043_ToggleSpotlightFullscreen — Happy Path

**Given** bảng ở khung thường, **When** Sunner bấm nút phóng to, **Then** khung bảng chiếm toàn màn hình và nhãn nút thành "Thu nhỏ bảng"; bấm Esc thì về như cũ.

### US043_ToggleSpotlightFullscreen — Error: Trình duyệt từ chối toàn màn hình

**Given** trình duyệt không cho vào toàn màn hình, **When** Sunner bấm nút phóng to, **Then** hiện thông báo ngắn "Không thể phóng to bảng." và bảng giữ nguyên.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Chưa có Kudo public nào | Bộ đếm "0 KUDOS", đám mây trống | "Chưa có Kudos nào để vinh danh." |
| Số người nhận vượt giới hạn hiển thị (60, hoặc 24 trên màn hẹp) | Chỉ hiện những tên nhiều Kudos nhất; bộ đếm vẫn là tổng thật | "None — silent handling" |
| Màn hẹp hoặc đám mây dày, một tên không còn chỗ | Tên đó bị bỏ khỏi bảng thay vì chồng lên tên khác | "None — silent handling" |
| Kudo ẩn danh được gửi | Dòng sự kiện chỉ nêu người nhận | "None — silent handling" |
| Kudo đang hiện bị đánh dấu spam | Bộ đếm và số của người nhận giảm 1, dòng của nó biến mất; tên biến mất nếu hết Kudo | "None — silent handling" |
| Kudo spam được bỏ đánh dấu | Số tăng lại, tên hiện lại, không thêm dòng sự kiện | "None — silent handling" |
| Cùng một sự kiện đến hai lần | Lần sau bị bỏ, bộ đếm không tăng đôi | "None — silent handling" |
| Sự kiện gỡ hoặc khôi phục đến muộn | Số có thể lệch vài giây rồi tự khớp sau lần đối chiếu | "None — silent handling" |
| Mất kết nối thời gian thực | Giữ số đang hiện, báo đang kết nối lại; nối lại thì đối chiếu với dữ liệu thật | "Đang kết nối lại…" |
| Nối lại thất bại 5 lần liên tiếp | Dừng thử, hiện nút thử lại; số liệu cuối cùng vẫn hiển thị | "Không cập nhật được trực tiếp." |
| Lần tải đầu lỗi | Chỉ vùng này hiện lỗi kèm nút thử lại, nút hiện "Đang tải…" khi đang thử; thử lại lỗi tiếp thì giữ thông báo | "Không tải được Spotlight Board. Vui lòng thử lại." |
| Lần đối chiếu ngầm lỗi | Giữ nguyên số đang hiện, lần đối chiếu sau sẽ sửa | "None — silent handling" |
| Quay lại tab sau khi ẩn | Đối chiếu lại số liệu ngay | "None — silent handling" |
| Gõ vào ô tìm không khớp tên nào | Mọi tên mờ đi | "Không tìm thấy tên nào" |
| Gõ quá 50 ký tự hoặc ký tự đặc biệt | Giữ 50 ký tự đầu; ký tự đặc biệt được so như chữ thường | "None — silent handling" |
| Trình duyệt không cho phóng to | Bảng giữ nguyên | "Không thể phóng to bảng." |
| Thoát toàn màn hình bằng Esc | Nhãn nút trở lại "Phóng to bảng" | "None — silent handling" |
| Sunner chưa đăng nhập mở Live board | Chuyển về màn đăng nhập, bảng không hiện | "None — silent handling" |
| Quản trị viên mở Live board | Thấy đúng bảng như Sunner | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-001** → Đánh dấu một Kudo thành spam rồi tải lại: bộ đếm giảm, tên người nhận giảm số hoặc biến mất.
- **FR-202** → Mỗi người nhận chỉ xuất hiện một lần dù nhận nhiều Kudos; người nhận nhiều nhất có cỡ lớn nhất; trên màn hẹp chỉ hiện tối đa 24 tên.
- **FR-204** → Dòng sự kiện chỉ nêu người nhận; không dòng nào nêu người gửi; tối đa 5 dòng, mới nhất ở dưới.
- **FR-205** → Làm dịch vụ dữ liệu lỗi rồi mở Live board: chỉ vùng này báo lỗi, các vùng khác vẫn dùng được; bấm "Thử lại" khi dịch vụ phục hồi thì hiện bảng.
- **FR-206** → Khi chưa có Kudo public nào: hiện "0 KUDOS" và thông báo trống.
- **FR-401** → Mở bảng ở hai trình duyệt, gửi một Kudo: cả hai cập nhật trong vài giây, không tải lại.
- **FR-402** → Đánh dấu spam rồi bỏ đánh dấu: bộ đếm về đúng số cũ và không có thêm dòng mới.
- **FR-403** → Tắt mạng rồi bật lại: có nhãn "Đang kết nối lại…", sau đó số liệu khớp dữ liệu thật, không bị cộng đôi; làm kết nối lỗi 5 lần liên tiếp thì hiện "Thử lại".
- **FR-404** → Gõ "chuc" làm nổi "Chức"; gõ chữ không khớp hiện thông báo.
- **FR-405** → Phóng to rồi Esc: vùng về đúng trạng thái trước đó và số liệu vẫn chạy.
- **FR-406** → Bấm một tên trong đám mây: mở đúng profile người đó.
- **FR-407** → Ẩn tab rồi hiện lại: số liệu được làm mới; sau một lần bỏ đánh dấu spam, vài giây sau số khớp dữ liệu thật.
- **FR-408** → Khi có Kudo mới, tên người nhận đổi màu nhấn vài giây rồi trở lại bình thường.
- **FR-601** → Chưa đăng nhập thì không mở được bảng và không nhận được cập nhật.
- **FR-602** → Dữ liệu trả về trình duyệt của Kudo ẩn danh không có định danh người gửi, kể cả trong các cập nhật trực tiếp.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Việc giấu người gửi dựa vào danh sách cột được chọn ở truy vấn và ở bước phát sự kiện, không dựa vào quyền truy cập của cơ sở dữ liệu; thêm một cột vào hai chỗ đó sẽ đưa dữ liệu đó xuống trình duyệt | Lộ người gửi ẩn danh, phá cam kết ẩn danh | [INFERRED] |
| RISK-02 | risk | Lỗi khi phát sự kiện bị nuốt và chỉ ghi log để không làm hỏng việc gửi Kudo; không có đối chiếu định kỳ nên sự kiện thêm Kudo bị lỡ chỉ được sửa ở lần nối kênh, quay lại tab hoặc sự kiện kiểm duyệt kế tiếp | Bộ đếm và dòng sự kiện sai tạm thời | confirmed |
| RISK-03 | risk | Sự kiện gỡ hoặc khôi phục đến muộn sau một bản dữ liệu đã phản ánh nó có thể làm số lệch 1 trong vài giây; bản tải lại sau 2 đến 3 giây sửa lại | Bộ đếm sai trong vài giây | confirmed |
| RISK-04 | known-issue | Người nhận ngoài 60 tên nhiều Kudos nhất (24 trên màn hẹp) hoặc không còn chỗ trống trên khung thì không hiện trên bảng và cũng không tìm được bằng ô tìm vì ô tìm chỉ lọc các tên đang hiện | Người ít Kudos có thể không thấy tên mình trên bảng | confirmed |
| RISK-05 | risk | Nếu hồ sơ của một người nhận có tên rỗng thì bản dữ liệu của bảng không qua được bước kiểm dạng và cả vùng báo lỗi tải | Cả Spotlight Board không hiện dù chỉ một hồ sơ lỗi | [INFERRED] |
| RISK-06 | risk | Cài đặt "cho phép truy cập công khai" của dịch vụ thời gian thực phải được tắt thủ công trên từng dự án; không kiểm chứng được từ mã | Kênh có thể bị mở rộng hơn dự định nếu quên bước triển khai này | [UNVERIFIED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập và tên hiển thị của người nhận trên hồ sơ Sunner | FR-601, FR-202 |
| F002_AppShell | feature | Ngôn ngữ vi/en cho nhãn và định dạng giờ, kiểu dáng dùng chung | FR-204, FR-201 |
| F003_KudosAuthoring | feature | Tạo bản ghi Kudo, là nguồn của mọi sự kiện "Kudos mới" | FR-401 |
| F004_KudosFeed | feature | Trang Live board chứa vùng này và header dùng chung | FR-101, FR-201 |
| F007_AdminModeration | feature | Trạng thái public hay spam quyết định Kudo có được tính hay không và sinh sự kiện gỡ hoặc khôi phục | FR-001, FR-402 |
| F012_Profile | feature | Đích khi bấm một tên trong đám mây | FR-406 |
| F013_Notifications | feature | Kết nối trình duyệt tới dịch vụ thời gian thực (BL010) dùng chung một ổ cắm cho mỗi tab; vùng này chỉ dùng chứ không sở hữu | FR-403 |
| Dịch vụ thời gian thực của Supabase | external-service | Kênh phát tin riêng tư để cập nhật trực tiếp | FR-401, FR-403 |
| Dữ liệu Kudo và hồ sơ Sunner | data | Số đếm, người nhận và trạng thái public hay spam của từng Kudo | FR-001, BR-001 |
| Cài đặt kênh riêng tư của dịch vụ thời gian thực | config | Phải tắt truy cập công khai để chỉ Sunner đã xác thực nhận được cập nhật | FR-601 |

## 13. Configuration

```text
NAME_CLOUD_MAX = 60             # số tên tối đa trong đám mây (mặc định chờ xác nhận, D001)
NAME_CLOUD_MAX_NARROW = 24      # số tên tối đa trên màn hẹp dưới 640 px
SIZE_TIERS = 4                  # số bậc cỡ chữ của tên (mặc định chờ xác nhận, D001)
TICKER_VISIBLE_LINES = 5        # số dòng sự kiện hiện cùng lúc (mặc định chờ xác nhận, D006)
TICKER_HISTORY_ON_LOAD = 5      # số Kudos gần nhất nạp sẵn khi mở trang (mặc định chờ xác nhận, D006)
SEARCH_MAX_LENGTH = 50          # độ dài tối đa của ô tìm
SEARCH_DEBOUNCE_MS = 200        # chờ sau lần gõ cuối rồi mới lọc
SPOTLIGHT_HIGHLIGHT_MS = 4000   # thời gian tên người vừa nhận Kudos được tô màu nhấn
RECONNECT_MAX_ATTEMPTS = 5      # số lần nối thất bại liên tiếp trước khi báo lỗi và dừng thử
```
