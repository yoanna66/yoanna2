// Browser UI regression with an isolated API fixture, not a remote Supabase test.
import { chromium, type Route } from "@playwright/test";
import assert from "node:assert/strict";
async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const code = "AABBCCDDEEFF",
      slot = "11111111-1111-4111-8111-111111111111";
    let participant: {
      nickname: string;
      choices: string[];
      token: string;
    } | null = null;
    let inserts = 0;
    const handler = async (route: Route) => {
      const req = route.request();
      if (req.method() === "GET")
        return route.fulfill({
          json: {
            id: "event",
            code,
            title: "回填測試",
            organizer: "測試",
            final_slot_id: null,
            slots: [
              {
                id: slot,
                starts_at: "2030-01-01T10:00:00+08:00",
                ends_at: "2030-01-01T11:00:00+08:00",
              },
            ],
            participants: participant
              ? [
                  {
                    nickname: participant.nickname,
                    choices: participant.choices,
                  },
                ]
              : [],
          },
        });
      const body = req.postDataJSON();
      if (body.action === "load")
        return route.fulfill(
          participant?.token === body.token
            ? { json: participant }
            : { status: 403, json: { error: "修改連結無效" } },
        );
      if (body.edit) assert.equal(body.token, participant?.token);
      else inserts++;
      participant = {
        nickname: body.nickname,
        choices: body.choices,
        token: body.token,
      };
      return route.fulfill({ json: { ok: true } });
    };
    await context.route("**/api/events/*", handler);
    const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
    await context.route("**/api/events", route => route.fulfill({status:201,json:{code,token:"a".repeat(64)}}));
    await page.goto(`${base}/create`);
    await page.getByLabel("活動名稱").fill("發起人自動帶入測試");
    await page.getByLabel("發起人暱稱").fill("小明");
    for (const kind of ["開始", "結束"]) {
      await page.getByLabel(`時段 1 ${kind}時間日期`, {exact:true}).fill("2030-01-01");
      await page.getByLabel(`時段 1 ${kind}時間時刻`).fill(kind === "開始" ? "10:00" : "11:00");
    }
    await page.getByRole("button", {name:"建立活動，邀請朋友"}).click();
    await page.getByRole("link", {name:"先填寫我的時間"}).click();
    await page.waitForFunction(() => (document.querySelector('input[maxlength="40"]') as HTMLInputElement)?.value === "小明");
    await page.locator("input[type=checkbox]").check();
    await page.getByRole("button", { name: "提交我的時間" }).click();
    await page.getByRole("heading", { name: "你的時間，收到了！" }).waitFor();
    await page.getByRole("link", { name: "查看統計結果" }).click();
    await page.getByRole("link", { name: "填寫時間", exact: true }).click();
    await page.getByRole("button", { name: "更新原有答案" }).waitFor();
    await page.waitForFunction(
      () =>
        (document.querySelector('input[maxlength="40"]') as HTMLInputElement)
          ?.value === "小明",
    );
    assert.equal(await page.locator("input[type=checkbox]").isChecked(), true);
    await page.reload();
    await page.waitForFunction(
      () =>
        (document.querySelector('input[maxlength="40"]') as HTMLInputElement)
          ?.value === "小明",
    );
    await page.locator("input[type=checkbox]").uncheck();
    await page.getByRole("button", { name: "更新原有答案" }).click();
    await page.getByRole("heading", { name: "你的時間，收到了！" }).waitFor();
    assert.equal(inserts, 1);
    // Another browser session must not inherit the participant capability.
    const fresh = await browser.newContext();
    await fresh.route("**/api/events/*", handler);
    const other = await fresh.newPage();
    await other.goto(`${base}/events/${code}/respond`);
    await other.getByRole("button", { name: "提交我的時間" }).waitFor();
    assert.equal(await other.getByLabel("你的暱稱").inputValue(), "");
    await fresh.close();
    console.log(
      "PASS: return from results, reload, update without new insert, isolated browser identity",
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
