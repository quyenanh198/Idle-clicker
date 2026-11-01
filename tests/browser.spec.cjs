const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
test("all gears have the same footprint, actual shafts and opposite rotation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => artReady);
  await page.evaluate(() => {
    S.board[1] = { k: "bot", l: 1 };
    S.board[2] = { k: "cog", l: 6 };
    S.board[3] = { k: "crab", l: 3 };
    S.board[23] = { k: "owl", l: 2 };
    render();
  });
  const sizes = await page.locator(".board .gear").evaluateAll((es) =>
    es.map((e) => ({
      w: e.getBoundingClientRect().width,
      h: e.getBoundingClientRect().height,
    })),
  );
  for (const size of sizes) {
    expect(Math.abs(size.w - sizes[0].w)).toBeLessThan(0.2);
    expect(Math.abs(size.h - size.w)).toBeLessThan(0.2);
  }
  await expect(page.locator('.shaft[data-link="1-7"]')).toHaveAttribute(
    "data-powered",
    "true",
  );
  await expect(page.locator(".shaft")).toHaveCount(4);
  const clipIds = await page
    .locator("svg clipPath[id]")
    .evaluateAll((es) => es.map((e) => e.id));
  expect(new Set(clipIds).size).toBe(clipIds.length);
  await expect(page.locator('[data-slot="23"]')).toHaveAttribute(
    "data-powered",
    "false",
  );
  await page.evaluate(() => dropGear({ type: "offer", index: 0 }, 0));
  const placed = await page.locator('[data-slot="0"] .gear').boundingBox();
  const motor = await page.locator('[data-slot="7"] .gear').boundingBox();
  expect(Math.abs(placed.width - motor.width)).toBeLessThan(0.2);
  expect(
    await page
      .locator('[data-slot="1"] .gear-rotor')
      .evaluate((e) => getComputedStyle(e).animationDirection),
  ).toBe("reverse");
  expect(
    await page
      .locator('[data-slot="7"] .gear-rotor')
      .evaluate((e) => getComputedStyle(e).animationDirection),
  ).toBe("normal");
  expect(
    await page
      .locator('[data-slot="23"] .gear-rotor')
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator('[data-slot="7"] .gear-rotor')
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
test("short desktop windows keep gear rows clear of recruitment controls", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [1366, 1920]) {
    await page.setViewportSize({ width, height: 600 });
    const board = await page.locator(".board").boundingBox();
    const field = await page.locator(".gear-field").boundingBox();
    const dock = await page.locator(".build-dock").boundingBox();
    expect(board.y).toBeGreaterThanOrEqual(field.y);
    expect(board.y + board.height).toBeLessThanOrEqual(field.y + field.height);
    await page.locator(".fight-btn").scrollIntoViewIfNeeded();
    await expect(page.locator(".fight-btn")).toBeInViewport();
    await expect(page.locator("nav")).toBeInViewport();
  }
});
test("desktop game fills a responsive frame without introduction panels", async ({
  page,
}) => {
  await page.goto("/");
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.locator(".desktop-intro,.field-notes")).toHaveCount(0);
    const frame = await page.locator(".game-frame").boundingBox();
    expect(frame.width).toBeGreaterThan(size.width * 0.9);
    expect(frame.height).toBeLessThanOrEqual(size.height);
    const lane = await page.locator(".battlefield").boundingBox();
    const board = await page.locator(".gear-field").boundingBox();
    // The selected Pixel Frontier composition puts battle above the workshop.
    expect(lane.width).toBeGreaterThan(frame.width * 0.9);
    expect(lane.y + lane.height).toBeLessThanOrEqual(board.y + 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
});
test("phone: purchase, move, merge, fight and reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "THE AMBER DUNES" }),
  ).toBeVisible();
  await page.locator('[data-offer="0"]').click();
  await page.locator('[data-slot="1"]').click();
  await page.locator('[data-offer="1"]').click();
  await page.locator('[data-slot="3"]').click();
  await expect(page.locator("#chain-count")).toHaveText(
    "2 fighter gears connected",
  );
  await page.reload();
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute(
    "aria-label",
    /Frontier Infantry/,
  );
  // Real mouse gesture moves an existing gear, preserving gold and connectivity.
  const from = await page.locator('[data-slot="1"]').boundingBox(),
    to = await page.locator('[data-slot="2"]').boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(page.locator('[data-slot="2"]')).toHaveAttribute(
    "aria-label",
    /Frontier Infantry/,
  );
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute(
    "aria-label",
    /Empty/,
  );
  await expect(page.locator("#chain-count")).toHaveText(
    "2 fighter gears connected",
  );
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: /FIGHT/ }).click();
  await expect(
    page.getByRole("button", { name: "Toggle battle speed" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle battle speed" }).click();
  await expect(page.locator(".speed-btn")).toHaveText("2×");
  await page.evaluate(() => {
    for (let i = 0; i < 2400 && battle; i++) tick(0.1);
  });
  await expect(page.locator(".wave-count")).toHaveText("WAVE 2 / 10");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("touch screen drag recruits a powered fighter", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  const from = await page.locator('[data-offer="0"]').boundingBox(),
    to = await page.locator('[data-slot="1"]').boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: from.x + 20, y: from.y + 20 }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: from.x + 20 + ((to.x + to.width / 2 - from.x - 20) * i) / 12,
          y: from.y + 20 + ((to.y + to.height / 2 - from.y - 20) * i) / 12,
        },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute(
    "aria-label",
    /Frontier Infantry, level 1, powered/,
  );
  await context.close();
});
test("secondary pointer cannot cancel an active drag", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-offer="0"]').dispatchEvent("pointerdown", {
    pointerId: 1,
    button: 0,
    clientX: 25,
    clientY: 650,
  });
  await page.locator('[data-offer="1"]').dispatchEvent("pointerdown", {
    pointerId: 2,
    button: 0,
    clientX: 150,
    clientY: 650,
  });
  await page
    .locator("body")
    .dispatchEvent("pointerup", { pointerId: 2, clientX: 150, clientY: 650 });
  expect(await page.evaluate(() => gesture?.id)).toBe(1);
});
test("drag shop purchase and keyboard controls", async ({ page }) => {
  await page.goto("/");
  const from = await page.locator('[data-offer="0"]').boundingBox(),
    to = await page.locator('[data-slot="1"]').boundingBox();
  await page.mouse.move(from.x + 20, from.y + 20);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 15,
  });
  await page.mouse.up();
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute(
    "aria-label",
    /Frontier Infantry/,
  );
  await expect(page.getByLabel("30 gold", { exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator('[data-offer="1"]').focus();
  await page.keyboard.press("Enter");
  await page.locator('[data-slot="3"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-slot="3"]')).toHaveAttribute(
    "aria-label",
    /Iron Guard/,
  );
});
test("all screens, summoning, persistence and responsive visual captures", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => artReady);
  fs.mkdirSync(".screenshots", { recursive: true });
  await page.screenshot({ path: ".screenshots/mobile.png" });
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "FIELD UPGRADES" }),
  ).toBeVisible();
  await page.screenshot({ path: ".screenshots/skills.png" });
  await page.getByRole("button", { name: "Deck", exact: true }).click();
  await expect(page.locator(".card")).toHaveCount(6);
  await page.screenshot({ path: ".screenshots/deck.png" });
  await page.getByRole("button", { name: "Summon", exact: true }).click();
  await page.getByRole("button", { name: /SUMMON A FIGHTER/ }).click();
  await expect(page.locator(".summon-result")).toBeVisible();
  await expect(page.getByLabel("30 gems", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("30 gems", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-offer="0"]').click();
  await page.locator('[data-slot="1"]').click();
  await page.locator('[data-offer="1"]').click();
  await page.locator('[data-slot="3"]').click();
  await page.locator('[data-offer="2"]').click();
  await page.locator('[data-slot="8"]').click();
  await page.evaluate(() => {
    fight();
    for (let i = 0; i < 2400 && battle; i++) tick(0.1);
  });
  await expect(page.locator(".wave-count")).toHaveText("WAVE 2 / 10");
  await expect(page.locator(".toast")).toHaveCount(0, { timeout: 5000 });
  await page.screenshot({ path: ".screenshots/desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".screenshots/mobile.png" });
  await page.getByRole("button", { name: /FIGHT/ }).click();
  await page.evaluate(() => {
    for (let i = 0; i < 80 && battle; i++) tick(0.1);
    render();
    speed = 0;
    drawLane();
  });
  await page.screenshot({ path: ".screenshots/mobile-battle.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: ".screenshots/battle.png" });
  for (const size of [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("desktop enemy taps follow resized canvas coordinates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    S.board[1] = { k: "bot", l: 1 };
    fight();
    battle.units = [
      {
        ...mkEnemy(battle.w),
        x: 500,
        y: 275,
        hp: 100,
        max: 100,
        speed: 0,
        dmg: 0,
      },
    ];
    render();
    speed = 0;
    drawLane();
  });
  const target = await page.locator("#lane").boundingBox();
  const point = await page.locator("#lane").evaluate((cv) => ({
    x: cv.width / 2,
    y: 275 + cv.height - 400,
    height: cv.height,
  }));
  await page.mouse.click(
    target.x + target.width / 2,
    target.y + (point.y / point.height) * target.height,
  );
  expect(await page.evaluate(() => battle.units[0].hp)).toBeLessThan(100);
});
