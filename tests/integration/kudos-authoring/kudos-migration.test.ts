import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "./kudo-test-fixtures";

/** Migrations NNNN_kudos + NNNN_kudos_constraints: tables, enum, defaults, CHECKs, RLS, unaccent. */
const KUDO_TABLES = ["kudos", "kudo_hashtags", "kudo_images", "kudo_image_uploads"];
const PATH = "kudos/1c0e6a7b-2d3f-4a5b-8c6d-7e8f9a0b1c2d.png";
let sender: Sunner;
let recipient: Sunner;

beforeAll(async () => {
  sender = await createSunner("mig-sender", "Migration Sender");
  recipient = await createSunner("mig-recipient", "Migration Recipient");
});
afterAll(async () => cleanupSunners([sender, recipient]));

type KudoValues = { sender?: string; recipient?: string; body?: string; title?: string | null; anon?: boolean; nickname?: string | null };
const insertKudo = (values: KudoValues = {}) =>
  withRollback(async (tx) => {
    const rows = await tx.execute<{ id: string; status: string; is_anonymous: boolean }>(sql`
      insert into public.kudos (sender_id, recipient_id, title, body, is_anonymous, anonymous_nickname)
      values (${values.sender ?? sender.id}, ${values.recipient ?? recipient.id}, ${values.title ?? null},
              ${values.body ?? "Cảm ơn"}, ${values.anon ?? false}, ${values.nickname ?? null})
      returning id, status, is_anonymous`);
    return rows[0];
  });
/** drizzle wraps the driver error; the Postgres constraint name is on `cause`. */
const violates = (constraint: string) => ({ cause: expect.objectContaining({ constraint_name: constraint }) });

describe("kudos schema", () => {
  it("creates the four tables with RLS on and no client privileges", async () => {
    const rows = await testSql<{ relname: string; rls: boolean; client_grant: boolean }[]>`
      select c.relname, c.relrowsecurity as rls,
             has_table_privilege('anon', c.oid, 'select,insert,update,delete')
             or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete') as client_grant
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any(${KUDO_TABLES}) order by c.relname`;
    expect(rows).toEqual(
      [...KUDO_TABLES].sort().map((relname) => ({ relname, rls: true, client_grant: false })),
    );
  });

  it("declares kudo_status as ('public', 'spam') and defaults a new kudo to public, not anonymous", async () => {
    const [enumRow] = await testSql<{ values: string[] }[]>`
      select enum_range(null::public.kudo_status)::text[] as values`;
    expect(enumRow.values).toEqual(["public", "spam"]);
    expect(await insertKudo()).toMatchObject({ status: "public", is_anonymous: false });
  });

  it("rejects self-send at the database (sender = recipient)", async () => {
    await expect(insertKudo({ recipient: sender.id })).rejects.toMatchObject(violates("kudos_no_self_send"));
  });

  it("bounds the body to 1..1000 characters and forbids a blank title", async () => {
    expect(await insertKudo({ body: "đ".repeat(1000) })).toBeTruthy();
    await expect(insertKudo({ body: "" })).rejects.toMatchObject(violates("kudos_body_length"));
    await expect(insertKudo({ body: "a".repeat(1001) })).rejects.toMatchObject(violates("kudos_body_length"));
    await expect(insertKudo({ title: "   " })).rejects.toMatchObject(violates("kudos_title_not_blank"));
  });

  it("rejects a whitespace-only body at the database (review S2, migration 0008)", async () => {
    expect(await insertKudo({ body: "  Cảm ơn\n" })).toBeTruthy();
    for (const body of ["   ", "\n\t \r\n"]) {
      await expect(insertKudo({ body })).rejects.toMatchObject(violates("kudos_body_not_blank"));
    }
  });

  it("indexes kudo_image_uploads by (uploader_id, created_at) for the pending-upload cap", async () => {
    const [row] = await testSql<{ columns: string[] }[]>`
      select array_agg(a.attname order by k.ord)::text[] as columns
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
      where c.relname = 'kudo_image_uploads_uploader_id_created_at_idx'`;
    expect(row?.columns).toEqual(["uploader_id", "created_at"]);
  });

  it("ties anonymous_nickname to is_anonymous", async () => {
    expect(await insertKudo({ anon: true, nickname: "Mèo Mun" })).toMatchObject({ is_anonymous: true });
    for (const values of [
      { anon: true, nickname: null },
      { anon: true, nickname: "   " },
      { anon: false, nickname: "Mèo" },
    ]) {
      await expect(insertKudo(values)).rejects.toMatchObject(violates("kudos_anonymous_nickname"));
    }
  });

  it("keeps image positions in 0..4 and image paths in the kudos/{uuid}.{ext} shape", async () => {
    const attempt = (position: number, path: string) =>
      withRollback(async (tx) => {
        const [kudo] = await tx.execute<{ id: string }>(sql`
          insert into public.kudos (sender_id, recipient_id, body)
          values (${sender.id}, ${recipient.id}, 'x') returning id`);
        await tx.execute(sql`
          insert into public.kudo_images (kudo_id, storage_path, position) values (${kudo.id}, ${path}, ${position})`);
        return true;
      });
    expect(await attempt(4, PATH)).toBe(true);
    await expect(attempt(5, PATH)).rejects.toMatchObject(violates("kudo_images_position_range"));
    await expect(attempt(0, `kudos/${sender.id}/a.png`)).rejects.toMatchObject(
      violates("kudo_images_storage_path_format"),
    );
    const upload = withRollback((tx) =>
      tx.execute(sql`insert into public.kudo_image_uploads (storage_path, uploader_id) values ('x.png', ${sender.id})`),
    );
    await expect(upload).rejects.toMatchObject(violates("kudo_image_uploads_storage_path_format"));
  });

  it("provides an immutable, diacritic-folding f_unaccent for name search", async () => {
    const [row] = await testSql<{ folded: string; volatility: string }[]>`
      select public.f_unaccent('Nguyễn Văn Đức') as folded,
             (select provolatile::text from pg_proc where proname = 'f_unaccent') as volatility`;
    expect(row).toEqual({ folded: "Nguyen Van Duc", volatility: "i" });
  });
});
