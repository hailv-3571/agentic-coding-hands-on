# Docs impact: phase 05 (F004 Kudos feed)

Verdict: docs were stale in 3 places. Updated 3 files. 3 artifacts skipped under the escalation rule.

## Changed (all verified against code)
| File | Change |
|---|---|
| `docs/system/architecture.md` (297 -> 316 lines) | New section "Đọc Kudo (F004, phase 05)": `/kudos`, `/kudos/{id}`, `GET /api/kudos`, `GET /api/kudos/highlight` (401/403/400/500, `no-store`), cursor, masking, 30-minute image read URLs, Markdown whitelist, heart/hero seams, launcher moved to `/kudos` and `/?editKudo` removed, migration 0009. Refreshed the F004 row in the feature table and the contract rows for `KudoPublicQuery`, `KudoHeartQuery` and the `kudos` index. |
| `docs/system/permissions.md` (169 lines, unchanged count) | Fixed a contradiction with the code. The docs said the detail page returns 404 even to the owner of a spam Kudo. The code and `tests/integration/kudos-feed/kudo-detail-access.test.ts` show the owner sees it read-only (`isSpam: true`). Edited 3 lines. |
| `docs/code-standards.md` (98 -> 106 lines) | Added `kudos-feed` to the existing-features list. New section "Đọc dữ liệu công khai (phase 05)": whitelist DTO, opaque cursor, `notFound()` and soft 404, Markdown renderer rule, seam files. |

## No change needed
- `README.md`: no route list.
- `docs/generated/*`: `feature-list` already says F004 is implemented; `screen-list` has `Route: TBD`.

## Skipped (escalation heuristic, more than 3 changed source files)
Advisory: run `/tkm:rebuild-spec --features F004` or `--artifact` for the items below. No `doc_lock: user` found.
- `docs/features/F004_KudosFeed/technical-spec.md`:
  - still marks handlers as "(planned)" and `TBD (draft)`;
  - A3 lists `GET /api/kudos/{id}`, which does not exist: detail is the page `/kudos/[id]`;
  - § 4.2 says "no new table" (true), but index and file references are `TBD`.
- `docs/features/F004_KudosFeed/functional-spec.md`:
  - lines 93, 215, 239, 248 say spam gives 404 on detail for everyone. That is wrong for the owner;
  - the "not logged in -> login, then back to the Kudo" case is not verified.
- `docs/screens/SCR007_KudoDetail/spec.md` and `SCR008_KudosLiveBoardFeed/spec.md`, and `docs/generated/screen-list.md`: `Route: TBD`. The real routes are `/kudos/[id]` and `/kudos`.
- `docs/features/F003_KudosAuthoring/*`: not touched; nothing in it references `/?editKudo`.

## Not touched, per instructions
`development-roadmap.md`, `project-changelog.md`, `plans/**`, code.

## Open questions
- Whether the owner-visible spam detail should also be written into the F004 and F007 functional specs. It is a human-owned decision (D006/C-17) that the rebuild should pick up.
- Soft 404 on production is documented as "status not guaranteed 404", per the page comment and the decision-log.

**Status:** DONE_WITH_CONCERNS
**Summary:** Updated architecture.md, permissions.md and code-standards.md, and fixed one real code-vs-docs contradiction (owner views own spam Kudo). No size limit crossed.
**Concerns/Blockers:** The F004 technical and functional specs and the SCR007/SCR008 screen specs are still stale (planned, TBD route, spam 404 for owner). They were skipped under the more-than-3-files rule and need `rebuild-spec`.
