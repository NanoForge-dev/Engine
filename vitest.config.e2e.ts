import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["e2e/**/*.test.ts"],
    passWithNoTests: true,
    hookTimeout: 100000,
    testTimeout: 100000,
  },
});
