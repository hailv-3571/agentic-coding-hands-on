-- F008 Spotlight Board realtime, phase 11 (custom SQL). Safety-critical: the trigger sits on the
-- `kudos` write path (F003 insert, F007 Mark/Un Spam) and must never abort that transaction.
--
-- spotlight_publish_kudo_event() — AFTER INSERT OR UPDATE OF status, FOR EACH ROW (BR-001/004):
--   INSERT with status 'public'  → type 'added'     (a kudo inserted as spam sends nothing)
--   UPDATE public → spam         → type 'removed'
--   UPDATE spam → public         → type 'restored'  (counts only; the client adds no ticker line)
--   anything else                → nothing (body edits never list `status`, so never fire at all)
-- Payload built field by field (BR-003, FR-602): {type, kudoId, recipientId, recipientName,
-- occurredAt}; never sender_id / is_anonymous / anonymous_nickname / body. NOT
-- realtime.broadcast_changes (it ships the whole row). realtime.send itself adds `id` (its message
-- id) to the payload; the client's Zod schema drops it. occurredAt = the kudo's created_at in the
-- JS toISOString form (same as GET /api/spotlight). Sent to PRIVATE topic 'spotlight', event 'kudo'
-- (SPOTLIGHT_TOPIC / SPOTLIGHT_EVENT in features/spotlight-board/spotlight-config.ts). It is a row in
-- realtime.messages inside the kudo's transaction: a rolled-back write is never broadcast.
-- Catch-all: any error (missing profile, Realtime schema/privilege problem) → RAISE LOG and the kudo
-- write commits; the board re-syncs from GET /api/spotlight on its next load or reconnect.
-- SECURITY DEFINER (runs as the migration role: reads profiles, inserts realtime.messages whatever
-- role writes the kudo), empty search_path, fully qualified names, EXECUTE revoked from client roles.
--
-- realtime.messages RLS (C-20 sanctioned exception on a Supabase system table): Realtime authorizes
-- a private channel join by reading this table as the client's role with realtime.topic() set.
-- One SELECT policy: authenticated, topic 'spotlight' (join and row), broadcast only. No INSERT/UPDATE/DELETE
-- policy → no client can forge a spotlight event. Phase 13 adds its own `notifications:*` policy;
-- the two stay independent. Spike 2026-11-22 (local Realtime v2.154): without this policy an
-- authenticated private join is refused; a public channel named 'spotlight' never receives these.
-- DEPLOY: Realtime → Settings → turn OFF "Allow public access" (private channels only) per project.
-- Rollback: db/migrations/0017_spotlight_realtime.down.sql (drizzle-kit keeps no down files).
CREATE FUNCTION public.spotlight_publish_kudo_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  event_type text;
  recipient_name text;
BEGIN
  -- Plain comparisons (cannot raise): decide first, so a no-op row opens no subtransaction.
  IF TG_OP = 'INSERT' AND NEW.status = 'public' THEN
    event_type := 'added';
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'public' AND NEW.status = 'spam' THEN
    event_type := 'removed';
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'spam' AND NEW.status = 'public' THEN
    event_type := 'restored';
  ELSE
    RETURN NEW;
  END IF;

  BEGIN
    -- STRICT: a missing profile raises (→ logged, nothing sent) instead of sending a null name.
    SELECT p.full_name INTO STRICT recipient_name FROM public.profiles p WHERE p.id = NEW.recipient_id;

    PERFORM realtime.send(
      jsonb_build_object(
        'type', event_type,
        'kudoId', NEW.id,
        'recipientId', NEW.recipient_id,
        'recipientName', recipient_name,
        'occurredAt', to_char(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      'kudo',
      'spotlight',
      true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'spotlight_publish_kudo_event: broadcast skipped for kudo % (%: %)', NEW.id, SQLSTATE, SQLERRM;
  END;
  RETURN NEW;
END
$fn$;--> statement-breakpoint

CREATE TRIGGER spotlight_publish_kudo_event
  AFTER INSERT OR UPDATE OF status ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION public.spotlight_publish_kudo_event();--> statement-breakpoint

-- Functions default to EXECUTE for PUBLIC; a trigger function never needs a client caller.
REVOKE EXECUTE ON FUNCTION public.spotlight_publish_kudo_event() FROM PUBLIC, anon, authenticated;--> statement-breakpoint

-- `topic` (the row's column) as well as realtime.topic() (the join being authorized): permissive
-- policies are OR-ed, so without the row check a role that sets realtime.topic = 'spotlight' could
-- read every other topic's rows (phase 13 notifications included).
CREATE POLICY spotlight_authenticated_read ON realtime.messages
  FOR SELECT TO authenticated
  USING (realtime.topic() = 'spotlight' AND topic = 'spotlight' AND extension = 'broadcast');
