import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";
import { TEST_PASSWORD } from "../auth/auth-test-users";

/**
 * Real Supabase Realtime clients for the phase 11 delivery tests (local stack only): a signed-in
 * Sunner or the anon key, joining topic `spotlight` as a private or public channel, recording every
 * `kudo` broadcast they receive. No browser: the websocket is Node's own.
 */
const supabaseUrl = assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const JOIN_TIMEOUT_MS = 10_000;

export type JoinOutcome = { status: string; error: string | null };
export type Listener = { client: SupabaseClient; channel: RealtimeChannel; outcome: JoinOutcome; received: Record<string, unknown>[] };

async function newClient(email: string | null): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (email) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    if (error) throw error;
    await client.realtime.setAuth(data.session.access_token);
  }
  return client;
}

/** Joins `topic` and resolves on the first terminal join status (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED). */
export async function listen(email: string | null, topic: string, isPrivate: boolean): Promise<Listener> {
  const client = await newClient(email);
  const received: Record<string, unknown>[] = [];
  const channel = client.channel(topic, { config: { private: isPrivate } });
  channel.on("broadcast", { event: "kudo" }, (message) => received.push(message.payload as Record<string, unknown>));
  const outcome = await new Promise<JoinOutcome>((resolve) => {
    const timer = setTimeout(() => resolve({ status: "NO_REPLY", error: null }), JOIN_TIMEOUT_MS);
    channel.subscribe((status, error) => {
      clearTimeout(timer);
      resolve({ status, error: error?.message ?? null });
    });
  });
  return { client, channel, outcome, received };
}

/** Waits until `predicate` holds or `timeoutMs` passes (then returns false). */
export async function eventually(predicate: () => boolean, timeoutMs = 5_000): Promise<boolean> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) return false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return true;
}

export async function closeAll(listeners: (Listener | undefined)[]): Promise<void> {
  for (const listener of listeners) {
    if (!listener) continue;
    await listener.client.removeAllChannels();
    listener.client.realtime.disconnect();
  }
}
