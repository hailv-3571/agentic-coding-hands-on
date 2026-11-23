---
lang: vi
---

# Roadmap

Nguồn: `plans/261108-0048-saa-2025-kudos-platform/plan.md` (chi tiết từng phase nằm ở các file `phase-NN-*.md` cùng thư mục). Cập nhật cột Trạng thái khi phase đổi trạng thái.

| # | Phase | Feature | Ưu tiên | Phụ thuộc | Trạng thái |
|---|-------|---------|---------|-----------|-----------|
| 01 | Foundation & infrastructure | nền cho mọi feature | P0 | — | Hoàn thành (2026-11-15) |
| 02 | Auth & onboarding | F001 | P0 | 01 | Hoàn thành (2026-11-15) |
| 03 | App shell & i18n | F002 | P0 | 01 | Hoàn thành (2026-11-15) |
| 04 | Kudos authoring | F003 | P0 | 02, 03 | Hoàn thành (2026-11-16) |
| 05 | Kudos feed & detail | F004 | P1 | 04 | Hoàn thành (2026-11-16) |
| 06 | Hearts & x2 campaigns | F005, F011 | P1 | 05 | Hoàn thành (2026-11-17) |
| 07 | Awards portal & prelaunch | F006 | P1 | 02, 03 | Hoàn thành (2026-11-22) |
| 08 | Admin moderation | F007 | P1 | 04 | Hoàn thành (2026-11-22) |
| 09 | Hero badges | F009 | P2 | 05 | Hoàn thành (2026-11-22) |
| 10 | Secret Box rewards | F010 | P2 | 06 | Hoàn thành (2026-11-22) |
| 11 | Spotlight board (realtime) | F008 | P2 | 05, 08 | Hoàn thành (2026-11-23) |
| 12 | Profile | F012 | P2 | 09, 10 | Hoàn thành (2026-11-23) |
| 13 | Notifications | F013 | P2 | 06, 08, 09, 10 | Hoàn thành (2026-11-23) |
| 14 | Admin users & overview | F014, F015 | P2/P3 | 08, 09, 10 | Hoàn thành (ký duyệt 2026-11-23) |

Tiến độ: 14/14 phase hoàn thành (01–14).

Rủi ro và việc mở của phase 14: chờ BTC xác nhận bản tiếng Anh, chặn hạ quyền admin trong `ADMIN_EMAILS` (409 `ENV_ADMIN`) và tiêu đề CSV tiếng Anh; `adminKudoExportFilename` trùng `adminCsvFilename` (Low); gộp tim mỗi trang tăng tuyến tính, xét lại ở 10 lần dữ liệu (Low); admin bị hạ giữa chừng có thể thấy mã lỗi nghiệp vụ trước `FORBIDDEN` (Low, hoãn); `test:prod` chưa phủ `/admin/users` và route export; chưa đo coverage.

Chạy song song được: 02 ∥ 03 · 07 ∥ 04 · 08 ∥ 05 (sau 04) · 09 ∥ 06. Phase 10 và 11 cùng sửa file chung của phase 01 nên chạy tuần tự.
