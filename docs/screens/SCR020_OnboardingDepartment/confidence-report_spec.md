---
source_artifact: docs\screens\SCR020_OnboardingDepartment\spec.md
claims_total: 5
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR020_OnboardingDepartment\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| E04 \| Bắt buộc chọn một đơn vị \| Lời nhắc có sẵn của trình duyệt (nội dung phụ thuộc trình duyệt và… | 6. Validation & Feedback | — | △ |
| `requireSunner()` đưa người chưa có đơn vị về `/onboarding/department` không kèm `next` (`shared/au… | Unresolved Questions | — | △ |
| Người có phiên nhưng không có hồ sơ nhận 401 qua `unauthorized()` (`app/onboarding/department/page.… | Unresolved Questions | — | △ |
| Khi bảng đơn vị rỗng, nhóm radio trống và không có câu giải thích; gửi form khi đó trả "Vui lòng ch… | Unresolved Questions | — | △ |
| Action chuyển về `/login` trần khi phiên hết hạn (`features/auth/server/choose-department-action.ts… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 6. Validation & Feedback: E04 \| Bắt buộc chọn một đơn vị \| Lời nhắc có sẵn của trình duyệt (nội dung phụ thuộc trình duyệt và…
- Unresolved Questions: `requireSunner()` đưa người chưa có đơn vị về `/onboarding/department` không kèm `next` (`shared/au…
- Unresolved Questions: Người có phiên nhưng không có hồ sơ nhận 401 qua `unauthorized()` (`app/onboarding/department/page.…
- Unresolved Questions: Khi bảng đơn vị rỗng, nhóm radio trống và không có câu giải thích; gửi form khi đó trả "Vui lòng ch…
- Unresolved Questions: Action chuyển về `/login` trần khi phiên hết hạn (`features/auth/server/choose-department-action.ts…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
