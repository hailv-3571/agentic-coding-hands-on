---
source_artifact: docs\features\F001_Auth\technical-spec.md
claims_total: 48
claims_with_evidence: 48
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F001_Auth\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/(public)/login/page.tsx:23-69 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/login-error-codes.ts:20-24 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/safe-next-path.ts:15-27 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/components/google-sign-in-form.tsx:22-35 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/server/sign-in-with-google-action.ts:29-51 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/supabase-server-client.ts:12-27 | ○ |
| (unlabeled claim) | 3. Actions | app/auth/callback/route.ts:14-39 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/server/complete-login.ts:37-53 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/login-error-codes.ts:16-18 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/safe-next-path.ts:15-27 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/public-paths.ts:57-63 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:20-45 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:80-88 | ○ |
| (unlabeled claim) | 3. Actions | supabase/config.toml:296-301 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:49-68 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:90-92 | ○ |
| (unlabeled claim) | 3. Actions | shared/db/schema/profiles.ts:14-32 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:72-78 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0005_auth_user_triggers.sql:94-97 | ○ |
| (unlabeled claim) | 3. Actions | app/onboarding/department/page.tsx:26-49 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/server/department-options-query.ts:10-16 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/session-profile-query.ts:25-39 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/components/department-picker-form.tsx:17-64 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/server/choose-department-action.ts:43-70 | ○ |
| (unlabeled claim) | 3. Actions | features/auth/schemas/choose-department-schema.ts:8-11 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/safe-next-path.ts:15-27 | ○ |
| (unlabeled claim) | 3. Actions | features/app-shell/components/account-menu.tsx:32-81 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/sign-out-action.ts:16-24 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/supabase-server-client.ts:12-27 | ○ |
| (unlabeled claim) | 3. Actions | proxy.ts:5-17 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/session-proxy.ts:98-121 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/route-access-policy.ts:29-40 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/access-denied-response.ts:40-60 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/run-seeds.ts:11-31 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/apply-all-seeds.ts:20-26 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/departments.ts:20-34 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/hashtags.ts:30-45 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/secret-box-prize-loader.ts:30-54 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/profiles.ts:21-22 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/profiles.ts:11-12 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0002_rls_baseline.sql:1-12 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/current-user.ts:18-53 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/admin-guard.ts:17-35 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0005_auth_user_triggers.sql:20-23 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/auth/server/complete-login.ts:22-26 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/safe-next-path.ts:9-27 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0005_auth_user_triggers.sql:18-23 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/auth/server/sign-in-with-google-action.ts:38-50 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
