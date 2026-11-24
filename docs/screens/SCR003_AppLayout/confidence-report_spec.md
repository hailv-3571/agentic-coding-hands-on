---
source_artifact: docs\screens\SCR003_AppLayout\spec.md
claims_total: 3
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR003_AppLayout\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Dashboard chỉ hiện với admin \| permission \| Chỉ là link hiển thị; `/admin/*` bị proxy và `requireAd… | Security Surface | — | △ |
| Ba hàng Exits về dòng thông báo (SCR006 / SCR007 / SCR016) dẫn nguồn từ `docs/generated/screen-flow… | Unresolved Questions | — | △ |
| Trang 401 khi "có phiên nhưng không có hồ sơ" dùng trang mặc định của Next vì không có `app/unautho… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Security Surface: Dashboard chỉ hiện với admin \| permission \| Chỉ là link hiển thị; `/admin/*` bị proxy và `requireAd…
- Unresolved Questions: Ba hàng Exits về dòng thông báo (SCR006 / SCR007 / SCR016) dẫn nguồn từ `docs/generated/screen-flow…
- Unresolved Questions: Trang 401 khi "có phiên nhưng không có hồ sơ" dùng trang mặc định của Next vì không có `app/unautho…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
