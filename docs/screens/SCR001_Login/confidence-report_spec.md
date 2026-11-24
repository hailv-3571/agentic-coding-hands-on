---
source_artifact: docs\screens\SCR001_Login\spec.md
claims_total: 3
claims_with_evidence: 0
confidence_derived: 0.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\screens\SCR001_Login\spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| Proxy: `/login` nằm trong allowlist công khai; có phiên thì chuyển về `/` \| auth \| Nếu bỏ qua: ngườ… | Security Surface | — | △ |
| Nhãn nút trong cả hai ngôn ngữ là "LOGIN With Google" (`messages/vi.json:12`), khác với mô tả "Đăng… | Unresolved Questions | — | △ |
| Chưa xác nhận bằng chạy thật thông điệp lỗi của Supabase hook `before_user_created` có luôn là `dom… | Unresolved Questions | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- Security Surface: Proxy: `/login` nằm trong allowlist công khai; có phiên thì chuyển về `/` \| auth \| Nếu bỏ qua: ngườ…
- Unresolved Questions: Nhãn nút trong cả hai ngôn ngữ là "LOGIN With Google" (`messages/vi.json:12`), khác với mô tả "Đăng…
- Unresolved Questions: Chưa xác nhận bằng chạy thật thông điệp lỗi của Supabase hook `before_user_created` có luôn là `dom…

## Risk Flags

- Low citation coverage (0%) -- most claims are marker-tagged, not cited.
