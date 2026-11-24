---
source_artifact: docs\features\F014_AdminUserManagement\technical-spec.md
claims_total: 42
claims_with_evidence: 41
confidence_derived: 0.9762
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F014_AdminUserManagement\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/admin/users/page.tsx:23-62 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/schemas/user-list-params-schema.ts:61-73 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-admin-query.ts:37-116 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-admin-sql-fragments.ts:23-110 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/components/admin-users-view.tsx:32-93 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-filter-options-query.ts:12-20 | ○ |
| (unlabeled claim) | 3. Actions | app/admin/users/page.tsx:23-31 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/components/admin-user-filters.tsx:24-45 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/components/admin-user-role-menu.tsx:44-159 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/components/admin-user-role-dialog.tsx:29-74 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/set-user-role-action.ts:18-31 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-role-service.ts:30-55 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/lib/admin-user-role-menu-state.ts:17-41 | ○ |
| (unlabeled claim) | 3. Actions | app/api/admin/users/export/route.ts:18-45 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-admin-query.ts:118-125 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-users/server/user-export-columns.ts:14-51 | ○ |
| (unlabeled claim) | 3. Actions | shared/admin/csv-serializer.ts:35-53 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-moderation/components/review-export-button.tsx:36-61 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-role-service.ts:30-55 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/components/admin-user-role-menu.tsx:44-86 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/admin-guard.ts:17-35 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-moderation/server/admin-api-guard.ts:15-24 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/route-access-policy.ts:25-27 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/session-proxy.ts:92-110 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0022_profiles_role_audit.sql:5-6 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:53-110 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/schemas/user-list-params-schema.ts:61-73 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0007_kudos_constraints.sql:34-38 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:20-49 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:48 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:61-62 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:81-85 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-query.ts:87 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/hero-tier-query.ts:20 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/hero-tier-query.ts:56-63 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/tier-from-count.ts:18-27 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/hero-tier-constants.ts:6-9 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:36-47 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-users/server/user-admin-sql-fragments.ts:56-67 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-ranking-query.ts:25-32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/secret-box-rewards.ts:80-111 | ○ |
| *(A1, A4)* Sắp xếp Level theo số người gửi dựa trên việc hạng Hero đơn điệu theo số này, đúng với n… | 5. Verification & Technical Notes | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 5. Verification & Technical Notes: *(A1, A4)* Sắp xếp Level theo số người gửi dựa trên việc hạng Hero đơn điệu theo số này, đúng với n…

## Risk Flags

_(none)_
