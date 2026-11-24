---
passed: true
issues: 0
warnings: 4
---

# DataModel Review (Wave 1.5)

**Artifact**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/data-model.md` (739 dòng, 16 entity MODEL001–MODEL016, 6 discriminator DISC-001–DISC-006)

## Passed Checks

- ✓ Check 1 — Entity completeness
- ✓ Check 2 — DISC-### scope
- ✓ Check 3 — MODEL### uniqueness
- ✓ Check 4 — DISC-### orphan check
- ✓ Check 5 — Relationship completeness

## Issues

Không có.

## Warnings

| # | Check | Location | Vấn đề | Gợi ý sửa |
|---|-------|----------|--------|-----------|
| W1 | Check 3 | data-model.md:732-733 | Bảng Summary theo domain có dải MODEL chồng nhau: Identity & Reference ghi `MODEL001–MODEL004` (3 entity), Kudos ghi `MODEL003–MODEL007` (4 entity). MODEL003 và MODEL004 cùng nằm trong hai dải. Định nghĩa entity (heading `###`) vẫn duy nhất, không trùng mã. | Ghi rời từng mã: `MODEL001, MODEL002, MODEL004` và `MODEL003, MODEL005–MODEL007`. |
| W2 | Check 5 | data-model.md:376 | Campaign: mục Relationships chỉ nêu liên hệ gián tiếp với MODEL008_KudoHeart, không có cardinality. | Ghi rõ "Logical, 0..n KudoHeart chụp `multiplier` từ Campaign, không có FK" hoặc chuyển thành ghi chú ngoài danh sách Relationships. |
| W3 | Check 5 | data-model.md:401 | SecretBoxPrize: bullet "Liên hệ logic" tới MODEL012_UserIcon qua `icon_code` thiếu cardinality. | Ghi cardinality logic (SecretBoxPrize 1 — 0..n UserIcon theo `icon_code`) hoặc bỏ khỏi Relationships. |
| W4 | Check 5 | data-model.md:451 | UserIcon: bullet "Liên hệ logic" tới MODEL010_SecretBoxPrize thiếu cardinality (đối xứng với W3). | Như W3. |

## Evidence (tóm tắt, không phải prose kiểm tra)

- Check 1: 16/16 entity có heading, `**Description**`, `**Relationships**`, `**Discriminator Fields**` (grep đếm 48 = 16 × 3); mọi bảng Attribute có cột Type không rỗng.
- Check 2: DISC-001 role (user, admin) · DISC-002 status (public, spam) · DISC-003 kind (icon, gift) · DISC-004 status (unopened, opened) · DISC-005 event_type (6 giá trị) · DISC-006 type (7 giá trị). Không DISC nào chỉ có true/false hoặc 1 giá trị; mỗi giá trị có mô tả hành vi riêng. Cờ boolean (`is_active`, `active`, `is_anonymous`) đã được loại khỏi discriminator.
- Check 3: MODEL001–MODEL016 mỗi mã đúng một heading (dòng 173, 192, 212, 253, 289, 306, 324, 342, 362, 383, 411, 438, 457, 474, 493, 520). MODEL004 đứng trước MODEL003 trong file (thứ tự theo domain), không phải lỗi.
- Check 4: DISC-001→MODEL004.role (:223/:248), DISC-002→MODEL003.status (:266/:285), DISC-003→MODEL010.kind (:391/:407), DISC-004→MODEL011.status (:420/:434), DISC-005→MODEL015.event_type (:500/:516), DISC-006→MODEL016.type (:528/:547). Không có mã DISC nào ngoài 6 mã này; Summary (:728) khớp 6.
- Check 5: 19 quan hệ FK trong ERD (:149-:167) khớp `Total Relationships: 19` (:727) và khớp 19 FK đếm từ các bảng Attribute; mọi bullet FK đều có source, target, cardinality.
