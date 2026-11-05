import { createTsdownConfig } from "../../tsdown.config";

export default [
  createTsdownConfig({ entry: ["src/index.ts", "src/three.ts", "src/three-tsl.ts"] }),
];
