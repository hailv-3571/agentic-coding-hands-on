import type { SpotlightEvent, SpotlightName, SpotlightSnapshot, SpotlightTickerItem } from "../schemas/spotlight-views";
import { TICKER_VISIBLE_LINES } from "./spotlight-ui-config";

/**
 * Client state of the Spotlight Board (DEC-001, technical-spec A3). Pure: no I/O, no clock.
 * `applied` remembers the last status this client applied per kudo id, so a replayed event never
 * counts twice; a `replace` (snapshot refetched after a (re)subscribe, a moderation event or tab
 * visible) is the new truth for the counts and only remembers the kudos its ticker lists.
 */
export type SpotlightState = {
  total: number;
  names: SpotlightName[];
  /** Oldest first, at most `TICKER_VISIBLE_LINES`; the newest line renders at the bottom. */
  ticker: SpotlightTickerItem[];
  applied: Readonly<Record<string, "public" | "spam">>;
  /** The newest `added` event: its name shows in #F17676 until `unspotlight`. */
  spotlit: { recipientId: string; kudoId: string } | null;
  /**
   * Kudos restored (spam → public) while this board is open. Restored is not news (DEC-001), so a
   * later `replace` keeps their lines out of the ticker even though the snapshot lists them again.
   */
  restoredIds: readonly string[];
};

export type SpotlightAction =
  | { type: "replace"; snapshot: SpotlightSnapshot }
  | { type: "event"; event: SpotlightEvent }
  | { type: "unspotlight"; kudoId: string };

/** What survives a `replace`: the running highlight and the restored kudos kept out of the ticker. */
type KeptOnReplace = Pick<SpotlightState, "spotlit" | "restoredIds">;

function fromSnapshot(snapshot: SpotlightSnapshot, { spotlit, restoredIds }: KeptOnReplace): SpotlightState {
  const ticker = snapshot.recent.slice(-TICKER_VISIBLE_LINES).filter((item) => !restoredIds.includes(item.kudoId));
  return {
    total: Math.max(0, snapshot.total),
    names: snapshot.names.filter((name) => name.count > 0),
    ticker,
    applied: Object.fromEntries(ticker.map((item) => [item.kudoId, "public" as const])),
    spotlit,
    restoredIds,
  };
}

export function initSpotlightState(snapshot: SpotlightSnapshot): SpotlightState {
  return fromSnapshot(snapshot, { spotlit: null, restoredIds: [] });
}

/** +1 or −1 on one recipient: a new name joins with 1, a name at 0 leaves, never negative. */
function shiftCount(names: SpotlightName[], event: SpotlightEvent, delta: 1 | -1): SpotlightName[] {
  const index = names.findIndex((name) => name.recipientId === event.recipientId);
  if (index === -1) return delta === 1 ? [...names, { recipientId: event.recipientId, name: event.recipientName, count: 1 }] : names;
  const count = names[index].count + delta;
  if (count <= 0) return names.filter((_, position) => position !== index);
  return names.map((name, position) => (position === index ? { ...name, name: event.recipientName || name.name, count } : name));
}

function applyEvent(state: SpotlightState, event: SpotlightEvent): SpotlightState {
  const known = state.applied[event.kudoId];
  switch (event.type) {
    case "added": {
      if (known) return state;
      const line: SpotlightTickerItem = {
        kudoId: event.kudoId,
        recipientId: event.recipientId,
        recipientName: event.recipientName,
        occurredAt: event.occurredAt,
      };
      return {
        ...state,
        total: state.total + 1,
        names: shiftCount(state.names, event, 1),
        ticker: [...state.ticker, line].slice(-TICKER_VISIBLE_LINES),
        applied: { ...state.applied, [event.kudoId]: "public" },
        spotlit: { recipientId: event.recipientId, kudoId: event.kudoId },
      };
    }
    case "removed": {
      // Unknown ids still count down: the snapshot total includes kudos no event has named yet.
      if (known === "spam") return state;
      return {
        ...state,
        total: Math.max(0, state.total - 1),
        names: shiftCount(state.names, event, -1),
        ticker: state.ticker.filter((item) => item.kudoId !== event.kudoId),
        applied: { ...state.applied, [event.kudoId]: "spam" },
        spotlit: state.spotlit?.kudoId === event.kudoId ? null : state.spotlit,
      };
    }
    case "restored": {
      // Back to public: counts only, no ticker line (it is not news).
      if (known === "public") return state;
      return {
        ...state,
        total: state.total + 1,
        names: shiftCount(state.names, event, 1),
        applied: { ...state.applied, [event.kudoId]: "public" },
        restoredIds: state.restoredIds.includes(event.kudoId) ? state.restoredIds : [...state.restoredIds, event.kudoId],
      };
    }
    default:
      return state;
  }
}

export function spotlightReducer(state: SpotlightState, action: SpotlightAction): SpotlightState {
  switch (action.type) {
    case "replace":
      return fromSnapshot(action.snapshot, state);
    case "event":
      return applyEvent(state, action.event);
    case "unspotlight":
      return state.spotlit?.kudoId === action.kudoId ? { ...state, spotlit: null } : state;
    default:
      return state;
  }
}
