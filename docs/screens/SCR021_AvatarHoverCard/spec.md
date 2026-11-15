---
status: draft
authored_by: takumi
fcode: F012
created: 2026-11-08
lang: vi
---

# SCR021_AvatarHoverCard — Screen Spec

**Screen**: SCR021_AvatarHoverCard: Thẻ thông tin nhanh khi rê chuột lên avatar
**Feature**: F012_Profile
**Type**: atomic
**Route**: N/A — lớp phủ nhỏ trên trang chứa avatar, không có địa chỉ riêng
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner rê chuột lên avatar một đồng nghiệp (trên thẻ Kudo, profile...) để xem nhanh họ là ai mà không rời trang. (Figma 721:5827, instance "Infor - HoverAvatar" 2268:35101, khoảng 344×300)
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập; avatar thuộc Sunner thật (không phải người gửi ẩn danh); thiết bị có rê chuột hoặc focus bàn phím.
**Exit Conditions:** Rời chuột/focus khỏi avatar và thẻ, nhấn Esc, hoặc bấm thẻ để mở profile.

[UNVERIFIED] Nội dung thẻ chưa chụp được từ Figma; bản này giả định avatar, tên, phòng ban, huy hiệu Hero và lối "Xem profile". Đối chiếu frame 721:5827 khi triển khai.

## 2. Screen Layout

### Layout Sketch

Avatar đang rê chuột có vòng vàng; ngay cạnh avatar là một thẻ nhỏ nổi trên nội dung trang, không chặn thao tác khác, không đẩy bố cục.

```
   (◉ avatar, vòng vàng)
   ┌─────────────────────────┐
   │ R1: Thẻ thông tin nhanh │
   │  avatar · tên           │
   │  phòng ban · huy hiệu   │
   │  Xem profile            │
   └─────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Thẻ thông tin nhanh | floating (cạnh avatar) | no | TBD (draft) — dùng lại huy hiệu Hero (F009) |
| R2 | Avatar có vòng vàng | static (thuộc trang chủ) | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Vòng vàng quanh avatar | display field | — | Ẩn | Conditional | — | static | vòng | hidden | N/A |
| E02 | Avatar trong thẻ | image | — | Ảnh Google | Always | — | API field | tròn | avatar mặc định | MODEL profiles (F001) |
| E03 | Tên | display field | — | — | Always | Bấm mở profile | API field | raw | dash | MODEL profiles (F001) |
| E04 | Phòng ban | display field | — | — | Conditional | — | API field | raw | hidden | TBD (draft) |
| E05 | Huy hiệu Hero | display field | — | — | Conditional | — | computed | pill | hidden | TBD (draft) |
| E06 | Xem profile | link | — | Enabled | Always | Mở profile người đó | — | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở thẻ | E01 | rê chuột hoặc focus bàn phím lên avatar | Avatar Sunner thật | Hiện vòng vàng, sau trễ ngắn thẻ mở | TBD (draft) |
| Đóng thẻ | R1 | rời chuột/focus khỏi avatar và thẻ, hoặc nhấn Esc | Thẻ đang mở | Thẻ đóng, vòng vàng tắt | TBD (draft) |
| Mở profile | E03, E06 | bấm | Thẻ đang mở | Mở profile người đó | TBD (draft) |

### Happy Path

1. Sunner rê chuột lên avatar; avatar có vòng vàng.
2. Thẻ hiện cạnh avatar với thông tin của Sunner đó.
3. Sunner di chuột sang thẻ và bấm tên hoặc "Xem profile".

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Avatar của người gửi ẩn danh | Không có vòng vàng, không có thẻ | TBD (draft) |
| Bước 2 | Dữ liệu thẻ lỗi | Không hiện thẻ trống; bấm avatar vẫn mở profile | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Chờ dữ liệu sau khi mở | Không hiện thẻ cho tới khi có dữ liệu (hoặc khung xương nhỏ — [NEEDS_DOMAIN_CONFIRMATION]) | rời chuột | TBD (draft) |
| empty | — | N/A — thẻ luôn có ít nhất tên | — | TBD (draft) |
| error | Gọi dữ liệu lỗi | Thẻ không mở | bấm avatar mở profile | TBD (draft) |
| saving | — | N/A — thẻ chỉ đọc | — | TBD (draft) |
| success | Có dữ liệu | Thẻ hiện đầy đủ | bấm thẻ, rời chuột | TBD (draft) |

## 6. Validation & Feedback

N/A — thẻ chỉ đọc, không có ô nhập; lỗi dữ liệu được xử lý bằng cách không mở thẻ (xem § 5).

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Sunner đã có cấp Hero | hardcoded-id | E05 | Có cấp | Chưa có cấp | — |
| Sunner có phòng ban | hardcoded-id | E04 | Có phòng ban | Chưa có | — |
| Thiết bị có rê chuột | responsive | E01, R1 | Có rê chuột/focus | Màn cảm ứng: chạm avatar đi thẳng profile | Tuỳ D007 ở functional-spec |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR008_KudosLiveBoardFeed (F004) | Rê chuột lên avatar người gửi/nhận trên thẻ Kudo | Không ẩn danh | TBD (draft) |
| SCR023_OwnProfile, SCR022_OtherProfile | Rê chuột lên avatar trên thẻ Kudo trong danh sách | Không ẩn danh | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở profile | E03, E06 | — | SCR022_OtherProfile (hoặc SCR023_OwnProfile nếu là chính mình) | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Thẻ có nhãn "Thông tin {tên}" |
| Keyboard navigation | [EXPECTED] | Focus vào avatar mở thẻ; Tab vào được liên kết trong thẻ |
| Focus management | [EXPECTED] | Esc đóng thẻ và trả tiêu điểm về avatar |
| Screen reader compatibility | [EXPECTED] | Nội dung thẻ đọc được khi mở |
| Error announcement | [EXPECTED] | Không có thông báo (lỗi chỉ không mở thẻ) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R1 | Không có thẻ vì không có rê chuột (D007) | TBD (draft) |
