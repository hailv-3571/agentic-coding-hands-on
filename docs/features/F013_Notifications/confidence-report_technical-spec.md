---
source_artifact: docs\features\F013_Notifications\technical-spec.md
claims_total: 99
claims_with_evidence: 99
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs\features\F013_Notifications\technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim | Section | Evidence (file:line) | Status ○/△ |
|---|---|---|---|
| (unlabeled claim) | 3. Actions | db/migrations/0020_notifications_drain_cron.sql:17-49 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0020_notifications_drain_cron.sql:35-47 | ○ |
| (unlabeled claim) | 3. Actions | app/api/internal/notifications/drain/route.ts:15-26 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/outbox-drain-guard.ts:17-22 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/public-paths.ts:30-40 | ○ |
| (unlabeled claim) | 3. Actions | features/awards-portal/server/prelaunch-gate.ts:67 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-event-processor.ts:60-79 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/load-notification-event-context.ts:35-40 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/map-event-to-notifications.ts:63-79 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-writer.ts:39-43 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-event-processor.ts:81-99 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/notification-config.ts:22-29 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0019_notifications_realtime.sql:25-48 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0019_notifications_realtime.sql:51 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0019_notifications_realtime.sql:53-59 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-bell-slot.tsx:9-17 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-bell.tsx:29-97 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/hooks/use-notification-channel.ts:24-87 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/lib/notification-sync-events.ts:16-28 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/supabase-browser-client.ts:14-20 | ○ |
| (unlabeled claim) | 3. Actions | app/api/notifications/unread-count/route.ts:9-19 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-api-session.ts:9-25 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-unread-query.ts:11-17 | ○ |
| (unlabeled claim) | 3. Actions | app/(app)/notifications/page.tsx:21-29 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-list-page-client.tsx:22-69 | ○ |
| (unlabeled claim) | 3. Actions | shared/auth/current-user.ts:48-53 | ○ |
| (unlabeled claim) | 3. Actions | app/api/notifications/route.ts:13-26 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-list-params.ts:16-24 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-query.ts:34-73 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-view-mapper.ts:43-91 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-list.tsx:50-110 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/hooks/use-notification-list.ts:78-126 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-row.tsx:41-52 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-panel.tsx:48-52 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/hooks/use-notification-list.ts:138-148 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-actions.ts:15-26 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-read-state.ts:14-23 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-view-mapper.ts:43-57 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/components/notification-panel.tsx:54-61 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/hooks/use-notification-list.ts:151-158 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-actions.ts:28-37 | ○ |
| (unlabeled claim) | 3. Actions | features/notifications/server/notification-read-state.ts:26-33 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql:22-35 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0021_notifications_retry_backoff_and_event_fk.sql:15-19 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql:36-39 | ○ |
| (unlabeled claim) | 3. Actions | db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql:15-17 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-read-state.ts:6-10 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-read-state.ts:14-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:12-29 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:35-38 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:81-99 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/hooks/use-notification-list.ts:15-17 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/hooks/use-notification-list.ts:78-107 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-api-session.ts:9-25 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/current-user.ts:18 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/current-user.ts:48-53 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/session-proxy.ts:98-120 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-query.ts:34-53 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0018_notifications.sql:27 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-writer.ts:6-17 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/map-event-to-notifications.ts:69-71 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0018_notifications.sql:28-30 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/map-event-to-notifications.ts:32-41 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/map-event-to-notifications.ts:49-57 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-query.ts:28-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-query.ts:42-44 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-view-mapper.ts:63-68 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-read-state.ts:6-10 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-read-state.ts:14-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-actions.ts:15-37 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-writer.ts:6-8 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-writer.ts:22-26 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-query.ts:34-37 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-query.ts:52 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/lib/notification-message.ts:25-54 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-view-mapper.ts:63-80 | ○ |
| (unlabeled claim) | 4. Shared Foundation | messages/vi.json:715-751 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:12-19 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:60-79 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:101-107 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/hooks/use-notification-list.ts:56-62 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/hooks/use-notification-list.ts:128-158 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/map-event-to-notifications.ts:63-79 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/detect-hero-tier-up.ts:6-24 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/load-notification-event-context.ts:26-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-view-mapper.ts:35-57 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/lib/notification-relative-time.ts:8-42 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/lib/notification-list-merge.ts:10-44 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-types.ts:12-43 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/events/domain-event-outbox.ts:18-29 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/notification-event-processor.ts:36-48 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0019_notifications_realtime.sql:25-59 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/notification-config.ts:12-19 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/tier-from-count.ts:18-21 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/hero-badges/server/hero-tier-query.ts:27-39 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/server/load-notification-event-context.ts:26-33 | ○ |
| (unlabeled claim) | 4. Shared Foundation | shared/auth/supabase-browser-client.ts:14-20 | ○ |
| (unlabeled claim) | 4. Shared Foundation | features/notifications/hooks/use-notification-channel.ts:41-60 | ○ |
| (unlabeled claim) | 4. Shared Foundation | db/migrations/0020_notifications_drain_cron.sql:17-49 | ○ |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
