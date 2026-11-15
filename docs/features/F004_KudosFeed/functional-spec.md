<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F004_KudosFeed

**Priority**: P1
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F004_KudosFeed → SCR (TBD (draft)) → US001_ViewHighlightKudos, US002_FilterHighlightKudos, US003_BrowseAllKudos, US004_ViewKudoDetail, US005_CopyKudoLink, US006_SearchSunnerProfile

## 1. Overview

**Problem:** Sunner gửi Kudo công khai để cảm ơn đồng nghiệp, nhưng nếu không có nơi xem tập trung thì lời cảm ơn không được lan toả và không ai biết ai đang được ghi nhận.
**Solution:** Cho Sunner xem các Kudo công khai trên Live board: dải Highlight Kudos (carousel, lọc theo Hashtag và Phòng ban), feed All Kudos, thẻ Kudo (có biến thể ẩn danh), trang chi tiết, nút Copy Link và ô tìm profile Sunner.
**Scope:** Chỉ ĐỌC và HIỂN THỊ Kudo ở trạng thái Public: Highlight Kudos, All Kudos, thẻ Kudo, chi tiết Kudo, Copy Link, tìm Sunner để mở profile.
**Non-Scope:** Viết/sửa Kudo (F003_KudosAuthoring); logic thả tim và đếm tim (F005_KudosHearts); Spotlight Board và luồng realtime (F008_SpotlightBoard); panel thống kê cá nhân, Secret Box, danh sách nhận quà (F010_SecretBoxRewards); trang profile (F012_Profile); duyệt/đánh dấu spam (F007_AdminModeration); huy hiệu Hero (F009_HeroBadges, ở đây chỉ hiển thị).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty | Xem lời cảm ơn công khai, lọc theo chủ đề/phòng ban, mở chi tiết, chia sẻ liên kết, tìm đồng nghiệp |
| Chủ Kudo | Sunner là người gửi của chính Kudo đang xem | Thấy lối vào sửa bài của mình ngay trên thẻ |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem Highlight Kudos | Duyệt carousel các Kudo nổi bật và lọc theo Hashtag, Phòng ban | US001_ViewHighlightKudos, US002_FilterHighlightKudos | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-401 | BR-002, BR-004 | TBD (draft) |
| CAP-02 | Duyệt feed All Kudos | Cuộn feed mọi Kudo công khai, đọc thẻ Kudo (cả biến thể ẩn danh) | US003_BrowseAllKudos | FR-002, FR-205, FR-301, FR-302, FR-304, FR-402, FR-601, FR-602 | BR-001, BR-003, BR-005, BR-006, DEC-001 | TBD (draft) |
| CAP-03 | Xem chi tiết và sao chép liên kết Kudo | Mở trang chi tiết một Kudo và sao chép liên kết để chia sẻ | US004_ViewKudoDetail, US005_CopyKudoLink | FR-102, FR-303, FR-305, FR-403, FR-404 | — | TBD (draft) |
| CAP-04 | Tìm profile Sunner | Gõ tên để tìm đồng nghiệp và mở profile | US006_SearchSunnerProfile | FR-206 | — | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Highlight Kudos chọn theo tiêu chí nào? | Top 5 Kudo có nhiều tim nhất sau khi áp bộ lọc; bằng tim thì bài mới hơn lên trước | Báo cáo Figma chỉ cho thấy phân trang "n/5" và lọc, không nêu tiêu chí | no |
| D002 | Bộ lọc Phòng ban áp lên người nhận hay người gửi? | Phòng ban của người nhận | Highlight vinh danh người được ghi nhận | no |
| D003 | Kiểu phân trang của All Kudos | Nút "Tải thêm", mỗi lần 10 Kudo, mới nhất trước | Đơn giản, không cần cuộn vô hạn | no |
| D004 | Chi tiết Kudo là trang riêng hay modal? | Trang riêng có địa chỉ cố định (để Copy Link mở thẳng được) | Copy Link cần một liên kết ổn định; frame "View Kudo" chưa xác định dạng hiển thị | yes |
| D005 | Feed có tự cập nhật khi có Kudo mới không? | Không; chỉ Spotlight (F008) chạy realtime, feed cập nhật khi tải lại | Giữ feed đơn giản; tránh bài nhảy khi đang đọc | no |
| D006 | Thẻ ẩn danh hiển thị gì và ai thấy người gửi thật? | Hiện nhãn "Ẩn danh" + ảnh đại diện mặc định; không ai trên feed thấy người gửi thật | Câu hỏi quyền xem của Admin/người nhận đã nằm trong danh sách mở chung của hệ thống, ở đây chỉ chốt phần feed | no |
| D007 | Ô tìm Sunner tìm theo trường nào, chọn kết quả thì đi đâu? | Tên + email; chọn kết quả mở profile (F012) | Khớp mục đích "tìm profile Sunner" | no |
| D008 | Nội dung dài trên thẻ cắt ở đâu? | Cắt gọn trên thẻ, đọc đủ ở trang chi tiết; độ dài cắt theo Figma | Lời nhắn có thể tới 1.000 ký tự | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Feed, Highlight và chi tiết chỉ hiển thị Kudo ở trạng thái Public.
- **FR-002** Tính năng này chỉ đọc: không tạo, sửa hay xoá Kudo (việc đó thuộc F003_KudosAuthoring).

### Navigation (1xx)

- **FR-101** Sunner vào Live board từ mục "Sun* Kudos" trên header và thấy ngay Highlight cùng All Kudos.
- **FR-102** Sunner mở chi tiết một Kudo bằng nút "Xem chi tiết" trên thẻ hoặc bằng liên kết đã sao chép.

### Live board (2xx)

- **FR-201** Highlight Kudos hiện dạng carousel: một thẻ ở giữa rõ nét, hai thẻ bên cạnh mờ.
- **FR-202** Sunner chuyển thẻ trước/sau và thấy chỉ số trang dạng "số hiện tại/tổng".
- **FR-203** Sunner lọc Highlight theo Hashtag chọn từ danh sách có sẵn, hoặc bỏ lọc.
- **FR-204** Sunner lọc Highlight theo Phòng ban chọn từ danh sách, hoặc bỏ lọc.
- **FR-205** All Kudos hiện feed các thẻ Kudo, mới nhất trước, nạp thêm khi Sunner yêu cầu.
- **FR-206** Ô tìm profile cho Sunner gõ tên và chọn đồng nghiệp trong kết quả để mở profile.

### Kudo card (3xx)

- **FR-301** Thẻ Kudo gồm người gửi, người nhận (ảnh, tên, phòng ban, huy hiệu Hero), thời gian, danh hiệu, nội dung, ảnh đính kèm, hashtag, số tim, Copy Link và Xem chi tiết.
- **FR-302** Kudo gửi ẩn danh dùng biến thể thẻ riêng: thay thông tin người gửi bằng nhãn "Ẩn danh".
- **FR-303** Nút Copy Link đưa liên kết cố định của Kudo vào bộ nhớ tạm của Sunner.
- **FR-304** Thẻ của chính Chủ Kudo có thêm nút sửa; thẻ người khác thì không.
- **FR-305** Trang chi tiết hiện đầy đủ nội dung một Kudo: toàn bộ lời nhắn, mọi ảnh, hashtag, số tim.

### Interaction (4xx)

- **FR-401** Hai bộ lọc Highlight áp dụng đồng thời và mỗi lần đổi lọc thì carousel về thẻ đầu.
- **FR-402** Khi không có Kudo phù hợp (bộ lọc hoặc feed trống), hiện thông báo trống thay vì vùng trắng.
- **FR-403** Mở Kudo không tồn tại hoặc không còn ở trạng thái Public thì thấy trang "không tìm thấy".
- **FR-404** Sao chép liên kết xong thì hiện thông báo ngắn xác nhận; thất bại thì báo lỗi.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem được Live board và chi tiết Kudo; người chưa đăng nhập được chuyển về màn đăng nhập.
- **FR-602** Danh tính người gửi của Kudo ẩn danh không bao giờ đến được trình duyệt của người xem.

## 5. Business Rules

- Chỉ Kudo Public được hiển thị; Kudo bị đánh dấu spam thì biến mất khỏi mọi nơi trong tính năng này (BR-001)
- Highlight lấy 5 Kudo có nhiều tim nhất sau khi áp bộ lọc, bằng tim thì bài mới hơn trước (BR-002) [NEEDS_DOMAIN_CONFIRMATION] D001
- Kudo ẩn danh không lộ người gửi ở bất kỳ nơi nào Sunner xem được (BR-003)
- Hashtag và Phòng ban là hai điều kiện cùng phải đúng; chọn "Tất cả" nghĩa là không lọc theo điều kiện đó (BR-004)
- All Kudos xếp theo thời điểm gửi, mới nhất trước (BR-005)
- Nút sửa chỉ hiện trên Kudo do chính người xem gửi (BR-006)
- Thẻ Kudo dựng người gửi theo hai nhánh: bình thường thì hiện tên, ảnh, phòng ban; ẩn danh thì hiện nhãn "Ẩn danh" (DEC-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Live board — Highlight và All Kudos | TBD (draft) | Carousel Highlight kèm hai bộ lọc, feed All Kudos, ô tìm Sunner (các vùng Spotlight, thống kê cá nhân do feature khác lo) | Lọc, chuyển thẻ, tải thêm, Copy Link, mở chi tiết, tìm Sunner |
| Chi tiết Kudo | TBD (draft) | Toàn bộ nội dung một Kudo | Đọc đầy đủ, Copy Link, quay lại Live board |

### User Journey

1. Sunner bấm "Sun* Kudos" trên header, tới Live board và thấy carousel Highlight cùng feed All Kudos.
2. Sunner chọn Hashtag hoặc Phòng ban — carousel lọc lại, về thẻ đầu.
3. Sunner cuộn xuống All Kudos, đọc thẻ, bấm "Tải thêm" khi muốn xem nữa.
4. Sunner bấm "Xem chi tiết" trên một thẻ — tới trang chi tiết đọc đủ lời nhắn và ảnh.
5. Sunner bấm Copy Link và dán cho đồng nghiệp; người nhận liên kết đăng nhập rồi mở thẳng đúng Kudo.

## 7. User Stories

### US001_ViewHighlightKudos — Xem Highlight Kudos

**Actor:** Sunner
**Goal:** Xem các Kudo nổi bật dưới dạng carousel.
**Business value:** Lời cảm ơn đáng nhớ được nhiều người thấy hơn, thúc đẩy văn hoá ghi nhận.

**Acceptance Criteria:**
- [ ] Carousel hiện một thẻ rõ nét ở giữa, hai thẻ bên cạnh mờ.
- [ ] Chuyển thẻ trước/sau được và chỉ số trang cập nhật theo.
- [ ] Chỉ có Kudo Public trong carousel.

### US002_FilterHighlightKudos — Lọc Highlight theo Hashtag và Phòng ban

**Actor:** Sunner
**Goal:** Thu hẹp Highlight theo chủ đề hoặc phòng ban mình quan tâm.
**Business value:** Sunner tìm nhanh lời cảm ơn gắn với giá trị cốt lõi hoặc đơn vị của mình.

**Acceptance Criteria:**
- [ ] Chọn Hashtag hoặc Phòng ban thì carousel chỉ còn Kudo khớp và về thẻ đầu.
- [ ] Chọn cả hai thì chỉ còn Kudo khớp cả hai.
- [ ] Không có Kudo khớp thì thấy thông báo trống.

### US003_BrowseAllKudos — Duyệt feed All Kudos

**Actor:** Sunner
**Goal:** Đọc mọi Kudo công khai theo thứ tự mới nhất trước.
**Business value:** Người nhận và đồng nghiệp thấy được dòng chảy ghi nhận trong toàn công ty.

**Acceptance Criteria:**
- [ ] Mỗi thẻ có đủ thông tin theo FR-301.
- [ ] Kudo ẩn danh dùng thẻ biến thể, không lộ người gửi.
- [ ] Bấm "Tải thêm" nạp thêm Kudo cũ hơn; hết thì không còn nút.
- [ ] Thẻ của chính mình có nút sửa, thẻ người khác không.

### US004_ViewKudoDetail — Xem chi tiết Kudo

**Actor:** Sunner
**Goal:** Đọc đầy đủ một Kudo (lời nhắn dài, mọi ảnh).
**Business value:** Không mất nội dung do thẻ cắt gọn; liên kết chia sẻ mở được đúng bài.

**Acceptance Criteria:**
- [ ] Trang chi tiết hiện toàn bộ lời nhắn, ảnh, hashtag, số tim.
- [ ] Kudo không tồn tại hoặc không Public thì thấy trang không tìm thấy.

### US005_CopyKudoLink — Sao chép liên kết Kudo

**Actor:** Sunner
**Goal:** Lấy liên kết của một Kudo để gửi cho người khác.
**Business value:** Lan toả lời cảm ơn ra ngoài Live board (chat, email nội bộ).

**Acceptance Criteria:**
- [ ] Bấm Copy Link thì liên kết nằm trong bộ nhớ tạm và có thông báo xác nhận.
- [ ] Sao chép thất bại thì có thông báo lỗi.

### US006_SearchSunnerProfile — Tìm profile Sunner

**Actor:** Sunner
**Goal:** Tìm một đồng nghiệp theo tên và mở profile.
**Business value:** Từ lời cảm ơn, Sunner đi tới người được ghi nhận để xem thành tích.

**Acceptance Criteria:**
- [ ] Gõ tên thì hiện danh sách gợi ý khớp.
- [ ] Chọn một kết quả thì mở profile của người đó.
- [ ] Không có kết quả thì hiện thông báo trống.

## 8. Scenarios

### US001_ViewHighlightKudos — Happy Path

**Given** có hơn 5 Kudo Public, **When** Sunner mở Live board, **Then** carousel hiện 5 Kudo nhiều tim nhất, thẻ đầu ở giữa, chỉ số "1/5".

### US001_ViewHighlightKudos — Error: Tải Highlight thất bại

**Given** dịch vụ dữ liệu đang lỗi, **When** Sunner mở Live board, **Then** vùng Highlight hiện thông báo lỗi kèm nút thử lại, phần còn lại của trang vẫn dùng được.

### US002_FilterHighlightKudos — Happy Path

**Given** Sunner đang ở Live board, **When** chọn hashtag "#BE PROFESSIONAL", **Then** carousel chỉ còn Kudo có hashtag đó và về thẻ đầu.

### US002_FilterHighlightKudos — Error: Không có Kudo khớp

**Given** không Kudo nào vừa thuộc phòng ban đã chọn vừa có hashtag đã chọn, **When** Sunner áp hai bộ lọc, **Then** hiện "Chưa có Kudo nào phù hợp bộ lọc" và bộ lọc vẫn bỏ được.

### US003_BrowseAllKudos — Happy Path

**Given** có 25 Kudo Public, **When** Sunner mở Live board rồi bấm "Tải thêm" hai lần, **Then** thấy 10, 20, rồi 25 Kudo mới nhất trước và nút biến mất.

### US003_BrowseAllKudos — Error: Nạp thêm thất bại

**Given** mạng đứt giữa chừng, **When** Sunner bấm "Tải thêm", **Then** hiện lỗi ngắn, các thẻ đã có giữ nguyên và bấm lại được.

### US004_ViewKudoDetail — Happy Path

**Given** Kudo có lời nhắn dài và 3 ảnh, **When** Sunner bấm "Xem chi tiết", **Then** thấy toàn bộ lời nhắn và cả 3 ảnh.

### US004_ViewKudoDetail — Error: Kudo đã bị gỡ

**Given** Kudo vừa bị Admin đánh dấu spam, **When** Sunner mở liên kết cũ của Kudo đó, **Then** thấy trang "không tìm thấy".

### US005_CopyKudoLink — Happy Path

**Given** Sunner đang xem một thẻ Kudo, **When** bấm Copy Link, **Then** hiện thông báo "Đã sao chép liên kết".

### US005_CopyKudoLink — Error: Trình duyệt chặn bộ nhớ tạm

**Given** trình duyệt từ chối quyền ghi bộ nhớ tạm, **When** Sunner bấm Copy Link, **Then** hiện thông báo lỗi kèm liên kết để sao chép tay.

### US006_SearchSunnerProfile — Happy Path

**Given** có Sunner tên "Nguyễn Văn An", **When** Sunner gõ "An" và chọn kết quả, **Then** mở profile của Nguyễn Văn An.

### US006_SearchSunnerProfile — Error: Không có kết quả

**Given** không ai khớp từ khoá, **When** Sunner gõ "zzzz", **Then** hiện "Không tìm thấy Sunner nào".

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Bộ lọc không khớp Kudo nào, hoặc feed chưa có Kudo | Vùng đó hiện trạng thái trống | "Chưa có Kudo nào phù hợp." |
| Ít hơn 5 Kudo đủ điều kiện Highlight | Carousel chỉ hiện số thẻ thực có, chỉ số trang theo số đó | "None — silent handling" |
| Kudo bị Mark Spam trong lúc Sunner đang xem | Lần tải sau Kudo biến mất; mở liên kết cũ ra trang không tìm thấy | "Kudo này không tồn tại hoặc đã bị gỡ." |
| Sunner chưa đăng nhập mở liên kết Kudo | Chuyển tới màn đăng nhập, đăng nhập xong quay lại đúng Kudo (TBD (draft)) | "Vui lòng đăng nhập để xem Kudo." |
| Kudo ẩn danh được xem bởi bất kỳ Sunner | Chỉ hiện nhãn "Ẩn danh", không có tên/ảnh/phòng ban người gửi | "None — silent handling" |
| Lời nhắn rất dài hoặc nhiều ảnh | Thẻ cắt gọn, trang chi tiết hiện đủ | "None — silent handling" |
| Sao chép liên kết thất bại | Không đổi bộ nhớ tạm, hiện lỗi | "Không sao chép được liên kết, vui lòng thử lại." |
| Tải dữ liệu feed thất bại | Vùng lỗi kèm nút thử lại; các vùng khác vẫn dùng được | "Không tải được Kudos. Vui lòng thử lại." |

## 10. Edge Behaviours to Verify

- **FR-001** → Mark một Kudo thành spam rồi tải lại: Kudo đó biến mất khỏi Highlight, All Kudos và trang chi tiết.
- **FR-002** → Trên Live board không có thao tác nào tạo/sửa/xoá nội dung Kudo, ngoài nút sửa chuyển sang luồng của F003.
- **FR-201** → Carousel luôn có đúng một thẻ rõ nét ở giữa; ít thẻ hơn thì vẫn không vỡ bố cục.
- **FR-203** → Chọn hashtag thì mọi thẻ còn lại đều mang hashtag đó.
- **FR-204** → Chọn phòng ban thì mọi thẻ còn lại thuộc phòng ban đó (theo D002).
- **FR-205** → Feed luôn mới nhất trước; "Tải thêm" không lặp thẻ đã có.
- **FR-302** → Thẻ ẩn danh không chứa tên/ảnh người gửi, kể cả khi xem mã nguồn trang.
- **FR-304** → Đăng nhập bằng hai tài khoản: chỉ tài khoản của người gửi thấy nút sửa.
- **FR-403** → Mở địa chỉ Kudo ngẫu nhiên hoặc đã bị gỡ ra trang "không tìm thấy", không lộ nội dung.
- **FR-601** → Mở Live board khi chưa đăng nhập bị chuyển về màn đăng nhập.
- **FR-602** → Dữ liệu trả về cho trình duyệt của Kudo ẩn danh không có định danh người gửi.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Highlight xếp theo tim có thể để các bài cũ nhiều tim chiếm chỗ mãi, bài mới khó lên | Người nhận bài mới ít được thấy | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Lộ người gửi ẩn danh qua dữ liệu trả về dù giao diện đã che | Vi phạm cam kết ẩn danh với người gửi | [EXPECTED] |
| RISK-03 | risk | Lọc và xếp hạng theo tim chạy chậm khi số Kudo và tim lớn | Highlight tải chậm trong cao điểm lễ trao giải | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, danh sách Phòng ban, hồ sơ Sunner để tìm kiếm | FR-601, FR-204, FR-206 |
| F002_AppShell | feature | Header với mục "Sun* Kudos", đổi ngôn ngữ vi/en, trang 404/403 | FR-101, FR-403 |
| F003_KudosAuthoring | feature | Tạo ra bản ghi Kudo, danh sách hashtag, lối vào sửa bài | FR-203, FR-304 |
| F005_KudosHearts | feature | Số tim trên thẻ và nút thả tim (feature này chỉ chừa chỗ hiển thị) | FR-301, BR-002 |
| F007_AdminModeration | feature | Trạng thái Public/Spam quyết định Kudo có hiện hay không | FR-001, BR-001 |
| F008_SpotlightBoard | feature | Dùng chung trang Live board; realtime thuộc về F008 | D005 |
| F009_HeroBadges | feature | Huy hiệu Hero hiện cạnh tên trên thẻ | FR-301 |
| F012_Profile | feature | Đích đến khi chọn Sunner ở ô tìm kiếm hoặc bấm tên trên thẻ | FR-206 |

## 13. Configuration

```text
HIGHLIGHT_COUNT = 5     # số Kudo tối đa trong carousel Highlight (mặc định đề xuất, D001)
FEED_PAGE_SIZE = 10     # số Kudo mỗi lần nạp ở All Kudos (mặc định đề xuất, D003)
```
