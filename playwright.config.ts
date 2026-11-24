import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  // Design target: a cheap Android phone. 360px wide is the smallest screen we design for.
  // The setup project logs in once as the demo owner (needs the Supabase project in .env.local).
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Pixel 5"] } },
    {
      name: "pixel-5",
      dependencies: ["setup"],
      use: { ...devices["Pixel 5"], storageState: "playwright/.auth/owner.json" },
    },
    {
      name: "android-360",
      dependencies: ["setup"],
      testIgnore: /(auth|onboarding)\.spec\.ts/, // login flows run once, on pixel-5
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 740 },
        storageState: "playwright/.auth/owner.json",
      },
    },
  ],
  // Screenshots differ between operating systems (fonts), so baselines are Linux-only (CI).
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
