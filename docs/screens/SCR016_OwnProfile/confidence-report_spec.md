---
source_artifact: docs\screens\SCR016_OwnProfile\spec.md
claims_total: 3
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR016_OwnProfile\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Khi `loadProfilePageData` trả null, trang ném `Error("[profile] the session user has no profile")`… | Unresolved Questions | — | △ |
| Tên chính mình trên thẻ trong danh sách "Đã gửi" vẫn là liên kết tới `/profile/` rồi bị redirect về… | Unresolved Questions | — | △ |
| Deep link `?secretBox=open` hoạt động trên mọi trang có `SecretBoxLauncher`, kể cả `/profile` (`fea… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Unresolved Questions: Khi `loadProfilePageData` trả null, trang ném `Error("[profile] the session user has no profile")`…
- Unresolved Questions: Tên chính mình trên thẻ trong danh sách "Đã gửi" vẫn là liên kết tới `/profile/` rồi bị redirect về…
- Unresolved Questions: Deep link `?secretBox=open` hoạt động trên mọi trang có `SecretBoxLauncher`, kể cả `/profile` (`fea…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
