# Phase 11 (F008) docs + plan sync — doc-writer

Sources read: the 5 phase-11 reports, decision log § Phase 11, and the code (`features/spotlight-board/**` file list, `spotlight-config.ts`, `spotlight-ui-config.ts`). No code touched.

## Edited
| File | Change |
|---|---|
| `plans/261108-0048-saa-2025-kudos-platform/phase-11-spotlight-board-realtime.md` | `status: completed`; todos vs evidence (1 left unchecked: Next 16 docs reading not recorded; "disable public channels" checked as checklist-written, switch not flipped); 7 success criteria with evidence + gates + reviewer + sign-off line; Delivery Notes; Open items. 183 lines |
| `plans/.../plan.md` | row 11 → completed (77 lines) |
| `docs/development-roadmap.md` | row 11 done (2026-11-23), 11/14 |
| `docs/project-changelog.md` | Phase 11 entry (Added/Changed/Decisions/Chưa làm) |
| `docs/system/architecture.md` (491 lines) | Realtime Design: `spotlight` row verified values, `[UNVERIFIED]` replaced by verified-on-local + hosted still unverified, policy topic rule, new "Spotlight phía client" (resync, `restoredIds`, limits); F008 module + DB-object rows; new F008 contract row; C-10/C-18/C-20 notes; Tech Stack Realtime row; Limits line. Deployment View checklist checked (accurate: public access off, `realtime` not exposed, staging check) and NOT duplicated; only linked |
| `docs/code-standards.md` | new "Realtime (Broadcast riêng tư)" section (private Broadcast via trigger, payload whitelist, policy with row topic, client replace-on-resync); `spotlight-board` added to feature list |
| `docs/features/F008_SpotlightBoard/technical-spec.md` | 3 in-place fixes only: A1 `recent` order (oldest first), `SPOTLIGHT_TOPIC` config row, §5.3 Q2 verified |

No `doc_lock: user` found in F008 / SCR016 / system files. `docs/decisions/*` untouched. SCR016 spec not edited (escalation: >3 changed source files).

## Needs `rebuild-spec --features F008` (not surgically patched)
- technical-spec: all "(planned)" component names and `TBD (draft)` files/Source rows (§3 A1–A5, §4.1, §4.2, §5.4); A1 BE text still says 3 queries (now 2 statements); BR-002 formula and text (distinct-count rank); ALG-001 (mulberry32 seeded by FNV-1a of id, first-fit not spiral; phone cap 24 + drop); INT-001 payload note (`id` key); SM-001 (extracted to `spotlight-channel-state.ts`, offline/online edges); A3 (resync rules, `restoredIds`); skeleton; §5.4 "Chưa có mã nguồn".
- functional-spec: still greenfield draft; § 5/§ 8/§ 9 rows for skeleton, phone cap, retry.
- SCR016 spec: phone layout (cap 24, board 460 px), skeleton row text, network layer.
- `docs/generated/screen-list.md` route/status rows for SCR016 (route text says TBD).

## Notes
- Decision-log § Phase 11 already holds the tier, phone cap, policy, resync and `restoredIds` entries; `decisions/*` not edited.
- Roadmap/changelog date 2026-11-23 follows the reports (env date is 2026-11-22).
- Tester's run (unit 755) predates the review fixes; the final-code gates (unit 785) are the implementer's. Recorded as such in the phase file, like phase 10.
- Unresolved: Next 16 docs reading (todo left unchecked); staging check of private channels never run; hosted Realtime version unknown.
