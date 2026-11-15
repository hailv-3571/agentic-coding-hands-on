<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F008_SpotlightBoard

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F008_SpotlightBoard → SCR (TBD (draft)) → US001_ViewSpotlightBoard, US002_FollowLiveKudosTicker, US003_SearchSpotlightNames, US004_ExpandSpotlightBoard

## 1. Overview

**Problem:** Lời cảm ơn gửi đi nhưng không có chỗ nào cho cả công ty thấy "ai đang được ghi nhận" ngay lúc này; không khí lễ trao giải thiếu một điểm nhấn sống động, cập nhật từng giây.
**Solution:** Một vùng "SPOTLIGHT BOARD" trên Live board: đám mây tên người nhận Kudos, tổng số Kudos, luồng dòng sự kiện "X đã nhận được một Kudos mới" chạy theo thời gian thực, ô tìm tên và nút phóng to toàn màn hình.
**Scope:** Chỉ riêng vùng Spotlight Board nhúng trong trang Live board: đám mây tên, bộ đếm tổng, luồng sự kiện, cập nhật thời gian thực, ô tìm tên, phóng to.
**Non-Scope:** Trang Live board và các vùng Highlight Kudos, All Kudos, ô tìm profile (F004_KudosFeed); viết/sửa Kudo (F003_KudosAuthoring); thả tim (F005_KudosHearts); duyệt/đánh dấu spam (F007_AdminModeration); trang profile (F012_Profile); thông báo cá nhân qua chuông (F013_Notifications). Feed All Kudos không tự cập nhật (F004 D005); chỉ vùng này chạy thời gian thực.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty | Xem ai đang được ghi nhận, thấy Kudos mới ngay khi có, tìm một đồng nghiệp trên bảng, phóng to bảng để chiếu |

Vùng này là một phần của trang Live board do F004_KudosFeed sở hữu (vùng R4 trong màn hình đó).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem đám mây tên và tổng số Kudos | Thấy tên những người nhận Kudos (cỡ chữ theo số Kudos), tổng số Kudos, bấm tên để mở profile | US001_ViewSpotlightBoard | FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-206, FR-406, FR-601 | BR-001, BR-002 | TBD (draft) |
| CAP-02 | Theo dõi Kudos mới theo thời gian thực | Thấy bộ đếm, đám mây và luồng sự kiện tự cập nhật khi có Kudos mới, bị gỡ hoặc được khôi phục | US002_FollowLiveKudosTicker | FR-204, FR-401, FR-402, FR-403, FR-602 | BR-003, BR-004, DEC-001, SM-001 | TBD (draft) |
| CAP-03 | Tìm tên trên bảng | Gõ để làm nổi tên khớp trong đám mây | US003_SearchSpotlightNames | FR-404 | BR-005, DEC-002 | TBD (draft) |
| CAP-04 | Phóng to bảng | Mở bảng ra toàn màn hình và thu lại | US004_ExpandSpotlightBoard | FR-405 | — | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cỡ tên tính theo gì, tên nào được tô màu nổi, hiện tối đa bao nhiêu tên? | Cỡ theo số Kudos Public người đó nhận, chia 4 bậc; bậc lớn nhất dùng màu nhấn; tối đa 60 tên nhiều Kudos nhất | Ảnh Figma chỉ cho thấy tên to nhỏ và một số tên khác màu, không nêu quy tắc | no |
| D002 | Bộ đếm "388 KUDOS" đếm phạm vi nào? | Mọi Kudo Public từ trước tới nay, toàn công ty | Đơn giản, khớp tổng số ở ảnh Figma; chưa có chiến dịch/thời hạn nào giới hạn | no |
| D003 | Ô "Tìm kiếm" của bảng tìm gì? | Lọc ngay trên các tên đang hiện: tên khớp nổi lên, tên khác mờ đi; không tìm toàn bộ Sunner (đó là ô tìm profile của F004) | Ô nằm trong khung bảng, tự nhiên hiểu là tìm trên bảng | no |
| D004 | Bấm vào một tên thì làm gì? | Mở profile của người đó (F012) | Cùng hành vi bấm tên trên thẻ Kudo | no |
| D005 | "Phóng to" nghĩa là gì? | Vùng bảng chiếm toàn màn hình (chế độ toàn màn hình của trình duyệt), vẫn cập nhật thời gian thực; thoát bằng nút thu nhỏ hoặc phím Esc | Phục vụ chiếu lên màn hình lớn tại sự kiện; không làm chế độ trình chiếu riêng | no |
| D006 | Luồng sự kiện hiện bao nhiêu dòng, thứ tự, có nạp lịch sử khi mở trang không? | 5 dòng; dòng mới nhất ở dưới cùng, dòng cũ phía trên mờ dần; lúc mở trang nạp sẵn 5 Kudo Public gần nhất | Ảnh Figma cho thấy dòng xếp chồng và mờ dần, không rõ chiều | no |
| D007 | Dùng cơ chế thời gian thực nào? (ĐÃ CHỐT mặc định) | Kênh phát tin riêng tư do hệ thống phát sau mỗi thay đổi Kudo, chỉ chứa dữ liệu đã lọc (tên người nhận, không có người gửi); không cho trình duyệt nghe thẳng bảng Kudo | Nghe thẳng bảng sẽ đưa cả dòng Kudo (có người gửi) xuống trình duyệt người xem, phá cam kết ẩn danh; kênh phát tin cũng nhẹ hơn khi nhiều người cùng mở | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Bộ đếm, đám mây tên và luồng sự kiện chỉ tính Kudo ở trạng thái Public.
- **FR-002** Tính năng này chỉ đọc và hiển thị: không tạo, sửa hay xoá Kudo (việc đó thuộc F003_KudosAuthoring).

### Navigation (1xx)

- **FR-101** Vùng Spotlight Board nằm trên trang Live board, giữa Highlight Kudos và All Kudos; không có trang riêng.

### Spotlight Board (2xx)

- **FR-201** Vùng hiện nhãn "Sun* Annual Awards 2025" và tiêu đề "SPOTLIGHT BOARD".
- **FR-202** Đám mây tên hiện mỗi người nhận Kudos đúng một lần, cỡ chữ theo số Kudos họ nhận.
- **FR-203** Bộ đếm ở giữa khung hiện tổng số dạng "{số} KUDOS".
- **FR-204** Luồng sự kiện hiện các dòng "{giờ} {tên người nhận} đã nhận được một Kudos mới"; dòng cũ mờ dần.
- **FR-206** Chưa có Kudo Public nào thì bộ đếm hiện "0 KUDOS" cùng thông báo trống thay vì khung trắng.

### Interaction (4xx)

- **FR-401** Khi có Kudo Public mới, bộ đếm tăng 1, tên người nhận hiện hoặc to lên và một dòng mới vào luồng sự kiện, không cần tải lại trang.
- **FR-402** Khi một Kudo bị đánh dấu spam, bộ đếm và số Kudos của người nhận giảm 1 và dòng của nó rời luồng; khi bỏ đánh dấu spam, bộ đếm và số Kudos tăng lại nhưng không thêm dòng mới.
- **FR-403** Khi mất kết nối thời gian thực, bảng báo "đang kết nối lại"; nối lại được thì số liệu tự khớp lại với dữ liệu thật.
- **FR-404** Gõ vào ô "Tìm kiếm" thì tên khớp được làm nổi, tên khác mờ đi; không tên nào khớp thì hiện thông báo.
- **FR-405** Nút phóng to đưa bảng ra toàn màn hình; nút thu nhỏ hoặc phím Esc đưa về như cũ.
- **FR-406** Bấm một tên trong đám mây mở profile của người đó (theo D004).

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem được bảng và nhận được cập nhật thời gian thực.
- **FR-602** Không dữ liệu nào đến trình duyệt người xem nêu người gửi Kudo; luồng sự kiện chỉ nêu người nhận, kể cả Kudo gửi ẩn danh.

## 5. Business Rules

- Chỉ Kudo Public được đếm, hiện tên và sinh dòng sự kiện; Kudo spam không bao giờ vào bảng (BR-001)
- Cỡ tên theo số Kudo Public người đó nhận, chia bậc; tên nhiều Kudo nhất to nhất (BR-002) [NEEDS_DOMAIN_CONFIRMATION] D001
- Dữ liệu của bảng chỉ nêu người nhận, không bao giờ nêu người gửi, kể cả khi gửi ẩn danh (BR-003)
- Mỗi Kudo Public mới tạo đúng một dòng sự kiện; spam và bỏ spam chỉ chỉnh số, không thêm dòng (BR-004)
- Tìm tên không phân biệt hoa thường và dấu tiếng Việt, khớp ở bất kỳ phần nào của tên (BR-005)
- Áp một cập nhật theo ba nhánh: Kudo mới thì tăng số và thêm dòng; bị spam thì giảm số và bỏ dòng; bỏ spam thì tăng số, không thêm dòng (DEC-001)
- Hiển thị khi tìm: ô trống thì hiện hết; có khớp thì làm nổi tên khớp và mờ tên khác; không khớp thì báo không tìm thấy (DEC-002)
- Kết nối thời gian thực đi qua các trạng thái: đang kết nối, đang chạy, đang kết nối lại, lỗi (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Spotlight Board (vùng nhúng trong Live board của F004) | TBD (draft) | Khung tối bo góc: ô tìm trái trên, bộ đếm giữa trên, đám mây tên, luồng sự kiện trái dưới, nút phóng to phải dưới | Tìm tên, bấm tên, phóng to/thu nhỏ, xem số liệu tự cập nhật |

### User Journey

1. Sunner vào Live board từ mục "Sun* Kudos" và cuộn tới vùng SPOTLIGHT BOARD, thấy đám mây tên, "388 KUDOS" và vài dòng sự kiện gần nhất.
2. Trong lúc Sunner đang xem, một đồng nghiệp gửi Kudos — bộ đếm nhảy lên, tên người nhận to lên và một dòng mới hiện ở luồng sự kiện.
3. Sunner gõ một tên vào ô "Tìm kiếm" — tên khớp nổi lên, tên khác mờ đi.
4. Sunner bấm tên đó — mở profile của người đó.
5. Tại sự kiện, Sunner bấm nút phóng to để chiếu bảng lên màn hình lớn, rồi bấm Esc để thoát.

## 7. User Stories

### US001_ViewSpotlightBoard — Xem đám mây tên và tổng số Kudos

**Actor:** Sunner
**Goal:** Thấy ngay những ai đang được ghi nhận và tổng số Kudos của cả công ty.
**Business value:** Tạo không khí ghi nhận chung, người nhận thấy tên mình được vinh danh.

**Acceptance Criteria:**
- [ ] Đám mây hiện mỗi người nhận đúng một lần, tên nhiều Kudos to hơn.
- [ ] Bộ đếm hiện tổng số Kudo Public dạng "{số} KUDOS".
- [ ] Kudo spam không được tính.
- [ ] Bấm một tên thì mở profile người đó.
- [ ] Chưa có Kudo nào thì hiện "0 KUDOS" và thông báo trống.

### US002_FollowLiveKudosTicker — Theo dõi Kudos mới theo thời gian thực

**Actor:** Sunner
**Goal:** Thấy Kudos mới xuất hiện ngay khi có mà không phải tải lại trang.
**Business value:** Bảng "sống", khuyến khích mọi người gửi thêm lời cảm ơn khi thấy người khác đang gửi.

**Acceptance Criteria:**
- [ ] Có Kudo Public mới thì bộ đếm +1, tên người nhận cập nhật và có một dòng mới ở luồng sự kiện.
- [ ] Dòng sự kiện chỉ nêu người nhận, không bao giờ nêu người gửi, kể cả Kudo ẩn danh.
- [ ] Kudo bị đánh dấu spam thì số giảm và dòng biến mất; bỏ đánh dấu thì số tăng lại, không thêm dòng.
- [ ] Mất kết nối thì thấy "đang kết nối lại", nối lại được thì số liệu đúng với dữ liệu thật.

### US003_SearchSpotlightNames — Tìm tên trên bảng

**Actor:** Sunner
**Goal:** Tìm một đồng nghiệp trong đám mây tên.
**Business value:** Sunner nhanh chóng kiểm tra tên mình hay tên đồng nghiệp đã lên bảng chưa.

**Acceptance Criteria:**
- [ ] Gõ chữ thì tên khớp nổi lên, tên khác mờ đi.
- [ ] Gõ không dấu vẫn khớp tên có dấu.
- [ ] Không tên nào khớp thì có thông báo; xoá chữ thì mọi tên về như cũ.

### US004_ExpandSpotlightBoard — Phóng to bảng

**Actor:** Sunner
**Goal:** Xem bảng ở toàn màn hình, ví dụ để chiếu tại sự kiện.
**Business value:** Bảng đạt hiệu quả trình diễn khi cả phòng cùng xem.

**Acceptance Criteria:**
- [ ] Bấm nút phóng to thì bảng chiếm toàn màn hình, số liệu vẫn cập nhật.
- [ ] Bấm nút thu nhỏ hoặc Esc thì về trạng thái cũ.

## 8. Scenarios

### US001_ViewSpotlightBoard — Happy Path

**Given** có 388 Kudo Public tới nhiều người, **When** Sunner mở Live board và cuộn tới Spotlight Board, **Then** thấy "388 KUDOS", đám mây tên với tên nhiều Kudos to nhất và các dòng sự kiện gần nhất.

### US001_ViewSpotlightBoard — Error: Tải bảng thất bại

**Given** dịch vụ dữ liệu đang lỗi, **When** Sunner mở Live board, **Then** vùng Spotlight hiện thông báo lỗi kèm nút thử lại, phần còn lại của trang vẫn dùng được.

### US002_FollowLiveKudosTicker — Happy Path

**Given** Sunner đang mở bảng, **When** một đồng nghiệp gửi Kudos cho Nguyễn Bá Chức (kể cả gửi ẩn danh), **Then** bộ đếm tăng 1 và có dòng "08:30PM Nguyễn Bá Chức đã nhận được một Kudos mới" mà không có tên người gửi.

### US002_FollowLiveKudosTicker — Error: Mất kết nối

**Given** Sunner đang mở bảng, **When** mạng đứt, **Then** bảng hiện "Đang kết nối lại…"; khi mạng về, số liệu được nạp lại đúng với dữ liệu thật và không đếm trùng.

### US003_SearchSpotlightNames — Happy Path

**Given** bảng có "Nguyễn Bá Chức", **When** Sunner gõ "chuc", **Then** "Nguyễn Bá Chức" nổi lên, các tên khác mờ đi.

### US003_SearchSpotlightNames — Error: Không có kết quả

**Given** không ai khớp, **When** Sunner gõ "zzzz", **Then** hiện "Không tìm thấy tên nào" và xoá chữ thì bảng về như cũ.

### US004_ExpandSpotlightBoard — Happy Path

**Given** bảng ở chế độ thường, **When** Sunner bấm nút phóng to, **Then** bảng chiếm toàn màn hình; bấm Esc thì về như cũ.

### US004_ExpandSpotlightBoard — Error: Trình duyệt từ chối toàn màn hình

**Given** trình duyệt không cho vào toàn màn hình, **When** Sunner bấm nút phóng to, **Then** hiện thông báo ngắn "Không thể phóng to bảng." và bảng giữ nguyên.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Chưa có Kudo Public nào | Bộ đếm "0 KUDOS", đám mây trống | "Chưa có Kudos nào để vinh danh." |
| Số người nhận vượt giới hạn hiển thị | Chỉ hiện những tên nhiều Kudos nhất; bộ đếm vẫn là tổng thật | "None — silent handling" |
| Kudo ẩn danh được gửi | Dòng sự kiện chỉ nêu người nhận | "None — silent handling" |
| Kudo bị Mark Spam khi Sunner đang xem | Bộ đếm và số của người nhận giảm 1, dòng của nó biến mất; tên biến mất nếu hết Kudo | "None — silent handling" |
| Mất kết nối thời gian thực | Hiện trạng thái đang kết nối lại; nối lại thì nạp lại số liệu | "Đang kết nối lại…" |
| Kết nối lại thất bại nhiều lần | Dừng thử, hiện lỗi và nút thử lại; số liệu cuối cùng vẫn hiển thị | "Không cập nhật được trực tiếp. Bấm để thử lại." |
| Sunner chưa đăng nhập mở Live board | Chuyển về màn đăng nhập | "Vui lòng đăng nhập để xem Kudos." |

## 10. Edge Behaviours to Verify

- **FR-001** → Mark một Kudo thành spam rồi tải lại: bộ đếm giảm, tên người nhận giảm số hoặc biến mất.
- **FR-202** → Mỗi người nhận chỉ xuất hiện một lần dù nhận nhiều Kudos; người nhận nhiều nhất có cỡ lớn nhất.
- **FR-204** → Dòng sự kiện chỉ nêu người nhận; không dòng nào nêu người gửi.
- **FR-401** → Mở bảng ở hai trình duyệt, gửi một Kudo: cả hai cập nhật trong vài giây, không tải lại.
- **FR-402** → Mark Spam rồi Un Spam: bộ đếm về đúng số cũ và không có thêm dòng mới.
- **FR-403** → Tắt mạng rồi bật lại: số liệu khớp dữ liệu thật, không bị cộng đôi.
- **FR-404** → Gõ "chuc" làm nổi "Chức"; gõ chữ không khớp hiện thông báo.
- **FR-405** → Phóng to rồi Esc: vùng về đúng trạng thái trước đó và số liệu vẫn chạy.
- **FR-602** → Dữ liệu trả về trình duyệt của Kudo ẩn danh không có định danh người gửi, kể cả trong các thông điệp cập nhật trực tiếp.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Cập nhật trực tiếp vô tình mang theo cột người gửi (nếu cho trình duyệt nghe thẳng bảng Kudo) | Lộ người gửi ẩn danh, phá cam kết ẩn danh | [EXPECTED] |
| RISK-02 | risk | Đám mây dày tên khiến chữ chồng chéo, khó bấm trên màn hình nhỏ | Khó đọc và khó bấm tên trên điện thoại | [INFERRED] |
| RISK-03 | risk | Bước phát sự kiện lỗi làm chậm hoặc chặn việc gửi Kudo | Sunner không gửi được Kudo vì lỗi phụ của bảng | [EXPECTED] |
| RISK-04 | risk | Sự kiện bị lỡ trong lúc đứt kết nối làm số liệu lệch cho tới lần nạp lại | Bộ đếm sai tạm thời | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, tên người nhận trên hồ sơ Sunner | FR-601, FR-202 |
| F002_AppShell | feature | Header, đổi ngôn ngữ vi/en cho nhãn và định dạng giờ | FR-101 |
| F003_KudosAuthoring | feature | Tạo ra bản ghi Kudo là nguồn của mọi sự kiện | FR-401 |
| F004_KudosFeed | feature | Trang Live board chứa vùng này (vùng R4) | FR-101 |
| F007_AdminModeration | feature | Trạng thái Public/Spam quyết định Kudo có được tính hay không | FR-001, FR-402 |
| F012_Profile | feature | Đích khi bấm tên trong đám mây | FR-406 |
| Dịch vụ thời gian thực của Supabase | external-service | Kênh phát tin riêng tư để cập nhật trực tiếp | FR-401, FR-403 |

## 13. Configuration

```text
NAME_CLOUD_MAX = 60           # số tên tối đa trong đám mây (mặc định đề xuất, D001)
SIZE_TIERS = 4                # số bậc cỡ chữ của tên (mặc định đề xuất, D001)
TICKER_VISIBLE_LINES = 5      # số dòng sự kiện hiện cùng lúc (mặc định đề xuất, D006)
TICKER_HISTORY_ON_LOAD = 5    # số Kudo gần nhất nạp sẵn khi mở trang (mặc định đề xuất, D006)
```
