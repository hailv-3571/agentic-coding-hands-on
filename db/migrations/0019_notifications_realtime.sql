-- F013 Notifications realtime, phase 13 (custom SQL). Same pattern as phase 11 (0017_spotlight_realtime).
--
-- notifications_publish_signal() — AFTER INSERT OR UPDATE OF count ON notifications, FOR EACH ROW:
--   a new row, or an unread heart row whose count the processor just raised (BR-004), sends ONE
--   content-free signal to the recipient's PRIVATE topic 'notifications:{recipient_id}', event
--   'notification' (NOTIFICATION_TOPIC_PREFIX / NOTIFICATION_SIGNAL_EVENT in
--   features/notifications/notification-config.ts). Payload built field by field (INT-002, FR-602/603):
--   {notificationId, type, occurredAt} — never params, actor, kudo body or a sender identity.
--   realtime.send itself adds `id` (its message id); the client's Zod schema drops it. A read
--   (UPDATE OF read_at) never fires. It is a row in realtime.messages inside the processor's
--   transaction: a rolled-back event is never signalled.
-- Catch-all: any error (Realtime schema/privilege problem) → RAISE LOG and the notification write
-- commits; the bell re-syncs from GET /api/notifications/unread-count on reconnect / tab focus.
-- SECURITY DEFINER (runs as the migration role, which may insert realtime.messages), empty
-- search_path, fully qualified names, EXECUTE revoked from client roles.
--
-- realtime.messages RLS (C-20 sanctioned exception, as phase 11): Realtime authorizes a private join
-- by reading this table as the client's role with realtime.topic() set. One SELECT policy:
-- authenticated, broadcast only, and BOTH the join topic (realtime.topic()) AND the row's own topic
-- must equal 'notifications:' || auth.uid() — permissive policies are OR-ed, so checking the row's
-- topic keeps another policy's join (e.g. 'spotlight') from reading these rows and this policy from
-- reading another user's. No INSERT/UPDATE/DELETE policy → no client can forge a signal.
-- DEPLOY: Realtime → Settings → "Allow public access" OFF (private channels only), as phase 11.
-- Rollback: db/migrations/0019_notifications_realtime.down.sql (drizzle-kit keeps no down files).
CREATE FUNCTION public.notifications_publish_signal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object(
        'notificationId', NEW.id,
        'type', NEW.type,
        'occurredAt', to_char(NEW.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      'notification',
      'notifications:' || NEW.recipient_id::text,
      true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'notifications_publish_signal: signal skipped for notification % (%: %)', NEW.id, SQLSTATE, SQLERRM;
  END;
  RETURN NEW;
END
$fn$;--> statement-breakpoint

CREATE TRIGGER notifications_publish_signal
  AFTER INSERT OR UPDATE OF count ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_publish_signal();--> statement-breakpoint

-- Functions default to EXECUTE for PUBLIC; a trigger function never needs a client caller.
REVOKE EXECUTE ON FUNCTION public.notifications_publish_signal() FROM PUBLIC, anon, authenticated;--> statement-breakpoint

CREATE POLICY notifications_recipient_read ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'notifications:' || (SELECT auth.uid())::text
    AND topic = 'notifications:' || (SELECT auth.uid())::text
    AND extension = 'broadcast'
  );
