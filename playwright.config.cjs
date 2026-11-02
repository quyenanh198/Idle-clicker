const { defineConfig } = require("@playwright/test");
const ci = !!process.env.CI;
const built = !!process.env.PLAYWRIGHT_TEST_BUILD;
const baseURL = `http://127.0.0.1:${built ? 4174 : 4173}`;
module.exports = defineConfig({
  testDir: "tests",
  testMatch: "*.spec.cjs",
  use: {
    baseURL,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: built ? "npm run preview" : "npm start",
    url: baseURL,
    reuseExistingServer: !ci && !built,
  },
  forbidOnly: ci,
  workers: ci ? 1 : undefined,
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
});
