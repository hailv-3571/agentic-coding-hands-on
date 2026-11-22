import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { migrationStatements } from "../secret-box-rewards/secret-box-cron-script-runner";
import { insertKudoIn, spotlightMessagesOf, type Tx } from "./spotlight-message-fixtures";

/**
 * Migration NNNN_spotlight_realtime (phase 11, custom SQL): the trigger function is SECURITY DEFINER
 * with an empty search_path and no client EXECUTE, the trigger fires AFTER INSERT OR UPDATE OF status,
 * the journal entry is applied, and down → up round-trips inside a transaction that is rolled back.
 */
type Journal = { entries: { tag: string; when: number }[] };
const journalEntry = () =>
  (JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as Journal).entries.find((entry) => entry.tag.endsWith("_spotlight_realtime"));

const objectsPresent = async (tx: Tx) => {
  const [row] = await tx.execute<{ fn: boolean; trigger: boolean; policy: boolean }>(sql`
    select to_regprocedure('public.spotlight_publish_kudo_event()') is not null as fn,
           exists (select 1 from pg_trigger where tgrelid = 'public.kudos'::regclass and tgname = 'spotlight_publish_kudo_event') as trigger,
           exists (select 1 from pg_policies where schemaname = 'realtime' and policyname = 'spotlight_authenticated_read') as policy`);
  return row;
};

let sender: Sunner;
let recipient: Sunner;
beforeAll(async () => {
  [sender, recipient] = await Promise.all([createSunner("spot-mig-sender", "Spot Mig Sender"), createSunner("spot-mig-recipient", "Spot Mig Recipient")]);
});
afterAll(async () => cleanupSunners([sender, recipient]));

describe("spotlight realtime migration", () => {
  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const entry = journalEntry();
    expect(entry).toBeDefined();
    const [row] = await testSql<{ count: number }[]>`select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${entry?.when ?? -1}`;
    expect(row.count).toBe(1);
  });

  it("defines the trigger function SECURITY DEFINER, search_path pinned to '', EXECUTE revoked from client roles", async () => {
    const [fn] = await testSql<{ secdef: boolean; config: string[]; anon: boolean; authenticated: boolean; public_acl: boolean }[]>`
      select p.prosecdef as secdef, p.proconfig as config,
             has_function_privilege('anon', p.oid, 'execute') as anon,
             has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
             coalesce(array_to_string(p.proacl, ','), '=X') ~ '(^|,)=X' as public_acl
      from pg_proc p where p.oid = 'public.spotlight_publish_kudo_event()'::regprocedure`;
    expect(fn).toEqual({ secdef: true, config: ['search_path=""'], anon: false, authenticated: false, public_acl: false });
  });

  it("fires AFTER INSERT OR UPDATE OF status, once per row", async () => {
    const [trigger] = await testSql<{ definition: string; enabled: string }[]>`
      select pg_get_triggerdef(oid) as definition, tgenabled::text as enabled from pg_trigger
      where tgrelid = 'public.kudos'::regclass and tgname = 'spotlight_publish_kudo_event'`;
    expect(trigger.enabled).toBe("O");
    expect(trigger.definition).toContain("AFTER INSERT OR UPDATE OF status ON public.kudos FOR EACH ROW EXECUTE FUNCTION spotlight_publish_kudo_event()");
  });

  it("rolls down (no trigger, function or policy; kudo writes unaffected) and back up cleanly", async () => {
    const tag = journalEntry()?.tag ?? "missing";
    const result = await withRollback(async (tx) => {
      for (const statement of migrationStatements(`${tag}.down.sql`)) await tx.execute(sql.raw(statement));
      const down = await objectsPresent(tx);
      const silent = await insertKudoIn(tx, { sender, recipient });
      const messagesAfterDown = (await spotlightMessagesOf(tx, silent.id)).length;
      for (const statement of migrationStatements(`${tag}.sql`)) await tx.execute(sql.raw(statement));
      const up = await objectsPresent(tx);
      const loud = await insertKudoIn(tx, { sender, recipient });
      return { down, messagesAfterDown, up, messagesAfterUp: (await spotlightMessagesOf(tx, loud.id)).length };
    });
    expect(result).toEqual({
      down: { fn: false, trigger: false, policy: false },
      messagesAfterDown: 0,
      up: { fn: true, trigger: true, policy: true },
      messagesAfterUp: 1,
    });
  });
});
