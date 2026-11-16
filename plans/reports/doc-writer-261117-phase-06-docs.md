# Phase 06 docs impact (F005, F011)

Verdict: docs were stale; surgical updates applied. Verified against code under `features/kudos-hearts/`, `features/admin-campaigns/`, `app/admin/settings/`, migrations 0010-0012, `shared/admin/timezone.ts`, `playwright.config.ts`.

## Edited
- `docs/system/architecture.md` (316 -> 335 lines): new section "Thả tim và Campaign x2" (tables/migrations, actions, atomic insert + outbox, queries, reader, campaign rules, UI); phase 05 seam bullet updated; heart flow no longer cites `PUT /api/kudos/:kudoId/heart` (server action `addHeartAction`); feature-map rows F005/F011; cross-feature contract rows (summaryForKudos, HeartStatsQuery `receivedByUsers(userIds, asOf)`, ActiveCampaignReader, no more `null` default); C-02 and C-19 annotated.
- `docs/code-standards.md` (106 -> 115): features list, seam note, new "Ghi qua server action và Campaign (phase 06)" section, Playwright 3-worker cap.
- `docs/screens/SCR019_AdminCampaignSettings/spec.md` and `docs/generated/screen-list.md`: Route set to `/admin/settings`.

## Not edited (no change needed)
- `docs/system/permissions.md`: statements for F005/F011 still match code. `docs/generated/feature-list.md`: already `implemented`. No `doc_lock: user` found anywhere. No data-model doc exists.

## For `/tkm:rebuild-spec` (not rewritten)
- `docs/features/F005_KudosHearts/technical-spec.md` (and functional-spec A-rows): describes planned REST `KudoHeartController` `PUT/DELETE /api/kudos/:kudoId/heart`; code uses server actions `addHeartAction`/`removeHeartAction`. Also lists `receivedByUser` only.
- `docs/features/F011_AdminCampaigns/technical-spec.md`: names `CampaignAdminActions#...`; code has `createCampaign`/`updateCampaign`/`removeCampaign` and `campaignActiveReader`. Verify rows.
- `docs/screens/SCR019_AdminCampaignSettings/spec.md`, `SCR020_CampaignFormModal/spec.md`: still `status: draft`, other "TBD (draft)" text; SCR020 route unchanged (modal).
- Suggested: `/tkm:rebuild-spec --features F005,F011`.

## Unresolved
- Roadmap/changelog left to the other agent.
- Contracts file says `startLocked` is a field-error key under `VALIDATION`; architecture row reflects that.

**Status:** DONE_WITH_CONCERNS
**Summary:** architecture, code-standards, SCR019 route and screen-list updated; F005/F011 technical specs flagged for rebuild.
**Concerns/Blockers:** F005/F011 technical-spec rows (REST endpoints vs server actions) remain stale until rebuilt.
