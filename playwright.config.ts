import { defineConfig } from "@playwright/test";

/** Each test game (`e2e/<game>`) is served by its own `nf start` and tested by `e2e/graphics/<game>.spec.ts`. */
const GAME_PORTS = { "game-2d": 3101, "game-3d": 3102 };

export default defineConfig({
  testDir: "e2e/graphics",
  forbidOnly: !!process.env.CI,
  // CI runners render WebGL on the CPU (SwiftShader): parallel games starve each other.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // Reference screenshots come from CI's Linux Chromium; other platforms render different pixels.
  ignoreSnapshots: process.platform !== "linux",
  expect: {
    // Absorbs antialiasing and rasterization noise; a missing mesh or wrong camera changes far more.
    // The timeout covers slow software-rendered captures: one 3D capture can take seconds on CI.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, timeout: 30_000 },
  },
  use: {
    browserName: "chromium",
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    // Same software WebGL as CI, so local runs exercise the same rendering path.
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  projects: Object.entries(GAME_PORTS).map(([game, port]) => ({
    name: game,
    testMatch: `${game}.spec.ts`,
    use: { baseURL: `http://localhost:${port}` },
  })),
  webServer: Object.entries(GAME_PORTS).map(([game, port]) => ({
    command: `pnpm exec nf build && pnpm exec nf start -p ${port}`,
    cwd: `e2e/${game}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  })),
});
