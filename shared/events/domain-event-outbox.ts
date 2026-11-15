import "server-only";
import type { DbTx } from "@/shared/db/client";
import { domainEventOutbox } from "@/shared/db/schema";
import {
  domainEventSchema,
  type DomainEventPayload,
  type DomainEventType,
} from "./domain-event-types";

/**
 * Records a domain event in the transactional outbox (C-16/C-01).
 *
 * - Takes the caller's business transaction and never opens its own: the event exists
 *   only if the business change commits.
 * - Validates the payload against the shared contract and throws a ZodError (rolling back
 *   the caller's transaction) on mismatch.
 */
async function add<T extends DomainEventType>(
  tx: DbTx,
  type: T,
  payload: DomainEventPayload<T>,
): Promise<{ id: string }> {
  const event = domainEventSchema.parse({ type, payload });
  const [row] = await tx
    .insert(domainEventOutbox)
    .values({ eventType: event.type, payload: event.payload })
    .returning({ id: domainEventOutbox.id });
  return row;
}

export const DomainEventOutbox = { add } as const;
