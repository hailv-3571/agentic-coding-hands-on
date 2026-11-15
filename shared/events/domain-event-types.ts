import { z } from "zod";

/**
 * Outbox event contract shared by producers (F003, F005, F007, F010) and the F013
 * processor (architecture.md § Cross-Feature Contracts). Payloads carry ids only — never
 * Kudo bodies or person names — and unknown keys are rejected (strict objects).
 */

const id = z.uuid();
const positiveInt = z.number().int().positive();

export const domainEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("KudoCreated"),
    payload: z.strictObject({ kudoId: id }),
  }),
  z.strictObject({
    type: z.literal("HeartAdded"),
    payload: z.strictObject({ kudoId: id, heartUserId: id }),
  }),
  z.strictObject({
    type: z.literal("KudoMarkedSpam"),
    payload: z.strictObject({
      kudoId: id,
      ownerId: id,
      moderatedAt: z.iso.datetime({ offset: true }),
    }),
  }),
  z.strictObject({
    type: z.literal("BoxGranted"),
    payload: z.strictObject({ userId: id, count: positiveInt }),
  }),
  z.strictObject({
    type: z.literal("SetCompleted"),
    payload: z.strictObject({ userId: id, giftName: z.string().trim().min(1).max(200) }),
  }),
  z.strictObject({
    type: z.literal("NationalKudosFinalized"),
    payload: z.strictObject({
      items: z.array(z.strictObject({ kudoId: id, senderId: id, rank: positiveInt })),
    }),
  }),
]);

export type DomainEvent = z.output<typeof domainEventSchema>;
export type DomainEventType = DomainEvent["type"];
export type DomainEventPayload<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>["payload"];
