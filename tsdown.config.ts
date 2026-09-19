import { type UserConfig, defineConfig } from "tsdown";

export function createTsdownConfig(options?: UserConfig) {
  return defineConfig({
    entry: options?.entry ?? ["src/index.ts"],
    outDir: options?.outDir ?? "dist",
    tsconfig: options?.tsconfig ?? "tsconfig.json",
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
      neverBundle: true,
    },
    copy: options?.copy,
    banner: options?.banner,
  });
}
