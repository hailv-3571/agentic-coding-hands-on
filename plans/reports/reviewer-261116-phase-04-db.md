# Phase 04 DB layer review (F003 Kudos authoring)

Score: 8.5/10. Status: DONE_WITH_CONCERNS (0 critical, 4 warnings, 6 suggestions).

## Checklist
- RLS: ENABLE on all 4 tables (0006:8,15,25,39) + REVOKE ALL from anon/authenticated (0007:27); no policy/grant. Test asserts both. OK.
- CHECKs: self-send, body 1..1000 (code points), title not blank, nickname biconditional w/ btrim 1..30, position 0..4, path regex (no sender id): all correct. NULL-safe.
- FKs: sender/recipient RESTRICT (consistent with "nobody deletes a Kudo"), children CASCADE, hashtag RESTRICT, uploads CASCADE. OK, see W3.
- hashtag_id index present (0006:46); kudo_id covered by PK / unique(kudo_id,position).
- Atomicity: create-kudo-action.ts:30-34 runs insertKudoGraph + DomainEventOutbox.add in one db.transaction. OK. Edit: single tx, conditional UPDATE first (row lock). OK.
- Upload ownership: path accepted only if upload row has uploader_id = sender AND storage.objects row exists in bucket; paths are random uuid, no sender id. Another user's object cannot be attached (tested). Consumed row deleted under FOR UPDATE; loser sees deleted row -> IMAGE_INVALID. OK.
- 0007 vs drizzle: drizzle runs pending migrations in one transaction, once, tracked by journal; `when` 6<7 ordered. Plain ADD CONSTRAINT / CREATE FUNCTION is fine (new empty tables). Not re-runnable by hand, acceptable. CHECKs are not declared in schema.ts so drizzle-kit generate will not diff/drop them.

## Warnings
W1 kudo-image-upload-service.ts:56-67 FOR UPDATE with no ORDER BY: two concurrent writes (double submit) claiming overlapping paths in different order can deadlock -> Postgres error -> generic failure. Fix: `.orderBy(kudoImageUploads.storagePath)` before `.for("update")`.
W2 kudo-image-upload-service.ts:24 (sign) + schema kudo-image-uploads: no per-user quota, no TTL/cleanup. A Sunner can mint unlimited tickets/rows and upload up to 5MB each; unclaimed or edit-dropped objects (kudo-write-repository.ts:36 deletes kudo_images rows, object stays) are orphaned forever. Fix: cap outstanding uploads per uploader in sign (count < e.g. 20, inside same tx), add `kudo_image_uploads_created_at_idx` + a cleanup job deleting rows and storage objects older than 24h and objects of dropped images.
W3 FK RESTRICT on kudos.sender_id/recipient_id (0006:44-45): if profiles rows are removed with auth.users (account offboarding), deletion fails with FK error. Consistent with the decision log but confirm the offboarding story (soft-deactivate profile, never delete). Test cleanup must delete kudos first.
W4 0007:33 `CREATE EXTENSION ... WITH SCHEMA "extensions"` assumes the `extensions` schema exists (true on Supabase hosted/local, false on vanilla Postgres/CI). Hosted: unaccent is on the allow-list, and the migration role (postgres) can create it; OK. Fix: prefix `CREATE SCHEMA IF NOT EXISTS extensions;` if CI ever uses plain Postgres.

## Suggestions
S1 No indexes on FK/filter columns kudos.sender_id, kudos.recipient_id, kudos.created_at, kudo_image_uploads.uploader_id. RESTRICT FK checks and later feed/profile queries (phases 05+) will seq-scan. Add `index(...)` in schema.ts + a new migration (or in the phase that reads them).
S2 0007:8 body CHECK allows whitespace-only body (`'   '`). If the form trims/rejects, add `AND btrim("body") <> ''` for parity; else document.
S3 f_unaccent (0007:34-37): IMMUTABLE with pinned dictionary and `SET search_path=''` is the accepted pattern; fully-qualified names, STRICT, EXECUTE revoked from PUBLIC/anon/authenticated (Supabase default grants to anon/authenticated are covered). Notes: SET clause prevents planner inlining, so an expression index is possible but ilike '%x%' needs pg_trgm gin to use it (sunner-search-query.ts:60 is a seq scan; fine at Sunner scale). Output depends on unaccent rules shipped with the PG version (test pins "Đ"->"D"); a major upgrade could change fold results and invalidate any future index on it (REINDEX).
S4 kudo-image-upload-service.ts:63 reads storage.objects (Supabase-internal schema). Works because the app role is postgres/service-level; will break silently (IMAGE_INVALID for everyone) if the app role changes. Test covers it; add a comment naming the role dependency.
S5 Sign endpoint trusts client-declared contentType/size; bucket allowed_mime_types/file_size_limit (0003) are the backstop but also trust declared Content-Type (carried over from phase-01 review). Keep serving images with a fixed content type / consider magic-byte check on claim.
S6 Hashtag active-ness is checked, not locked: a hashtag deactivated between check and insert still commits (FK only checks existence). Negligible; note only.

## Done well
Single-row rules in DB plus cross-row rules in tx; constraint-name assertions in tests; RLS+REVOKE verified by test; outbox in same tx; conditional UPDATE for edit authz/race (C-17); uploads claim model removes sender id from paths; hashtag duplicates/limits rejected in zod before hitting PK.

## Unresolved
- Cleanup job owner for orphaned uploads/objects (W2).
- Whether profile deletion is ever allowed (W3).
