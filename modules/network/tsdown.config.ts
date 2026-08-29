import { createTsdownConfig } from "../../tsdown.config";

export default [
  createTsdownConfig({
    entry: "src/client/index.ts",
    outDir: "dist/client",
    tsconfig: "tsconfig.client.json",
  }),
  createTsdownConfig({
    entry: "src/server/index.ts",
    outDir: "dist/server",
    tsconfig: "tsconfig.server.json",
  }),
];
