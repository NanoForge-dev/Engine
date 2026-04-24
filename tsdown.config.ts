import { defineConfig } from "tsdown";

export function createTsdownConfig() {
  return defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm", "cjs"],
    shims: true,
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    fixedExtension: false,
    platform: "node",
    target: "esnext",
    treeshake: false,
    deps: {
      skipNodeModulesBundle: true,
    },
    loader: { ".wasm": "copy" },
    outputOptions: {
      assetFileNames: "[name][extname]",
    },
  });
}
