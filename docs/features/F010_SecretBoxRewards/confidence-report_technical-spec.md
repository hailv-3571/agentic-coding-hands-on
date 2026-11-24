---
source_artifact: docs\features\F010_SecretBoxRewards\technical-spec.md
claims_total: 72
claims_with_evidence: 72
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F010_SecretBoxRewards\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-grant-service.ts:24-72 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-stats-query.ts:19-48 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-advisory-lock.ts:11-13 | ○ |
| (unlabeled claim) | 3. Actions | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-sweep-job.ts:17-30 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-grant-service.ts:37-99 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-stats-query.ts:19-42 | ○ |
| (unlabeled claim) | 3. Actions | app/api/secret-boxes/open/route.ts:13-25 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-api-session.ts:10-25 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-open-service.ts:20-95 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/prize-draw-service.ts:19-56 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/prize-weighted-pick.ts:17-38 | ○ |
| (unlabeled claim) | 3. Actions | app/api/secret-boxes/me/route.ts:9-18 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-query.ts:13-47 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/secret-box-launcher.tsx:38-73 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/use-secret-box-opener.ts:29-44 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/icon-collection-service.ts:19-37 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/schemas/secret-box-views.ts:9-17 | ○ |
| (unlabeled claim) | 3. Actions | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/secret-box-prize-loader.ts:15-54 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/secret-box-prize-catalog.ts:22-32 | ○ |
| (unlabeled claim) | 3. Actions | db/seeds/apply-all-seeds.ts:6-24 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/personal-stats-panel.tsx:41-71 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/open-secret-box-button.tsx:21-77 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/rewards-column-data-loader.ts:15-31 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/personal-reward-stats-query.ts:27-38 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-query.ts:22-31 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/latest-gift-winners-list.tsx:16-46 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/rewards-column-data-loader.ts:15-31 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/latest-gift-winners-query.ts:15-31 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-page-data.ts:46 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/icon-collection-query.ts:11-18 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/icon-collection.tsx:19-48 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/national-kudos-finalize-job.ts:25-63 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-hearts/server/heart-ranking-query.ts:25-61 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-filters.ts:31-37 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-advisory-lock.ts:15-18 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0016_secret_box_tick_cron.sql:15-47 | ○ |
| (unlabeled claim) | 3. Actions | app/api/internal/secret-box/tick/route.ts:16-30 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/internal-job-guard.ts:11-22 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-tick-job.ts:20-36 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-advisory-lock.ts:25-28 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/public-paths.ts:24 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/public-paths.ts:38 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/secret-box-rewards.ts:18-45 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/secret-box-rewards.ts:51-77 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/db/schema/secret-box-rewards.ts:51-77 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/components/secret-box-opener.ts:12-150 | ○ |
| · route-list.md ROUTE015, ROUTE016 | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-api-session.ts:10-25 | ○ |
| · route-list.md ROUTE015, ROUTE016 | 4. Shared Foundation | features/secret-box-rewards/server/rewards-column-data-loader.ts:24-31 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-grant-service.ts:29-51 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-grant-service.ts:54-66 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-grant-service.ts:47-66 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-grant-service.ts:23-26 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-stats-query.ts:19-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-stats-query.ts:19-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/personal-reward-stats-query.ts:16-25 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/national-kudos-finalize-job.ts:29-46 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-tick-job.ts:20-36 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-sweep-job.ts:17-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/secret-box-config.ts:23-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-grant-service.ts:24-99 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/secret-box-open-service.ts:35-95 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/national-kudos-finalize-job.ts:25-63 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/prize-draw-service.ts:19-56 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-stats-query.ts:19-50 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-types.ts:29-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-hearts/server/heart-ranking-query.ts:25-61 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-filters.ts:31-37 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0016_secret_box_tick_cron.sql:15-47 | ○ |
| (unlabeled claim) | 4. Shared Foundation | app/api/internal/secret-box/tick/route.ts:16-30 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
