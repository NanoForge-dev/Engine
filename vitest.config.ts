import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "ignore-wasm-imports",
      enforce: "pre",
      load: (id) => (id.split("?")[0]?.endsWith(".wasm") ? "export {};" : undefined),
    },
  ],
  test: {
    exclude: ["**/node_modules", "**/dist", ".idea", ".git", ".cache"],
    passWithNoTests: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.spec.json",
    },
    coverage: {
      enabled: true,
      reporter: ["text", "lcov", "cobertura"],
      provider: "v8",
      include: ["src"],
      exclude: [
        "**/*.{interface,type,d}.ts",
        "**/{interfaces,types}/*.ts",
        "**/index.{js,ts}",
        "**/exports/*.{js,ts}",
      ],
    },
  },
});
