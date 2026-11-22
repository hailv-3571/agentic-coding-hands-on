import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, expect, it } from "vitest";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * RISK-03: the spotlight trigger must never abort a kudo write. Fault injection on a connection of
 * its own, in a transaction that is always rolled back: the real trigger function is handed to a
 * throw-away owner (SECURITY DEFINER → it runs as that role) that may read `profiles` but has no
 * USAGE on schema `realtime`, so its `realtime.send(…)` call raises `permission denied`. The kudo
 * INSERT and the Mark Spam UPDATE must still succeed, nothing is sent, and the catch-all logs it.
 */
const ROLLBACK = Symbol("rollback");
type Outcome = { status: string; messages: number; logs: string[]; kudoId: string };

let sender: Sunner;
let recipient: Sunner;
beforeAll(async () => {
  [sender, recipient] = await Promise.all([createSunner("spot-fault-sender", "Fault Sender"), createSunner("spot-fault-recipient", "Fault Recipient")]);
});
afterAll(async () => cleanupSunners([sender, recipient]));

async function writeWithBrokenSend(): Promise<Outcome> {
  const logs: string[] = [];
  const client = postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false, onnotice: (notice) => logs.push(notice.message) });
  const owner = `spotlight_send_fault_${randomUUID().slice(0, 8)}`;
  let outcome: Outcome | undefined;
  try {
    await client.begin(async (tx) => {
      await tx.unsafe(`set local client_min_messages = log`);
      await tx.unsafe(`create role ${owner} nologin bypassrls`);
      await tx.unsafe(`grant ${owner} to current_user`);
      await tx.unsafe(`grant usage, create on schema public to ${owner}`);
      await tx.unsafe(`grant select on public.profiles to ${owner}`);
      await tx.unsafe(`alter function public.spotlight_publish_kudo_event() owner to ${owner}`);
      const [kudo] = await tx<{ id: string }[]>`
        insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${recipient.id}, 'fault') returning id`;
      await tx`update public.kudos set status = 'spam' where id = ${kudo.id}`;
      const [row] = await tx<{ status: string; messages: number }[]>`
        select k.status::text as status,
               (select count(*)::int from realtime.messages m where m.topic = 'spotlight' and m.payload ->> 'kudoId' = ${kudo.id}) as messages
        from public.kudos k where k.id = ${kudo.id}`;
      outcome = { ...row, logs, kudoId: kudo.id };
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
  if (!outcome) throw new Error("the faulted write did not complete");
  return outcome;
}

it("commits the kudo insert and its status update when realtime.send raises, and logs the skipped broadcast", async () => {
  const outcome = await writeWithBrokenSend();
  expect({ status: outcome.status, messages: outcome.messages }).toEqual({ status: "spam", messages: 0 });
  // log_statement = ddl also echoes the ALTER FUNCTION above: keep only the catch-all lines.
  const skipped = outcome.logs.filter((log) => log.includes("spotlight_publish_kudo_event: broadcast skipped"));
  expect(skipped).toHaveLength(2);
  for (const log of skipped) {
    expect(log).toContain(outcome.kudoId);
    expect(log).toContain("permission denied for schema realtime");
  }
});
