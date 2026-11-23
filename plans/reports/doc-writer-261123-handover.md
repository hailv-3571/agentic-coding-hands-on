# doc-writer 2026-11-23: handover open decisions + permissions check

## Task 1
- Created `plans/261108-0048-saa-2025-kudos-platform/handover-open-decisions.md` (128 lines, one file, Vietnamese).
- A: 26 default decisions grouped by phase 07, 09-14 (A07-1..A14-6), each with choice, alternative, code area, link to decision-log line.
- B: 14 copy items (B1..B14) with exact message keys / file paths.
- C: 6 deliberately-left items (demoted-in-flight oracle, heart aggregation 10x, plus 4 Lows from reviewer-261123-phase-14).
- D (extra): 4 pre-go-live technical tasks (Realtime staging check, live cron POST, outbox/cron housekeeping, OAuth redirectTo host).
- Excluded as user-settled: env-admin 409 policy (2026-11-15), hashtag 5, /rules panel, DSEG7, soft 404, floating widget deferral (kept only as B11 since BTC build-or-drop is still open), write window, footer Thể lệ link.

## Task 2: docs/system/permissions.md
No `doc_lock`. Phase 14 role management was thin and partly wrong. Edited (F014 block + 2 stale lines):
- Wrong: "self-demote (403)" and "last admin (409)". Code returns in-band `{ok:false,error}` codes from the server action (decision-log L194), not HTTP.
- Added: requireAdmin first on page+action, actor from session only; export routes `requireAdminApi` 401/403 `{code}`; SELF_DEMOTE/ENV_ADMIN/LAST_ADMIN; lock order + loser gets LAST_ADMIN; actor re-check FORBIDDEN; no-op when role already set; `role_updated_by/at` audit; ADMIN_EMAILS login exception.
- Stale removed: "first admin = TBD" (settled: ADMIN_EMAILS, decision-log L17), in role list and open-decisions list.
- Verified against: user-role-service.ts, set-user-role-action.ts, admin-guard.ts, admin-api-guard.ts, users export route, env-admin-email.ts, complete-login.ts, profiles schema.

## Findings worth knowing
- Phase 14 file says "English CSV headers" for exports; actual: users and overview English, **kudos export header is Vietnamese** (admin-kudo-export.ts:13).
- Pre-launch heart reason still open: kudo-heart-service.ts:62 throws EVENT_ENDED when write window closed.
- permissions.md still has other stale open-decisions (Guest/Countdown public, Admin bypasses prelaunch gate, Admin sees anonymous sender): decision-log L16/L21 settled them. Not edited (outside phase 14 scope); recommend a follow-up pass.
- `docs/system/permissions.md` F015 line does not mention export 403 explicitly; covered by the F014 bullet for `/api/admin/overview/export`.

Unresolved: none blocking.

## Follow-up pass: permissions.md stale decisions (verified in code)
Code checked: `features/awards-portal/server/prelaunch-gate.ts` (allowlist, admin bypass fail-closed, JSON 403 `prelaunch`), `shared/auth/public-paths.ts`, `shared/auth/session-proxy.ts`, `features/admin-moderation/server/admin-kudo-row-select.ts` + `admin-kudo-export.ts` (real sender + "Ẩn danh" column), `app/(public)/layout.tsx` -> PublicHeader with language switcher. Decision-log L16, L21, L132, L134.
Edits (all in `docs/system/permissions.md`):
- Guest bullet: Countdown public; `/awards` NOT public pre-launch (not in allowlist) - was "pending/open".
- F006: `/awards` blocked pre-launch; Admin bypasses gate but cannot write pre-launch (was TBD).
- F002 language: public pages have switcher, always open (was pending).
- Anonymous sender, Admin: settled yes (was INFERRED / NEEDS_DOMAIN_CONFIRMATION).
- Special Conditions: pre-launch rule rewritten with allowlist, internal paths, JSON 403.
- `SECRET_BOX_LOCK_AT` bullet replaced: no such mechanism, lock is `EVENT_END_AT` (decision-log L36; grep finds the name only in a comment).
- Open-decisions list: removed settled items; spam-owner visibility marked settled (read-only), points to handover doc.
Not changed: line about spam owner in F004/F007 already correct. 
