---
source_artifact: docs\screens\SCR004_Error403\spec.md
claims_total: 2
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR004_Error403\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Mở trực tiếp `/access-denied` trả HTTP 200 và ai cũng mở được; chỉ proxy mới dựng HTTP 403 (`app/ac… | Unresolved Questions | — | △ |
| Nút "Về trang chủ" với người không phải admin trước `LAUNCH_AT` sẽ bị proxy đưa tiếp tới `/countdow… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Unresolved Questions: Mở trực tiếp `/access-denied` trả HTTP 200 và ai cũng mở được; chỉ proxy mới dựng HTTP 403 (`app/ac…
- Unresolved Questions: Nút "Về trang chủ" với người không phải admin trước `LAUNCH_AT` sẽ bị proxy đưa tiếp tới `/countdow…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
