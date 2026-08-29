import { defineConfig } from "nanoforge/config";

export default defineConfig({
  type: "client",

  libs: ["../../libs/test-lib"], // ? or ["test-lib"] (with a name set in config or in pkg.json) or ["libs/test-lib"]
});
