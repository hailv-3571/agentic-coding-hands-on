import type { CampaignPhase } from "../schemas/campaign-admin-result";

/**
 * BR-001 / BR-004: a campaign is `active` on the half-open window [startsAt, endsAt), `ended`
 * from endsAt on, `upcoming` before startsAt. Pure: callers pass the server clock. Rules per
 * phase — ended: read-only; active: name + end editable, start locked, deletable; upcoming: all.
 */
export function campaignPhase(window: { startsAt: Date; endsAt: Date }, now: Date): CampaignPhase {
  if (window.endsAt.getTime() <= now.getTime()) return "ended";
  if (window.startsAt.getTime() <= now.getTime()) return "active";
  return "upcoming";
}
