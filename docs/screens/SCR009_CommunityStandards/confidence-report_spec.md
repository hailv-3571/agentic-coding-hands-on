---
source_artifact: docs\screens\SCR009_CommunityStandards\spec.md
claims_total: 1
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR009_CommunityStandards\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| `requireSunner()` ở route và ở layout `(app)` \| auth \| Khách bị chuyển tới `/login`, người chưa có… | Security Surface | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Security Surface: `requireSunner()` ở route và ở layout `(app)` \| auth \| Khách bị chuyển tới `/login`, người chưa có…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
