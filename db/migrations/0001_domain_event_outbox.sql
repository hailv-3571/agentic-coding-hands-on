CREATE TABLE "domain_event_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"failed_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE INDEX "domain_event_outbox_pending_idx" ON "domain_event_outbox" USING btree ("occurred_at","id") WHERE "domain_event_outbox"."consumed_at" is null and "domain_event_outbox"."failed_at" is null;