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
| 04 | Kudos authoring | F003 | P0 | 02, 03 | Chưa làm |
| 05 | Kudos feed & detail | F004 | P1 | 04 | Chưa làm |
| 06 | Hearts & x2 campaigns | F005, F011 | P1 | 05 | Chưa làm |
| 07 | Awards portal & prelaunch | F006 | P1 | 02, 03 | Chưa làm |
| 08 | Admin moderation | F007 | P1 | 04 | Chưa làm |
| 09 | Hero badges | F009 | P2 | 05 | Chưa làm |
| 10 | Secret Box rewards | F010 | P2 | 06 | Chưa làm |
| 11 | Spotlight board (realtime) | F008 | P2 | 05, 08 | Chưa làm |
| 12 | Profile | F012 | P2 | 09, 10 | Chưa làm |
| 13 | Notifications | F013 | P2 | 06, 08, 09, 10 | Chưa làm |
| 14 | Admin users & overview | F014, F015 | P2/P3 | 08, 09, 10 | Chưa làm |

Tiến độ: 3/14 phase hoàn thành (01, 02, 03).

Chạy song song được: 02 ∥ 03 · 07 ∥ 04 · 08 ∥ 05 (sau 04) · 09 ∥ 06. Phase 10 và 11 cùng sửa file chung của phase 01 nên chạy tuần tự.
