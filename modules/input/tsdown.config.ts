import { type UserConfig } from "tsdown";

import { createTsdownConfig } from "../../tsdown.config";

const createInputPartConfig = (part: "keyboard-mouse" | "controller"): UserConfig =>
  createTsdownConfig({
    entry: `src/${part}/index.ts`,
    outDir: `dist/${part}`,
  });

export default [
  createTsdownConfig(),
  createInputPartConfig("keyboard-mouse"),
  createInputPartConfig("controller"),
];
