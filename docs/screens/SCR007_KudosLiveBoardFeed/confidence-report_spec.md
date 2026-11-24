---
source_artifact: docs\screens\SCR007_KudosLiveBoardFeed\spec.md
claims_total: 2
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR007_KudosLiveBoardFeed\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| `requireSunner()` trong `LiveBoardContent` và layout `(app)` \| auth \| Khách bị chuyển tới `/login`,… | Security Surface | — | △ |
| Kênh Realtime `spotlight` riêng tư \| auth \| — chính sách kênh nằm ngoài tầm đọc của spec này; xem s… | Security Surface | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Security Surface: `requireSunner()` trong `LiveBoardContent` và layout `(app)` \| auth \| Khách bị chuyển tới `/login`,…
- Security Surface: Kênh Realtime `spotlight` riêng tư \| auth \| — chính sách kênh nằm ngoài tầm đọc của spec này; xem s…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
