# Phase 04 Kudos authoring: a wrong UI string, a cancel that still sent, and an upload path with no cap

**Date**: 2026-11-16 08:30
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F003 Kudos authoring (`features/kudos-authoring/`, `features/sunner-search/`, `db/migrations/0006`–`0008`, `app/api/kudos/`)
**Status**: ongoing

## What Happened

Phase 04 closed as SEALED at 9/10 after two review fix rounds. Three commits sit on `main` and are not pushed: `ba4ad6a` (schema, constraints, server actions), `9b45147` (composer modal), `98af8e5` (delivery docs). The user signed off the residual risk on 2026-11-16.

The work went through three reviewers (DB, actions, UI), a re-check, and a full tester run. The reviews found real defects that the happy-path tests had not reached: a lock-ordering deadlock on upload claims, an unbounded upload path, a reference-style link bypass, and a Cancel button that stayed live during a save.

## The Brutal Truth

The sting is the one we walked into with open eyes. The phase text was written before the Figma review and the user decisions, so it carried stale rules: hashtags "1–3" (decided later as 1–5), plain text instead of the Markdown subset, no nickname. The orchestrator then retyped the DEC-001 error from memory and got it wrong.

The worse one: the cancel bug would have sent content the user had just discarded. Discard closed the dialog, the queued action still created the Kudo, and the success toast fired.

## Technical Details

- DEC-001 copy, verbatim from Figma: `Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!` The first draft read `Lời nhắn`.
- Deadlock: `kudo-image-upload-service.ts` took `FOR UPDATE` with no `ORDER BY`. Fixed with `.orderBy(storagePath).for("update")`.
- Quota: 20 pending uploads per user per rolling 24 h, enforced with `pg_advisory_xact_lock(hashtext(ns), hashtext(uploaderId))`. A 21-request burst returns 200 × 20 and 429 `UPLOAD_LIMIT`.
- Link bypass: `[1]: javascript:alert(1)` got past the policy, which only checked `](` destinations. Fixed by rejecting reference definitions.
- Sign body capped at 4 KB (413 `PAYLOAD_TOO_LARGE`) with an exact media-type match.
- Results: unit 285/285, integration 168/168, e2e 40/40 (run twice), build, `test:prod` 13/13.
- Evidence: 24 screenshots in `evidence/screenshots/phase-04/`.
- Environment: a `next dev` from an earlier session was left on port 3000. `TaskStop` did not kill it, because child processes survive. Ports 3000 and 3100 were free when the final run started. Backend and UI suites must not run at once: they share the local DB, and `db:reset` collides.

## What We Tried

- Two fix rounds closed the items from the three reviews. The re-check confirmed each one against file and line.
- The tester was stopped mid-run once it was clear a second fix round was needed, which saved one full run. This was a judgement call, and it worked.
- The `acceptanceCovered` list in the final verdict claimed "launcher disabled after EVENT_END_AT" was e2e-covered. No test renders the disabled launcher. The delivery tracker caught it, and the claim was corrected to code-reading only.

## Root Cause Analysis

- **Stale spec, not stale code.** The plan was not revisited after the Figma and user decisions. The 1–3 hashtag rule still lives in the 2026-11-08 decision entry, so grepping "1–3" finds dead text.
- **Retyped UI copy.** The orchestrator wrote the string from memory.
- **Accepted risk with no design.** The upload table and bucket were designed with no per-user cap, and orphans were filed as "accepted". Nobody asked what a loop on the sign route costs.
- **Tests checked the syntax we wrote, not every form.** The link policy enumerated inline forms and missed reference definitions.

## Lessons Learned

- Copy UI strings from the Figma extraction. Never retype them.
- Re-read the phase text against the decision log before the first commit.
- Any endpoint that mints rows or storage objects needs a cap in the design, not in review.
- For each `acceptanceCovered` entry, open the test that backs it. A gate's text match proves nothing.

## Next Steps

- Remove `/?editKudo` and `kudo-edit-deep-link.tsx`, and move the launcher to the Live board. Owner: phase 05, before it starts.
- Orphan upload and Storage cleanup job. Still deferred; the 20/24 h quota is consumed by abandoned rows until claimed. Owner: unassigned.
- `/community-standards` returns 404 until it ships. Owner: phase 07.
- Refresh the F003 feature specs with `/tkm:rebuild-spec --features F003`. Owner: user.
- Check `.gitattributes`, since commits raise CRLF warnings. Owner: whoever picks up the next commit.
- Four low findings from the re-check stay deferred, including the `kudos_body_not_blank` `[:space:]` locale question.
