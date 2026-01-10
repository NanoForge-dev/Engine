import { createTsupConfig } from "../../tsup.config.js";

const createConfig = (name: string, entries: string[] = []) => {
  return createTsupConfig({
    entry: [`src/${name}/action.yml`, ...entries.map((entry) => `src/${name}/${entry}`)],
    outDir: `dist/${name}`,
    dts: false,
    format: "esm",
    minify: "terser",
    target: "esnext",
  });
};

export default [createConfig("pnpm-install"), createConfig("release-packages", ["index.ts"])];
