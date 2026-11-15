---
status: draft
authored_by: takumi
fcode: F001
created: 2026-11-08
lang: vi
---

# SCR001_Login — Screen Spec

**Screen**: SCR001_Login: Login
**Feature**: F001_Auth
**Type**: atomic
**Route**: TBD (draft)
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Khách chưa đăng nhập dùng màn này để đăng nhập vào hệ thống SAA 2025 bằng tài khoản Google công ty.
**Actors:** Khách chưa đăng nhập
**Entry Conditions:** Chưa có phiên đăng nhập hợp lệ; hoặc vừa bị từ chối/huỷ ở bước đăng nhập và quay lại.
**Exit Conditions:** Đăng nhập thành công và rời màn này, hoặc ở lại màn này kèm thông báo lỗi.

## 2. Screen Layout

### Layout Sketch

Màn toàn trang theo thương hiệu ROOT FURTHER: vùng đầu trang, vùng nội dung chính chứa lời giới thiệu ngắn và nút đăng nhập Google, vùng chân trang. Bố cục, màu và kích thước chính xác lấy từ khung Figma Login (662:14387) khi implement, bản nháp không đoán giá trị hình ảnh. `[EXPECTED]`

```
┌─────────────────────────────────────────┐
│  R1: Header (TBD (draft): logo, ngôn ngữ) │
├─────────────────────────────────────────┤
│  R2: Khối đăng nhập                     │
│   - lời giới thiệu                      │
│   - vùng báo lỗi (chỉ khi có lỗi)       │
│   - nút đăng nhập Google                │
├─────────────────────────────────────────┤
│  R3: Footer                             │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | TBD (draft) | no | TBD (draft) |
| R2 | Khối đăng nhập | static | no | TBD (draft) |
| R3 | Footer | TBD (draft) | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Lời giới thiệu (chữ chính thức TBD (draft)) | message | — | Hiện | Always | — | static | raw | — | N/A |
| E02 | Nút đăng nhập bằng Google (chữ chính thức TBD (draft)) | button | — | Bật | Always | Bắt đầu đăng nhập Google | — | — | — | N/A |
| E03 | Thông báo lỗi email ngoài công ty | message | — | Ẩn | Conditional | — | computed | raw | hidden | N/A |
| E04 | Thông báo lỗi đăng nhập chung | message | — | Ẩn | Conditional | — | computed | raw | hidden | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đăng nhập Google | E02 | click | không đang xử lý | Nút bị khoá, hiện trạng thái chờ rồi chuyển sang màn của Google | TBD (draft) |

### Happy Path

1. Khách thấy lời giới thiệu (E01) và nút đăng nhập Google (E02) ở R2.
2. Khách bấm E02; nút bị khoá và hiện trạng thái chờ.
3. Màn của Google mở ra để chọn tài khoản; sau đó người dùng rời màn này.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Sau khi quay lại từ Google | Email ngoài công ty | Hiện E03, nút E02 bật lại | TBD (draft) |
| Sau khi quay lại từ Google | Huỷ hoặc lỗi khác | Hiện E04, nút E02 bật lại | TBD (draft) |

### Interaction Notes

- **Bấm đúp vào nút đăng nhập không gửi hai yêu cầu** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang chuyển sang Google | Nút khoá kèm biểu tượng chờ | none | TBD (draft) |
| empty | — | Không có vùng dữ liệu để rỗng (màn tĩnh) | — | TBD (draft) |
| error | Email ngoài công ty hoặc đăng nhập thất bại | Hiện E03 hoặc E04 phía trên nút | Bấm lại E02 | TBD (draft) |
| saving | Đang đổi mã lấy phiên sau khi quay lại | Nút khoá | none | TBD (draft) |
| success | Đăng nhập thành công | Rời màn này, không dừng ở đây | — | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E03 | Chỉ email thuộc công ty được đăng nhập | "Chỉ tài khoản công ty được phép đăng nhập" (chữ chính thức TBD (draft)) | server response |
| E04 | Đăng nhập phải hoàn tất hoặc không bị huỷ | "Đăng nhập không thành công, vui lòng thử lại" (chữ chính thức TBD (draft)) | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Lỗi email ngoài công ty | configuration | E03 | vừa bị từ chối vì email ngoài công ty | mặc định hoặc khi bấm đăng nhập lại | Chỉ một trong E03 và E04 hiện cùng lúc |
| Lỗi đăng nhập chung | configuration | E04 | vừa huỷ hoặc gặp lỗi khác | mặc định hoặc khi bấm đăng nhập lại | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| external | Mở hệ thống hoặc trang cần phiên khi chưa đăng nhập | Không có phiên | TBD (draft) |
| external | Quay về từ màn Google kèm lỗi | Email ngoài công ty, huỷ hoặc lỗi | TBD (draft) |
| TBD (draft) | Đăng xuất | Đã đăng nhập, chọn Đăng xuất | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đăng nhập Google | E02 | — | external (màn Google) | redirect | TBD (draft) |
| Đăng nhập thành công | — | Email hợp lệ | TBD (draft) — trang định vào hoặc trang chủ | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Nút đăng nhập có nhãn rõ ràng cho trình đọc màn hình |
| Keyboard navigation | [EXPECTED] | Tab tới được nút đăng nhập và kích hoạt bằng Enter hoặc Space |
| Focus management | [EXPECTED] | Khi có lỗi, đưa focus tới thông báo lỗi hoặc giữ ở nút để thử lại |
| Screen reader compatibility | [EXPECTED] | Vùng lỗi được đọc ra khi xuất hiện |
| Error announcement | [EXPECTED] | Thông báo lỗi dùng vùng thông báo động để trình đọc màn hình đọc ngay |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop | R2 | Hiển thị theo thiết kế Figma desktop | TBD (draft) |
| mobile | R2 | Co lại vừa màn hình hẹp, nút đăng nhập vẫn dễ bấm; chi tiết theo thiết kế mobile (web responsive) | TBD (draft) |
