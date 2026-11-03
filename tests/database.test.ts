import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
test("migration, least privileges, persistent updates and capability authorization", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec("set role service_role");
    const run = async (sql: string, args: unknown[] = []) =>
      (await db.query<any>(sql, args)).rows;
    const slots = JSON.stringify([
      { start: "2026-12-01T10:00:00Z", end: "2026-12-01T11:00:00Z" },
    ]);
    await run("select create_event($1,$2,$3,$4,$5::jsonb)", [
      "AABBCCDDEEFF",
      "聚餐",
      "主辦",
      "admin-hash",
      slots,
    ]);
    await run("select create_event($1,$2,$3,$4,$5::jsonb)", [
      "112233445566",
      "另一活動",
      "主辦",
      "other-admin",
      slots,
    ]);
    let event = (
      await run("select read_event($1) as event", ["AABBCCDDEEFF"])
    )[0].event;
    const slot = event.slots[0].id;
    const other = (
      await run("select read_event($1) as event", ["112233445566"])
    )[0].event.slots[0].id;
    assert.equal(JSON.stringify(event).includes("admin-hash"), false);
    await assert.rejects(() =>
      run("select save_response($1,$2,$3,$4::uuid[],$5)", [
        "AABBCCDDEEFF",
        "bad",
        "A",
        [other],
        false,
      ]),
    );
    await run("select save_response($1,$2,$3,$4::uuid[],$5)", [
      "AABBCCDDEEFF",
      "participant-hash",
      "A",
      [slot],
      false,
    ]);
    await run("select save_response($1,$2,$3,$4::uuid[],$5)", [
      "AABBCCDDEEFF",
      "participant-hash",
      "B",
      [],
      true,
    ]);
    await run("select save_response($1,$2,$3,$4::uuid[],$5)", [
      "AABBCCDDEEFF",
      "participant-hash",
      "B",
      [slot],
      false,
    ]);
    event = (await run("select read_event($1) as event", ["AABBCCDDEEFF"]))[0]
      .event;
    assert.equal(event.participants.length, 1);
    assert.equal(event.participants[0].nickname, "B");
    assert.equal(
      (
        await run("select read_response($1,$2) as value", [
          "AABBCCDDEEFF",
          "wrong",
        ])
      )[0].value,
      null,
    );
    await assert.rejects(() =>
      run("select save_response($1,$2,$3,$4::uuid[],$5)", [
        "AABBCCDDEEFF",
        "wrong",
        "C",
        [],
        true,
      ]),
    );
    await assert.rejects(() =>
      run("select confirm_event($1,$2,$3)", ["AABBCCDDEEFF", "wrong", slot]),
    );
    await assert.rejects(() =>
      run("select confirm_event($1,$2,$3)", [
        "AABBCCDDEEFF",
        "admin-hash",
        other,
      ]),
    );
    await run("select confirm_event($1,$2,$3)", [
      "AABBCCDDEEFF",
      "admin-hash",
      slot,
    ]);
    await assert.rejects(() =>
      run("select save_response($1,$2,$3,$4::uuid[],$5)", [
        "AABBCCDDEEFF",
        "participant-hash",
        "C",
        [],
        true,
      ]),
    );
    const permissions = await run(
      "select has_table_privilege('anon','public.events','SELECT') as read, has_table_privilege('authenticated','public.participants','UPDATE') as write, has_function_privilege('anon','public.read_event(text)','EXECUTE') as rpc",
    );
    assert.deepEqual(permissions[0], { read: false, write: false, rpc: false });
    assert.equal(
      (await run("select read_event($1) as event", ["AABBCCDDEEFF"]))[0].event
        .final_slot_id,
      slot,
    );
  } finally {
    await db.close();
  }
});
