---
source_artifact: docs\features\F004_KudosFeed\technical-spec.md
claims_total: 56
claims_with_evidence: 56
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F004_KudosFeed\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | app/(app)/kudos/page.tsx:42-80 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-query.ts:68-82 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-highlight-query.ts:22-30 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/build-kudo-card-views.ts:16-24 | ○ |
| (unlabeled claim) | 3. Actions | app/api/kudos/highlight/route.ts:14-39 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/schemas/kudo-feed-params-schema.ts:24-39 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-highlight-query.ts:22-30 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-filters.ts:13-37 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/enrich-heart-summary.ts:21-30 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-card-enrichment.ts:12-15 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/highlight-section.tsx:25-69 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/use-highlight-kudos.ts:18-72 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/highlight-filter-dropdown.tsx:32-131 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-feed-status-message.tsx:22-52 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/highlight-carousel.tsx:36-113 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card.tsx:33-84 | ○ |
| (unlabeled claim) | 3. Actions | app/api/kudos/route.ts:13-37 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/schemas/kudo-feed-params-schema.ts:11-39 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-query.ts:51-82 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-select.ts:43-52 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/build-kudo-card-views.ts:16-24 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-row-mask.ts:25-59 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card.tsx:33-84 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/all-kudos-feed.tsx:33-122 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-feed-status-message.tsx:22-52 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card.tsx:33-84 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/kudos/[id]/page.tsx:24-66 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-public-query.ts:89-95 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/build-kudo-card-views.ts:16-24 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-detail-view.tsx:26-68 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/kudos/[id]/not-found.tsx:11-25 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-card-images.tsx:19-49 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-detail-view.tsx:43-43 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/server/kudo-image-read-urls.ts:11-26 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-copy-link-button.tsx:29-61 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/kudo-copy-link-toast.tsx:24-58 | ○ |
| (unlabeled claim) | 3. Actions | features/kudos-feed/components/sunner-profile-search.tsx:17-46 | ○ |
| (unlabeled claim) | 3. Actions | features/sunner-search/components/sunner-search-combobox.tsx:34-137 | ○ |
| (unlabeled claim) | 3. Actions | features/sunner-search/components/use-sunner-search.ts:23-54 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/profile/[userId]/page.tsx:30-35 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/current-user.ts:33-53 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/server/require-api-sunner.ts:6-23 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-authoring/schemas/kudo-write-result.ts:11-32 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/session-proxy.ts:98-121 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:51-62 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-query.ts:89-95 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-filters.ts:31-37 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-highlight-query.ts:25-26 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-row-mask.ts:11-59 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/enrich-hero-tier.ts:14-29 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-public-select.ts:21-52 | ○ |
| (unlabeled claim) | 4. Shared Foundation | app/api/kudos/route.ts:13-17 | ○ |
| (unlabeled claim) | 4. Shared Foundation | app/api/kudos/highlight/route.ts:14-18 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-feed-cursor.ts:11-62 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-highlight-query.ts:17-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/kudos-feed/server/kudo-image-read-urls.ts:11-26 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
