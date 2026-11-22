import { z } from "zod";
import { KudoFeedListParamsSchema, parseKudoFeedParams } from "@/features/kudos-feed/schemas/kudo-feed-params-schema";
import { PROFILE_KUDOS_DIRECTIONS } from "./profile-views";

/**
 * Query of GET /api/profile/{userId}/kudos (A3): `direction` = `received` (default) | `sent`, and the
 * phase 05 feed cursor (the ONE KudoPublicQuery cursor, strictly decoded). A key that is present but
 * empty or malformed → 400 VALIDATION `{ fieldErrors }` before any DB read; unknown keys are
 * ignored, so no request can name a sender (BR-002). Server-side only (the cursor check uses Buffer).
 */
export const ProfileKudosParamsSchema = z.object({
  direction: z.enum(PROFILE_KUDOS_DIRECTIONS, { error: "invalid" }).default("received"),
  cursor: KudoFeedListParamsSchema.shape.cursor,
});

export const parseProfileKudosParams = (params: URLSearchParams) => parseKudoFeedParams(ProfileKudosParamsSchema, params);
