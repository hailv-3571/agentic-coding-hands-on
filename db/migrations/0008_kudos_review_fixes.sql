-- F003 Kudos authoring, phase 04 review round 1. 0006/0007 stay untouched.
-- Review W2: the sign route counts an uploader's pending uploads in a rolling window (drizzle-generated).
CREATE INDEX "kudo_image_uploads_uploader_id_created_at_idx" ON "kudo_image_uploads" USING btree ("uploader_id","created_at");--> statement-breakpoint
-- Review S2 (hand-written): a body must hold a non-whitespace character, like the form's trim.
-- Stricter than btrim("body") <> '', which only strips spaces and would pass E'\n\t'.
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_body_not_blank" CHECK ("body" ~ '[^[:space:]]');
