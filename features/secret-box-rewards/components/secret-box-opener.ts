import {
  SECRET_BOX_ICON_CODES,
  type OpenSecretBoxResult,
  type SecretBoxIconCode,
} from "../schemas/secret-box-views";

/**
 * SM-002 phases. `result` is the waiting/empty step that still shows the last prize: the box stays
 * clickable while `unopened > 0` (Figma 1466:7614 keeps the hint and the counter under the icon).
 * `unavailable` = the count could not be read when the modal opened.
 */
export type OpenerPhase = "loading" | "unavailable" | "waiting" | "opening" | "result" | "empty";
export type OpenerNotice = "openFailed" | "sessionExpired";

export type OpenerState = {
  phase: OpenerPhase;
  unopened: number;
  result: OpenSecretBoxResult | null;
  notice: OpenerNotice | null;
};

export type SecretBoxOpenerDeps = {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  newKey: () => string;
  /** Shortest time the opening frame stays on screen (0 under `prefers-reduced-motion`). */
  minOpeningMs: number;
};

export type SecretBoxOpener = {
  getState(): OpenerState;
  subscribe(listener: () => void): () => void;
  load(): Promise<void>;
  open(): Promise<void>;
  dismissNotice(): void;
};

export const SECRET_BOX_ME_URL = "/api/secret-boxes/me";
export const SECRET_BOX_OPEN_URL = "/api/secret-boxes/open";
/** A hung request must not lock the box forever: past this it counts as a network error (retry replays). */
const OPEN_TIMEOUT_MS = 15_000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isOpenResult(body: unknown): body is OpenSecretBoxResult {
  if (typeof body !== "object" || body === null) return false;
  const value = body as Record<string, unknown>;
  const iconOk = value.kind === "gift" || SECRET_BOX_ICON_CODES.includes(value.iconCode as SecretBoxIconCode);
  return (
    (value.kind === "icon" || value.kind === "gift") &&
    iconOk &&
    typeof value.name === "string" &&
    typeof value.setCompleted === "boolean" &&
    typeof value.unopenedLeft === "number"
  );
}

type OpenOutcome =
  | { type: "opened"; result: OpenSecretBoxResult }
  | { type: "noBox" }
  | { type: "rejected" }
  | { type: "unknown"; notice: OpenerNotice };

/** Maps one POST to what the client now knows. Only a definite server answer frees the key. */
async function requestOpen(deps: SecretBoxOpenerDeps, key: string): Promise<OpenOutcome> {
  try {
    const response = await deps.fetch(SECRET_BOX_OPEN_URL, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(OPEN_TIMEOUT_MS),
    });
    if (response.status === 409) return { type: "noBox" };
    if (response.status === 400) return { type: "rejected" };
    if (response.status === 401) return { type: "unknown", notice: "sessionExpired" };
    if (!response.ok) return { type: "unknown", notice: "openFailed" };
    const body: unknown = await response.json();
    return isOpenResult(body) ? { type: "opened", result: body } : { type: "unknown", notice: "openFailed" };
  } catch {
    return { type: "unknown", notice: "openFailed" };
  }
}

/**
 * The open-box modal's client state machine (SM-002), framework-free so it is unit-tested in
 * Node; `useSecretBoxOpener` binds it to React. Idempotency (FR-402): each click gets a NEW key,
 * except when the previous click's outcome is unknown (network error, timeout, 5xx, 401, unreadable
 * body) — then the next click is that click's retry and re-sends the SAME key, so the server
 * replays the stored result instead of opening another box. The box is locked while loading and
 * opening; the prize is always the server's answer (FR-602).
 */
export function createSecretBoxOpener(deps: SecretBoxOpenerDeps): SecretBoxOpener {
  let state: OpenerState = { phase: "loading", unopened: 0, result: null, notice: null };
  /** Key of the click whose answer never arrived; reused by the next click. */
  let pendingKey: string | null = null;
  const listeners = new Set<() => void>();

  function update(patch: Partial<OpenerState>) {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  }

  const idle = (unopened: number): OpenerPhase => (unopened > 0 ? "waiting" : "empty");
  /** Read through a call: a click may start opening while the count request is in flight. */
  const opening = () => state.phase === "opening";

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async load() {
      if (opening()) return;
      try {
        const response = await deps.fetch(SECRET_BOX_ME_URL, { cache: "no-store" });
        const body = (response.ok ? await response.json() : null) as { unopened?: unknown } | null;
        if (typeof body?.unopened !== "number") throw new Error(`unreadable box count (${response.status})`);
        if (!opening()) update({ phase: idle(body.unopened), unopened: body.unopened, result: null });
      } catch {
        if (!opening()) update({ phase: "unavailable" });
      }
    },
    async open() {
      const canOpen = (state.phase === "waiting" || state.phase === "result") && state.unopened > 0;
      if (!canOpen) return;
      const key = pendingKey ?? deps.newKey();
      pendingKey = key;
      update({ phase: "opening", notice: null });
      const [outcome] = await Promise.all([requestOpen(deps, key), wait(deps.minOpeningMs)]);
      if (outcome.type === "unknown") {
        update({ phase: "waiting", result: null, notice: outcome.notice });
        return;
      }
      pendingKey = null;
      if (outcome.type === "opened") {
        const unopened = Math.max(outcome.result.unopenedLeft, 0);
        update({ phase: "result", unopened, result: outcome.result });
      } else if (outcome.type === "noBox") {
        update({ phase: "empty", unopened: 0, result: null });
      } else {
        update({ phase: "waiting", result: null, notice: "openFailed" });
      }
    },
    dismissNotice() {
      if (state.notice) update({ notice: null });
    },
  };
}
