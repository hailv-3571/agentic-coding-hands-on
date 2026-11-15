---
passed: true
issues: 0
warnings: 0
---

# Feature List Review (GREENFIELD subset)

**Target**: `spec/feature-list.md` (15 feature, F001–F015, status draft)
**Criteria**: `verification-checklist-quality-gates.md` § FeatureList
**Study input**: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md` (không đọc lại, chỉ dùng làm ngữ cảnh)

## Scope

| Check | Trạng thái | Ghi chú |
|-------|-----------|---------|
| 1 US### coverage | SKIPPED | chưa có user-stories.md |
| 2 SCR### coverage | SKIPPED | chưa có screen-list.md |
| 3 Orphan codes | SKIPPED | chưa có artifact nguồn; mọi Related US/SCR đang là `TBD (draft)` |
| 4 F-code uniqueness | PASS | |
| 5 Capability intent | NOT A GATE | thuộc `code-formats.md § Capability-Level Intent` |
| 6 Clear Flow | PASS | |
| 7 Vague naming | PASS | |
| 8 Scope overlap | PASS | |
| 9 Grouping coherence | PASS | |

## Check 4 — F-code uniqueness: PASS
F001…F015 liên tục, mỗi số một lần, đúng format `F###_NameSlug`. Bảng Hierarchy khớp 15 section Feature Details (cả code lẫn tên). Không trùng.

## Check 6 — Clear Flow (warning): PASS
Mỗi feature có trigger → xử lý → kết quả đọc ra được từ Description:
- F001 đăng nhập Google → kiểm domain, tạo hồ sơ lần đầu → session + role.
- F003 mở modal, nhập → Zod validate → bản ghi Kudo.
- F005 bấm tim → áp hệ số theo campaign → đếm tim.
- F007 Admin Mark Spam → ẩn khỏi feed + Alert Overlay cho chủ bài.
- F009/F010/F013 logic nền có đầu vào (Kudo/tim) và đầu ra (huy hiệu/hộp/thông báo) nêu rõ.
- F002, F006 thiên về tĩnh/khung nên luồng yếu nhất, nhưng vẫn có tương tác (đổi ngôn ngữ, menu, đếm ngược, trang lỗi). Không đáng gắn warning.

## Check 7 — Vague naming (warning): PASS
Không có tên chỉ là danh từ chung (`Management`, `System`, `Handler`, `CRUD`). `Auth`, `Profile`, `Notifications` là tên miền cụ thể; `AdminUserManagement` có tiền tố `Admin` + đối tượng nên chấp nhận được. Dự án có 15 feature nên không dùng ngoại lệ ≤5.

## Check 8 — Scope overlap >50% (warning): PASS
Không cặp nào trùng quá nửa từ khoá mô tả. Các cặp có điểm chạm nhưng ranh giới rõ, ghi lại để khi promote không bị lệch:
- F004 KudosFeed ↔ F012 Profile: cả hai liệt kê Kudo có lọc. F004 là feed công khai, F012 là Kudo theo từng Sunner. Nên để F012 tái dùng thẻ Kudo của F004.
- F009 HeroBadges ↔ F012 Profile: F009 sở hữu logic tính cấp, F012 chỉ hiển thị. Đã phân định trong Description F009.
- F010 ↔ F012: cả hai có thống kê cá nhân (panel Live board vs trang profile). Khác bề mặt, nên chia sẻ nguồn số liệu.
- F014 ↔ F015: cùng dạng bảng Admin + Export, nhưng đối tượng khác (người dùng vs đơn vị).
- F001 ↔ F002 về 403: F001 chặn và trả 403, F002 dựng trang 403. Bổ sung nhau, không trùng.

## Check 9 — Grouping coherence (critical): PASS
US/SCR của mọi feature đang `TBD`, nên đánh giá dựa trên Description và các dòng "Related ... (draft)". Mỗi feature xoay quanh một chủ đề: Auth/phân quyền (F001), khung dùng chung (F002), soạn Kudo (F003), xem Kudo (F004), tim (F005), cổng giải (F006), duyệt nội dung (F007), bảng realtime (F008), huy hiệu (F009), thưởng (F010), campaign (F011), profile (F012), thông báo (F013), quản lý user (F014), tổng quan Admin (F015). Không thấy capability lạc chủ đề (kiểu F001 ôm payment).

## Observations (không tính issue/warning, không phải gate)
- F010 gom nhiều thứ: Secret Box, panel thống kê, danh sách nhận quà, Kudos Quốc Dân. Đây thuộc Check 5, do `code-formats.md § Capability-Level Intent` quyết định, không fail ở đây.
- Check 1–3 phải chạy lại sau khi có user-stories.md và screen-list.md. Check 3 chỉ có nghĩa khi Related Screens/US không còn là `TBD`.
- Phụ thuộc chéo F005 → F011 (campaign) và F005 → F010 (tim → hộp) nằm đúng thứ tự P0–P3 hợp lý, nhưng F005 (P1) đọc cấu hình F011 (P2). Cần cho F005 chạy với hệ số mặc định 1 khi chưa có F011.

## Kết luận
Không có critical, không warning. `passed: true`. Không cần merge/split feature nào.

**Chưa giải quyết**: Check 1–3 bị SKIP vì thiếu artifact nguồn; cần chạy lại ở W7a.
