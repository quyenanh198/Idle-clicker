const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "tests",
  testMatch: "*.spec.cjs",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "node scripts/serve.cjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
