import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NOTIFICATION_SIGNAL_EVENT, notificationTopicFor } from "@/features/notifications/notification-config";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";
import { closeAppDb, TEST_PASSWORD } from "../auth/auth-test-users";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { eventually } from "../spotlight-board/spotlight-realtime-clients";
import * as fx from "./notification-test-fixtures";

/**
 * End to end on the local Realtime server (FR-402, FR-602, SC-007): the recipient joins their PRIVATE
 * topic `notifications:{id}` and receives the drained notification's signal (ids only); another Sunner
 * trying to join that topic is refused and receives nothing; the anon key is refused.
 */
type Listener = { client: SupabaseClient; channel: RealtimeChannel; status: string; received: Record<string, unknown>[] };
const supabaseUrl = assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

async function listen(email: string | null, topic: string): Promise<Listener> {
  const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
  if (email) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    if (error) throw error;
    await client.realtime.setAuth(data.session.access_token);
  }
  const received: Record<string, unknown>[] = [];
  const channel = client.channel(topic, { config: { private: true } });
  channel.on("broadcast", { event: NOTIFICATION_SIGNAL_EVENT }, (message) => received.push(message.payload as Record<string, unknown>));
  const status = await new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve("NO_REPLY"), 10_000);
    channel.subscribe((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
  return { client, channel, status, received };
}

let recipient: Sunner;
let intruder: Sunner;
let listeners: Listener[] = [];
beforeAll(async () => {
  [recipient, intruder] = await Promise.all([createSunner("noti-live-recipient", "Noti Live Recipient"), createSunner("noti-live-intruder", "Noti Intruder")]);
  await fx.drainUntilIdle();
  listeners = await Promise.all([listen(recipient.email, notificationTopicFor(recipient.id)), listen(intruder.email, notificationTopicFor(recipient.id)), listen(null, notificationTopicFor(recipient.id))]);
}, 40_000);
afterAll(async () => {
  for (const { client } of listeners) {
    await client.removeAllChannels();
    client.realtime.disconnect();
  }
  await fx.cleanupNotificationTest([recipient, intruder]);
  await closeAppDb();
});

describe("notifications private channel", () => {
  it("lets the recipient join their own topic and refuses another Sunner and the anon key", () => {
    expect(listeners.map((listener) => listener.status)).toEqual(["SUBSCRIBED", "CHANNEL_ERROR", "CHANNEL_ERROR"]);
  });

  it("delivers the drained notification's signal to its recipient only", async () => {
    await fx.addEvent("BoxGranted", { userId: recipient.id, count: 1 });
    await fx.drainUntilIdle();
    const [row] = await fx.notificationsOf(recipient.id);
    const [own, other, anon] = listeners;
    expect(await eventually(() => own.received.some((payload) => payload.notificationId === row.id), 8_000)).toBe(true);
    const signal = own.received.find((payload) => payload.notificationId === row.id);
    expect(Object.keys(signal ?? {}).sort()).toEqual(["id", "notificationId", "occurredAt", "type"]);
    expect(signal).toMatchObject({ type: "secret_box_granted" });
    expect([other.received, anon.received]).toEqual([[], []]);
  }, 30_000);
});
