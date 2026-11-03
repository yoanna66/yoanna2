import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, responseSchema, tally, formatSlot } from "../lib/domain";
const slot = {
  start: "2026-12-01T10:00:00.000Z",
  end: "2026-12-01T11:00:00.000Z",
};
test("reject invalid intervals and duplicate slots", () => {
  assert.equal(
    createSchema.safeParse({ title: "聚餐", organizer: "小明", slots: [slot] })
      .success,
    true,
  );
  for (const slots of [[slot, slot], [{ ...slot, end: slot.start }], []])
    assert.equal(
      createSchema.safeParse({ title: "聚餐", organizer: "小明", slots })
        .success,
      false,
    );
});
test("participant requires secure capability and supports all unavailable", () => {
  assert.equal(
    responseSchema.safeParse({
      nickname: "小華",
      choices: [],
      token: "a".repeat(64),
      edit: false,
    }).success,
    true,
  );
  assert.equal(
    responseSchema.safeParse({
      nickname: "小華",
      choices: [],
      token: "guessable",
      edit: true,
    }).success,
    false,
  );
});
test("statistics count each participant once even if choices contain duplicates", () => {
  const result = tally(
    [
      { id: "a", starts_at: slot.start, ends_at: slot.end },
      { id: "b", starts_at: slot.start, ends_at: slot.end },
    ],
    [
      { nickname: "A", choices: ["a", "a"] },
      { nickname: "B", choices: [] },
    ],
  );
  assert.deepEqual(
    result.map((r) => r.count),
    [1, 0],
  );
});

test("accept Taiwan offset input", () => {
  assert.equal(
    createSchema.safeParse({
      title: "聚餐",
      organizer: "小明",
      slots: [
        {
          start: "2030-01-01T10:00:00+08:00",
          end: "2030-01-01T11:00:00+08:00",
        },
      ],
    }).success,
    true,
  );
});

test("cross-day slots display the end date in Taiwan time", () => {
  assert.match(
    formatSlot({
      id: "x",
      starts_at: "2030-01-01T23:00:00+08:00",
      ends_at: "2030-01-02T01:00:00+08:00",
    }),
    /1\/2/,
  );
});
