// Real integration test. Requires an application server configured with a real Supabase project.
// Creates one lasting test event; no service key is read by this script.
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
async function main() {
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
  async function request(path: string, body?: unknown) {
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  }
  const created = await request("/api/events", {
    title: "整合驗收（測試資料）",
    organizer: "自動化驗收",
    slots: [
      { start: "2030-01-01T10:00:00+08:00", end: "2030-01-01T11:00:00+08:00" },
    ],
  });
  assert.equal(created.status, 201, created.data.error);
  const { code, token: admin } = created.data;
  const path = "/api/events/" + code;
  let event = (await request(path)).data;
  const slot = event.slots[0].id,
    token = randomBytes(32).toString("hex");
  assert.equal(
    (
      await request(path, {
        nickname: "測試參與者",
        choices: [slot],
        token,
        edit: false,
      })
    ).status,
    200,
  );
  assert.equal((await request(path)).data.participants.length, 1);
  assert.equal(
    (
      await request(path, {
        nickname: "測試參與者已修改",
        choices: [],
        token,
        edit: true,
      })
    ).status,
    200,
  );
  event = (await request(path)).data;
  assert.equal(event.participants.length, 1);
  assert.deepEqual(event.participants[0].choices, []);
  assert.equal(
    (await request(path, { action: "load", token: "f".repeat(64) })).status,
    403,
  );
  assert.equal(
    (
      await request(path, {
        action: "confirm",
        token: "f".repeat(64),
        slotId: slot,
      })
    ).status,
    403,
  );
  assert.equal(
    (await request(path, { action: "confirm", token: admin, slotId: slot }))
      .status,
    200,
  );
  assert.equal((await request(path)).data.final_slot_id, slot);
  assert.equal(
    (
      await request(path, {
        nickname: "修改應失敗",
        choices: [],
        token,
        edit: true,
      })
    ).status,
    409,
  );
  console.log(
    "PASS real Supabase: create, persisted read, response, edit without duplication, invalid credentials, confirm, closed event. Test event code:",
    code,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
