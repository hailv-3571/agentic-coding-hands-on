---
source_artifact: docs\screens\SCR005_Error404\spec.md
claims_total: 4
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR005_Error404\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| error \| Đọc hồ sơ người dùng ném lỗi (DB) \| code không bắt lỗi ở bước này, kết quả hiển thị chưa xá… | 5. UI States | — | △ |
| error \| Đọc hồ sơ người dùng ném lỗi (DB) \| [UNVERIFIED] code không bắt lỗi ở bước này, kết quả hiể… | 5. UI States | — | △ |
| Khách mở URL không khớp thường không thấy trang này: proxy chuyển mọi đường dẫn không công khai tới… | Unresolved Questions | — | △ |
| `getShellUser()` không bắt lỗi đọc hồ sơ (`features/app-shell/server/shell-session.ts:31`), nên lỗi… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 5. UI States: error \| Đọc hồ sơ người dùng ném lỗi (DB) \| code không bắt lỗi ở bước này, kết quả hiển thị chưa xá…
- 5. UI States: error \| Đọc hồ sơ người dùng ném lỗi (DB) \| [UNVERIFIED] code không bắt lỗi ở bước này, kết quả hiể…
- Unresolved Questions: Khách mở URL không khớp thường không thấy trang này: proxy chuyển mọi đường dẫn không công khai tới…
- Unresolved Questions: `getShellUser()` không bắt lỗi đọc hồ sơ (`features/app-shell/server/shell-session.ts:31`), nên lỗi…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
