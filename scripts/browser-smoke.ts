import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
async function main() {
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      await page
        .getByRole("heading", {
          name: "別再問「哪天有空？」 一起，揪個好時間。",
        })
        .waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `homepage overflow at ${width}`,
      );
      await page.screenshot({
        path: `/tmp/ju-time-home-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("link", { name: "建立一個活動" }).click();
      await page.getByLabel("活動名稱").fill("週末聚餐");
      await page.getByLabel("發起人暱稱").fill("小明");
      await page
        .getByLabel("時段 1 開始時間日期", { exact: true })
        .fill("2026-12-01");
      await page.getByLabel("時段 1 開始時間時刻").fill("18:00");
      await page
        .getByLabel("時段 1 結束時間日期", { exact: true })
        .fill("2026-12-01");
      await page.getByLabel("時段 1 結束時間時刻").fill("20:00");
      await page
        .getByRole("button", { name: "選擇時段 1 開始時間日期" })
        .click();
      await page.getByRole("button", { name: "下一個月" }).click();
      await page
        .getByRole("button", { name: "2027-01-02", exact: true })
        .click();
      assert.equal(
        await page
          .getByLabel("時段 1 開始時間日期", { exact: true })
          .inputValue(),
        "2027-01-02",
      );
      await page.getByRole("button", { name: "新增候選時段" }).click();
      assert.equal(await page.locator('input[type="time"]').count(), 4);
      await page.getByRole("button", { name: "移除時段 2" }).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `create overflow at ${width}`,
      );
      await page.screenshot({
        path: `/tmp/ju-time-create-${width}.png`,
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      await page.close();
      console.log(
        `PASS ${width}px: homepage, navigation, create form, add/remove slots, no overflow or browser errors`,
      );
    }
    const response = await fetch(base + "/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://invalid.example",
      },
      body: "{}",
    });
    assert.equal(response.status, 400);
    console.log("PASS cross-origin mutation rejected");
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
