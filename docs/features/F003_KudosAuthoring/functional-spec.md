---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Functional Spec — F003_KudosAuthoring

**Priority**: P0
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoint, giao dịch ghi dữ liệu, thực thể và quy tắc kiểm tra phía máy chủ cho Dev/QA/SA.

**Traceability:** F003_KudosAuthoring → SCR TBD (draft) → US001_SendKudo, US002_AttachMediaAndLinks, US003_SendAnonymousKudo, US004_EditOwnKudo

## 1. Overview

**Problem:** Sunner cần một cách nhanh, công khai để cảm ơn và ghi nhận đồng nghiệp trong SAA 2025; không có nơi soạn thì Kudos không có dữ liệu đầu vào.
**Solution:** Một form (modal) cho Sunner chọn người nhận, viết lời nhắn, gắn hashtag, đặt danh hiệu, đính ảnh và link, tuỳ chọn gửi ẩn danh; chủ bài mở lại form để sửa sau khi đăng.
**Scope:** Viết Kudo mới; sửa Kudo của chính mình; ô "gửi lời cảm ơn" làm lối vào form trên Live board; kiểm tra dữ liệu và báo lỗi khi thiếu trường bắt buộc.
**Non-Scope:** Hiển thị feed, thẻ và trang chi tiết Kudo (F004); thả tim (F005); đánh dấu Spam và cảnh báo vi phạm (F007); thông báo cho người nhận (F013); huy hiệu Hero (F009); Secret Box (F010).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty | Gửi và chỉnh sửa Kudo cho đồng nghiệp |
| Chủ bài | Sunner là người gửi của một Kudo | Sửa lại nội dung Kudo mình đã đăng |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Viết và gửi Kudo | Soạn và gửi Kudo kèm người nhận, hashtag, danh hiệu, ảnh, link, tuỳ chọn ẩn danh | US001_SendKudo, US002_AttachMediaAndLinks, US003_SendAnonymousKudo | FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-209, FR-210, FR-403, FR-601, FR-603 | BR-001, BR-002, BR-003, BR-005, DEC-001 | TBD (draft) |
| CAP-02 | Sửa Kudo của mình | Mở lại và sửa Kudo mình đã đăng | US004_EditOwnKudo | FR-102, FR-401, FR-402, FR-602 | BR-004 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Người gửi ẩn danh: người dùng khác và Admin có thấy người gửi thật không? (đã biết, chờ BTC) | Người dùng thường không thấy; Admin thấy | Admin cần truy vết khi có vi phạm | no |
| D002 | Có cho tự gửi cho chính mình, gửi nhiều lần cho một người, giới hạn số Kudo mỗi ngày? (đã biết, chờ BTC) | Chặn tự gửi; chưa giới hạn số lượng | Tránh tự tích tim; giới hạn thêm sau nếu bị lạm dụng | yes |
| D003 | Sau 26/12/2025 có khoá việc gửi và sửa Kudo? (đã biết, chờ BTC) | Không khoá ở bản đầu | Chưa có yêu cầu rõ; thêm cờ cấu hình sau | no |
| D004 | Nguồn danh sách hashtag: cố định theo giá trị cốt lõi hay người dùng tạo? (đã biết, chờ BTC) | Danh sách cố định do hệ thống nạp sẵn | Khớp mô tả "chọn từ danh sách" | yes |
| D005 | Người ẩn danh có được đặt bí danh hay luôn hiện chữ "Ẩn danh"? | Luôn hiện "Ẩn danh" | Đơn giản, không phát sinh trường dữ liệu mới | no |
| D006 | Danh hiệu có bắt buộc không, tối đa bao nhiêu ký tự? | Tuỳ chọn, tối đa 50 ký tự | Thông báo lỗi chỉ nêu ba trường bắt buộc, không có danh hiệu | no |
| D007 | Chủ bài được sửa những trường nào (người nhận, hashtag, ẩn danh, ảnh)? | Sửa mọi trường trừ người nhận | Đổi người nhận làm lệch thống kê và thông báo | yes |
| D008 | Kudo đang ở trạng thái Spam, chủ bài còn sửa được không? | Không cho sửa | Tránh lách kiểm duyệt bằng cách sửa nội dung | no |
| D009 | Chủ bài có được xoá Kudo không? | Không cho xoá | Thiết kế chỉ có sửa; xoá ảnh hưởng tim và Secret Box | no |
| D010 | Định dạng lời nhắn: văn bản thuần kèm thẻ nhắc tên, hay rich text? | Văn bản thuần kèm thẻ nhắc tên và link | Dễ kiểm giới hạn 1.000 ký tự, dễ chống chèn mã độc | yes |
| D011 | Nhắc tên bằng "@" có sinh thông báo riêng cho người được nhắc? | Không, ở bản đầu chỉ gắn tên | Tránh nở phạm vi sang F013 | no |
| D012 | Quy tắc ảnh: định dạng, dung lượng mỗi ảnh, tối đa đúng 5 ảnh hay khác? | JPG/PNG/WEBP, 5 MB mỗi ảnh, tối đa 5 ảnh | Thiết kế ghi "tối đa ~5"; cần số chính xác | no |
| D013 | Số hashtag tối đa trên một Kudo? | Tối đa 5 (theo Figma "Tối đa 5"; decision-log 2026-11-15) | Khớp thiết kế | no |
| D014 | Ngoài ô trên Live board, còn lối vào nào để viết Kudo (nút nổi, trang profile người khác)? | Chỉ ô trên Live board | Chưa có thiết kế xác nhận các lối khác | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Kudo lưu người gửi, người nhận, danh hiệu, lời nhắn, hashtag, ảnh, cờ ẩn danh, thời gian tạo và bắt đầu ở trạng thái Public.
- **FR-002** Hashtag chỉ được chọn từ danh sách có sẵn, không tự gõ hashtag mới.

### Navigation (1xx)

- **FR-101** Sunner mở form viết Kudo từ ô "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" trên Live board.
- **FR-102** Chủ bài mở form sửa từ nút sửa trên thẻ Kudo của chính mình; người khác không thấy nút.

### Form Viết / Sửa Kudo (2xx)

- **FR-201** Người nhận được chọn bằng cách gõ tìm tên Sunner trong dropdown; mỗi Kudo có đúng một người nhận.
- **FR-202** Lời nhắn là bắt buộc, tối đa 1.000 ký tự.
- **FR-203** Gõ "@" kèm tên để nhắc đồng nghiệp trong lời nhắn.
- **FR-204** Phải chọn ít nhất một hashtag từ dropdown.
- **FR-205** Người gửi có thể đặt danh hiệu cho Kudo (không bắt buộc).
- **FR-206** Người gửi có thể đính tối đa 5 ảnh và gỡ từng ảnh trước khi gửi.
- **FR-207** Người gửi chèn link vào lời nhắn qua hộp "Add link".
- **FR-208** Người gửi có thể chọn gửi ẩn danh.
- **FR-209** Thiếu Người nhận, Lời nhắn hoặc Hashtag thì không gửi được và hiện thông báo lỗi.
- **FR-210** Gửi thành công thì form đóng, người gửi thấy xác nhận và Kudo mới xuất hiện trên feed.

### Interaction (4xx)

- **FR-401** Form sửa mở ra với nội dung hiện tại đã điền sẵn.
- **FR-402** Lưu bản sửa cập nhật đúng Kudo đó, không tạo bài mới; thời gian tạo và tim vẫn giữ.
- **FR-403** Khi đang gửi hoặc đang lưu, nút gửi bị khoá để tránh gửi hai lần.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới viết hoặc sửa được Kudo.
- **FR-602** Chỉ chủ bài mới sửa được Kudo; người khác bị từ chối.
- **FR-603** Mọi quy tắc nhập liệu đều được máy chủ kiểm lại, không chỉ dựa vào form.

## 5. Business Rules

- Lời nhắn dài tối đa 1.000 ký tự, kiểm cả khi gửi lẫn khi sửa (BR-001)
- Mỗi Kudo bắt buộc có Người nhận, Lời nhắn và ít nhất một Hashtag; danh hiệu, ảnh, link là tuỳ chọn (BR-002)
- Mỗi Kudo đính tối đa 5 ảnh và chỉ được dùng ảnh do chính người gửi tải lên (BR-003)
- Chỉ người gửi của Kudo mới được sửa Kudo đó (BR-004)
- Kudo vừa gửi luôn ở trạng thái Public; việc chuyển sang Spam thuộc về Admin (BR-005)
- Thiếu một trong ba trường bắt buộc thì Kudo không được gửi và người dùng thấy câu lỗi nêu đủ ba trường (DEC-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Modal Viết / Sửa Kudo | TBD (draft) | Form có người nhận, danh hiệu, lời nhắn, hashtag, ảnh, link, ô ẩn danh, nút Hủy và Gửi (hoặc Lưu khi sửa) | Điền và gửi Kudo; sửa Kudo của mình; thêm/gỡ ảnh; chèn link; đóng form |
| Ô "gửi lời cảm ơn" trên Live board | TBD (draft) | Ô mời gọi "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" nằm trong Live board do F004 dựng | Bấm để mở modal viết Kudo |

### User Journey

1. Sunner thấy ô "gửi lời cảm ơn" trên Live board và bấm vào.
2. Modal hiện ra; Sunner gõ tên để chọn người nhận, chọn hashtag, viết lời nhắn (có thể "@" nhắc đồng nghiệp), tuỳ chọn thêm danh hiệu, ảnh, link, ẩn danh.
3. Sunner bấm Gửi; nếu thiếu trường bắt buộc thì thấy câu lỗi và vẫn ở trong form.
4. Gửi thành công: modal đóng, Sunner thấy xác nhận, Kudo xuất hiện trên feed.
5. Sau đó, trên thẻ Kudo của mình Sunner bấm nút sửa, chỉnh nội dung và lưu.

## 7. User Stories

### US001_SendKudo — Gửi Kudo cho đồng nghiệp

**Actor:** Sunner
**Goal:** Gửi một Kudo gồm người nhận, lời nhắn và hashtag.
**Business value:** Tạo dữ liệu ghi nhận công khai làm nền cho cả hệ thống Kudos.

**Acceptance Criteria:**
- [ ] Tìm và chọn được đúng một người nhận bằng cách gõ tên.
- [ ] Gõ "@" kèm tên thì nhắc được đồng nghiệp trong lời nhắn.
- [ ] Gửi đủ ba trường bắt buộc thì Kudo mới xuất hiện trên feed.

### US002_AttachMediaAndLinks — Đính ảnh và link vào Kudo

**Actor:** Sunner
**Goal:** Làm lời cảm ơn sinh động hơn bằng ảnh và link.
**Business value:** Tăng giá trị minh chứng của Kudo khi Hội đồng xét giải tham khảo.

**Acceptance Criteria:**
- [ ] Đính được tối đa 5 ảnh; ảnh thứ 6 bị chặn kèm thông báo.
- [ ] Chèn được link qua hộp "Add link" và link hiện trong lời nhắn.

### US003_SendAnonymousKudo — Gửi Kudo ẩn danh

**Actor:** Sunner
**Goal:** Gửi lời cảm ơn mà không hiện tên mình.
**Business value:** Khuyến khích những Sunner ngại lộ danh vẫn ghi nhận đồng nghiệp.

**Acceptance Criteria:**
- [ ] Có lựa chọn gửi ẩn danh trên form.
- [ ] Kudo gửi ẩn danh được lưu cùng đánh dấu ẩn danh (cách hiển thị thuộc F004).

### US004_EditOwnKudo — Sửa Kudo của mình

**Actor:** Chủ bài
**Goal:** Chỉnh nội dung Kudo đã đăng.
**Business value:** Sửa lỗi chính tả hoặc bổ sung ý mà không phải đăng lại bài mới.

**Acceptance Criteria:**
- [ ] Nút sửa chỉ hiện trên Kudo của chính mình.
- [ ] Form sửa mở ra với nội dung hiện tại đã điền sẵn.
- [ ] Lưu xong, Kudo đó được cập nhật tại chỗ, tim vẫn giữ.

## 8. Scenarios

### US001_SendKudo — Happy Path

**Given** Sunner mở form và đã chọn người nhận, hashtag, viết lời nhắn, **When** bấm Gửi, **Then** form đóng, hiện xác nhận và Kudo mới xuất hiện trên feed.

### US001_SendKudo — Error: thiếu trường bắt buộc

**Given** Sunner chưa chọn hashtag, **When** bấm Gửi, **Then** hiện câu "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" và Kudo không được tạo.

### US002_AttachMediaAndLinks — Happy Path

**Given** Sunner đã đính 2 ảnh, **When** thêm một ảnh và chèn một link rồi gửi, **Then** Kudo lưu đủ 3 ảnh và link.

### US002_AttachMediaAndLinks — Error: quá số ảnh

**Given** Sunner đã đính 5 ảnh, **When** cố thêm ảnh thứ 6, **Then** ảnh bị từ chối kèm thông báo đã đạt giới hạn.

### US003_SendAnonymousKudo — Happy Path

**Given** Sunner bật ẩn danh và điền đủ trường, **When** bấm Gửi, **Then** Kudo được lưu với đánh dấu ẩn danh.

### US003_SendAnonymousKudo — Error: thiếu trường bắt buộc

**Given** Sunner bật ẩn danh nhưng bỏ trống lời nhắn, **When** bấm Gửi, **Then** hiện câu lỗi thiếu trường và Kudo không được tạo.

### US004_EditOwnKudo — Happy Path

**Given** Sunner là chủ bài, **When** mở form sửa, đổi lời nhắn và bấm Lưu, **Then** Kudo cập nhật tại chỗ và form đóng.

### US004_EditOwnKudo — Error: không phải chủ bài

**Given** một Sunner khác, **When** cố sửa Kudo không phải của mình (ví dụ qua đường dẫn trực tiếp), **Then** yêu cầu bị từ chối và nội dung không bị lộ.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Lời nhắn vượt 1.000 ký tự | Form không cho gõ thêm; máy chủ cũng từ chối nếu bị vượt | "Lời nhắn tối đa 1.000 ký tự." |
| Bấm Gửi hai lần liên tiếp | Nút bị khoá trong lúc đang gửi | None — xử lý im lặng |
| Người nhận không còn tồn tại hoặc bị vô hiệu | Từ chối gửi, giữ nguyên nội dung đã nhập | "Người nhận không hợp lệ, vui lòng chọn lại." |
| Ảnh sai định dạng hoặc quá dung lượng | Ảnh đó bị từ chối, các ảnh khác giữ nguyên | "Ảnh không hợp lệ. Vui lòng chọn ảnh đúng định dạng và dung lượng cho phép." |
| Phiên đăng nhập hết hạn khi đang soạn | Không gửi được, đưa người dùng về trang đăng nhập | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." |
| Sunner khác cố sửa Kudo không phải của mình | Bị từ chối, không lộ nội dung | "Bạn không có quyền sửa Kudo này." |

## 10. Edge Behaviours to Verify

- **FR-001** → Kudo mới tạo có đủ thông tin và ở trạng thái Public.
- **FR-002** → Không có cách nào nhập hashtag ngoài danh sách.
- **FR-101** → Bấm ô trên Live board thì modal viết Kudo mở ra.
- **FR-102** → Nút sửa chỉ hiện trên Kudo của chính mình.
- **FR-201** → Gõ tên tìm được Sunner và chọn được đúng một người nhận.
- **FR-202** → Lời nhắn trống bị chặn; 1.001 ký tự bị chặn.
- **FR-203** → Gõ "@" và tên thì chèn được tên đồng nghiệp vào lời nhắn.
- **FR-204** → Không chọn hashtag thì không gửi được.
- **FR-205** → Bỏ trống danh hiệu vẫn gửi được.
- **FR-206** → Ảnh thứ 6 bị chặn; gỡ được từng ảnh.
- **FR-207** → Link chèn qua "Add link" hiện đúng trong lời nhắn.
- **FR-208** → Bật ẩn danh thì Kudo lưu cờ ẩn danh.
- **FR-209** → Thiếu trường bắt buộc thì hiện đúng câu lỗi và không có Kudo mới.
- **FR-210** → Gửi thành công thì form đóng, có xác nhận, Kudo lên feed.
- **FR-401** → Form sửa có sẵn nội dung hiện tại.
- **FR-402** → Lưu bản sửa không tạo thêm bài và không mất tim.
- **FR-403** → Bấm Gửi nhanh hai lần chỉ tạo một Kudo trong điều kiện thử thông thường.
- **FR-601** → Chưa đăng nhập thì không viết và không sửa được.
- **FR-602** → Người không phải chủ bài bị từ chối khi sửa.
- **FR-603** → Gửi dữ liệu vi phạm quy tắc bằng cách bỏ qua form vẫn bị từ chối.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Ảnh đã tải lên nhưng người dùng huỷ form sẽ để lại tệp thừa trong kho lưu trữ | Tốn dung lượng lưu trữ theo thời gian | [EXPECTED] |
| RISK-02 | risk | Chưa có giới hạn số Kudo mỗi ngày hay chặn tự gửi; có thể bị lạm dụng để tích tim | Số liệu Kudos và Secret Box bị méo | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Cung cấp phiên đăng nhập, hồ sơ Sunner để tìm người nhận và xác định người gửi | FR-601, FR-201 |
| F004_KudosFeed | feature | Dựng Live board chứa ô lối vào, thẻ Kudo có nút sửa và hiển thị Kudo sau khi gửi | FR-101, FR-102, FR-210 |
| F007_AdminModeration | feature | Sở hữu trạng thái Spam; F003 chỉ ghi giá trị khởi tạo Public | BR-005 |
| Kho lưu trữ ảnh | external-service | Lưu ảnh đính kèm | FR-206, BR-003 |
| Danh sách hashtag | data | Nguồn các hashtag để chọn; cách nạp dữ liệu chưa chốt | FR-002, D004 |

## 13. Configuration

```text
KUDO_BODY_MAX_LENGTH = 1000   # số ký tự tối đa của lời nhắn
KUDO_IMAGES_MAX = 5           # số ảnh tối đa đính kèm một Kudo
KUDO_TITLE_MAX_LENGTH = TBD   # TBD (draft) — độ dài tối đa của danh hiệu
KUDO_HASHTAGS_MAX = TBD       # TBD (draft) — số hashtag tối đa mỗi Kudo
```
