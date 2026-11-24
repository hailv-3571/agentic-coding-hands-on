---
source_artifact: docs\features\F005_KudosHearts\technical-spec.md
claims_total: 51
claims_with_evidence: 51
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F005_KudosHearts\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | features/kudos-hearts/components/kudo-heart-button.tsx:26-34 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-actions.ts:18-36 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-service.ts:30-69 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-query.ts:13-27 | ○ |
| (unlabeled claim) | 3. Actions | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/components/kudo-heart-button.tsx:72-90 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-actions.ts:18-31 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-actions.ts:38-41 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-service.ts:71-74 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/components/kudo-heart-button.tsx:49-124 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/components/heart-summary-store.ts:10-37 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card-heart-slot.tsx:20-22 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card.tsx:62-73 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/enrich-heart-summary.ts:21-27 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/kudo-heart-query.ts:13-27 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/active-campaign-reader.ts:8-12 | ○ |
| (unlabeled claim) | 3. Actions | features/admin-campaigns/server/campaign-active-reader.ts:15-26 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-stats-query.ts:19-48 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-grant-service.ts:70 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-grant-service.ts:83 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-ranking-query.ts:25-59 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/enrich-heart-summary.ts:29-30 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/national-kudos-finalize-job.ts:30-32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:32-74 | ○ |
| · PERM027_KudoHeartToggle (permissions-matrix.md), PERM008_SunnerAreaGate | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-actions.ts:18-21 | ○ |
| · PERM027_KudoHeartToggle (permissions-matrix.md), PERM008_SunnerAreaGate | 4. Shared Foundation | shared/auth/current-user.ts:48-53 | ○ |
| · PERM027_KudoHeartToggle (permissions-matrix.md), PERM008_SunnerAreaGate | 4. Shared Foundation | features/kudos-hearts/schemas/kudo-heart-result.ts:1-11 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/components/kudo-heart-button.tsx:61-76 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:32-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:56 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-row-mask.ts:56 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:32-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:61-69 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/kudo-hearts.ts:23 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-query.ts:13-27 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-ranking-query.ts:25-32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-ranking-query.ts:49-59 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-stats-query.ts:19-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/config/event-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:61-74 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-ranking-query.ts:25-59 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/kudo-heart-service.ts:61-69 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-types.ts:17-20 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-multiplier-resolver.ts:13-21 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/admin-campaigns/server/campaign-active-reader.ts:15-26 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
