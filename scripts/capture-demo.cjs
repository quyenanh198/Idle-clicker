// Reproducible recording of the actual game, with no simulated video frames.
// Run npm start first, then node scripts/capture-demo.cjs.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync(".screenshots/videos", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: {
        dir: ".screenshots/videos",
        size: { width: 1280, height: 800 },
      },
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173");
    await page.evaluate(() => Promise.all([artReady, document.fonts.ready]));
    await page.locator('[data-offer="0"]').click();
    await page.locator('[data-slot="1"]').click();
    await page.locator('[data-offer="1"]').click();
    await page.locator('[data-slot="3"]').click();
    await page.locator('[data-offer="2"]').click();
    await page.locator('[data-slot="8"]').click();
    await page.waitForTimeout(2500);
    await page.locator(".fight-btn").click();
    await page.waitForTimeout(13000);
    await page.screenshot({ path: ".screenshots/live-battle.png" });
    const video = page.video();
    await context.close();
    await video.saveAs(".screenshots/pixel-frontier.webm");
    console.log("Recorded .screenshots/pixel-frontier.webm");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
