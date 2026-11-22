# Doc-writer: phase 08 docs (F007 Admin moderation + owner spam view)

Date: 2026-11-22. Verdict: **updated 7 files**. All under the size limit (largest `docs/system/architecture.md`, 382 lines; fallback ceiling 800, none set in `.claude/.tkm.json`). No `doc_lock: user` in any touched file. No code changed, no tests run (docs-only).

## Files updated

| File | Change |
|---|---|
| `docs/development-roadmap.md` | Phase 08 -> Hoàn thành (2026-11-22); progress 8/14 |
| `docs/project-changelog.md` | New 2026-11-22 Phase 08 entry (Added/Changed/Decisions/Security/Tests/Deferred/Docs) |
| `docs/system/architecture.md` | New section "Kiểm duyệt của Admin (F007)": entry points + error codes, conditional UPDATE write path, `KudoMarkedSpam` producer, admin read model separate from `KudoPublicQuery` (C-13), shared where-builder, `requireAdminApi`, export bound (`EXPORT_MAX_ROWS + 1` -> 422), owner spam view. Module Boundaries F007 row, Cross-Feature Contracts rows (`KudoAdminQuery`, `OwnSpamKudoQuery`, outbox events), C-01 and C-13 rows noted as resolved on the F007 side |
| `docs/code-standards.md` | Two bullets under "Admin utility": admin route-handler guard (`requireAdminApi`, `private, no-store`) and the export bound / shared where-builder |
| `docs/screens/SCR014_AdminReviewContent/spec.md` | Route `/admin/review` + URL params; vi/en placeholders; 8-char ID; anonymous chip; heart = raw count; Public blue `#3174C6`; one-item popover as confirmation (D004 resolved); branch/feedback texts; search 100 client / 200 server; aria-sort; responsive (min 960px, scroll) |
| `docs/screens/SCR015_SpamAlertOverlay/spec.md` | Route (detail page now, Profile "Đã gửi" in phase 12, not Live board); full-card blur overlay, orange tag; D012 resolved (not closable); Tab order (`tabIndex=-1`, no `inert`); screen-reader order; mobile text size |
| `docs/features/F007_AdminModeration/technical-spec.md` | Row-level only: § 2 A1-A5 handler names; § 4.1 component rows -> real files (no `KudoSpamCard`, no `OwnSpamKudoQuery`); § 4.6 config (page size is a constant, `SEARCH_MAX_LENGTH` 100 vs server 200, removed `EXPORT_CSV_BOM`); § 5.4 source references |

Counted as 7 content files above plus nothing else touched.

## Verified in code before writing
`0013_kudos_moderation_columns.sql`, `kudo-moderation-service.ts`, `kudo-moderation-actions.ts`, `kudo-admin-query.ts`, `admin-kudo-where-builder.ts`, `admin-kudo-export.ts`, `admin-api-guard.ts`, `admin-kudo-filter-schema.ts`, `admin-kudo-row.ts`, both `app/api/admin/kudos` routes, `app/admin/review/page.tsx`, `review-content-screen.tsx`, `review-moderation-button.tsx`, `review-export-button.tsx`, `review-search-input.tsx`, `review-person-filter.tsx`, `review-pagination.tsx`, `review-table(-row).tsx`, `spam-alert-overlay.tsx`, `kudo-spam-tag.tsx`, kudos-feed component diff, `messages/vi.json` `adminModeration`, `shared/admin/export-limit.ts`, `.env.example`, `tests/prod/production-admin-403-status.ts`, decision-log Phase 08 session, tester and reviewer phase-08 reports.

## Machine-owned content left for `rebuild-spec` (not edited)
Phase 08 touched far more than 3 source files, so the guardrail says rebuild; I made only the row-level fixes above. Still stale:
- `docs/features/F007_AdminModeration/functional-spec.md`: § 2 Open Decisions (D004 confirm step, D006 "khoá sửa", D012 closable overlay, D001/D010 now resolved), § 5 Screens (SCR codes still "TBD"), FR-30x about the owner list on Profile, § 10 Configuration; `Traceability` line.
- `technical-spec.md`: § 3 prose (all "(planned)"/"TBD (draft)" markers), DEC rows' Source = TBD, A5 `GET /api/kudos/mine/spam` flow in § 3.4, § 5.2/5.3 assumptions and unresolved questions (INT-001 mechanism is now decided: outbox in the same transaction), SC-008.
- `docs/generated/*` and `docs/system/permissions.md` (C-13 `[INFERRED]` note) not checked.
- Screen specs SCR014/SCR015 stay `status: draft`; many `TBD (draft)` Source cells remain.
- F013 notification spec still expects trigger/Realtime for "tạm ẩn"; actual mechanism is the outbox event.

Recommended: `/tkm:rebuild-spec --features F007`.

## Findings worth acting on
- `plans/261108-0048-saa-2025-kudos-platform/plan.md` and `phase-08-admin-moderation.md` still say `pending`; the roadmap now says done per your instruction. Sync is the delivery-tracker's job (a sync report exists in `plans/reports`).
- Risk sign-off for phase 08 is still outstanding (decision-log line 149); the changelog lists it under Deferred.
- `OwnSpamKudoQuery#listBySender` / `GET /api/kudos/mine/spam` do not exist; F012 must decide whether to build it or use `KudoPublicQuery` with `includeOwnSpam`. Noted in architecture and F007 § 2/§ 4.1.
- `SCR007_KudoDetail` and `SCR008` specs contain no mention of spam (grep), so the overlay on the detail page is documented only in SCR015.

## Unresolved
- Whether to patch the machine-owned sections above despite the guardrail (needs your say).
- Coverage not measured (tester); changelog says so.
