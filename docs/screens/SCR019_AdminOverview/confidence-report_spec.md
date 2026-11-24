---
source_artifact: docs\screens\SCR019_AdminOverview\spec.md
claims_total: 3
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR019_AdminOverview\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Quy tắc "Total member không theo khoảng ngày; bốn cột còn lại theo khoảng" chỉ thấy ở chú thích của… | Unresolved Questions | — | △ |
| Chọn khoảng chỉ có một đầu (chỉ ngày bắt đầu hoặc chỉ ngày kết thúc) vẫn lọc ngay (`features/admin-… | Unresolved Questions | — | △ |
| Lỗi `invalid_date_range` cho khoảng ngược do tự gõ chỉ chặn được ở ô chọn; vì `DateField` đặt `min`… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Unresolved Questions: Quy tắc "Total member không theo khoảng ngày; bốn cột còn lại theo khoảng" chỉ thấy ở chú thích của…
- Unresolved Questions: Chọn khoảng chỉ có một đầu (chỉ ngày bắt đầu hoặc chỉ ngày kết thúc) vẫn lọc ngay (`features/admin-…
- Unresolved Questions: Lỗi `invalid_date_range` cho khoảng ngược do tự gõ chỉ chặn được ở ô chọn; vì `DateField` đặt `min`…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
