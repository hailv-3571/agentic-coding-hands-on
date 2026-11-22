import { sql } from "drizzle-orm";
import type { withRollback } from "../../setup/integration-db";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Helpers for the phase 11 trigger tests: write kudos with SQL inside a transaction that is always
 * rolled back, and read what the `kudos` trigger handed to `realtime.send` straight from
 * `realtime.messages` (no websocket needed for the payload/privacy proof).
 */
export type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];
export type SpotlightMessage = {
  id: string;
  event: string;
  topic: string;
  private: boolean;
  extension: string;
  payload: Record<string, unknown>;
};

/** The 5 payload keys the trigger builds; `realtime.send` itself appends `id` (the message id). */
export const PAYLOAD_KEYS = ["kudoId", "occurredAt", "recipientId", "recipientName", "type"];

export async function insertKudoIn(
  tx: Tx,
  seed: { sender: Sunner; recipient: Sunner; status?: "public" | "spam"; nickname?: string; body?: string },
): Promise<{ id: string; createdAt: string }> {
  const [row] = await tx.execute<{ id: string; created_at: string }>(sql`
    insert into public.kudos (sender_id, recipient_id, body, is_anonymous, anonymous_nickname, status)
    values (${seed.sender.id}, ${seed.recipient.id}, ${seed.body ?? "Cảm ơn bạn"}, ${Boolean(seed.nickname)},
            ${seed.nickname ?? null}, ${seed.status ?? "public"})
    returning id, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at`);
  return { id: row.id, createdAt: row.created_at };
}

export async function setStatusIn(tx: Tx, kudoId: string, status: "public" | "spam"): Promise<void> {
  await tx.execute(sql`update public.kudos set status = ${status} where id = ${kudoId}`);
}

/** Every `spotlight` message about one kudo, in send order. */
export async function spotlightMessagesOf(tx: Tx, kudoId: string): Promise<SpotlightMessage[]> {
  return tx.execute<SpotlightMessage>(sql`
    select id::text as id, event, topic, private, extension, payload from realtime.messages
    where topic = 'spotlight' and payload ->> 'kudoId' = ${kudoId}
    order by inserted_at, id`);
}

export const eventTypes = (messages: SpotlightMessage[]) => messages.map((message) => message.payload.type);
