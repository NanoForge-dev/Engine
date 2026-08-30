import { createTsdownConfig } from "../../tsdown.config";

export default [
  createTsdownConfig({ entry: "src/client/index.ts", outDir: "dist/client" }),
  createTsdownConfig({ entry: "src/server/index.ts", outDir: "dist/server" }),
];
