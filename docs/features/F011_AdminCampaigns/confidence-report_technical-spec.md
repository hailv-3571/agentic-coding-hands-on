---
source_artifact: docs\features\F011_AdminCampaigns\technical-spec.md
claims_total: 33
claims_with_evidence: 33
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F011_AdminCampaigns\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/admin/settings/page.tsx:19-47 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-admin-query.ts:16-34 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/components/campaign-table.tsx:33-94 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/components/use-campaign-form.ts:43-116 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-admin-actions.ts:30-52 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-write-transaction.ts:38-61 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-overlap-check.ts:15-36 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/components/campaign-row-menu.tsx:94-97 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/components/use-campaign-form.ts:81-100 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-admin-actions.ts:58-86 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-phase.ts:8-12 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/components/campaign-delete-dialog.tsx:36-89 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-admin-actions.ts:89-99 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-write-transaction.ts:25-33 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-active-reader.ts:15-26 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/active-campaign-reader.ts:8-12 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| · route-list ROUTE029-ROUTE031 | 4. Shared Foundation | shared/auth/session-proxy.ts:92-110 | ○ |
| · route-list ROUTE029-ROUTE031 | 4. Shared Foundation | app/admin/layout.tsx:10-12 | ○ |
| · route-list ROUTE029-ROUTE031 | 4. Shared Foundation | shared/auth/admin-guard.ts:30-35 | ○ |
| · route-list ROUTE029-ROUTE031 | 4. Shared Foundation | db/migrations/0012_campaigns_no_overlap_exclude.sql:12-12 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-phase.ts:8-12 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-active-reader.ts:15-24 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-overlap-check.ts:15-36 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-write-transaction.ts:38-51 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/schemas/campaign-input-schema.ts:35-72 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-write-transaction.ts:25-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-admin-actions.ts:70-80 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:63-65 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-time-format.ts:11-20 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/admin/timezone.ts:110-118 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-active-reader.ts:15-24 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
