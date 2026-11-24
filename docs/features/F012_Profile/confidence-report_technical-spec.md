---
source_artifact: docs\features\F012_Profile\technical-spec.md
claims_total: 75
claims_with_evidence: 74
confidence_derived: 0.9867
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F012_Profile\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/(app)/profile/page.tsx:23-36 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-page-data.ts:38-58 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-header.tsx:24-50 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-stats-panel-slot.tsx:13-30 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/personal-reward-stats-query.ts:27-38 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/server/secret-box-grant-service.ts:47-72 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/profile/[userId]/page.tsx:30-44 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-page-data.ts:38-58 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-query.ts:17-36 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-header.tsx:24-50 | ○ |
| (unlabeled claim) | 3. Actions | features/secret-box-rewards/components/icon-collection.tsx:20-48 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-send-kudo-button.tsx:21-51 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/locked-recipient-composer.tsx:22-35 | ○ |
| (unlabeled claim) | 3. Actions | app/api/profile/[userId]/kudos/route.ts:19-49 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/schemas/profile-kudos-request-schema.ts:11-16 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-kudos-list-service.ts:29-39 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/lib/profile-kudos-filter.ts:12-38 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-query.ts:51-82 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-kudo-counts-query.ts:13-20 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/use-profile-kudos-list.ts:22-95 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-kudos-section.tsx:30-86 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/profile-kudos-direction-dropdown.tsx:27-108 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-feed-status-message.tsx:22-52 | ○ |
| **BR-008 — Số đếm trên thẻ: nhận = Kudo Public nhận; gửi = Kudo Public gửi không tính Spam; với ngư… | 3. Actions | features/profile/server/profile-kudo-counts-query.ts:22-34 | ○ |
| **BR-008 — Số đếm trên thẻ: nhận = Kudo Public nhận; gửi = Kudo Public gửi không tính Spam; với ngư… | 3. Actions | features/kudos-feed/server/kudo-public-query.ts:51-62 | ○ |
| (unlabeled claim) | 3. Actions | app/api/sunners/[userId]/card/route.ts:15-33 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/sunner-card-query.ts:16-33 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/server/profile-kudo-counts-query.ts:28-34 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/schemas/profile-views.ts:35-43 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/avatar-hover-card.tsx:47-172 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/use-sunner-card.ts:12-30 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/lib/sunner-card-cache.ts:24-59 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/use-hover-card-keyboard.ts:37-90 | ○ |
| (unlabeled claim) | 3. Actions | features/profile/components/sunner-card-content.tsx:41-103 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/secret-box-rewards/server/personal-reward-stats-query.ts:27-38 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/avatar-hover-card.tsx:47-141 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/use-profile-kudos-list.ts:22-95 | ○ |
| · route-list.md ROUTE014, ROUTE019 | 4. Shared Foundation | shared/auth/route-access-policy.ts:29-40 | ○ |
| · route-list.md ROUTE014, ROUTE019 | 4. Shared Foundation | shared/auth/session-proxy.ts:112-120 | ○ |
| · route-list.md ROUTE014, ROUTE019 | 4. Shared Foundation | shared/auth/current-user.ts:48-53 | ○ |
| · route-list.md ROUTE014, ROUTE019 | 4. Shared Foundation | features/kudos-authoring/server/require-api-sunner.ts:12-18 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/profile-kudos-filter.ts:16 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/profile-kudos-filter.ts:23-25 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:51-62 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/profile-kudos-filter.ts:12-25 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-kudos-list-service.ts:29-39 | ○ |
| (unlabeled claim) | 4. Shared Foundation | app/api/profile/[userId]/kudos/route.ts:42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-row-mask.ts:27-58 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:57-58 | ○ |
| (unlabeled claim) | 4. Shared Foundation | app/(app)/profile/page.tsx:32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/profile-stats-panel-slot.tsx:13-22 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-page-data.ts:23-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-page-data.ts:45 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-page-data.ts:53 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/sunner-card-query.ts:19-28 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/profile-header.tsx:32-37 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/profile-kudos-filter.ts:27-38 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-kudo-counts-query.ts:13-20 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:97-107 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/components/kudo-card-sender.tsx:27-65 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/components/kudo-card-sender.tsx:76 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/sunner-card-query.ts:9-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/kudo-write-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/config/event-window.ts:11-14 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/sunner-card-query.ts:31 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/profile-send-kudo-button.tsx:32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/profile-send-kudo-button.tsx:43-47 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/server/profile-page-data.ts:22-58 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/locked-recipient-composer.tsx:22-35 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/profile-kudos-filter.ts:19-21 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:51-82 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-row-mask.ts:40-58 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/lib/sunner-card-cache.ts:4-59 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/profile/components/use-sunner-card.ts:12-30 | ○ |
| *(A1, A2)* Next.js 16 với `cacheComponents: true`: hai trang khai `instant = false` nên đọc theo ph… | 5. Verification & Technical Notes | — | △ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 5. Verification & Technical Notes: *(A1, A2)* Next.js 16 với `cacheComponents: true`: hai trang khai `instant = false` nên đọc theo ph…

## Risk Flags

_(none)_
