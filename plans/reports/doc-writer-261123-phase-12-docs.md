# Doc-writer report: Phase 12 docs + plan sync

Date: 2026-11-23 · Work context: C:\Users\luong.viet.hai\my-app

## Verified against code before writing
- `KudoPublicQuery = { list, count, findForViewer, publicKudoIdsSubquery }`, `KudoListFilters`, `count` throws `RangeError` on invalid filters (`features/kudos-feed/server/kudo-public-query.ts`).
- Route handlers: `app/api/profile/[userId]/kudos/route.ts`, `app/api/sunners/[userId]/card/route.ts` (status codes, `private, no-store`, `SunnerCardView` fields).
- Constants: `HOVER_CARD_OPEN_DELAY_MS = 300`, `SUNNER_CARD_TTL_MS = 60_000`, `PROFILE_KUDOS_PAGE_SIZE = FEED_PAGE_SIZE`; `profileKudosFilter` binds `senderId` to the session.
- Test file names used as evidence exist (unit 3, integration 3 + fixtures, e2e 3 specs + helpers). Evidence dir has `inspection-verdict.json` (SEALED, 8, 0 critical), `temper-results.json`, 8 screenshots.
- Test numbers and e2e line refs are copied from the implementer/reviewer reports; I did not re-run suites (docs-only).

## Changed
| File | Change |
|---|---|
| `plans/261108-0048-saa-2025-kudos-platform/phase-12-profile.md` | status completed (frontmatter + Overview); Todo ticked (ALG-001 and profile-pages test noted as not written, with reason); Success Criteria ticked with evidence; Delivery Notes; Open items; risk sign-off line |
| `plans/.../plan.md` | row 12 completed (77 lines) |
| `docs/project-changelog.md` | new "2026-11-23 — Phase 12" entry |
| `docs/development-roadmap.md` | row 12 done, 12/14 |
| `docs/system/architecture.md` | new "Profile (F012)" section (pages, 2 endpoints, error order, filter binding, ALG-001 in SQL, `count`, hover card, keyboard, cache, `email: ""`); updated feed bullet (`count`), spam bullet, F012 module row, contracts rows (`KudoPublicQuery`, `OwnSpamKudoQuery`, `KudoComposerModal`, Spotlight link note), C-05 / C-07 / C-17 resolution notes. 513 lines |
| `docs/code-standards.md` | 2 bullets under "Đọc dữ liệu công khai": counts share the list's predicate; sender filter only from the session |

## Not done, and why
- **No api map / generated route doc exists** (`docs/generated/` holds only `feature-list.md`, `screen-list.md`), so the two endpoints live in architecture.md only.
- **`docs/features/F012_Profile/*` and `docs/screens/SCR021..SCR023` not edited.** Escalation heuristic: more than 3 changed source files for the artifact, so skip. No `doc_lock: user` found anywhere in docs. Nothing in `docs/decisions/` touched.
- Decision log not edited (orchestrator owns it; § 2026-11-23 already carries decisions 1-6 and the review round).

## Needs `rebuild-spec --features F012` (greenfield draft is stale)
- technical-spec: handler names `ProfileKudosHandler`/`SunnerCardHandler` (planned), `OwnSpamKudoQuery#listBySender` and the ALG-001 merge (now SQL, one cursor, no merge function), "§ 5.3 needs filters" (exist), A5 payload (now `{id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo}`, no avatar/`department`), status line still "TBD (draft)" in places, TTL/invalidation, 300 ms delay constant.
- functional-spec: § 3 D004 (card = avatar, name, department code, badge, "Xem profile") now Figma 2268:35101 with counts and "Gửi KUDO"; FR-403/FR-404 (card click opens profile is not what ships: card has name link + send button); keyboard reach FR; SCR column "TBD (draft)".
- screens `SCR021_AvatarHoverCard`, `SCR022_OtherProfile`, `SCR023_OwnProfile` and `docs/generated/screen-list.md` / `feature-list.md` routes column ("routes: —").
- Plan-side stale refs in `spec/profile/*` (same items).

## Open questions
- None blocking. Reviewer's human sign-off is recorded as covered by the conditional pre-approval (2026-11-22), per instruction.

**Status:** DONE
**Summary:** Phase 12 plan and `plan.md` marked completed with evidence-linked criteria, delivery notes and open items; changelog, roadmap (12/14), architecture (new Profile section, contracts, C-05/C-07/C-17) and two code-standards bullets updated from the code and reports.
**Concerns:** F012 feature/screen docs skipped by the >3-source-files rule, so they remain stale until `rebuild-spec --features F012`. Test counts are taken from implementer reports, not re-run.
