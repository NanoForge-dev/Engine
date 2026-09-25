import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PROJECT_DIR = join(dirname(fileURLToPath(import.meta.url)), "./game");
const CLIENT_DIST = join(PROJECT_DIR, "apps/client/dist");
const SERVER_DIST = join(PROJECT_DIR, "apps/server/dist");

const cleanDists = () => {
  for (const dir of [CLIENT_DIST, SERVER_DIST]) rmSync(dir, { recursive: true, force: true });
};

describe("E2E Game", () => {
  beforeAll(() => {
    cleanDists();
    execSync("pnpm exec nf build", {
      cwd: PROJECT_DIR,
      stdio: "pipe",
      timeout: 120_000,
    });
  }, 130_000);

  afterAll(() => {
    cleanDists();
  }, 130_000);

  describe("Build", () => {
    it("should produce a server bundle", () => {
      expect(existsSync(join(SERVER_DIST, "main.js"))).toBe(true);
    });

    it("should produce a client bundle", () => {
      expect(existsSync(join(CLIENT_DIST, "main.js"))).toBe(true);
    });

    it("should include the WASM file in the server bundle", () => {
      expect(existsSync(join(SERVER_DIST, "libecs.wasm"))).toBe(true);
    });
  });
});
