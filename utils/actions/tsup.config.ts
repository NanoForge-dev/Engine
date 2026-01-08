import { createTsupConfig } from "../../tsup.config.js";

export default [
  createTsupConfig({
    entry: ["src/release-packages/index.ts"],
    dts: false,
    format: "esm",
    minify: "terser",
    target: "esnext",
  }),
];
