# doc-writer — Phase 09 (F009 Hero badges) docs + plan sync

Date: 2026-11-22

## Files updated
- `plans/261108-0048-saa-2025-kudos-platform/phase-09-hero-badges.md`: status completed; todos checked against the implementer report (review item left unchecked); success criteria with evidence; Delivery Notes; Open items. Risk sign-off worded as "per the user's conditional pre-approval 2026-11-22, recorded at commit time".
- `plans/261108-0048-saa-2025-kudos-platform/plan.md`: phase 09 row completed (77 lines).
- `docs/project-changelog.md`: new entry "Phase 09".
- `docs/development-roadmap.md`: 09 done, 9/14.
- `docs/system/architecture.md`: new "Hero tier" section (390 lines), seam line fixed, C-04 and C-12 rows annotated.
- `docs/code-standards.md`: line 68 no longer says enrich-hero-tier waits for phase 09.
- `docs/features/F009_HeroBadges/technical-spec.md`: Action Index rows A1-A3 "(planned)" → "(implemented, phase 09)". No `doc_lock: user` found in docs.

## Verified in code
Exports in `features/hero-badges/**`, constants 1/5/10/21, `HERO_QUERY_MAX_IDS = 500`, optional executor, no Zod on ids, migration `0014` present, hero-tag webp files exist in `public/images/awards-portal/`.

## Not changed / needs rebuild-spec (`/tkm:rebuild-spec --features F009`)
- F009 `technical-spec.md`: the A1 heading/body still say "(planned)" and "Zod kiểm uuid" (code has no Zod); BR-003 anonymous counting.
- F009 `functional-spec.md` § 2 D001 still `[NEEDS_DOMAIN_CONFIRMATION]` (machine-owned, not touched).
- `docs/screens/SCR008_KudosLiveBoardFeed` E12/E13 and the Thể lệ screen spec: not edited (no machine-verifiable row change; badge size/tooltip detail would need a rebuild).
- `docs/generated/*` inventories not touched (no new routes or entities).

## Concerns
- C-11 in architecture.md is the heart-count definition (weighted vs raw), unrelated to the tier. The plan frontmatter's "C-11 (single tier count)" does not match it, so I left C-11 unchanged rather than claim it resolved.
- C-04 text says the count function should work by `(created_at, id)` position; the code counts current state (with executor for before/after in a transaction). I noted this in the C-04 row; phase 13 should confirm that is enough.
- Reviewer not yet run; tooltip "bạn" wording and en copy (D006) still pending.

**Status:** DONE_WITH_CONCERNS
**Summary:** Plan, roadmap, changelog, architecture, code-standards and F009 action index synced to the verified code; deeper F009 spec text is listed for rebuild-spec.
**Concerns/Blockers:** C-11 mismatch, C-04 position-based wording, reviewer pending.
