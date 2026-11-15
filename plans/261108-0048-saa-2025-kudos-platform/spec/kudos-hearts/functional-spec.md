---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Functional Spec — F005_KudosHearts

**Priority**: P1
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoint dự kiến, thiết kế dữ liệu, thuật toán và cách xử lý đồng thời cho Dev/QA/SA.

**Traceability:** F005_KudosHearts → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft)

## 1. Overview

**Problem:** Sunner muốn bày tỏ sự đồng tình với một Kudo bằng một cú bấm nhẹ, và hệ thống cần con số tim đáng tin để làm nền cho cơ chế game hoá (Secret Box, Kudos Quốc Dân). Nếu đếm tim không chặt, bấm đúp hoặc nhiều tab sẽ làm số tim sai.
**Solution:** Mỗi Sunner thả hoặc bỏ tim cho một Kudo công khai; số tim hiển thị tức thì và luôn khớp với thực tế. Trong chiến dịch "Ngày x2 tim" (do F011 cấu hình), mỗi tim thả ra được tính gấp đôi vào tổng tim nhận được; ngoài chiến dịch hệ số là 1.
**Scope:** Thả/bỏ tim cho Kudo, hiển thị số tim và trạng thái "đã thả" trên thẻ Kudo, tính và hiển thị tổng tim nhận được đã nhân hệ số, đọc hệ số từ chiến dịch đang hiệu lực (mặc định 1 khi chưa có chiến dịch).
**Non-Scope:** Không quy đổi tim thành Secret Box (F010). Không tạo/sửa/xoá chiến dịch (F011). Không dựng thẻ Kudo hay feed (F004). Không kiểm duyệt Spam (F007). Không có danh sách "ai đã thả tim".

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner thả tim | Sunner đã đăng nhập, đang xem một Kudo công khai | Bày tỏ sự đồng tình, và bỏ tim nếu đổi ý |
| Sunner gửi Kudo | Sunner là người đã viết Kudo | Xem số tim các Kudo của mình nhận được, để theo dõi tiến độ phần thưởng |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Heart a Kudo | Thả tim, bỏ tim và thấy số tim cùng trạng thái "đã thả" trên thẻ Kudo | US001, US002, US003 | FR-001, FR-101, FR-201, FR-202, FR-401, FR-402, FR-403, FR-404, FR-405, FR-601, FR-602 | BR-001, BR-002, BR-003, BR-004, DEC-001, SM-001 | TBD (draft) |
| CAP-02 | Heart multiplier | Được tính tim gấp đôi khi chiến dịch x2 đang chạy, và xem tổng tim nhận được đã nhân hệ số | US004, US005 | FR-002, FR-003, FR-301, FR-302, FR-406 | BR-005, DEC-002 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Người gửi có được tự thả tim Kudo của mình không? | Không được | Tránh tự nâng tiến độ Secret Box của chính mình | no |
| D002 | Bỏ tim rồi thả lại trong lúc chiến dịch x2 chạy thì tim mới lấy hệ số hiện tại hay giữ hệ số của lần đầu? | Lấy hệ số hiện tại (mỗi lần thả là một tim mới) | Đơn giản nhất; rủi ro lạm dụng ghi ở § 11 | no |
| D003 | Số tim trên thẻ Kudo là số người đã thả (đếm thô) hay tổng đã nhân hệ số? | Thẻ hiện số người đã thả; tổng đã nhân hệ số chỉ hiện ở vùng thống kê | Thẻ phản ánh đúng số lượt bấm; hệ số là chuyện thưởng | no |
| D004 | "Tim nhận được" ở vùng thống kê tính trên Kudo mình đã gửi hay Kudo mình là người nhận? | Tính trên Kudo mình đã gửi | Khớp mô tả F010 (tim là đầu vào cho người gửi tích Secret Box) | yes |
| D005 | Tim x2 có cộng gấp đôi vào tiến độ Secret Box không? | F005 cung cấp cả số thô lẫn tổng đã nhân hệ số; F010 chọn cách dùng, mặc định dùng tổng đã nhân hệ số | Quyết định thuộc F010, F005 chỉ phải đưa đủ dữ liệu | no |
| D006 | Khi Kudo bị Mark Spam, tim đã thả có bị trừ không? | Giữ nguyên bản ghi tim nhưng loại khỏi mọi tổng khi Kudo không còn Public; Un Spam thì tính lại | Đảo ngược được, không mất dữ liệu | no |
| D007 | Nếu nhiều chiến dịch trùng giờ thì hệ số là bao nhiêu, và hệ số có cấu hình được không? | Cố định x2 khi có ít nhất một chiến dịch hiệu lực | F011 hiện chỉ có tên và khung giờ, chưa có trường hệ số | no |
| D008 | Số tim trên thẻ có cập nhật realtime cho người xem khác không? | Không; chỉ cập nhật khi tải lại hoặc sau thao tác của chính mình | Realtime thuộc phạm vi F008; giữ đơn giản | no |
| D009 | Có hiển thị danh sách người đã thả tim không? | Không | Brief và Figma chỉ nêu số đếm | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Sunner chỉ có tối đa một tim cho mỗi Kudo, dù bấm bao nhiêu lần.
- **FR-002** Mỗi tim ghi lại hệ số nhân có hiệu lực tại thời điểm thả, dùng làm trọng số khi cộng tim nhận được.
- **FR-003** Khi không có chiến dịch hiệu lực, hoặc chưa có tính năng quản lý chiến dịch, hệ số luôn là 1.

### Navigation (1xx)

- **FR-101** Nút tim có mặt trên mọi thẻ Kudo công khai do feed và trang chi tiết Kudo hiển thị.

### Kudo Card Heart Button (2xx)

- **FR-201** Thẻ Kudo hiện số tim hiện tại và cho biết người xem đã thả tim hay chưa.
- **FR-202** Nút tim của Kudo do chính người xem gửi bị vô hiệu hoá và có chú thích lý do.

### Heart Statistics Area (3xx)

- **FR-301** Vùng thống kê hiện tổng tim người dùng nhận được, đã nhân hệ số của từng tim.
- **FR-302** Khi chiến dịch x2 đang hiệu lực, vùng thống kê hiện nhãn cho biết tim đang được nhân đôi.

### Interaction (4xx)

- **FR-401** Bấm nút tim để thả; giao diện đổi ngay và quay về trạng thái cũ nếu thao tác thất bại.
- **FR-402** Bấm lại nút tim đã thả để bỏ; phần tim và hệ số đã cộng của tim đó bị trừ đúng.
- **FR-403** Bấm liên tiếp, mở nhiều tab hoặc nhiều thiết bị cùng lúc không làm sinh tim trùng hay lệch số đếm.
- **FR-404** Không thả được tim cho Kudo không còn ở trạng thái Public (bị Spam hoặc đã xoá).
- **FR-405** Người gửi không thể tự thả tim cho Kudo của mình, kể cả với Kudo gửi ẩn danh.
- **FR-406** Hệ số của tim lấy từ chiến dịch đang hiệu lực đúng lúc thả tim.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới thả hoặc bỏ được tim.
- **FR-602** Mỗi Sunner chỉ thả hoặc bỏ tim dưới danh nghĩa chính mình, không thao tác thay người khác.

## 5. Business Rules

- Một cặp (Sunner, Kudo) có tối đa một tim; thả lần hai là không có tác dụng, không báo lỗi (BR-001)
- Người gửi không được thả tim cho Kudo của mình, để không tự tăng tiến độ phần thưởng (BR-002)
- Chỉ Kudo đang Public mới nhận được tim mới (BR-003)
- Hệ số của một tim được chốt lúc thả và không đổi về sau, kể cả khi chiến dịch kết thúc hay bị sửa (BR-004)
- Hệ số là 2 khi có chiến dịch x2 đang hiệu lực, còn lại là 1 (BR-005)
- Nút tim của Kudo mình gửi bị vô hiệu hoá và có chú thích, các Kudo khác thì bấm được (DEC-001)
- Hệ số được chọn theo chiến dịch đang chạy, không có thì dùng 1 mà người dùng không thấy lỗi gì (DEC-002)
- Một tim chỉ có hai trạng thái: chưa thả và đã thả, chuyển qua lại bằng thả/bỏ tim (SM-001)

## 6. Screens

N/A — feature không sở hữu màn hình riêng; nút tim và vùng thống kê tim là thành phần nhúng trong thẻ Kudo của F004_KudosFeed và panel thống kê cá nhân của F010_SecretBoxRewards. Mã SCR### của các màn đó do hai feature kia quản lý (TBD (draft)).

### User Journey

1. Sunner mở Live board và thấy các thẻ Kudo, mỗi thẻ có nút tim cùng số tim hiện tại.
2. Sunner bấm tim trên một Kudo của đồng nghiệp — tim tô đầy và số tim tăng ngay.
3. Sunner đổi ý, bấm lại — tim trở về viền rỗng và số tim giảm một.
4. Sunner gửi Kudo mở vùng thống kê cá nhân và thấy tổng tim nhận được; trong chiến dịch x2 có nhãn "x2" bên cạnh.

## 7. User Stories

### US001_HeartKudo — Thả tim cho Kudo

**Actor:** Sunner thả tim
**Goal:** Thả tim cho một Kudo công khai của đồng nghiệp.
**Business value:** Tạo tương tác tích cực và là nguồn số liệu cho phần thưởng của người gửi.

**Acceptance Criteria:**
- [ ] Bấm tim thì tim tô đầy và số tim tăng đúng một ngay lập tức.
- [ ] Tải lại trang vẫn thấy tim đã thả.
- [ ] Không thả được tim cho Kudo của chính mình hoặc Kudo không còn Public.

### US002_UnheartKudo — Bỏ tim đã thả

**Actor:** Sunner thả tim
**Goal:** Rút lại tim đã thả.
**Business value:** Cho người dùng quyền sửa lỡ tay, giữ số liệu tim trung thực.

**Acceptance Criteria:**
- [ ] Bấm lại tim đã thả thì tim trở về trống và số tim giảm đúng một.
- [ ] Bỏ tim hai lần liên tiếp không làm số tim âm hay báo lỗi.

### US003_ViewHeartState — Xem số tim và trạng thái đã thả

**Actor:** Sunner thả tim
**Goal:** Thấy mỗi Kudo có bao nhiêu tim và mình đã thả chưa.
**Business value:** Giúp nhận biết Kudo được cộng đồng quan tâm và tránh thả nhầm lần nữa.

**Acceptance Criteria:**
- [ ] Mọi thẻ Kudo, kể cả biến thể ẩn danh, hiện số tim và trạng thái của người xem.
- [ ] Kudo do mình gửi hiện nút tim bị vô hiệu hoá kèm chú thích.

### US004_DoubleHeartsDay — Tim được nhân đôi trong chiến dịch x2

**Actor:** Sunner thả tim
**Goal:** Tim mình thả trong khung giờ chiến dịch được tính gấp đôi cho người nhận phần thưởng.
**Business value:** Khuyến khích tương tác đúng thời điểm BTC muốn đẩy mạnh.

**Acceptance Criteria:**
- [ ] Tim thả khi chiến dịch đang chạy được tính hệ số 2; ngoài chiến dịch hệ số là 1.
- [ ] Chưa có chiến dịch nào thì mọi tim đều có hệ số 1 và không có lỗi.

### US005_ViewReceivedHearts — Xem tổng tim nhận được

**Actor:** Sunner gửi Kudo
**Goal:** Xem tổng tim các Kudo mình đã gửi nhận được.
**Business value:** Cho người gửi thấy tiến độ tích luỹ phần thưởng một cách rõ ràng.

**Acceptance Criteria:**
- [ ] Tổng hiển thị đã nhân hệ số của từng tim.
- [ ] Kudo bị Mark Spam không được tính vào tổng.
- [ ] Trong chiến dịch x2 có nhãn báo tim đang được nhân đôi.

## 8. Scenarios

### US001_HeartKudo — Happy Path

**Given** Sunner đã đăng nhập và đang xem Kudo công khai của đồng nghiệp chưa thả tim, **When** bấm nút tim, **Then** tim tô đầy và số tim tăng một.

### US001_HeartKudo — Error: Kudo của chính mình

**Given** Sunner đang xem Kudo do mình gửi, **When** nhìn nút tim, **Then** nút bị vô hiệu hoá và có chú thích "Bạn không thể thả tim cho Kudo của mình".

### US001_HeartKudo — Error: Kudo đã bị Spam

**Given** Kudo vừa bị Admin Mark Spam trong lúc Sunner còn đang mở trang, **When** Sunner bấm tim, **Then** tim quay về trạng thái cũ và hiện thông báo "Kudo này không còn khả dụng".

### US002_UnheartKudo — Happy Path

**Given** Sunner đã thả tim cho một Kudo, **When** bấm lại nút tim, **Then** tim trở về viền rỗng và số tim giảm một.

### US002_UnheartKudo — Error: Mất kết nối

**Given** Sunner đã thả tim và mạng bị ngắt, **When** bấm bỏ tim, **Then** giao diện quay về trạng thái đã thả và hiện thông báo "Không thể cập nhật, vui lòng thử lại".

### US003_ViewHeartState — Happy Path

**Given** Sunner mở feed có nhiều Kudo, **When** trang tải xong, **Then** mỗi thẻ hiện số tim và tim tô đầy ở những Kudo Sunner đã thả.

### US003_ViewHeartState — Error: Không tải được số tim

**Given** dữ liệu tim tạm thời không tải được, **When** thẻ Kudo hiển thị, **Then** nội dung Kudo vẫn hiện bình thường và vùng tim hiện trạng thái lỗi nhẹ, không làm hỏng cả feed.

### US004_DoubleHeartsDay — Happy Path

**Given** chiến dịch x2 đang hiệu lực, **When** Sunner thả tim cho một Kudo, **Then** tim đó được tính hệ số 2 trong tổng tim nhận được của người gửi.

### US004_DoubleHeartsDay — Error: Chưa có chiến dịch

**Given** hệ thống chưa có chiến dịch nào hoặc chiến dịch đã hết giờ, **When** Sunner thả tim, **Then** tim được tính hệ số 1 và không có thông báo lỗi.

### US005_ViewReceivedHearts — Happy Path

**Given** Sunner gửi Kudo có 3 tim thả ngoài chiến dịch và 2 tim thả trong chiến dịch x2, **When** mở vùng thống kê, **Then** tổng tim nhận được là 7.

### US005_ViewReceivedHearts — Error: Kudo bị Spam

**Given** một Kudo của Sunner có 4 tim bị Mark Spam, **When** mở vùng thống kê, **Then** 4 tim đó không còn nằm trong tổng; nếu Un Spam thì được tính lại.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Bấm tim hai lần liên tiếp rất nhanh, hoặc từ hai tab cùng lúc | Chỉ một tim được ghi; yêu cầu thứ hai được coi là đã xong | "None — silent handling" |
| Bấm tim lúc chiến dịch vừa hết giờ | Hệ số chốt theo thời điểm máy chủ nhận yêu cầu | "None — silent handling" |
| Kudo bị xoá hoặc không còn Public lúc bấm tim | Từ chối, giao diện hoàn lại trạng thái cũ | "Kudo này không còn khả dụng" |
| Phiên đăng nhập hết hạn lúc bấm tim | Từ chối, đưa người dùng về đăng nhập | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" |
| Chưa có tính năng chiến dịch hoặc đọc chiến dịch lỗi | Dùng hệ số 1 để thả tim vẫn chạy | "None — silent handling" |
| Người gửi cố thả tim Kudo ẩn danh của mình | Từ chối dù danh tính đang ẩn với người khác | "Bạn không thể thả tim cho Kudo của mình" |

## 10. Edge Behaviours to Verify

- **FR-001** → Bấm tim 10 lần liên tiếp cho cùng một Kudo chỉ để lại đúng một tim.
- **FR-002** → Tim thả trong chiến dịch vẫn giữ hệ số 2 sau khi chiến dịch kết thúc.
- **FR-003** → Khi không có chiến dịch, tổng tim nhận được bằng đúng số tim.
- **FR-403** → Hai tài khoản bấm cùng lúc thì số tim tăng đúng hai; một tài khoản mở hai tab thì tăng đúng một.
- **FR-404** → Kudo bị Mark Spam không nhận thêm tim và biến mất khỏi tổng tim của người gửi.
- **FR-405** → Người gửi không thả được tim cho Kudo của mình, kể cả khi gửi ẩn danh.
- **FR-601** → Người chưa đăng nhập không thả được tim.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Bỏ tim rồi thả lại trong khung giờ chiến dịch có thể "đổi" tim cũ thành tim nhân đôi | Số tim x2 bị thổi phồng bởi thao tác bấm đi bấm lại | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Kudo lan truyền có rất nhiều người cùng thả tim một lúc | Phản hồi chậm hoặc tranh chấp ghi dữ liệu | [EXPECTED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Biết Sunner nào đang thao tác và chặn khách chưa đăng nhập | FR-601, FR-602 |
| F003_KudosAuthoring | feature | Cung cấp bản ghi Kudo, người gửi và trạng thái để thả tim lên | FR-404, FR-405 |
| F004_KudosFeed | feature | Nơi hiển thị thẻ Kudo chứa nút tim | FR-101, FR-201 |
| F007_AdminModeration | feature | Quyết định trạng thái Spam, ảnh hưởng đến Kudo còn nhận tim và tổng tim | BR-003, D006 |
| F010_SecretBoxRewards | feature | Dùng tổng tim làm đầu vào cấp Secret Box; hiển thị vùng thống kê | FR-301, D005 |
| F011_AdminCampaigns | feature | Cung cấp chiến dịch x2 đang hiệu lực (không bắt buộc, thiếu thì hệ số là 1) | FR-003, FR-406 |

## 13. Configuration

```text
HEART_CAMPAIGN_MULTIPLIER = 2   # hệ số của mỗi tim thả trong lúc chiến dịch x2 đang chạy
DEFAULT_HEART_MULTIPLIER = 1    # hệ số khi không có chiến dịch hiệu lực
SELF_HEART_ALLOWED = false      # người gửi có được tự thả tim Kudo của mình hay không (D001)
```
