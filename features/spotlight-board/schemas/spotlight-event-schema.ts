import { z } from "zod";
import type { SpotlightEvent, SpotlightName, SpotlightSnapshot, SpotlightTickerItem } from "./spotlight-views";

/**
 * Runtime guards for the Spotlight contracts in ./spotlight-views.ts (client-safe).
 * - SpotlightEventSchema: the browser parses every `kudo` broadcast with it and ignores what fails
 *   (technical-spec A3). `realtime.send` appends its own message `id` to the trigger's payload; like
 *   any unknown key it is stripped, so a parsed event has exactly the 5 contract keys.
 * - SpotlightSnapshotSchema: GET /api/spotlight and the first server render pass the query result
 *   through it, so only whitelisted keys ever leave the server (FR-602, BR-003).
 * Times are UTC ISO instants (`2026-11-22T15:31:37.123Z`), the form both the trigger and the query emit.
 */
const isoInstant = z.iso.datetime();
const recipientName = z.string().min(1);

export const SpotlightEventSchema = z.object({
  type: z.enum(["added", "removed", "restored"]),
  kudoId: z.uuid(),
  recipientId: z.uuid(),
  recipientName,
  occurredAt: isoInstant,
}) satisfies z.ZodType<SpotlightEvent>;

const SpotlightNameSchema = z.object({
  recipientId: z.uuid(),
  name: recipientName,
  count: z.int().positive(),
}) satisfies z.ZodType<SpotlightName>;

const SpotlightTickerItemSchema = z.object({
  kudoId: z.uuid(),
  recipientId: z.uuid(),
  recipientName,
  occurredAt: isoInstant,
}) satisfies z.ZodType<SpotlightTickerItem>;

export const SpotlightSnapshotSchema = z.object({
  total: z.int().nonnegative(),
  names: z.array(SpotlightNameSchema),
  recent: z.array(SpotlightTickerItemSchema),
}) satisfies z.ZodType<SpotlightSnapshot>;
