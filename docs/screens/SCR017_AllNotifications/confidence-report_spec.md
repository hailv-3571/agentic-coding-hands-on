---
source_artifact: docs\screens\SCR017_AllNotifications\spec.md
claims_total: 5
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR017_AllNotifications\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Đánh dấu đọc thất bại (một dòng hay tất cả) chỉ hoàn lại chấm đỏ, không có thông báo lỗi nào (`feat… | Unresolved Questions | — | △ |
| Khi phiên hết hạn lúc đọc danh sách (API trả 401), màn chỉ hiện lỗi chung kèm Thử lại, không có lối… | Unresolved Questions | — | △ |
| Nếu `params.kudoId` thiếu, dòng loại Kudo rơi về `/kudos` (Live board) thay vì Kudo cụ thể (`featur… | Unresolved Questions | — | △ |
| `loading.tsx` dựng panel không có keyvisual và không có `-mt-20`, trong khi trang thật có (`app/(ap… | Unresolved Questions | — | △ |
| Thông báo "nhận Kudo" của một Kudo ẩn danh sau đó được sửa thành có tên vẫn hiện bản ẩn danh không… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Unresolved Questions: Đánh dấu đọc thất bại (một dòng hay tất cả) chỉ hoàn lại chấm đỏ, không có thông báo lỗi nào (`feat…
- Unresolved Questions: Khi phiên hết hạn lúc đọc danh sách (API trả 401), màn chỉ hiện lỗi chung kèm Thử lại, không có lối…
- Unresolved Questions: Nếu `params.kudoId` thiếu, dòng loại Kudo rơi về `/kudos` (Live board) thay vì Kudo cụ thể (`featur…
- Unresolved Questions: `loading.tsx` dựng panel không có keyvisual và không có `-mt-20`, trong khi trang thật có (`app/(ap…
- Unresolved Questions: Thông báo "nhận Kudo" của một Kudo ẩn danh sau đó được sửa thành có tên vẫn hiện bản ẩn danh không…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
