-- Kudo image bucket (D012: JPG/PNG/WEBP, max 5 MB each). Private: images are read through
-- server-signed URLs only. Object paths must not contain the sender id (anonymous Kudos);
-- the path convention is fixed in phase 04. Same SQL works on local and hosted Supabase.
-- DO UPDATE (not DO NOTHING): a bucket created by hand earlier (public, other limits) is
-- corrected to the invariant instead of silently kept.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kudo-images',
  'kudo-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
