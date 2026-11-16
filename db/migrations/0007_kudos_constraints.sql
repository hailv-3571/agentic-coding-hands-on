-- F003 Kudos authoring: row rules that drizzle-kit does not generate (hand-written, phase 04).
-- Cross-row rules (1-5 active hashtags, at most 5 images, upload ownership) are enforced in the
-- write transaction (features/kudos-authoring/server), not here.

-- Decision-log "Luật viết Kudo": nobody sends a Kudo to themselves (the action checks too).
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_no_self_send" CHECK ("sender_id" <> "recipient_id");--> statement-breakpoint
-- BR-001: 1-1000 characters of raw Markdown (char_length counts code points, like the form).
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_body_length" CHECK (char_length("body") BETWEEN 1 AND 1000);--> statement-breakpoint
-- D006: the title is optional; "no title" is NULL, never a blank string.
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_title_not_blank" CHECK ("title" IS NULL OR btrim("title") <> '');--> statement-breakpoint
-- Decision-log 2026-11-15: a nickname exactly when anonymous, 1-30 characters after trim.
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_anonymous_nickname" CHECK (
  ("is_anonymous" AND "anonymous_nickname" IS NOT NULL AND char_length(btrim("anonymous_nickname")) BETWEEN 1 AND 30)
  OR (NOT "is_anonymous" AND "anonymous_nickname" IS NULL)
);--> statement-breakpoint

-- FR-206: at most 5 images, shown in position order 0..4.
ALTER TABLE "kudo_images" ADD CONSTRAINT "kudo_images_position_range" CHECK ("position" BETWEEN 0 AND 4);--> statement-breakpoint
-- Object paths never carry the sender id (anonymous Kudos): only kudos/{uuid}.{jpg|png|webp}.
ALTER TABLE "kudo_images" ADD CONSTRAINT "kudo_images_storage_path_format"
  CHECK ("storage_path" ~ '^kudos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$');--> statement-breakpoint
ALTER TABLE "kudo_image_uploads" ADD CONSTRAINT "kudo_image_uploads_storage_path_format"
  CHECK ("storage_path" ~ '^kudos/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$');--> statement-breakpoint

-- Defence in depth (C-20): RLS without a policy already blocks the client roles, and 0002
-- revoked default privileges; revoke explicitly for these tables too.
REVOKE ALL ON "kudos", "kudo_hashtags", "kudo_images", "kudo_image_uploads" FROM anon, authenticated;--> statement-breakpoint

-- Diacritic-insensitive Sunner search (C-06): "nguyen van duc" finds "Nguyễn Văn Đức".
-- unaccent() is only STABLE (its dictionary could change); the wrapper pins the dictionary and
-- normalizes to NFC first so decomposed input folds the same way. Empty search_path, fully
-- qualified names, not callable through the Data API.
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";--> statement-breakpoint
CREATE FUNCTION public.f_unaccent(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT SET search_path = '' AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, normalize(value, NFC))
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.f_unaccent(text) FROM PUBLIC, anon, authenticated;
