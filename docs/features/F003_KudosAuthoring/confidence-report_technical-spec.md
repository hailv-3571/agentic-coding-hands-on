---
source_artifact: docs\features\F003_KudosAuthoring\technical-spec.md
claims_total: 69
claims_with_evidence: 67
confidence_derived: 0.971
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F003_KudosAuthoring\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/api/sunners/search/route.ts:12-26 | ○ |
| (unlabeled claim) | 3. Actions | features/sunner-search/schemas/sunner-search-params-schema.ts:35-49 | ○ |
| (unlabeled claim) | 3. Actions | features/sunner-search/server/sunner-search-query.ts:57-67 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/recipient-picker.tsx:23-58 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-markdown-format.ts:97-121 | ○ |
| (unlabeled claim) | 3. Actions | app/api/hashtags/route.ts:11-21 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/hashtag-list-query.ts:12-28 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/use-hashtag-options.ts:15-39 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/hashtag-picker.tsx:27-145 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/kudos/page.tsx:42-61 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-launcher.tsx:23-48 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-modal.tsx:28-63 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-dialog.tsx:32-82 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-form.tsx:37-144 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/use-kudo-composer-submit.ts:25-65 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/create-kudo-action.ts:19-39 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/kudo-write-repository.ts:56-66 | ○ |
| (unlabeled claim) | 3. Actions | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 3. Actions | app/api/kudos/images/sign/route.ts:18-37 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/read-capped-json-body.ts:20-49 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/schemas/kudo-image-sign-schema.ts:9-21 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/kudo-image-upload-service.ts:19-51 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-image-picker.tsx:23-74 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/use-kudo-image-uploads.ts:56-92 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-image-upload-client.ts:49-58 | ○ |
| (unlabeled claim) | 3. Actions | app/api/kudos/[id]/edit/route.ts:16-38 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/kudo-edit-query.ts:21-76 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/use-kudo-edit-prefill.ts:18-42 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-edit-loader.tsx:21-61 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/kudo-composer-form.tsx:62-68 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/components/use-kudo-composer-submit.ts:25-65 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/update-kudo-action.ts:18-32 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/kudo-write-repository.ts:74-88 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-authoring/server/kudo-image-upload-service.ts:60-92 | ○ |
| A3 \| Người nhận bị xoá giữa lúc mở form và gửi \| `assertRecipientExists` ném `RECIPIENT_INVALID`, r… | 3. Actions | — | △ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-image-upload-service.ts:19-51 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/components/kudo-composer-dialog.tsx:32-82 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/components/use-kudo-image-uploads.ts:36-92 | ○ |
| · docs/generated/permissions-matrix.md § PERM010_ApiSunnerGate | 4. Shared Foundation | shared/auth/current-user.ts:48-53 | ○ |
| · docs/generated/permissions-matrix.md § PERM010_ApiSunnerGate | 4. Shared Foundation | features/kudos-authoring/server/require-api-sunner.ts:12-23 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/config/event-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/config/env-schema.ts:95-99 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:6-11 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-repository.ts:56-66 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-repository.ts:74-79 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:35-44 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/kudo-authoring-limits.ts:53-55 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0007_kudos_constraints.sql:7-8 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0008_kudos_review_fixes.sql:4-6 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:27-34 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0007_kudos_constraints.sql:9-10 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:45-49 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-repository.ts:23-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:50-57 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-repository.ts:32-46 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/components/use-kudo-image-uploads.ts:65-76 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-input-schema.ts:58-81 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0007_kudos_constraints.sql:11-15 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-edit-query.ts:33-49 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-repository.ts:74-84 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-body-link-policy.ts:10-108 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-image-upload-service.ts:53-92 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-image-upload-service.ts:34-51 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/components/kudo-markdown-format.ts:97-121 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-image-upload-service.ts:19-32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-outbox.ts:18-31 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-edit-query.ts:18-31 | ○ |
| 1. **Hành vi của hộp thoại khi `requireSunner()` chuyển hướng giữa lúc soạn** *(A3, A7)*: chưa tìm… | 5. Verification & Technical Notes | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 3. Actions: A3 \| Người nhận bị xoá giữa lúc mở form và gửi \| `assertRecipientExists` ném `RECIPIENT_INVALID`, r…
- 5. Verification & Technical Notes: 1. **Hành vi của hộp thoại khi `requireSunner()` chuyển hướng giữa lúc soạn** *(A3, A7)*: chưa tìm…

## Risk Flags

_(none)_
