import { type UserConfig } from "tsdown";

import { createTsdownConfig } from "../../tsdown.config";

const createECSPartConfig = (part: "client" | "server"): UserConfig =>
  createTsdownConfig({
    entry: `src/${part}/index.ts`,
    outDir: `dist/${part}`,
    copy: [`lib/${part === "client" ? "web" : "node"}/libecs.wasm`],
    banner: ({ format }) => ({
      js: format === "cjs" ? 'require("./libecs.wasm");' : 'import "./libecs.wasm";',
    }),
  });

export default [createTsdownConfig(), createECSPartConfig("client"), createECSPartConfig("server")];
