---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-secret-box-open — Screen Spec

**Screen**: SCR-secret-box-open: Khám phá Secret Box của bạn
**Feature**: F010_SecretBoxRewards
**Type**: atomic
**Route**: TBD (draft) — mặc định là modal phủ lên Live board (kích thước tham chiếu 651×822 trong Figma), mở được bằng đường dẫn từ thông báo
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner có Secret Box chưa mở bấm vào hộp để mở và biết mình nhận được icon hay quà gì từ BTC SAA 2025.
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập; vào từ nút "Mở Secret Box" ở cột thưởng của Live board, từ profile của chính mình, hoặc từ đường dẫn trong thông báo "có lượt mở Secret Box mới".
**Exit Conditions:** Sunner đóng modal, hoặc hết hộp chưa mở.

## 2. Screen Layout

### Layout Sketch

Modal nằm giữa màn hình trên lớp nền mờ của trang bên dưới. Phần đầu là tiêu đề "KHÁM PHÁ SECRET BOX CỦA BẠN" và hướng dẫn "Click vào box để mở"; giữa là hộp quà (đổi thành hoạt ảnh khi mở, rồi thành kết quả); cuối là bộ đếm "Secretbox chưa mở 05". Nút đóng ở góc. Bố cục chi tiết [INFERRED] từ các frame 1466:7676, 1466:7024, 1466:7635 trong báo cáo phân tích Figma, cần đối chiếu khi triển khai.

```
┌──────────────────────────────────────┐
│ R1: Lớp nền mờ (overlay)             │
│  ┌────────────────────────────────┐  │
│  │ R2: Đầu modal  [X]             │  │
│  │  KHÁM PHÁ SECRET BOX CỦA BẠN   │  │
│  │  Click vào box để mở           │  │
│  │ R3: Sân khấu hộp quà           │  │
│  │   [ hộp ] → hoạt ảnh → kết quả │  │
│  │ R4: Bộ đếm                     │  │
│  │  Secretbox chưa mở 05          │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Lớp nền mờ | fixed-top | no | TBD (draft) |
| R2 | Đầu modal | static | no | TBD (draft) |
| R3 | Sân khấu hộp quà / kết quả | static | no | TBD (draft) |
| R4 | Bộ đếm hộp chưa mở | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | KHÁM PHÁ SECRET BOX CỦA BẠN | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Click vào box để mở | display field | — | — | Conditional | — | static | — | hidden | N/A |
| E03 | Hộp quà (Secret Box) | button | — | Enabled | Conditional | Mở hộp | — | — | — | N/A |
| E04 | Secretbox chưa mở {số} | display field | — | 0 | Always | — | API field | số, hiển thị hai chữ số như "05" | 00 | TBD (draft) |
| E05 | Hoạt ảnh mở hộp | image | — | Ẩn | Conditional | — | static | — | hidden | N/A |
| E06 | Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025 | message | — | Ẩn | Conditional | — | static | — | — | N/A |
| E07 | Phần thưởng nhận được (ảnh và tên quà hoặc icon) | display field | — | Ẩn | Conditional | — | API field | tên quà; icon ghi tên icon | dash | TBD (draft) |
| E08 | Chú thích icon đã có | message | — | Ẩn | Conditional | — | static | "Bạn đã có icon này rồi" | — | N/A |
| E09 | Thông điệp đã gom đủ 6 icon | message | — | Ẩn | Conditional | — | static | Theo mẫu thông báo "đã thu thập đủ 6 huy hiệu của SAA" [INFERRED] | — | N/A |
| E10 | Nút đóng | button | — | Enabled | Always | Đóng modal | — | — | — | N/A |
| E11 | Thông báo hết hộp | message | — | Ẩn | Conditional | — | static | "Bạn chưa có Secret Box nào để mở" | — | N/A |
| E12 | Thông báo lỗi (kèm thử lại) | message | — | Ẩn | Conditional | Thử lại | static | "Không thể mở hộp, vui lòng thử lại" | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở hộp | E03 | bấm | Ở trạng thái chờ mở và còn hộp | Hộp bị khoá, E05 chạy hoạt ảnh, rồi hiện kết quả (E06, E07) | TBD (draft) |
| Mở hộp kế tiếp | E03 | bấm | Ở trạng thái chờ sau khi xem kết quả và còn hộp | Lặp lại như trên với hộp tiếp theo | TBD (draft) |
| Thử lại | E12 | bấm | Đang ở trạng thái lỗi | Gửi lại đúng yêu cầu mở vừa rồi, không mở thêm hộp | TBD (draft) |
| Đóng | E10 | bấm | — | Đóng modal | TBD (draft) |

### Happy Path

1. Sunner mở modal và thấy tiêu đề (E01), hướng dẫn (E02), hộp quà (E03) và bộ đếm (E04) báo số hộp chưa mở.
2. Sunner bấm vào hộp (E03); hộp bị khoá và hoạt ảnh (E05) chạy.
3. Hoạt ảnh kết thúc, màn hiện lời chúc mừng (E06) và phần thưởng (E07).
4. Màn về trạng thái chờ hộp kế tiếp, bộ đếm (E04) giảm một.
5. Sunner mở tiếp hoặc bấm Đóng (E10).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Số hộp chưa mở bằng 0 | Hộp bị mờ, hiện E11, bộ đếm là 00 | TBD (draft) |
| Bước 3 | Phần thưởng là quà hiện vật | E07 hiện ảnh và tên quà | TBD (draft) |
| Bước 3 | Phần thưởng là icon chưa có | E07 hiện icon và tên icon | TBD (draft) |
| Bước 3 | Phần thưởng là icon đã có | E07 hiện icon kèm E08 | TBD (draft) |
| Bước 3 | Icon vừa nhận làm đủ bộ 6 | E07 hiện icon kèm E09 | TBD (draft) |
| Bước 4 | Hết hộp sau lần mở này | Màn chuyển sang trạng thái hết hộp (E11) | TBD (draft) |

### Interaction Notes

- **Trong lúc hoạt ảnh chạy hoặc đang chờ phản hồi, bấm hộp thêm lần nữa không có tác dụng** — source: TBD (draft)
- **Kết quả hiện ra luôn khớp với kết quả đã lưu; đóng rồi mở lại màn không đổi được kết quả hộp vừa mở** — source: TBD (draft)
- **Figma ghi chú "Prototype action khi click mở quà": hoạt ảnh và chuyển trạng thái chỉ là mẫu, thời lượng chưa chốt** — source: TBD (draft) [NEEDS_DOMAIN_CONFIRMATION]

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Vừa mở modal, đang lấy số hộp chưa mở | Khung chờ ở bộ đếm, hộp tạm khoá | Đóng | TBD (draft) |
| waiting (chưa mở) | Có hộp chưa mở | Hộp bấm được, hiện hướng dẫn "Click vào box để mở" | Mở hộp, Đóng | TBD (draft) |
| opening | Đã bấm hộp, đang chờ phản hồi | Hoạt ảnh mở hộp, hộp khoá | none | TBD (draft) |
| result | Phản hồi thành công | Lời chúc mừng, phần thưởng, bộ đếm đã giảm | Mở hộp kế tiếp (nếu còn), Đóng | TBD (draft) |
| empty (hết hộp) | Số hộp chưa mở bằng 0 | Hộp mờ, thông báo "Bạn chưa có Secret Box nào để mở" | Đóng | TBD (draft) |
| error | Gửi yêu cầu thất bại / mất kết nối | Thông báo "Không thể mở hộp, vui lòng thử lại"; hộp vẫn coi là chưa mở | Thử lại, Đóng | TBD (draft) |
| saving | Đang chờ phản hồi mở hộp | Cùng trạng thái opening | none | TBD (draft) |
| success | Mở xong | Cùng trạng thái result | Mở hộp kế tiếp, Đóng | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E03 | Chỉ mở được khi còn hộp chưa mở | "Bạn chưa có Secret Box nào để mở" | server response |
| E03 | Mỗi lần bấm chỉ gửi một yêu cầu cho tới khi có phản hồi | None — silent handling | change |
| E03 | Phiên đăng nhập còn hiệu lực | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" | server response |
| E12 | Kết nối phải thông | "Không thể mở hộp, vui lòng thử lại" | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Hướng dẫn và hộp chỉ bấm được khi còn hộp và không đang mở | hardcoded-id | E02, E03 | Còn hộp, ở trạng thái chờ | Hết hộp hoặc đang mở / đang hiện kết quả | — |
| Lời chúc mừng và phần thưởng chỉ hiện sau khi mở xong | hardcoded-id | E06, E07 | Ở trạng thái kết quả | Trạng thái khác | — |
| Chú thích icon đã có chỉ hiện khi icon nhận được trùng icon đang có | hardcoded-id | E08 | Icon trùng | Quà hiện vật hoặc icon mới | — |
| Thông điệp đủ bộ chỉ hiện khi icon vừa nhận làm đủ 6 icon khác nhau | hardcoded-id | E09 | Vừa đủ bộ | Các trường hợp khác | Nội dung [INFERRED], cần BTC chốt câu chữ |
| Thông báo hết hộp / lỗi chỉ hiện khi tương ứng | hardcoded-id | E11, E12 | Hết hộp / yêu cầu thất bại | Còn lại | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-live-board-rewards-column (F010, vùng của Live board) | Bấm "Mở Secret Box" | Còn hộp chưa mở | TBD (draft) |
| Profile của chính mình (F012, TBD (draft)) | Bấm "Mở Secret Box" ở bảng thống kê | Còn hộp chưa mở | TBD (draft) |
| Thông báo (F013, TBD (draft)) | Bấm vào thông báo "có lượt mở Secret Box mới" | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đóng | E10 | — | Trang đã mở modal (Live board, profile hoặc trang đích của thông báo) | modal đóng | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Modal có vai trò hộp thoại và nhãn là tiêu đề; hộp quà có nhãn "Mở Secret Box" |
| Keyboard navigation | [EXPECTED] | Hộp quà mở được bằng Enter hoặc Space; Esc đóng modal |
| Focus management | [EXPECTED] | Tiêu điểm vào modal khi mở, bị giữ trong modal, trở về nút gọi khi đóng |
| Screen reader compatibility | [EXPECTED] | Kết quả mở hộp và bộ đếm được đọc tự động; hoạt ảnh có phương án giảm chuyển động |
| Error announcement | [EXPECTED] | Thông báo hết hộp và lỗi được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.

[NEEDS_DOMAIN_CONFIRMATION] Figma có khung trang (1466:7069) lẫn khung modal 651×822; chưa rõ cách thu nhỏ modal trên tablet/mobile; cần đối chiếu Figma khi triển khai.
